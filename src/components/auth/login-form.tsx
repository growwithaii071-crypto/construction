"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, LogIn } from "lucide-react";
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

      // Read role from fresh session and send user to the right dashboard
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      const home = getRoleHome(role);

      // Honor safe callback only for clients returning to public flow (e.g. /services)
      let dest = home;
      if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
        const isClientCallback =
          role === "CLIENT" &&
          (callbackUrl === "/services" || callbackUrl.startsWith("/services?") || callbackUrl.startsWith("/customer/"));
        if (isClientCallback) dest = callbackUrl;
      }

      window.location.replace(dest);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          One login for Admin, Client &amp; Contractor
        </p>
      </div>

      {/* Role hint chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Admin", hint: "admin@…" },
          { label: "Client", hint: "customer@…" },
          { label: "Contractor", hint: "contractor@…" },
        ].map((r) => (
          <span
            key={r.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            {r.label}
          </span>
        ))}
      </div>

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
            autoComplete="email"
            disabled={isPending}
            className={cn(errors.email && "border-red-400 focus-visible:ring-red-400")}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
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
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#1e3a5f] hover:bg-[#162e4d] text-white h-11 font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </>
          )}
        </Button>
      </form>

      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center space-y-2">
        <p className="text-sm text-gray-600 font-medium">New here? Create an account</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/customer/register"
            className="text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            Register as Client
          </Link>
          <span className="hidden sm:inline text-gray-300">·</span>
          <Link
            href="/construction/register"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            Register as Contractor
          </Link>
        </div>
      </div>
    </div>
  );
}
