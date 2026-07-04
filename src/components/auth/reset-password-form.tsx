"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth";
import { resetPasswordAction } from "@/actions/auth/reset-password";
import { cn } from "@/lib/utils";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", token },
  });

  function onSubmit(data: ResetPasswordInput) {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(data);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(result.message);
      }
    });
  }

  if (success) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Password updated!</h3>
          <p className="mt-1.5 text-sm text-gray-500">{success}</p>
          <p className="text-xs text-gray-400 mt-1">Redirecting to login...</p>
        </div>
        <Link href="/login">
          <Button className="w-full bg-[#1e3a5f] hover:bg-[#162e4d] text-white">Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Your new password must be different from your previous one.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <span>{error}</span>
            {error.includes("expired") && (
              <div className="mt-1">
                <Link href="/forgot-password" className="font-semibold underline">
                  Request a new link
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register("token")} value={token} />

        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              disabled={isPending}
              className={cn(
                "pr-10",
                errors.password && "border-red-400 focus-visible:ring-red-400"
              )}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat new password"
              disabled={isPending}
              className={cn(
                "pr-10",
                errors.confirmPassword && "border-red-400 focus-visible:ring-red-400"
              )}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
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
              Updating password...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 mr-2" />
              Update Password
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
