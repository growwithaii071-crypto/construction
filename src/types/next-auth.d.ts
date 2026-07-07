import { UserRole } from "@/generated/prisma";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: Date | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      avatar?: string | null;
      phone?: string | null;
      emailVerified: Date | null;
    };
    error?: "RefreshTokenExpired" | "RefreshTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: UserRole;
    name: string;
    email: string;
    picture?: string | null;
    emailVerified: Date | null;
    accessTokenExpires: number;
    refreshToken: string;
    error?: "RefreshTokenExpired" | "RefreshTokenError";
  }
}
