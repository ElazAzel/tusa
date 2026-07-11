import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-permissions";

export type AdminMember = {
  id: string;
  clerkUserId: string;
  displayName: string;
  handle: string;
  imageUrl: string;
  role: AdminRole;
  permissions: AdminPermission[];
  status: "active" | "suspended";
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditEntry = {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

let sqlClient: ReturnType<typeof neon> | null = null;
let schemaPromise: Promise<void> | null = null;

function db() {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL)
      throw new Error("Database is not configured.");
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

function cleanPermissions(value: unknown, fallback: AdminPermission[] = []) {
  if (!Array.isArray(value)) return fallback;
  const allowed = new Set<AdminPermission>(ADMIN_PERMISSIONS);
  return [
    ...new Set(
      value.filter(
        (item): item is AdminPermission =>
          typeof item === "string" && allowed.has(item as AdminPermission),
      ),
    ),
  ];
}

function parseJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function memberFromRow(row: Record<string, unknown>): AdminMember {
  const role = ADMIN_ROLES.includes(row.role as AdminRole)
    ? (row.role as AdminRole)
    : "support";
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    displayName: String(row.display_name ?? "TUSA admin"),
    handle: String(row.handle ?? ""),
    imageUrl: String(row.image_url ?? ""),
    role,
    permissions: cleanPermissions(
      parseJson(row.permissions),
      ROLE_PERMISSIONS[role],
    ),
    status: row.status === "suspended" ? "suspended" : "active",
    invitedBy: String(row.invited_by ?? ""),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
    updatedAt: new Date(row.updated_at as string | Date).toISOString(),
  };
}

function auditFromRow(row: Record<string, unknown>): AdminAuditEntry {
  const metadata = parseJson(row.metadata);
  return {
    id: String(row.id),
    actorId: String(row.actor_id),
    action: String(row.action),
    targetId: String(row.target_id ?? ""),
    metadata:
      metadata && typeof metadata === "object"
        ? (metadata as Record<string, unknown>)
        : {},
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export function ensureAdminSchema() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS admin_members (
      id UUID PRIMARY KEY,
      clerk_user_id TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'analyst', 'support')),
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      invited_by TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS admin_members_status_idx ON admin_members (status, updated_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS admin_audit_log (
      id UUID PRIMARY KEY,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit_log (created_at DESC)`;
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

async function audit(
  actorId: string,
  action: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
) {
  await ensureAdminSchema();
  await db()`INSERT INTO admin_audit_log (id, actor_id, action, target_id, metadata)
    VALUES (${randomUUID()}, ${actorId}, ${action}, ${targetId}, ${JSON.stringify(metadata)}::jsonb)`;
}

export async function adminProfileExists(clerkUserId: string) {
  await ensureAdminSchema();
  const rows =
    (await db()`SELECT 1 FROM user_profiles WHERE clerk_user_id = ${clerkUserId} LIMIT 1`) as unknown as Record<
      string,
      unknown
    >[];
  return Boolean(rows[0]);
}
export async function getAdminMember(clerkUserId: string) {
  await ensureAdminSchema();
  const rows = (await db()`SELECT am.*, up.display_name, up.handle, up.image_url
    FROM admin_members am
    LEFT JOIN user_profiles up ON up.clerk_user_id = am.clerk_user_id
    WHERE am.clerk_user_id = ${clerkUserId}
    LIMIT 1`) as unknown as Record<string, unknown>[];
  return rows[0] ? memberFromRow(rows[0]) : null;
}

export async function listAdminMembers() {
  await ensureAdminSchema();
  const rows = (await db()`SELECT am.*, up.display_name, up.handle, up.image_url
    FROM admin_members am
    LEFT JOIN user_profiles up ON up.clerk_user_id = am.clerk_user_id
    ORDER BY CASE am.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 WHEN 'analyst' THEN 3 ELSE 4 END, am.created_at ASC`) as unknown as Record<
    string,
    unknown
  >[];
  return rows.map(memberFromRow);
}

export async function createAdminMember(input: {
  clerkUserId: string;
  role: AdminRole;
  permissions?: AdminPermission[];
  actorId: string;
}) {
  await ensureAdminSchema();
  const permissions = cleanPermissions(
    input.permissions,
    ROLE_PERMISSIONS[input.role],
  );
  const [row] =
    (await db()`INSERT INTO admin_members (id, clerk_user_id, role, permissions, invited_by)
    VALUES (${randomUUID()}, ${input.clerkUserId}, ${input.role}, ${JSON.stringify(permissions)}::jsonb, ${input.actorId})
    ON CONFLICT (clerk_user_id) DO UPDATE SET role = EXCLUDED.role, permissions = EXCLUDED.permissions, status = 'active', updated_at = NOW()
    RETURNING *`) as unknown as Record<string, unknown>[];
  await audit(input.actorId, "admin.member.created", input.clerkUserId, {
    role: input.role,
    permissions,
  });
  return getAdminMember(String(row.clerk_user_id));
}

export async function updateAdminMember(input: {
  clerkUserId: string;
  role?: AdminRole;
  permissions?: AdminPermission[];
  status?: "active" | "suspended";
  actorId: string;
}) {
  await ensureAdminSchema();
  const current = await getAdminMember(input.clerkUserId);
  if (!current) return null;
  const role = input.role ?? current.role;
  const permissions =
    input.permissions === undefined
      ? current.permissions
      : cleanPermissions(input.permissions, ROLE_PERMISSIONS[role]);
  const status = input.status ?? current.status;
  await db()`UPDATE admin_members SET role = ${role}, permissions = ${JSON.stringify(permissions)}::jsonb, status = ${status}, updated_at = NOW()
    WHERE clerk_user_id = ${input.clerkUserId}`;
  await audit(input.actorId, "admin.member.updated", input.clerkUserId, {
    role,
    permissions,
    status,
  });
  return getAdminMember(input.clerkUserId);
}

export async function deleteAdminMember(clerkUserId: string, actorId: string) {
  await ensureAdminSchema();
  const rows =
    (await db()`DELETE FROM admin_members WHERE clerk_user_id = ${clerkUserId} RETURNING clerk_user_id`) as unknown as Record<
      string,
      unknown
    >[];
  if (!rows[0]) return false;
  await audit(actorId, "admin.member.deleted", clerkUserId);
  return true;
}

export async function listAdminAudit(limit = 50) {
  await ensureAdminSchema();
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(limit)));
  const rows =
    (await db()`SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT ${safeLimit}`) as unknown as Record<
      string,
      unknown
    >[];
  return rows.map(auditFromRow);
}
