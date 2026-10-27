import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  getStripe,
  isStripeConfigured,
  connectReturnUrl,
  connectRefreshUrl,
} from "@/lib/stripe";
import { UserRole } from "@/generated/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.CONTRACTOR) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  if (!isStripeConfigured()) {
    return NextResponse.redirect(
      new URL("/construction/payouts?error=stripe_not_configured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeAccountId: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
