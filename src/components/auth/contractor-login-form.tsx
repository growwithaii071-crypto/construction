"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, HardHat, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { LoginSchema, type LoginInput } from "@/schemas/auth";
import { cn } from "@/lib/utils";

export function ContractorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/construction/dashboard";
  const urlError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "SessionExpired" ? "Your session expired. Please sign in again." : null
  );
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: LoginInput) {
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
          <HardHat className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-1.5 text-sm text-gray-500">Sign in to your contractor account</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Email address</label>
          <input
            type="email"
            placeholder="company@example.com"
            autoComplete="email"
            disabled={isPending}
            className={cn(
              "w-full h-12 px-4 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all",
              errors.email ? "border-red-400" : "border-gray-200"
            )}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <Link href="/forgot-password" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isPending}
              className={cn(
                "w-full h-12 px-4 pr-12 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all",
                errors.password ? "border-red-400" : "border-gray-200"
              )}
              {...register("password")}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 mt-2"
        >
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            : <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-gray-400">New to BuildPro?</span>
        </div>
      </div>

      {/* Register link */}
      <Link
        href="/construction/register"
        className="flex items-center justify-center gap-2 w-full h-12 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 hover:text-orange-700 font-semibold rounded-xl text-sm transition-all"
      >
        Register Your Construction Company
      </Link>

      <p className="text-center text-xs text-gray-400">
        Are you a customer?{" "}
        <Link href="/customer/login" className="text-violet-600 hover:text-violet-700 font-semibold">
          Customer portal →
        </Link>
      </p>
    </div>
  );
}
