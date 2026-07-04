"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, Mail, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth";
import { forgotPasswordAction } from "@/actions/auth/forgot-password";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(data: ForgotPasswordInput) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(data);
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Enter your email and we&apos;ll send a password reset link.
        </p>
      </div>

      {success ? (
        <div className="text-center space-y-6 py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Check your inbox</h3>
            <p className="mt-1.5 text-sm text-gray-500">{success}</p>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isPending}
                className={cn(errors.email && "border-red-400 focus-visible:ring-red-400")}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#1e3a5f] hover:bg-[#162e4d] text-white h-11 font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
