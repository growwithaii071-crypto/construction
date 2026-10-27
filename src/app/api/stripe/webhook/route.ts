import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured, computeVerified } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import type Stripe from "stripe";
import {
  markMarketplacePaymentSucceeded,
  markMarketplacePaymentFailed,
  markMarketplacePaymentRefunded,
} from "@/lib/marketplace-payments";

export const runtime = "nodejs";

async function handleAccountUpdated(account: Stripe.Account) {
  const userId = account.metadata?.buildproUserId;
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findFirst({ where: { stripeAccountId: account.id } });

  if (!user) {
    console.warn("[STRIPE_WEBHOOK] No user for account", account.id);
    return;
  }

  const onboardingDone = Boolean(account.details_submitted);
  const payoutsEnabled = Boolean(account.payouts_enabled);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeAccountId: account.id,
      stripeOnboardingDone: onboardingDone,
      stripePayoutsEnabled: payoutsEnabled,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "user",
      entityId: user.id,
      action: "stripe_webhook_account_updated",
      after: {
        accountId: account.id,
        onboardingDone,
        payoutsEnabled,
        verified: computeVerified({
          onboardingDone,
          payoutsEnabled,
          feePaymentMethodId: user.feePaymentMethodId,
        }),
      },
    },
  });
}

async function handleSetupIntentSucceeded(intent: Stripe.SetupIntent) {
  const userId = intent.metadata?.buildproUserId;
  const pm =
    typeof intent.payment_method === "string"
      ? intent.payment_method
      : intent.payment_method?.id;

  if (!userId || !pm) return;

  await prisma.user.update({
    where: { id: userId },
    data: { feePaymentMethodId: pm },
  });

  await prisma.auditLog.create({
    data: {
      entity: "user",
      entityId: userId,
      action: "stripe_webhook_setup_intent_succeeded",
      after: { paymentMethodId: pm, setupIntentId: intent.id },
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret or signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[STRIPE_WEBHOOK_SIG]", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const already = await prisma.auditLog.findFirst({
    where: {
      entity: "stripe_event",
      entityId: event.id,
      action: "processed",
    },
  });
  if (already) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "setup_intent.succeeded":
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markMarketplacePaymentSucceeded({
          paymentIntentId: pi.id,
          eventId: event.id,
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markMarketplacePaymentFailed({
          paymentIntentId: pi.id,
          eventId: event.id,
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (piId) {
          const partial = charge.amount_refunded < charge.amount;
          await markMarketplacePaymentRefunded({
            paymentIntentId: piId,
            partial,
            eventId: event.id,
          });
        }
        break;
      }
      default:
        break;
    }

    await prisma.auditLog.create({
      data: {
        entity: "stripe_event",
        entityId: event.id,
        action: "processed",
        after: { type: event.type },
      },
    });
  } catch (err) {
    console.error("[STRIPE_WEBHOOK_HANDLER]", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
