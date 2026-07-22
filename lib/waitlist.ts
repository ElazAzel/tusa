import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { ensurePartySchema } from "@/lib/parties";

export const WAITLIST_CAPACITY_DEFAULT = 765;
export const WAITLIST_BASELINE_DEFAULT = 254;
export const WAITLIST_STATUSES = ["new", "shortlisted", "invited", "rejected"] as const;

export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export type WaitlistApplication = {
  id: string;
  name: string;
  city: string;
  contact: string;
  beta: boolean;
  status: WaitlistStatus;
  notes: string;
  submittedAt: string;
  updatedAt: string;
};

export type WaitlistStats = {
  capacity: number;
  baseline: number;
  applications: number;
  total: number;
  remaining: number;
  statuses: Record<WaitlistStatus, number>;
  betaApplicants: number;
  registeredUsers: number;
};

type ApplicationRow = {
  id: string;
  name: string;
  city: string;
  contact: string;
  beta: boolean;
  status: WaitlistStatus;
  notes: string | null;
  submitted_at: string | Date;
  updated_at: string | Date;
};

let sqlClient: ReturnType<typeof neon> | null = null;
let schemaPromise: Promise<void> | null = null;
const PRODUCTION_SCHEMA_VERSION = 12;

function sql() {
  if (!sqlClient) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("Waitlist database is not configured.");
    sqlClient = neon(databaseUrl);
  }
  return sqlClient;
}

function number(value: unknown) {
  return Number(value ?? 0);
}

export function fallbackWaitlistStats(): WaitlistStats {
  return {
    capacity: WAITLIST_CAPACITY_DEFAULT,
    baseline: WAITLIST_BASELINE_DEFAULT,
    applications: 0,
    total: WAITLIST_BASELINE_DEFAULT,
    remaining: WAITLIST_CAPACITY_DEFAULT - WAITLIST_BASELINE_DEFAULT,
    statuses: { new: 0, shortlisted: 0, invited: 0, rejected: 0 },
    betaApplicants: 0,
    registeredUsers: 0,
  };
}

function applicationFromRow(row: ApplicationRow): WaitlistApplication {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    contact: row.contact,
    beta: Boolean(row.beta),
    status: row.status,
    notes: row.notes ?? "",
    submittedAt: new Date(row.submitted_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function ensureWaitlistSchema() {
  if (schemaPromise) return schemaPromise;
  const database = sql();
  const requiresMigrationGate = process.env.TUSA_STRICT_SCHEMA === "true" || process.env.VERCEL_ENV === "production";
  if (requiresMigrationGate) {
    schemaPromise = database`SELECT version FROM platform_schema_version WHERE singleton = TRUE LIMIT 1`
      .then((rows) => {
        const [version] = rows as unknown as { version: number }[];
        if (!version || Number(version.version) < PRODUCTION_SCHEMA_VERSION) {
          throw new Error("Database schema is outdated. Run npm run db:migrate before serving waitlist traffic.");
        }
      })
      .catch((error) => { schemaPromise = null; throw error; });
    return schemaPromise;
  }
  schemaPromise = (async () => {
  await database`CREATE TABLE IF NOT EXISTS waitlist_settings (
    id TEXT PRIMARY KEY,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    baseline_count INTEGER NOT NULL CHECK (baseline_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await database`CREATE TABLE IF NOT EXISTS waitlist_applications (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    contact TEXT NOT NULL,
    contact_normalized TEXT NOT NULL UNIQUE,
    beta BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'invited', 'rejected')),
    notes TEXT NOT NULL DEFAULT '',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await database`CREATE INDEX IF NOT EXISTS waitlist_applications_submitted_at_idx ON waitlist_applications (submitted_at DESC)`;
  await database`INSERT INTO waitlist_settings (id, capacity, baseline_count)
    VALUES ('primary', ${WAITLIST_CAPACITY_DEFAULT}, ${WAITLIST_BASELINE_DEFAULT})
    ON CONFLICT (id) DO NOTHING`;
  })().catch((error) => { schemaPromise = null; throw error; });
  return schemaPromise;
}

export async function getWaitlistStats(): Promise<WaitlistStats> {
  await Promise.all([ensureWaitlistSchema(), ensurePartySchema()]);
  const database = sql();
  const settingsRows = await database`SELECT capacity, baseline_count FROM waitlist_settings WHERE id = 'primary'` as unknown as { capacity: number; baseline_count: number }[];
  const settings = settingsRows[0];
  const summaryRows = await database`SELECT
    COUNT(*)::int AS applications,
    COUNT(*) FILTER (WHERE beta)::int AS beta_applicants,
    COUNT(*) FILTER (WHERE status <> 'rejected')::int AS active_applications
    FROM waitlist_applications` as unknown as { applications: number; beta_applicants: number; active_applications: number }[];
  const summary = summaryRows[0];
  const rows = await database`SELECT status, COUNT(*)::int AS count FROM waitlist_applications GROUP BY status` as unknown as { status: string; count: number }[];
  const registrationRows = await database`SELECT COUNT(*)::int AS count FROM user_profiles` as unknown as { count: number }[];
  const statuses: Record<WaitlistStatus, number> = { new: 0, shortlisted: 0, invited: 0, rejected: 0 };
  for (const row of rows) {
    if (WAITLIST_STATUSES.includes(row.status as WaitlistStatus)) statuses[row.status as WaitlistStatus] = number(row.count);
  }
  const capacity = number(settings.capacity);
  const baseline = number(settings.baseline_count);
  const registeredUsers = number(registrationRows[0]?.count);
  const total = baseline + number(summary.active_applications) + registeredUsers;
  return {
    capacity,
    baseline,
    applications: number(summary.applications),
    total,
    remaining: Math.max(0, capacity - total),
    statuses,
    betaApplicants: number(summary.beta_applicants),
    registeredUsers,
  };
}

export async function getWaitlistStatsSafe(): Promise<WaitlistStats> {
  try {
    return await getWaitlistStats();
  } catch (error) {
    console.error("[waitlist] stats fallback", error instanceof Error ? error.message : String(error));
    return fallbackWaitlistStats();
  }
}

export async function listWaitlistApplications(): Promise<WaitlistApplication[]> {
  await ensureWaitlistSchema();
  const rows = await sql()`SELECT * FROM waitlist_applications ORDER BY submitted_at DESC` as unknown as ApplicationRow[];
  return rows.map(applicationFromRow);
}

export async function createWaitlistApplication(input: { name: string; city: string; contact: string; beta: boolean }) {
  await ensureWaitlistSchema();
  const database = sql();
  const contactNormalized = input.contact.trim().toLowerCase();
  const duplicateRows = await database`SELECT id FROM waitlist_applications WHERE contact_normalized = ${contactNormalized} LIMIT 1` as unknown as { id: string }[];
  const duplicate = duplicateRows[0];
  if (duplicate) return { kind: "duplicate" as const };

  const stats = await getWaitlistStats();
  if (stats.remaining < 1) return { kind: "full" as const, stats };

  const id = randomUUID();
  const [row] = await database`INSERT INTO waitlist_applications
    (id, name, city, contact, contact_normalized, beta)
    VALUES (${id}, ${input.name.trim()}, ${input.city.trim()}, ${input.contact.trim()}, ${contactNormalized}, ${input.beta})
    RETURNING *` as unknown as ApplicationRow[];
  const nextStats = await getWaitlistStats();
  return { kind: "created" as const, application: applicationFromRow(row), stats: nextStats };
}

export async function updateWaitlistApplication(id: string, update: Partial<Pick<WaitlistApplication, "status" | "notes">>) {
  await ensureWaitlistSchema();
  const database = sql();
  const current = await database`SELECT * FROM waitlist_applications WHERE id = ${id} LIMIT 1` as unknown as ApplicationRow[];
  if (!current[0]) return null;
  const status = update.status ?? current[0].status;
  const notes = update.notes ?? current[0].notes ?? "";
  const [row] = await database`UPDATE waitlist_applications
    SET status = ${status}, notes = ${notes}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *` as unknown as ApplicationRow[];
  return applicationFromRow(row);
}

export async function deleteWaitlistApplication(id: string) {
  await ensureWaitlistSchema();
  const result = await sql()`DELETE FROM waitlist_applications WHERE id = ${id} RETURNING id` as unknown as { id: string }[];
  return result.length > 0;
}

export async function updateWaitlistSettings(input: { capacity: number; baseline: number }) {
  await ensureWaitlistSchema();
  const [row] = await sql()`UPDATE waitlist_settings
    SET capacity = ${input.capacity}, baseline_count = ${input.baseline}, updated_at = NOW()
    WHERE id = 'primary'
    RETURNING capacity, baseline_count` as unknown as { capacity: number; baseline_count: number }[];
  return { capacity: number(row.capacity), baseline: number(row.baseline_count) };
}
