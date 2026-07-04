/**
 * Type-safe environment variable access.
 * Add new variables here to get TypeScript validation.
 */

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  app: {
    name: getEnvVar("NEXT_PUBLIC_APP_NAME", "Construction Co."),
    url: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    env: getEnvVar("NEXT_PUBLIC_APP_ENV", "development"),
    isDev: process.env.NEXT_PUBLIC_APP_ENV !== "production",
    isProd: process.env.NEXT_PUBLIC_APP_ENV === "production",
  },
  db: {
    url: process.env.DATABASE_URL ?? "",
  },
  auth: {
    url: process.env.NEXTAUTH_URL ?? "",
    secret: process.env.NEXTAUTH_SECRET ?? "",
  },
  email: {
    from: process.env.EMAIL_FROM ?? "",
    host: process.env.EMAIL_SERVER_HOST ?? "",
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    user: process.env.EMAIL_SERVER_USER ?? "",
    password: process.env.EMAIL_SERVER_PASSWORD ?? "",
  },
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  analytics: {
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  },
} as const;
