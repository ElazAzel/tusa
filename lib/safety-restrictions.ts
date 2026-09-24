import "server-only";
import { neon } from "@neondatabase/serverless";

export type SafetyRestriction = {
  userId: string;
  restriction: "warn" | "suspended";
  reason: string;
  expiresAt: string | null;
};

let sqlClient: ReturnType<typeof neon> | null = null;

function db() {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

export async function getActiveSafetyRestriction(userId: string): Promise<SafetyRestriction | null> {
  try {
    const [row] = await db()`SELECT user_id, restriction, reason, expires_at
      FROM safety_user_restrictions
      WHERE user_id = ${userId} AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1` as unknown as Record<string, unknown>[];
    if (!row) return null;
    return {
      userId: String(row.user_id),
      restriction: String(row.restriction) as SafetyRestriction["restriction"],
      reason: String(row.reason ?? ""),
      expiresAt: row.expires_at ? new Date(row.expires_at as string | Date).toISOString() : null,
    };
  } catch {
    if (process.env.VERCEL_ENV === "production" || process.env.TUSA_STRICT_SCHEMA === "true") return { userId, restriction: "suspended", reason: "Restriction lookup unavailable", expiresAt: null };
    return null;
  }
}

export async function isUserSuspended(userId: string) {
  const restriction = await getActiveSafetyRestriction(userId);
  return restriction?.restriction === "suspended";
}
