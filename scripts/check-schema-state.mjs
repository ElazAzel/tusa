import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const sql = neon(process.env.DATABASE_URL);
const migrationTable = await sql`SELECT to_regclass('drizzle.__drizzle_migrations')::text AS name`;
const migrations = migrationTable[0]?.name
  ? await sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`
  : [];
const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('safety_reports', 'moderation_actions', 'safety_blocks', 'password_reset_tokens', 'platform_schema_version') ORDER BY table_name`;
const version = tables.some((row) => row.table_name === "platform_schema_version")
  ? await sql`SELECT version, applied_at FROM platform_schema_version WHERE singleton = TRUE`
  : [];
console.log(JSON.stringify({ migrationTable: migrationTable[0]?.name ?? null, migrationCount: migrations.length, migrations, tables: tables.map((row) => row.table_name), version }, null, 2));
