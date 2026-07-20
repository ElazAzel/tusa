import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const required = ["CERTIFICATION_BASE_URL", "CERTIFICATION_INVITE_CODE", "CERTIFICATION_PARTY_ID", "CERTIFICATION_HOST_STORAGE_STATE"] as const;
const missing = required.filter((name) => !process.env[name]);
const failures: string[] = [];

if (missing.length) failures.push(`Missing required environment variables: ${missing.join(", ")}`);

const baseUrl = process.env.CERTIFICATION_BASE_URL;
if (baseUrl) {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:") failures.push("CERTIFICATION_BASE_URL must use HTTPS.");
    if (url.hostname === "tusa.game" || url.hostname === "www.tusa.game") failures.push("Certification must run against an isolated preview, not the canonical production domain.");
  } catch {
    failures.push("CERTIFICATION_BASE_URL must be a valid URL.");
  }
}

const storageState = process.env.CERTIFICATION_HOST_STORAGE_STATE;
if (storageState && !existsSync(resolve(storageState))) failures.push("CERTIFICATION_HOST_STORAGE_STATE does not point to a readable Playwright storage-state file.");

try {
  if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) failures.push("Certification evidence must be generated from a clean Git worktree so its commit SHA matches the tested source.");
} catch {
  failures.push("Unable to verify the Git worktree state.");
}

if (process.env.CERTIFICATION_WRITE_EVIDENCE !== "true") failures.push("Set CERTIFICATION_WRITE_EVIDENCE=true to generate source-bound evidence.");

if (failures.length) {
  console.error(`Certification preflight failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log("Certification preflight passed. The run will use the supplied isolated preview URL and Host storage state.");
