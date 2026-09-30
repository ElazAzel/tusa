import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log(`Skipping database migrations for VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}.`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to migrate the production database before the build.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["scripts/migrate-database.mjs"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
