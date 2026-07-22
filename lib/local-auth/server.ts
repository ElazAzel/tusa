import "server-only";
import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "tusa_auth";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PRODUCTION_SCHEMA_VERSION = 11;

type AccountRow = { id: string; email: string; display_name: string; password_hash: string; image_url: string | null; session_version: number; email_verified_at: string | Date | null };
export type LocalUser = { id: string; fullName: string; firstName: string; imageUrl: string; emailVerified: boolean; primaryEmailAddress: { emailAddress: string } };

let sqlClient: ReturnType<typeof neon> | null = null;
let schemaPromise: Promise<void> | null = null;

function db() {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

function secret() {
  const value = process.env.LOCAL_AUTH_SECRET || process.env.GUEST_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Authentication secret is not configured.");
  return value;
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function makeToken(userId: string, sessionVersion: number) {
  const payload = encode(JSON.stringify({ userId, sessionVersion, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

function readToken(token?: string | null) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(decode(payload)) as { userId?: string; sessionVersion?: number; exp?: number };
    return parsed.userId && Number.isInteger(parsed.sessionVersion) && typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000)
      ? { userId: parsed.userId, sessionVersion: parsed.sessionVersion as number }
      : null;
  } catch {
    return null;
  }
}

async function ensureSchema() {
  if (schemaPromise) return schemaPromise;
  const requiresMigrationGate = process.env.TUSA_STRICT_SCHEMA === "true" || process.env.VERCEL_ENV === "production";
  if (requiresMigrationGate) {
    schemaPromise = db()`SELECT version FROM platform_schema_version WHERE singleton = TRUE LIMIT 1`
      .then((rows) => {
        const [version] = rows as unknown as { version: number }[];
        if (!version || Number(version.version) < PRODUCTION_SCHEMA_VERSION) {
          throw new Error("Database schema is outdated. Run npm run db:migrate before serving auth traffic.");
        }
      })
      .catch((error) => { schemaPromise = null; throw error; });
    return schemaPromise;
  }
  schemaPromise = db()`CREATE TABLE IF NOT EXISTS local_accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    session_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`.then(async () => {
    await db()`ALTER TABLE local_accounts ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1`;
    await db()`ALTER TABLE local_accounts ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`;
    await db()`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES local_accounts(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await db()`CREATE INDEX IF NOT EXISTS password_reset_account_idx ON password_reset_tokens (account_id, created_at DESC)`;
    await db()`CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id UUID PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES local_accounts(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await db()`CREATE INDEX IF NOT EXISTS email_verification_account_idx ON email_verification_tokens (account_id, created_at DESC)`;
  }).catch((error) => { schemaPromise = null; throw error; });
  return schemaPromise;
}

async function hashPassword(password: string, salt = randomBytes(16).toString("base64url")) {
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${hash.toString("base64url")}`;
}

async function passwordMatches(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = await hashPassword(password, salt);
  const actualHash = actual.split(":")[1];
  return actualHash.length === expected.length && timingSafeEqual(Buffer.from(actualHash), Buffer.from(expected));
}

function userFromRow(row: Omit<AccountRow, "password_hash">): LocalUser {
  const firstName = row.display_name.trim().split(/\s+/)[0] || "TUSA friend";
  return { id: row.id, fullName: row.display_name, firstName, imageUrl: row.image_url ?? "", emailVerified: Boolean(row.email_verified_at), primaryEmailAddress: { emailAddress: row.email } };
}

export async function register(input: { email: string; password: string; name: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().slice(0, 80);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Введите корректный email.");
  if (input.password.length < 10 || !/[a-z]/i.test(input.password) || !/\d/.test(input.password)) throw new Error("Пароль должен содержать минимум 10 символов и цифру.");
  if (!name) throw new Error("Введите имя.");
  await ensureSchema();
  const id = `local_${randomUUID()}`;
  const passwordHash = await hashPassword(input.password);
  try {
    const [row] = await db()`INSERT INTO local_accounts (id, email, display_name, password_hash) VALUES (${id}, ${email}, ${name}, ${passwordHash}) RETURNING id, email, display_name, image_url, session_version, email_verified_at` as unknown as Omit<AccountRow, "password_hash">[];
    return userFromRow(row);
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) throw new Error("Этот email уже зарегистрирован.");
    throw error;
  }
}

export async function signIn(input: { email: string; password: string }) {
  await ensureSchema();
  const [row] = await db()`SELECT id, email, display_name, password_hash, image_url, session_version, email_verified_at FROM local_accounts WHERE email = ${input.email.trim().toLowerCase()} LIMIT 1` as unknown as AccountRow[];
  if (!row || !(await passwordMatches(input.password, row.password_hash))) throw new Error("Неверный email или пароль.");
  return userFromRow(row);
}

export async function sessionCookie(userId: string) {
  await ensureSchema();
  const [account] = await db()`SELECT session_version FROM local_accounts WHERE id = ${userId} LIMIT 1` as unknown as { session_version: number }[];
  if (!account) throw new Error("Account not found.");
  return { name: COOKIE_NAME, value: makeToken(userId, Number(account.session_version)), options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_SECONDS } };
}

export function clearedSessionCookie() {
  return { name: COOKIE_NAME, value: "", options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 } };
}

export async function auth() {
  const store = await cookies();
  const token = readToken(store.get(COOKIE_NAME)?.value);
  if (!token) return { userId: null };
  await ensureSchema();
  const [account] = await db()`SELECT session_version FROM local_accounts WHERE id = ${token.userId} LIMIT 1` as unknown as { session_version: number }[];
  return { userId: account && Number(account.session_version) === token.sessionVersion ? token.userId : null };
}

export async function currentUser(): Promise<LocalUser | null> {
  const { userId } = await auth();
  if (!userId) return null;
  await ensureSchema();
  const [row] = await db()`SELECT id, email, display_name, image_url, session_version, email_verified_at FROM local_accounts WHERE id = ${userId} LIMIT 1` as unknown as Omit<AccountRow, "password_hash">[];
  return row ? userFromRow(row) : null;
}

export async function revokeAllSessions(userId: string) {
  await ensureSchema();
  await db()`UPDATE local_accounts SET session_version = session_version + 1 WHERE id = ${userId}`;
}

function resetTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestEmailVerification(userId: string) {
  await ensureSchema();
  const [account] = await db()`SELECT id, email, display_name, email_verified_at FROM local_accounts WHERE id = ${userId} LIMIT 1` as unknown as { id: string; email: string; display_name: string; email_verified_at: string | Date | null }[];
  if (!account || account.email_verified_at) return null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db()`DELETE FROM email_verification_tokens WHERE account_id = ${account.id} AND used_at IS NULL`;
  await db()`INSERT INTO email_verification_tokens (id, account_id, token_hash, expires_at) VALUES (${randomUUID()}, ${account.id}, ${resetTokenHash(token)}, ${expiresAt})`;
  return { token, email: account.email, name: account.display_name };
}

export async function verifyEmail(token: string) {
  await ensureSchema();
  const [result] = await db()`WITH valid AS (
      UPDATE email_verification_tokens SET used_at = NOW()
      WHERE token_hash = ${resetTokenHash(token)} AND used_at IS NULL AND expires_at > NOW()
      RETURNING account_id
    ), verified AS (
      UPDATE local_accounts account SET email_verified_at = COALESCE(email_verified_at, NOW())
      FROM valid WHERE account.id = valid.account_id RETURNING account.id
    ) SELECT id FROM verified` as unknown as { id: string }[];
  return Boolean(result);
}

export async function requestPasswordReset(emailInput: string) {
  await ensureSchema();
  const email = emailInput.trim().toLowerCase();
  const [account] = await db()`SELECT id, email, display_name FROM local_accounts WHERE email = ${email} LIMIT 1` as unknown as { id: string; email: string; display_name: string }[];
  if (!account) return null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await db()`DELETE FROM password_reset_tokens WHERE account_id = ${account.id} AND used_at IS NULL`;
  await db()`INSERT INTO password_reset_tokens (id, account_id, token_hash, expires_at) VALUES (${randomUUID()}, ${account.id}, ${resetTokenHash(token)}, ${expiresAt})`;
  return { token, email: account.email, name: account.display_name };
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 10 || !/[a-z]/i.test(password) || !/\d/.test(password)) throw new Error("Password must contain at least 10 characters and a number.");
  await ensureSchema();
  const passwordHash = await hashPassword(password);
  const [result] = await db()`WITH valid AS (
      UPDATE password_reset_tokens SET used_at = NOW()
      WHERE token_hash = ${resetTokenHash(token)} AND used_at IS NULL AND expires_at > NOW()
      RETURNING account_id
    ), changed AS (
      UPDATE local_accounts account
      SET password_hash = ${passwordHash}, session_version = session_version + 1
      FROM valid WHERE account.id = valid.account_id
      RETURNING account.id
    ) SELECT id FROM changed` as unknown as { id: string }[];
  if (!result) throw new Error("Reset link is invalid or expired.");
  return result.id;
}
