import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { LoginSchema } from "@/schemas/auth";
import {
  generateRefreshToken,
  getRefreshToken,
  revokeAllUserRefreshTokens,
  ACCESS_TOKEN_EXPIRES_MS,
  REFRESH_TOKEN_EXPIRES_MS,
} from "@/lib/tokens";
import { authConfig } from "./auth.config";
import type { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const stored = await getRefreshToken(token.refreshToken);

    if (!stored || stored.revoked || stored.expires < new Date()) {
      await revokeAllUserRefreshTokens(token.userId).catch(() => null);
      return { ...token, error: "RefreshTokenExpired" };
    }

    const newRefreshToken = await generateRefreshToken(token.userId);

    return {
      ...token,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_EXPIRES_MS,
      refreshToken: newRefreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: REFRESH_TOKEN_EXPIRES_MS / 1000,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = LoginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;
          if (!user.isActive) return null;

          const passwordMatch = await compare(password, user.password);
          if (!passwordMatch) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            image: user.avatar,
          };
        } catch (err) {
          console.error("[AUTH] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const refreshToken = await generateRefreshToken(user.id);
        return {
          ...token,
          userId: user.id,
          role: user.role,
          name: user.name ?? "",
          email: user.email ?? "",
          picture: user.image ?? null,
          emailVerified: user.emailVerified,
          accessTokenExpires: Date.now() + ACCESS_TOKEN_EXPIRES_MS,
          refreshToken,
        };
      }

      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      return refreshAccessToken(token);
    },

    async session({
      session,
      token,
    }: {
      session: import("next-auth").Session;
      token: import("next-auth/jwt").JWT;
    }) {
      session.user = {
        ...session.user,
        id: token.userId,
        role: token.role,
        name: token.name,
        email: token.email,
        avatar: token.picture,
        emailVerified: token.emailVerified,
      };
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.userId) {
        await revokeAllUserRefreshTokens(message.token.userId).catch(() => null);
      }
    },
  },
});
