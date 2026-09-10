import prisma from "@/lib/prisma";

export const DEFAULT_EMAIL_TEMPLATES = [
  {
    key: "welcome",
    name: "Welcome Email",
    description: "Sent after a user registers successfully",
    subject: "Welcome to {{appName}}, {{userName}}!",
    variables: ["userName", "userEmail", "appName", "loginUrl"],
    bodyHtml: `
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Welcome, {{userName}}!</h2>
      <p style="color:#555;line-height:1.6;">Your {{appName}} account is ready. Sign in to browse services, hire contractors, or manage your business.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{loginUrl}}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">Go to Login</a>
      </div>
    `,
  },
  {
    key: "password_reset",
    name: "Password Reset",
    description: "Sent when a user requests a password reset",
    subject: "Reset your password — {{appName}}",
    variables: ["userName", "resetUrl", "appName"],
    bodyHtml: `
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Reset Your Password</h2>
      <p style="color:#555;line-height:1.6;">Hi {{userName}}, we received a request to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{resetUrl}}" style="background:#1e3a5f;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">Reset Password</a>
      </div>
      <p style="color:#c00;font-size:13px;">If you did not request this, ignore this email.</p>
    `,
  },
  {
    key: "service_request_created",
    name: "New Service Request (to Contractor)",
    description: "Sent to contractor when a client requests their service",
    subject: "New job request: {{serviceTitle}}",
    variables: ["contractorName", "clientName", "serviceTitle", "category", "location", "budget", "message", "requestsUrl", "appName"],
    bodyHtml: `
      <h2 style="color:#1e3a5f;margin:0 0 16px;">New Service Request</h2>
      <p style="color:#555;line-height:1.6;">Hi {{contractorName}}, <strong>{{clientName}}</strong> requested your service <strong>{{serviceTitle}}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Category</td><td style="padding:8px;border-bottom:1px solid #eee;">{{category}}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Location</td><td style="padding:8px;border-bottom:1px solid #eee;">{{location}}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Budget</td><td style="padding:8px;border-bottom:1px solid #eee;">{{budget}}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Message</td><td style="padding:8px;border-bottom:1px solid #eee;">{{message}}</td></tr>
      </table>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{requestsUrl}}" style="background:#ea580c;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">View Request</a>
      </div>
    `,
  },
  {
    key: "service_request_accepted",
    name: "Request Accepted (to Client)",
    description: "Sent to client when contractor accepts their request",
    subject: "Your request was accepted — {{serviceTitle}}",
    variables: ["clientName", "contractorName", "serviceTitle", "messagesUrl", "appName"],
    bodyHtml: `
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Request Accepted 🎉</h2>
      <p style="color:#555;line-height:1.6;">Hi {{clientName}}, <strong>{{contractorName}}</strong> accepted your request for <strong>{{serviceTitle}}</strong>. You can now message them.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{messagesUrl}}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">Open Chat</a>
      </div>
    `,
  },
  {
    key: "service_request_rejected",
    name: "Request Rejected (to Client)",
    description: "Sent to client when contractor rejects their request",
    subject: "Update on your request — {{serviceTitle}}",
    variables: ["clientName", "contractorName", "serviceTitle", "servicesUrl", "appName"],
    bodyHtml: `
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Request Update</h2>
      <p style="color:#555;line-height:1.6;">Hi {{clientName}}, unfortunately <strong>{{contractorName}}</strong> could not take your request for <strong>{{serviceTitle}}</strong>. You can browse other contractors.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{servicesUrl}}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">Browse Services</a>
      </div>
    `,
  },
  {
    key: "service_request_in_progress",
    name: "Work Started (to Client)",
    description: "Sent when contractor marks job as in progress",
    subject: "Work started — {{serviceTitle}}",
    variables: ["clientName", "contractorName", "serviceTitle", "messagesUrl", "appName"],
    bodyHtml: `
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Work In Progress</h2>
      <p style="color:#555;line-height:1.6;">Hi {{clientName}}, <strong>{{contractorName}}</strong> has started work on <strong>{{serviceTitle}}</strong>.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{messagesUrl}}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">Message Contractor</a>
      </div>
    `,
  },
  {
    key: "service_request_completed",
    name: "Job Completed (to Client)",
    description: "Sent when contractor marks job as completed",
    subject: "Job completed — {{serviceTitle}}",
    variables: ["clientName", "contractorName", "serviceTitle", "requestsUrl", "appName"],
    bodyHtml: `
      <h2 style="color:#1e3a5f;margin:0 0 16px;">Job Completed ✓</h2>
      <p style="color:#555;line-height:1.6;">Hi {{clientName}}, <strong>{{contractorName}}</strong> marked <strong>{{serviceTitle}}</strong> as completed.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{requestsUrl}}" style="background:#16a34a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">View Request</a>
      </div>
    `,
  },
  {
    key: "new_message",
    name: "New Chat Message",
    description: "Sent when the other party sends a chat message",
    subject: "New message from {{senderName}} — {{serviceTitle}}",
    variables: ["recipientName", "senderName", "serviceTitle", "messagePreview", "messagesUrl", "appName"],
    bodyHtml: `
      <h2 style="color:#1e3a5f;margin:0 0 16px;">New Message</h2>
      <p style="color:#555;line-height:1.6;">Hi {{recipientName}}, <strong>{{senderName}}</strong> sent you a message about <strong>{{serviceTitle}}</strong>:</p>
      <blockquote style="background:#f8f8f8;border-left:4px solid #7c3aed;margin:16px 0;padding:12px 16px;color:#444;">{{messagePreview}}</blockquote>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{messagesUrl}}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">Reply in Chat</a>
      </div>
    `,
  },
] as const;

export async function ensureDefaultEmailTemplates() {
  if (!prisma.emailTemplate) {
    throw new Error(
      "Prisma client is missing EmailTemplate. Run `npx prisma generate` and restart the dev server."
    );
  }

  for (const t of DEFAULT_EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { key: t.key },
      create: {
        key: t.key,
        name: t.name,
        description: t.description,
        subject: t.subject,
        bodyHtml: t.bodyHtml.trim(),
        variables: [...t.variables],
        isActive: true,
      },
      update: {},
    });
  }
}
