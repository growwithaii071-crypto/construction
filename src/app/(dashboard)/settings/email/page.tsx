import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { SmtpSettingsForm } from "@/components/admin/smtp-settings-form";
import { ArrowLeft, Mail, Mails } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Email / SMTP Settings" };

function envSmtpFallback() {
  const host = process.env.EMAIL_SERVER_HOST?.trim() || "";
  if (!host) return null;

  const fromEmail = process.env.EMAIL_FROM?.trim() || "";
  return {
    host,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587) || 587,
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    username: process.env.EMAIL_SERVER_USER?.trim() || "",
    password: process.env.EMAIL_SERVER_PASSWORD || "",
    fromEmail: fromEmail.includes("@") ? fromEmail : "",
    fromName: "BuildPro",
    isActive: true,
  };
}

export default async function EmailSettingsPage() {
  await requireAuth([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  let smtp = null;
  let loadError: string | null = null;

  try {
    smtp = await prisma.smtpSettings.findFirst({ orderBy: { updatedAt: "desc" } });
  } catch (err) {
    console.error("[SMTP_SETTINGS_LOAD]", err);
    loadError =
      err instanceof Error ? err.message : "Could not load SMTP settings from database.";
  }

  const envFallback = envSmtpFallback();
  const source: "database" | "env" | "none" = smtp
    ? "database"
    : envFallback
      ? "env"
      : "none";

  const formInitial = smtp
    ? {
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        username: smtp.username,
        password: smtp.password ? "••••••••" : "",
        fromEmail: smtp.fromEmail,
        fromName: smtp.fromName,
        isActive: smtp.isActive,
      }
    : envFallback
      ? {
          host: envFallback.host,
          port: envFallback.port,
          secure: envFallback.secure,
          username: envFallback.username,
          password: envFallback.password ? "••••••••" : "",
          fromEmail: envFallback.fromEmail,
          fromName: envFallback.fromName,
          isActive: true,
        }
      : null;

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">SMTP Settings</h1>
              <p className="text-sm text-slate-500">
                Mail server for welcome, requests, chat and password emails
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/settings/email-templates"
          className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Mails className="h-4 w-4 text-slate-500" />
          Email templates
        </Link>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <SmtpSettingsForm initial={formInitial} source={source} />
    </div>
  );
}
