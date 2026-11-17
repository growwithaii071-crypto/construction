import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured, computeVerified } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import type Stripe from "stripe";
import {
  markMarketplacePaymentSucceeded,
  markMarketplacePaymentFailed,
  markMarketplacePaymentRefunded,
} from "@/lib/marketplace-payments";
import {
  fulfillCreditPurchase,
  fulfillSubscription,
  fulfillCommission,
} from "@/actions/marketplace/billing";
import { fulfillCheckoutSession } from "@/lib/marketplace-checkout";
import { PayoutTransferStatus } from "@/generated/prisma";
import {
  checkRateLimit,
  clientIpFromRequest,
  RATE_LIMITS,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

function rateLimitedResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    }
  );
}

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

async function handleTransferEvent(
  transfer: Stripe.Transfer,
  status: "SUCCEEDED" | "FAILED"
) {
  const existing = await prisma.payout.findFirst({
    where: { stripeTransferId: transfer.id },
  });
  if (!existing) {
    await prisma.auditLog.create({
      data: {
        entity: "stripe_transfer",
        entityId: transfer.id,
        action: status === "FAILED" ? "transfer_failed_unmatched" : "transfer_seen",
        after: {
          amount: transfer.amount,
          destination: String(transfer.destination),
          jobId: transfer.metadata?.buildproJobId ?? null,
        },
      },
    });
    return;
  }

  await prisma.payout.update({
    where: { id: existing.id },
    data: {
      status:
        status === "FAILED"
          ? PayoutTransferStatus.FAILED
          : PayoutTransferStatus.SUCCEEDED,
      failureMessage:
        status === "FAILED"
          ? transfer.metadata?.failure_message || "Stripe transfer failed"
          : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "payout",
      entityId: existing.id,
      action: status === "FAILED" ? "transfer_failed" : "transfer_succeeded",
      after: {
        transferId: transfer.id,
        amount: transfer.amount,
        destination: String(transfer.destination),
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

  const ip = clientIpFromRequest(req);
  const ipLimit = checkRateLimit(
    `webhook:ip:${ip}`,
    RATE_LIMITS.webhookIp.limit,
    RATE_LIMITS.webhookIp.windowMs
  );
  if (!ipLimit.ok) {
    return rateLimitedResponse(ipLimit.retryAfterSec);
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!signature || !webhookSecret) {
    const bad = checkRateLimit(
      `webhook:badsig:${ip}`,
      RATE_LIMITS.webhookBadSig.limit,
      RATE_LIMITS.webhookBadSig.windowMs
    );
    if (!bad.ok) return rateLimitedResponse(bad.retryAfterSec);
    return NextResponse.json({ error: "Missing webhook secret or signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[STRIPE_WEBHOOK_SIG]", err);
    const bad = checkRateLimit(
      `webhook:badsig:${ip}`,
      RATE_LIMITS.webhookBadSig.limit,
      RATE_LIMITS.webhookBadSig.windowMs
    );
    if (!bad.ok) return rateLimitedResponse(bad.retryAfterSec);
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
        const kind = pi.metadata?.buildproKind;
        if (kind === "credits" && pi.metadata.buildproPurchaseId) {
          await fulfillCreditPurchase(pi.metadata.buildproPurchaseId, pi.id);
        } else if (kind === "subscription" && pi.metadata.buildproSubscriptionId) {
          await fulfillSubscription(pi.metadata.buildproSubscriptionId, pi.id);
        } else if (kind === "commission" && pi.metadata.buildproFeeLedgerId) {
          await fulfillCommission(pi.metadata.buildproFeeLedgerId, pi.id);
        } else {
          await markMarketplacePaymentSucceeded({
            paymentIntentId: pi.id,
            eventId: event.id,
            autoSplit: pi.metadata?.buildproAutoSplit === "1",
            feeLedgerId: pi.metadata?.buildproFeeLedgerId,
            applicationFee: pi.metadata?.buildproApplicationFee
              ? Number(pi.metadata.buildproApplicationFee)
              : undefined,
            traderNet: pi.metadata?.buildproTraderNet
              ? Number(pi.metadata.buildproTraderNet)
              : undefined,
          });
        }
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.buildproKind === "homeowner_checkout") {
          await fulfillCheckoutSession(session);
        }
        break;
      }
      case "transfer.created":
      case "transfer.updated": {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferEvent(transfer, "SUCCEEDED");
        break;
      }
      case "transfer.reversed": {
        const transfer = event.data.object as Stripe.Transfer;
        await handleTransferEvent(transfer, "FAILED");
        break;
      }
      case "payout.paid":
      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        await prisma.auditLog.create({
          data: {
            entity: "stripe_payout",
            entityId: payout.id,
            action: event.type,
            after: {
              amount: payout.amount,
              status: payout.status,
              failure_code: payout.failure_code ?? null,
              destination: String(payout.destination ?? ""),
            },
          },
        });
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
