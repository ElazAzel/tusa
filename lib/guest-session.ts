import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

export const GUEST_COOKIE = "tusa_guest_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface GuestSession {
  kind: "guest";
  id: string;
  partyId: string;
  inviteCode: string;
  displayName: string;
  avatar: string;
  expiresAt: number;
}

export type Actor = {
  id: string;
  kind: "clerk" | "guest";
  displayName: string;
  imageUrl: string;
  guest?: GuestSession;
};

function getSecret() {
  const secret = process.env.GUEST_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "tusa-local-guest-secret-change-me";
  return null;
}

function sign(payload: string, secret: string) { return createHmac("sha256", secret).update(payload).digest("base64url"); }

export function createGuestSession(input: Omit<GuestSession, "kind" | "id" | "expiresAt">) {
  const secret = getSecret();
  if (!secret) throw new Error("Guest sessions are not configured");
  const session: GuestSession = { kind: "guest", id: `guest_${randomUUID()}`, ...input, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { session, token: `${payload}.${sign(payload, secret)}` };
}

export function verifyGuestSession(token?: string | null): GuestSession | null {
  const secret = getSecret();
  if (!secret || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GuestSession;
    if (parsed.kind !== "guest" || !parsed.id.startsWith("guest_") || parsed.expiresAt <= Date.now()) return null;
    if (!parsed.partyId || !parsed.inviteCode || !parsed.displayName) return null;
    return parsed;
  } catch { return null; }
}

export async function readGuestSession() {
  const store = await cookies();
  return verifyGuestSession(store.get(GUEST_COOKIE)?.value);
}

export async function resolveActor(): Promise<Actor | null> {
  try {
    const { userId } = await auth();
    if (userId) {
      let user;
      try { user = await currentUser(); } catch { user = null; }
      return { id: userId, kind: "clerk", displayName: user?.fullName ?? user?.firstName ?? "TUSA friend", imageUrl: user?.imageUrl ?? "" };
    }
  } catch { /* Clerk auth failed — fall through to guest session */ }
  const guest = await readGuestSession();
  return guest ? { id: guest.id, kind: "guest", displayName: guest.displayName, imageUrl: guest.avatar, guest } : null;
}

export const guestCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
