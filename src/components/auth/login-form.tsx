"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, LogIn, Mail, Lock } from "lucide-react";
import { signIn, getSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginSchema, type LoginInput } from "@/schemas/auth";
import { getRoleHome } from "@/lib/role-home";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "SessionExpired" ? "Your session has expired. Please log in again." : null
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
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
        setError("Invalid email or password.");
        return;
      }

      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      const home = getRoleHome(role);

      let dest = home;
      if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
        const isClientCallback =
          role === "CLIENT" &&
          (callbackUrl === "/services" ||
            callbackUrl.startsWith("/services?") ||
            callbackUrl.startsWith("/customer/"));
        if (isClientCallback) dest = callbackUrl;
      }

      window.location.replace(dest);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <LogIn className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2A4A]">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Sign in to continue to your BuildPro account
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-semibold text-slate-700">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isPending}
              className={cn(
                "h-12 rounded-xl border-slate-200 bg-slate-50/80 pl-10 focus-visible:ring-orange-500",
                errors.email && "border-red-400 focus-visible:ring-red-400"
              )}
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-semibold text-slate-700">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isPending}
              className={cn(
                "h-12 rounded-xl border-slate-200 bg-slate-50/80 pl-10 pr-10 focus-visible:ring-orange-500",
                errors.password && "border-red-400 focus-visible:ring-red-400"
              )}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 w-full rounded-xl bg-orange-500 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </>
          )}
        </Button>
      </form>

      <div className="relative text-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-100" />
        <span className="relative bg-white px-3 text-xs font-medium text-slate-400">
          New to BuildPro?
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/customer/register"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-[#0B2A4A] transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
        >
          Register as Client
        </Link>
        <Link
          href="/construction/register"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-[#0B2A4A] transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
        >
          Register as Contractor
        </Link>
      </div>
    </div>
  );
}
