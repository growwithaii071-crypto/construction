import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";

const PASSWORD_RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_EXPIRES_MS = 24 * 60 * 60 * 1000; // 24 hours
export const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const ACCESS_TOKEN_EXPIRES_MS = 15 * 60 * 1000; // 15 minutes

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// ─── Password Reset Token ───────────────────────────────────────────────────

export async function generatePasswordResetToken(email: string) {
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = generateToken();
  const expires = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS);

  return prisma.passwordResetToken.create({
    data: { email, token, expires },
  });
}

export async function getPasswordResetToken(token: string) {
  return prisma.passwordResetToken.findUnique({ where: { token } });
}

export async function deletePasswordResetToken(token: string) {
  return prisma.passwordResetToken.delete({ where: { token } });
}

// ─── Email Verification Token ──────────────────────────────────────────────

export async function generateEmailVerificationToken(email: string) {
  await prisma.emailVerificationToken.deleteMany({ where: { email } });

  const token = generateToken();
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_MS);

  return prisma.emailVerificationToken.create({
    data: { email, token, expires },
  });
}

export async function getEmailVerificationToken(token: string) {
  return prisma.emailVerificationToken.findUnique({ where: { token } });
}

export async function deleteEmailVerificationToken(token: string) {
  return prisma.emailVerificationToken.delete({ where: { token } });
}

// ─── Refresh Token ─────────────────────────────────────────────────────────

export async function generateRefreshToken(userId: string): Promise<string> {
  // Revoke all existing refresh tokens for this user
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });

  const token = generateToken();
  const expires = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

  await prisma.refreshToken.create({
    data: { token, userId, expires },
  });

  return token;
}

export async function getRefreshToken(token: string) {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
}

export async function revokeRefreshToken(token: string) {
  return prisma.refreshToken.update({
    where: { token },
    data: { revoked: true },
  });
}

export async function revokeAllUserRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true },
  });
}
