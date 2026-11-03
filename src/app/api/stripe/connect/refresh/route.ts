import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  getStripe,
  isStripeConfigured,
  connectReturnUrl,
  connectRefreshUrl,
} from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";
import { UserRole } from "@/generated/prisma";

export async function GET() {
  const appUrl = getAppUrl();
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.CONTRACTOR) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  if (!isStripeConfigured()) {
    return NextResponse.redirect(
      new URL("/construction/payouts?error=stripe_not_configured", appUrl)
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeAccountId: true },
  });

  if (!user?.stripeAccountId) {
    return NextResponse.redirect(new URL("/construction/payouts", appUrl));
  }

  try {
    const stripe = getStripe();
    const link = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: connectRefreshUrl(),
      return_url: connectReturnUrl(),
      type: "account_onboarding",
    });
    return NextResponse.redirect(link.url);
  } catch (err) {
    console.error("[STRIPE_CONNECT_REFRESH_ROUTE]", err);
    return NextResponse.redirect(new URL("/construction/payouts?error=refresh_failed", appUrl));
  }
}
