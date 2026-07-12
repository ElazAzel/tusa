import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hits = new Map<string, { count: number; resetAt: number }>();

const distributedLimiters = new Map<string, Ratelimit>();

function getDistributedLimiter(max: number, windowMs: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const key = `${max}:${windowMs}`;
  const cached = distributedLimiters.get(key);
  if (cached) return cached;
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(max, `${Math.max(1, Math.ceil(windowMs / 1000))} s`), prefix: "tusa:rl", analytics: true });
  distributedLimiters.set(key, limiter);
  return limiter;
}

export function rateLimit(key: string, max: number = 60, windowMs: number = 60000) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  entry.count++;
  if (entry.count > max) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: max - entry.count };
}

export async function distributedRateLimit(key: string, max: number = 60, windowMs: number = 60000) {
  const limiter = getDistributedLimiter(max, windowMs);
  if (!limiter) return { ...rateLimit(key, max, windowMs), backend: "local" as const };
  const result = await limiter.limit(key);
  return { allowed: result.success, remaining: result.remaining, resetAt: result.reset, backend: "upstash" as const };
}

export function getClientIp(headers: Headers) {
  const vercelIp = headers.get("x-vercel-forwarded-for");
  const forwarded = vercelIp ?? headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "unknown";
  return forwarded.split(",")[0].trim().slice(0, 64) || "unknown";
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}, 60000);
