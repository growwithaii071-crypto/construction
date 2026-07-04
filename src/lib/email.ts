import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function createTransporter() {
  // In development, log to console if SMTP not configured
  if (process.env.NODE_ENV === "development" && !process.env.EMAIL_SERVER_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

async function sendEmail({ to, subject, html }: EmailOptions) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM ?? "noreply@construction.com";

  if (!transporter) {
    // Dev fallback — print to console
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 [DEV EMAIL]");
    console.log(`To:      ${to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log("────────────────────────────────────");
    console.log(html.replace(/<[^>]*>/g, ""));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  await transporter.sendMail({ from, to, subject, html });
}

// ─── Email Templates ────────────────────────────────────────────────────────

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Construction Co.";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${appName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1e3a5f;padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;">${appName}</h1>
            <p style="color:#93b4d4;margin:8px 0 0;font-size:13px;">Construction Management System</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #e5e5e5;">
            <p style="color:#999;margin:0;font-size:12px;">
              © ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
              If you did not request this email, please ignore it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: `Verify your email — ${appName}`,
    html: baseTemplate(`
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Verify Your Email Address</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 24px;">
        Welcome! Please verify your email address to activate your account on ${appName}.
        This link expires in <strong>24 hours</strong>.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}"
           style="background:#1e3a5f;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;display:inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color:#888;font-size:13px;margin:24px 0 0;">
        Or copy this link: <a href="${verifyUrl}" style="color:#1e3a5f;">${verifyUrl}</a>
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: `Reset your password — ${appName}`,
    html: baseTemplate(`
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Reset Your Password</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 24px;">
        We received a request to reset your password. Click the button below to create a new password.
        This link expires in <strong>1 hour</strong>.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}"
           style="background:#1e3a5f;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color:#888;font-size:13px;margin:24px 0 0;">
        Or copy this link: <a href="${resetUrl}" style="color:#1e3a5f;">${resetUrl}</a>
      </p>
      <p style="color:#c00;font-size:13px;margin:16px 0 0;">
        If you did not request a password reset, please ignore this email and your password will remain unchanged.
      </p>
    `),
  });
}

export async function sendWelcomeEmail(name: string, email: string) {
  await sendEmail({
    to: email,
    subject: `Welcome to ${appName}!`,
    html: baseTemplate(`
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Welcome to ${appName}, ${name}!</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 24px;">
        Your account has been successfully verified. You can now access all features of the
        Construction Management System.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}/login"
           style="background:#1e3a5f;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600;display:inline-block;">
          Go to Dashboard
        </a>
      </div>
    `),
  });
}
