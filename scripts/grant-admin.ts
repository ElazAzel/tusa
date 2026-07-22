import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { ADMIN_PERMISSIONS, ADMIN_ROLES, ROLE_PERMISSIONS, type AdminRole } from "@/lib/admin-permissions";

nextEnv.loadEnvConfig(process.cwd());

const email = process.argv[2]?.trim().toLowerCase();
const role = process.argv[3] ?? "admin";

if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Usage: tsx scripts/grant-admin.ts email@example.com [role]");
if (!ADMIN_ROLES.includes(role as AdminRole)) throw new Error(`Unknown admin role: ${role}`);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const sql = neon(process.env.DATABASE_URL);
let [profile] = await sql`SELECT clerk_user_id, display_name FROM user_profiles WHERE lower(clerk_user_id) = ${email} LIMIT 1` as unknown as Array<{ clerk_user_id: string; display_name: string }>;
if (!profile) {
  const [account] = await sql`SELECT id, display_name, image_url FROM local_accounts WHERE lower(email) = ${email} LIMIT 1` as unknown as Array<{ id: string; display_name: string; image_url: string }>;
  if (!account) throw new Error("No local TUSA.game account exists for this email. Sign in or sign up once, then run this command again.");
  const handle = `${account.display_name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18) || "tusa"}${account.id.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase()}`.slice(0, 24);
  const [created] = await sql`INSERT INTO user_profiles (clerk_user_id, display_name, handle, image_url)
    VALUES (${account.id}, ${account.display_name.slice(0, 80)}, ${handle}, ${account.image_url ?? ""})
    ON CONFLICT (clerk_user_id) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING clerk_user_id, display_name` as unknown as Array<{ clerk_user_id: string; display_name: string }>;
  profile = created;
}

const adminRole = role as AdminRole;
const permissions = ROLE_PERMISSIONS[adminRole] ?? ADMIN_PERMISSIONS;
await sql`INSERT INTO admin_members (id, clerk_user_id, role, permissions, status, invited_by)
  VALUES (${randomUUID()}, ${profile.clerk_user_id}, ${adminRole}, ${JSON.stringify(permissions)}::jsonb, 'active', 'bootstrap')
  ON CONFLICT (clerk_user_id) DO UPDATE SET role = EXCLUDED.role, permissions = EXCLUDED.permissions, status = 'active', updated_at = NOW()`;
await sql`INSERT INTO admin_audit_log (id, actor_id, action, target_id, metadata)
  VALUES (${randomUUID()}, 'bootstrap', 'admin.member.granted', ${profile.clerk_user_id}, ${JSON.stringify({ role: adminRole, email })}::jsonb)`;

console.log(JSON.stringify({ granted: true, clerkUserId: profile.clerk_user_id, displayName: profile.display_name, role: adminRole }));
