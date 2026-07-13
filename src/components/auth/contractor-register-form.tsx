"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, HardHat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contractorRegisterAction } from "@/actions/auth/contractor-register";
import { cn } from "@/lib/utils";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

const ContractorRegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    companyName: z.string().min(2, "Company name must be at least 2 characters").max(150),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Please enter a valid phone number"),
    specialization: z.string().min(1, "Please select your specialization"),
    licenseNumber: z.string().optional(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ContractorRegisterInput = z.infer<typeof ContractorRegisterSchema>;

const PASSWORD_REQUIREMENTS = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const SPECIALIZATIONS = [
  "Residential Construction",
  "Commercial Construction",
  "Industrial Construction",
  "Infrastructure & Civil",
  "Interior Finishing",
  "Electrical Works",
  "Plumbing & Sanitation",
  "Structural Engineering",
  "Renovation & Remodeling",
  "Other",
];

export function ContractorRegisterForm() {
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
  } = useForm<ContractorRegisterInput>({
    resolver: zodResolver(ContractorRegisterSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      specialization: "",
      licenseNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });

  function onSubmit(data: ContractorRegisterInput) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await contractorRegisterAction(data);

      if (result.success) {
        setSuccess("Company registered! Redirecting to sign in…");
        setTimeout(() => router.push("/construction/login"), 2500);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mb-4">
          <HardHat className="w-6 h-6 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Register Your Company</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Join BuildPro as a contractor and grow your construction business
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
        {/* Row: Name + Company Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-gray-700 font-medium text-sm">
              Contact person name
            </Label>
            <Input
              id="name"
              placeholder="Arun Kumar"
              disabled={isPending}
              className={cn(
                "h-10 rounded-xl border-gray-200 focus-visible:ring-orange-500 text-sm",
                errors.name && "border-red-400"
              )}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="companyName" className="text-gray-700 font-medium text-sm">
              Company name
            </Label>
            <Input
              id="companyName"
              placeholder="Arun Builders Pvt Ltd"
              disabled={isPending}
              className={cn(
                "h-10 rounded-xl border-gray-200 focus-visible:ring-orange-500 text-sm",
                errors.companyName && "border-red-400"
              )}
              {...register("companyName")}
            />
            {errors.companyName && (
              <p className="text-xs text-red-500">{errors.companyName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
            Business email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@company.com"
            autoComplete="email"
            disabled={isPending}
            className={cn(
              "h-10 rounded-xl border-gray-200 focus-visible:ring-orange-500 text-sm",
              errors.email && "border-red-400"
            )}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Row: Phone + Specialization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-gray-700 font-medium text-sm">
              Phone number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              disabled={isPending}
              className={cn(
                "h-10 rounded-xl border-gray-200 focus-visible:ring-orange-500 text-sm",
                errors.phone && "border-red-400"
              )}
              {...register("phone")}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specialization" className="text-gray-700 font-medium text-sm">
              Specialization
            </Label>
            <select
              id="specialization"
              disabled={isPending}
              className={cn(
                "w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all",
                errors.specialization && "border-red-400"
              )}
              {...register("specialization")}
            >
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.specialization && (
              <p className="text-xs text-red-500">{errors.specialization.message}</p>
            )}
          </div>
        </div>

        {/* License Number (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="licenseNumber" className="text-gray-700 font-medium text-sm">
            License / Registration number{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="licenseNumber"
            placeholder="e.g. MH-CON-2024-0012"
            disabled={isPending}
            className="h-10 rounded-xl border-gray-200 focus-visible:ring-orange-500 text-sm"
            {...register("licenseNumber")}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              disabled={isPending}
              className={cn(
                "h-10 rounded-xl border-gray-200 focus-visible:ring-orange-500 pr-10 text-sm",
                errors.password && "border-red-400"
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

          {passwordValue && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(passwordValue);
                return (
                  <span
                    key={req.label}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs",
                      met ? "text-green-600" : "text-gray-400"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
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
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium text-sm">
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              disabled={isPending}
              className={cn(
                "h-10 rounded-xl border-gray-200 focus-visible:ring-orange-500 pr-10 text-sm",
                errors.confirmPassword && "border-red-400"
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
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl font-semibold mt-1 transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registering company…
            </>
          ) : (
            "Register Construction Company"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already registered?{" "}
        <Link href="/construction/login" className="text-orange-600 hover:text-orange-700 font-semibold">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-gray-400">
        Are you a customer?{" "}
        <Link href="/customer/register" className="text-blue-600 hover:text-blue-700 font-semibold">
          Customer portal →
        </Link>
      </p>
    </div>
  );
}
