import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { verifyEmailAction } from "@/actions/auth/verify-email";
import { resendVerificationAction } from "@/actions/auth/resend-verification";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email — Construction Co.",
};

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

async function VerifyEmailContent({ token, email }: { token?: string; email?: string }) {
  if (!token) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-500">
            We&apos;ve sent a verification link to your email address.
            <br />
            Click the link to verify your account.
          </p>
        </div>
        {email && (
          <form
            action={async () => {
              "use server";
              await resendVerificationAction(email);
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Resend verification email
            </Button>
          </form>
        )}
        <Link href="/login">
          <Button variant="ghost" className="w-full text-gray-500">
            Back to login
          </Button>
        </Link>
      </div>
    );
  }

  const result = await verifyEmailAction(token);

  if (result.success) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Email verified!</h2>
          <p className="mt-2 text-sm text-gray-500">{result.message}</p>
        </div>
        <Link href="/login">
          <Button className="w-full bg-[#1e3a5f] hover:bg-[#162e4d] text-white h-11 font-semibold">
            Sign In to Your Account
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <XCircle className="w-8 h-8 text-red-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Verification failed</h2>
        <p className="mt-2 text-sm text-gray-500">{result.message}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/register">
          <Button className="w-full bg-[#1e3a5f] hover:bg-[#162e4d] text-white">
            Register Again
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Verifying your email...</p>
        </div>
      }
    >
      <VerifyEmailContent token={token} email={email} />
    </Suspense>
  );
}
