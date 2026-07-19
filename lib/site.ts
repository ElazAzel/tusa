export const SITE_NAME = "TUSA.game";
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://tusa.game").replace(/\/$/, "");
export const CONTENT_UPDATED_AT = new Date("2026-07-19T00:00:00.000Z");

export function isCanonicalHost(host: string | null) {
  if (!host) return false;
  const normalized = host.split(":")[0].toLowerCase();
  return normalized === "tusagame.vercel.app" || normalized === "tusa.game" || normalized === "www.tusa.game";
}
