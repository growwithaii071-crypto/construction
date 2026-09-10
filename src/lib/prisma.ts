import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function isClientCurrent(client: PrismaClient) {
  // After schema changes, Turbopack can keep an old global PrismaClient.
  return (
    typeof (client as { emailTemplate?: unknown }).emailTemplate !== "undefined" &&
    typeof (client as { staffRole?: unknown }).staffRole !== "undefined"
  );
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma;
  if (existing && isClientCurrent(existing)) {
    return existing;
  }

  if (existing) {
    void existing.$disconnect().catch(() => {});
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/** Always resolve through a fresh/current client (avoids stale HMR singleton). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

export default prisma;
