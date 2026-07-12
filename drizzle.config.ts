import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dbCredentials: { url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/tusa" },
  strict: true,
  verbose: true,
});
