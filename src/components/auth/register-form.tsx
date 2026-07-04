"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterSchema, type RegisterInput } from "@/schemas/auth";
import { registerAction } from "@/actions/auth/register";
import { cn } from "@/lib/utils";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" },
  });

  const passwordValue = watch("password", "");

  function onSubmit(data: RegisterInput) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await registerAction(data);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create an account</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Join the Construction Management System
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={isPending}
            className={cn(errors.name && "border-red-400 focus-visible:ring-red-400")}
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Email */}
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

        {/* Phone (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Phone number <span className="text-gray-400 text-xs">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            disabled={isPending}
            {...register("phone")}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}

          {/* Password strength indicators */}
          {passwordValue && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(passwordValue);
                return (
                  <div key={req.label} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full flex-shrink-0 transition-colors",
                        met ? "bg-green-500" : "bg-gray-200"
                      )}
                    />
                    <span className={cn("text-xs", met ? "text-green-600" : "text-gray-400")}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
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

        {/* Submit */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#1e3a5f] hover:bg-[#162e4d] text-white h-11 font-semibold mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
