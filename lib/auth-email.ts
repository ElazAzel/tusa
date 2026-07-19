import "server-only";
import { recordPlatformError } from "@/lib/observability";

export async function deliverAuthEmail(payload: Record<string, unknown>) {
  if (!process.env.AUTH_EMAIL_WEBHOOK_URL) return false;
  try {
    const response = await fetch(process.env.AUTH_EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AUTH_EMAIL_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.AUTH_EMAIL_WEBHOOK_SECRET}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Auth email webhook returned ${response.status}.`);
    return true;
  } catch (error) {
    void recordPlatformError({ source: "server", route: "auth-email", method: "POST", error, context: { template: payload.template ?? "unknown" } }).catch(() => undefined);
    return false;
  }
}
