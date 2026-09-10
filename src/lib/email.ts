import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { ensureDefaultEmailTemplates } from "@/lib/email-templates";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "BuildPro";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type SendOptions = {
  to: string;
  subject: string;
  html: string;
};

function renderVars(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function wrapBase(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1e3a5f;padding:28px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;">${appName}</h1>
          </td>
        </tr>
        <tr><td style="padding:36px 40px;">${content}</td></tr>
        <tr>
          <td style="background:#f8f8f8;padding:18px 40px;text-align:center;border-top:1px solid #e5e5e5;">
            <p style="color:#999;margin:0;font-size:12px;">© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function getSmtpConfig() {
  const db = await prisma.smtpSettings
    .findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } })
    .catch(() => null);

  if (db?.host) {
    return {
      host: db.host,
      port: db.port,
      secure: db.secure || db.port === 465,
      user: db.username,
      pass: db.password,
      from: db.fromName ? `${db.fromName} <${db.fromEmail}>` : db.fromEmail,
    };
  }

  if (!process.env.EMAIL_SERVER_HOST) return null;

  return {
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    user: process.env.EMAIL_SERVER_USER ?? "",
    pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
    from: process.env.EMAIL_FROM ?? "noreply@buildpro.in",
  };
}

async function sendEmail({ to, subject, html }: SendOptions) {
  const smtp = await getSmtpConfig();

  if (!smtp) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 [EMAIL — SMTP not configured]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("────────────────────────────────────");
    console.log(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return { success: true, logged: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({ from: smtp.from, to, subject, html });
  return { success: true };
}

/** Send using an admin-managed template key */
export async function sendTemplateEmail(
  templateKey: string,
  to: string,
  vars: Record<string, string>
) {
  try {
    await ensureDefaultEmailTemplates();

    const template = await prisma.emailTemplate.findUnique({ where: { key: templateKey } });
    if (!template || !template.isActive) {
      console.warn(`[EMAIL] Template "${templateKey}" missing or inactive`);
      return { success: false, message: "Template inactive" };
    }

    const merged = {
      appName,
      appUrl,
      loginUrl: `${appUrl}/login`,
      servicesUrl: `${appUrl}/services`,
      ...vars,
    };

    const subject = renderVars(template.subject, merged);
    const body = renderVars(template.bodyHtml, merged);

    return await sendEmail({
      to,
      subject,
      html: wrapBase(body),
    });
  } catch (err) {
    console.error(`[EMAIL] Failed to send ${templateKey} to ${to}`, err);
    return { success: false, message: "Send failed" };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: `Verify your email — ${appName}`,
    html: wrapBase(`
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Verify Your Email</h2>
      <p style="color:#555;line-height:1.6;">Click below to verify your account. Link expires in 24 hours.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${verifyUrl}" style="background:#1e3a5f;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">Verify Email</a>
      </div>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string, userName = "there") {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  await sendTemplateEmail("password_reset", email, {
    userName,
    resetUrl,
  });
}

export async function sendWelcomeEmail(name: string, email: string) {
  await sendTemplateEmail("welcome", email, {
    userName: name,
    userEmail: email,
    loginUrl: `${appUrl}/login`,
  });
}

export async function testSmtpConnection() {
  const smtp = await getSmtpConfig();
  if (!smtp) return { success: false, message: "No SMTP configured. Save settings first." };

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    await transporter.verify();
    return { success: true, message: "SMTP connection successful!" };
  } catch (err) {
    console.error("[SMTP_TEST]", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "SMTP connection failed",
    };
  }
}

export { appName, appUrl };
