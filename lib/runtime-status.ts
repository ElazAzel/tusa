export type RuntimeServiceState = "ready" | "fallback" | "missing";

export type RuntimeStatus = {
  environment: "production" | "preview" | "development";
  strictDistributedServices: boolean;
  overall: "ready" | "degraded" | "blocked";
  services: {
    database: RuntimeServiceState;
    localAuth: RuntimeServiceState;
    clerk: "live" | "development" | "unconfigured";
    realtime: RuntimeServiceState;
    rateLimit: RuntimeServiceState;
    media: RuntimeServiceState;
    observability: RuntimeServiceState;
    email: RuntimeServiceState;
    adminMfa: RuntimeServiceState;
  };
};

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

export function runtimeEnvironment(): RuntimeStatus["environment"] {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "development";
}

export function requiresDistributedServices() {
  return process.env.TUSA_REQUIRE_DISTRIBUTED_SERVICES === "true";
}

export function hasAblyConfiguration() {
  return configured(process.env.ABLY_API_KEY);
}

export function hasUpstashConfiguration() {
  return configured(process.env.UPSTASH_REDIS_REST_URL) && configured(process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function hasDatabaseTransport() {
  return configured(process.env.DATABASE_URL);
}

export function realtimeTransportAvailable() {
  return hasAblyConfiguration() || hasDatabaseTransport() || !requiresDistributedServices();
}

export function getRuntimeStatus(): RuntimeStatus {
  const environment = runtimeEnvironment();
  const strictDistributedServices = requiresDistributedServices();
  const database = configured(process.env.DATABASE_URL) ? "ready" : "missing";
  const localAuth = configured(process.env.LOCAL_AUTH_SECRET) || configured(process.env.GUEST_SESSION_SECRET) || configured(process.env.ADMIN_SESSION_SECRET)
    ? "ready"
    : "missing";
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const clerk = clerkKey?.startsWith("pk_live_") ? "live" : clerkKey ? "development" : "unconfigured";
  const realtime = hasAblyConfiguration() || hasDatabaseTransport() ? "ready" : strictDistributedServices ? "missing" : "fallback";
  const rateLimit = hasUpstashConfiguration() || hasDatabaseTransport() ? "ready" : strictDistributedServices ? "missing" : "fallback";
  const media = configured(process.env.BLOB_READ_WRITE_TOKEN) ? "ready" : "fallback";
  const observability = configured(process.env.SENTRY_DSN) || configured(process.env.NEXT_PUBLIC_SENTRY_DSN) || database === "ready" ? "ready" : "fallback";
  const email = (configured(process.env.RESEND_API_KEY) && configured(process.env.AUTH_EMAIL_FROM))
    || (environment !== "production" && configured(process.env.AUTH_EMAIL_WEBHOOK_URL)) ? "ready" : "missing";
  const adminMfa = configured(process.env.ADMIN_TOTP_SECRET) || configured(process.env.ADMIN_MFA_ENCRYPTION_KEY) ? "ready" : "missing";
  const blocked = database === "missing" || localAuth === "missing" || realtime === "missing" || rateLimit === "missing";
  const degraded = !blocked && ([realtime, rateLimit, media, observability].includes("fallback") || email !== "ready" || adminMfa !== "ready");

  return {
    environment,
    strictDistributedServices,
    overall: blocked ? "blocked" : degraded ? "degraded" : "ready",
    services: { database, localAuth, clerk, realtime, rateLimit, media, observability, email, adminMfa },
  };
}
