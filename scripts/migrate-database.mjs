import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

try {
  await migrate(drizzle(neon(process.env.DATABASE_URL)), { migrationsFolder: "drizzle" });
  console.log("Database migrations completed.");
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  if (error && typeof error === "object" && "cause" in error) console.error(error.cause);
  process.exitCode = 1;
}
