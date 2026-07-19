import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";

let sqlClient: ReturnType<typeof neon> | null = null;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function db() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

function encryptionKey() {
  const value = process.env.ADMIN_MFA_ENCRYPTION_KEY?.trim() ?? "";
  const key = /^[0-9a-f]{64}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("ADMIN_MFA_ENCRYPTION_KEY must contain 32 random bytes encoded as base64 or hex.");
  return key;
}

function encrypt(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

function decrypt(value: string) {
  const [version, iv, tag, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext) throw new Error("Invalid encrypted MFA secret.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

function encodeBase32(buffer: Buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let offset = 0; offset < bits.length; offset += 5) output += alphabet[Number.parseInt(bits.slice(offset, offset + 5).padEnd(5, "0"), 2)];
  return output;
}

function decodeBase32(value: string) {
  let bits = "";
  for (const character of value.toUpperCase().replace(/[^A-Z2-7]/g, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) return Buffer.alloc(0);
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  return Buffer.from(bytes);
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function totpAt(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

export function verifyTotpSecret(secret: string, code: string, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return false;
  const step = Math.floor(now / 30_000);
  return [-1, 0, 1].some((offset) => safeEqual(totpAt(secret, step + offset), code));
}

export async function getAdminMfaStatus(actorId: string) {
  if (!process.env.DATABASE_URL || !process.env.ADMIN_MFA_ENCRYPTION_KEY) return { configured: false, enabled: false, recoveryCodesRemaining: 0 };
  try {
    const [row] = await db()`SELECT enabled_at,
      (SELECT COUNT(*)::int FROM admin_mfa_recovery_codes r WHERE r.actor_id = c.actor_id AND r.used_at IS NULL) AS remaining
      FROM admin_mfa_credentials c WHERE actor_id = ${actorId}` as unknown as Array<{ enabled_at: string | null; remaining: number }>;
    return { configured: Boolean(row), enabled: Boolean(row?.enabled_at), recoveryCodesRemaining: Number(row?.remaining ?? 0) };
  } catch {
    return { configured: false, enabled: false, recoveryCodesRemaining: 0 };
  }
}

export async function beginAdminMfaEnrollment(actorId: string) {
  const secret = encodeBase32(randomBytes(20));
  await db()`INSERT INTO admin_mfa_credentials (actor_id, encrypted_secret, enabled_at, updated_at)
    VALUES (${actorId}, ${encrypt(secret)}, NULL, NOW())
    ON CONFLICT (actor_id) DO UPDATE SET encrypted_secret = EXCLUDED.encrypted_secret, enabled_at = NULL, updated_at = NOW()`;
  await db()`DELETE FROM admin_mfa_recovery_codes WHERE actor_id = ${actorId}`;
  const label = encodeURIComponent("TUSA.game root admin");
  return { secret, otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent("TUSA.game")}&algorithm=SHA1&digits=6&period=30` };
}

export async function confirmAdminMfaEnrollment(actorId: string, code: string) {
  const [row] = await db()`SELECT encrypted_secret FROM admin_mfa_credentials WHERE actor_id = ${actorId}` as unknown as Array<{ encrypted_secret: string }>;
  if (!row || !verifyTotpSecret(decrypt(row.encrypted_secret), code)) return null;
  const recoveryCodes = Array.from({ length: 10 }, () => `${randomBytes(3).toString("hex")}-${randomBytes(3).toString("hex")}`);
  await db().transaction((sql) => [
    sql`UPDATE admin_mfa_credentials SET enabled_at = NOW(), updated_at = NOW() WHERE actor_id = ${actorId}`,
    sql`DELETE FROM admin_mfa_recovery_codes WHERE actor_id = ${actorId}`,
    ...recoveryCodes.map((recoveryCode) => {
      const hash = createHash("sha256").update(recoveryCode).digest("hex");
      return sql`INSERT INTO admin_mfa_recovery_codes (id, actor_id, code_hash) VALUES (${randomUUID()}, ${actorId}, ${hash})`;
    }),
  ]);
  return recoveryCodes;
}

export async function verifyAdminMfaCode(actorId: string, code: string) {
  const [row] = await db()`SELECT encrypted_secret FROM admin_mfa_credentials WHERE actor_id = ${actorId} AND enabled_at IS NOT NULL` as unknown as Array<{ encrypted_secret: string }>;
  return Boolean(row && verifyTotpSecret(decrypt(row.encrypted_secret), code));
}

export async function consumeAdminRecoveryCode(actorId: string, code: string) {
  const hash = createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
  const rows = await db()`UPDATE admin_mfa_recovery_codes SET used_at = NOW()
    WHERE actor_id = ${actorId} AND code_hash = ${hash} AND used_at IS NULL RETURNING id` as unknown as Array<{ id: string }>;
  return rows.length === 1;
}
