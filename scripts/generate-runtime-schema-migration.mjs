import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync(new URL("../lib/parties.ts", import.meta.url), "utf8");
const schemaStart = source.indexOf("export function ensurePartySchema()");
const schemaEnd = source.indexOf("export async function syncProfile", schemaStart);
const v2Start = source.indexOf("export function ensurePartyV2()");
const v2End = source.indexOf("async function seedPartyPass", v2Start);
if ([schemaStart, schemaEnd, v2Start, v2End].some((offset) => offset < 0)) throw new Error("Schema blocks were not found");

function extract(block) {
  return [...block.matchAll(/await sql`([\s\S]*?)`/g)]
    .map((match) => match[1].trim())
    .filter((statement) => !statement.includes("${") && /^(CREATE|ALTER|DROP)/i.test(statement));
}

const statements = [
  ...extract(source.slice(schemaStart, schemaEnd)),
  ...extract(source.slice(v2Start, v2End)),
];
const uniqueStatements = [...new Set(statements)];

const header = "-- Generated from ensurePartySchema. Review changes before applying.\n";
writeFileSync(new URL("../drizzle/0005_full_party_schema.sql", import.meta.url), `${header}${uniqueStatements.join(";\n--> statement-breakpoint\n\n")};\n`);
console.log(`Generated ${uniqueStatements.length} idempotent schema statements.`);
