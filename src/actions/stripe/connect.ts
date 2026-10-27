"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import {
  getStripe,
  isStripeConfigured,
  connectReturnUrl,
  connectRefreshUrl,
  computeVerified,
  type TraderConnectStatus,
} from "@/lib/stripe";

async function requireContractor() {
  return requireAuth([UserRole.CONTRACTOR]);
}

async function syncAccountFromStripe(userId: string, accountId: string) {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);

  const onboardingDone = Boolean(account.details_submitted);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const chargesEnabled = Boolean(account.charges_enabled);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      stripeAccountId: accountId,
      stripeOnboardingDone: onboardingDone,
      stripePayoutsEnabled: payoutsEnabled,
    },
    select: {
      feePaymentMethodId: true,
      stripeOnboardingDone: true,
      stripePayoutsEnabled: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "user",
      entityId: userId,
      action: "stripe_connect_sync",
      actorId: userId,
      after: {
        accountId,
        onboardingDone,
        payoutsEnabled,
        chargesEnabled,
        verified: computeVerified({
          onboardingDone: user.stripeOnboardingDone,
          payoutsEnabled: user.stripePayoutsEnabled,
          feePaymentMethodId: user.feePaymentMethodId,
        }),
      },
    },
  });

  return {
    onboardingDone,
    payoutsEnabled,
    chargesEnabled,
    detailsSubmitted: onboardingDone,
    requirementsDue: account.requirements?.currently_due ?? [],
  };
}

export async function getConnectStatusAction(): Promise<TraderConnectStatus> {
  const session = await requireContractor();
  const userId = session.user.id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeAccountId: true,
      stripeOnboardingDone: true,
      stripePayoutsEnabled: true,
      feePaymentMethodId: true,
    },
  });

  if (!isStripeConfigured()) {
    return {
      configured: false,
      accountId: null,
      onboardingDone: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      chargesEnabled: false,
      feeMethodSaved: false,
      verified: false,
      requirementsDue: [],
    };
  }

  let onboardingDone = user?.stripeOnboardingDone ?? false;
  let payoutsEnabled = user?.stripePayoutsEnabled ?? false;
  let detailsSubmitted = onboardingDone;
  let chargesEnabled = false;
  let requirementsDue: string[] = [];

  if (user?.stripeAccountId) {
    try {
      const synced = await syncAccountFromStripe(userId, user.stripeAccountId);
      onboardingDone = synced.onboardingDone;
      payoutsEnabled = synced.payoutsEnabled;
      detailsSubmitted = synced.detailsSubmitted;
      chargesEnabled = synced.chargesEnabled;
      requirementsDue = synced.requirementsDue;
    } catch (err) {
      console.error("[STRIPE_CONNECT_SYNC]", err);
    }
  }

  const feeMethodSaved = Boolean(user?.feePaymentMethodId);

  return {
    configured: true,
    accountId: user?.stripeAccountId ?? null,
    onboardingDone,
    payoutsEnabled,
    detailsSubmitted,
    chargesEnabled,
    feeMethodSaved,
    verified: computeVerified({
      onboardingDone,
      payoutsEnabled,
      feePaymentMethodId: user?.feePaymentMethodId,
    }),
    requirementsDue,
  };
}

export async function startConnectOnboardingAction() {
  const session = await requireContractor();
  const userId = session.user.id!;

  if (!isStripeConfigured()) {
    return {
      success: false as const,
      message: "Stripe is not configured. Ask an admin to set STRIPE_SECRET_KEY.",
    };
  }

  try {
    const stripe = getStripe();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        stripeAccountId: true,
      },
    });
    if (!user) {
      return { success: false as const, message: "User not found." };
    }

    let accountId = user.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          buildproUserId: userId,
          role: "CONTRACTOR",
        },
        business_profile: {
          name: user.name?.split(" — ")[0] ?? user.name ?? undefined,
          product_description: "Home improvement and construction services via BuildPro",
        },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: accountId },
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: connectRefreshUrl(),
      return_url: connectReturnUrl(),
      type: "account_onboarding",
    });

    await prisma.auditLog.create({
      data: {
        entity: "user",
        entityId: userId,
        action: "stripe_connect_onboarding_started",
        actorId: userId,
        after: { accountId },
      },
    });

    return { success: true as const, url: link.url };
  } catch (err) {
    console.error("[STRIPE_CONNECT_START]", err);
    return {
      success: false as const,
      message: err instanceof Error ? err.message : "Could not start Stripe onboarding.",
    };
  }
}

export async function refreshConnectStatusAction() {
  const session = await requireContractor();
  const userId = session.user.id!;

  if (!isStripeConfigured()) {
    return { success: false as const, message: "Stripe is not configured." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true },
  });

  if (!user?.stripeAccountId) {
    return { success: false as const, message: "No Connect account yet." };
  }

  try {
    await syncAccountFromStripe(userId, user.stripeAccountId);
    revalidatePath("/construction/payouts");
    return { success: true as const, message: "Status updated." };
  } catch (err) {
    console.error("[STRIPE_CONNECT_REFRESH]", err);
    return { success: false as const, message: "Could not refresh status." };
  }
}

/** Create SetupIntent so trader can authorize success-fee deduction. */
export async function createFeeSetupIntentAction() {
  const session = await requireContractor();
  const userId = session.user.id!;

  if (!isStripeConfigured()) {
    return { success: false as const, message: "Stripe is not configured." };
  }

  try {
    const stripe = getStripe();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, stripeCustomerId: true },
    });
    if (!user) {
      return { success: false as const, message: "User not found." };
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { buildproUserId: userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      allowed_payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        buildproUserId: userId,
        purpose: "trader_success_fee",
      },
    });

    return {
      success: true as const,
      clientSecret: setupIntent.client_secret!,
      customerId,
    };
  } catch (err) {
    console.error("[STRIPE_FEE_SETUP]", err);
    return {
      success: false as const,
      message: err instanceof Error ? err.message : "Could not create SetupIntent.",
    };
  }
}

export async function saveFeePaymentMethodAction(paymentMethodId: string) {
  const session = await requireContractor();
  const userId = session.user.id!;

  if (!paymentMethodId?.startsWith("pm_")) {
    return { success: false as const, message: "Invalid payment method." };
  }

  try {
    const stripe = getStripe();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return { success: false as const, message: "Stripe customer missing. Retry setup." };
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { feePaymentMethodId: paymentMethodId },
    });

    await prisma.auditLog.create({
      data: {
        entity: "user",
        entityId: userId,
        action: "stripe_fee_method_saved",
        actorId: userId,
        after: { paymentMethodId },
      },
    });

    revalidatePath("/construction/payouts");
    return { success: true as const, message: "Fee payment method saved." };
  } catch (err) {
    console.error("[STRIPE_FEE_SAVE]", err);
    return {
      success: false as const,
      message: err instanceof Error ? err.message : "Could not save payment method.",
    };
  }
}
