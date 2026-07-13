"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterSchema, type RegisterInput } from "@/schemas/auth";
import { registerAction } from "@/actions/auth/register";
import { cn } from "@/lib/utils";

const PASSWORD_REQUIREMENTS = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function CustomerRegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" },
  });

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });

  function onSubmit(data: RegisterInput) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await registerAction(data);
      if (result.success) {
        setSuccess("Account created! Redirecting to sign in…");
        setTimeout(() => router.push("/customer/login"), 2500);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Create Customer Account</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Join BuildPro and start managing your construction projects
        </p>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-gray-700 font-medium">
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Rajesh Sharma"
            disabled={isPending}
            className={cn(
              "h-11 rounded-xl border-gray-200 focus-visible:ring-blue-500",
              errors.name && "border-red-400 focus-visible:ring-red-400"
            )}
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-gray-700 font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isPending}
            className={cn(
              "h-11 rounded-xl border-gray-200 focus-visible:ring-blue-500",
              errors.email && "border-red-400 focus-visible:ring-red-400"
            )}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-gray-700 font-medium">
            Phone number{" "}
            <span className="text-gray-400 text-xs font-normal">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            disabled={isPending}
            className="h-11 rounded-xl border-gray-200 focus-visible:ring-blue-500"
            {...register("phone")}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              disabled={isPending}
              className={cn(
                "h-11 rounded-xl border-gray-200 focus-visible:ring-blue-500 pr-10",
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

          {/* Strength indicators */}
          {passwordValue && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(passwordValue);
                return (
                  <span
                    key={req.label}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs transition-colors",
                      met ? "text-green-600" : "text-gray-400"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0 transition-colors",
                        met ? "bg-green-500" : "bg-gray-300"
                      )}
                    />
                    {req.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              disabled={isPending}
              className={cn(
                "h-11 rounded-xl border-gray-200 focus-visible:ring-blue-500 pr-10",
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

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl font-semibold mt-1 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create Customer Account"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/customer/login" className="text-blue-600 hover:text-blue-700 font-semibold">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-gray-400">
        Are you a contractor?{" "}
        <Link
          href="/construction/register"
          className="text-orange-600 hover:text-orange-700 font-semibold"
        >
          Contractor portal →
        </Link>
      </p>
    </div>
  );
}
