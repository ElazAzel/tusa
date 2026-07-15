import "server-only";
import { createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "tusa_auth";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type AccountRow = { id: string; email: string; display_name: string; password_hash: string; image_url: string | null };
export type LocalUser = { id: string; fullName: string; firstName: string; imageUrl: string; primaryEmailAddress: { emailAddress: string } };

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

function makeToken(userId: string) {
  const payload = encode(JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

function readToken(token?: string | null) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(decode(payload)) as { userId?: string; exp?: number };
    return parsed.userId && typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000) ? parsed.userId : null;
  } catch {
    return null;
  }
}

async function ensureSchema() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = db()`CREATE TABLE IF NOT EXISTS local_accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`.then(() => undefined).catch((error) => { schemaPromise = null; throw error; });
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
  return { id: row.id, fullName: row.display_name, firstName, imageUrl: row.image_url ?? "", primaryEmailAddress: { emailAddress: row.email } };
}

export async function register(input: { email: string; password: string; name: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().slice(0, 80);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Введите корректный email.");
  if (input.password.length < 8) throw new Error("Пароль должен содержать минимум 8 символов.");
  if (!name) throw new Error("Введите имя.");
  await ensureSchema();
  const id = `local_${randomUUID()}`;
  const passwordHash = await hashPassword(input.password);
  try {
    const [row] = await db()`INSERT INTO local_accounts (id, email, display_name, password_hash) VALUES (${id}, ${email}, ${name}, ${passwordHash}) RETURNING id, email, display_name, image_url` as unknown as Omit<AccountRow, "password_hash">[];
    return userFromRow(row);
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) throw new Error("Этот email уже зарегистрирован.");
    throw error;
  }
}

export async function signIn(input: { email: string; password: string }) {
  await ensureSchema();
  const [row] = await db()`SELECT id, email, display_name, password_hash, image_url FROM local_accounts WHERE email = ${input.email.trim().toLowerCase()} LIMIT 1` as unknown as AccountRow[];
  if (!row || !(await passwordMatches(input.password, row.password_hash))) throw new Error("Неверный email или пароль.");
  return userFromRow(row);
}

export function sessionCookie(userId: string) {
  return { name: COOKIE_NAME, value: makeToken(userId), options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_SECONDS } };
}

export function clearedSessionCookie() {
  return { name: COOKIE_NAME, value: "", options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 } };
}

export async function auth() {
  const store = await cookies();
  return { userId: readToken(store.get(COOKIE_NAME)?.value) };
}

export async function currentUser(): Promise<LocalUser | null> {
  const { userId } = await auth();
  if (!userId) return null;
  await ensureSchema();
  const [row] = await db()`SELECT id, email, display_name, image_url FROM local_accounts WHERE id = ${userId} LIMIT 1` as unknown as Omit<AccountRow, "password_hash">[];
  return row ? userFromRow(row) : null;
}
