import { createHmac, timingSafeEqual } from "node:crypto";
import { auth } from "@/lib/local-auth/server";
import { cookies } from "next/headers";
import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-permissions";
import { getAdminMember } from "@/lib/admin-members";
import { consumeAdminRecoveryCode, getAdminMfaStatus, verifyAdminMfaCode, verifyTotpSecret } from "@/lib/admin-mfa";

const COOKIE_NAME = "tusa_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

export type AdminAccess = {
  clerkUserId: string;
  displayName: string;
  role: AdminRole;
  permissions: AdminPermission[];
  source: "root" | "member";
};

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function signature(value: string) {
  const secret = getSessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function isValidAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return Boolean(expected) && safeEqual(password, expected);
}

export async function isAdminMfaConfigured() {
  if (process.env.ADMIN_TOTP_SECRET?.trim()) return true;
  return (await getAdminMfaStatus("root")).enabled;
}

export function isValidAdminTotp(code: string, now = Date.now()) {
  const secret = process.env.ADMIN_TOTP_SECRET?.trim() ?? "";
  if (!secret) return true;
  return verifyTotpSecret(secret, code, now);
}

export async function verifyRootAdminSecondFactor(code: string, recoveryCode: string) {
  if (process.env.ADMIN_TOTP_SECRET?.trim()) return isValidAdminTotp(code);
  const status = await getAdminMfaStatus("root");
  if (!status.enabled) return true;
  if (code && await verifyAdminMfaCode("root", code)) return true;
  return Boolean(recoveryCode && await consumeAdminRecoveryCode("root", recoveryCode));
}

export function sessionValue() {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${signature(payload)}`;
}

export function hasValidSession(value?: string) {
  if (!value || !getSessionSecret()) return false;
  const [role, expiresAt, receivedSignature] = value.split(".");
  if (role !== "admin" || !expiresAt || !receivedSignature) return false;
  if (Number(expiresAt) < Date.now()) return false;
  const payload = `${role}.${expiresAt}`;
  return safeEqual(signature(payload), receivedSignature);
}

export async function getAdminAccess(): Promise<AdminAccess | null> {
  const store = await cookies();
  if (hasValidSession(store.get(COOKIE_NAME)?.value)) {
    return {
      clerkUserId: "root",
      displayName: "TUSA owner",
      role: "owner",
      permissions: [...ADMIN_PERMISSIONS],
      source: "root",
    };
  }

  try {
    const { userId } = await auth();
    if (!userId) return null;
    const member = await getAdminMember(userId);
    if (!member || member.status !== "active") return null;
    return {
      clerkUserId: member.clerkUserId,
      displayName: member.displayName,
      role: member.role,
      permissions: member.permissions,
      source: "member",
    };
  } catch {
    return null;
  }
}

export async function isAdmin(permission?: AdminPermission) {
  const access = await getAdminAccess();
  return Boolean(
    access && (!permission || access.permissions.includes(permission)),
  );
}

export const adminCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  },
};
