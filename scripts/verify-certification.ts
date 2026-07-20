import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { certificationGameIds, certificationScenarios, computeCertificationSourceHash } from "../lib/games/certification-node";

type Evidence = { gameId?: string; sourceHash?: string; commitSha?: string; contexts?: number; scenarios?: Record<string, { passed?: boolean }>; screenshots?: string[] };
const manifest = readFileSync(resolve("lib/games/manifest.ts"), "utf8");
const failures: string[] = [];
let certified = 0;

for (const gameId of certificationGameIds) {
  const line = manifest.split("\n").find((item) => item.includes(`id: "${gameId}"`));
  const status = line?.match(/releaseStatus: "(beta|certified)"/)?.[1];
  if (!status) failures.push(`${gameId}: release status is missing from the manifest`);
  if (status !== "certified") continue;
  certified += 1;
  const path = resolve("docs/game-certification", `${gameId}.json`);
  if (!existsSync(path)) { failures.push(`${gameId}: evidence is missing`); continue; }
  const evidence = JSON.parse(readFileSync(path, "utf8")) as Evidence;
  if (evidence.gameId !== gameId) failures.push(`${gameId}: evidence gameId mismatch`);
  if (!evidence.commitSha || evidence.commitSha === "unknown") failures.push(`${gameId}: evidence needs a commit SHA`);
  if ((evidence.contexts ?? 0) < 3) failures.push(`${gameId}: Host + two Controller contexts are required`);
  if (evidence.sourceHash !== computeCertificationSourceHash(gameId)) failures.push(`${gameId}: evidence is stale for current source`);
  for (const scenario of certificationScenarios) if (!evidence.scenarios?.[scenario]?.passed) failures.push(`${gameId}: scenario ${scenario} did not pass`);
  const expectedScreenshots = [`screenshots/${gameId}-ru.png`, `screenshots/${gameId}-en.png`];
  for (const screenshot of expectedScreenshots) {
    if (!evidence.screenshots?.includes(screenshot)) failures.push(`${gameId}: ${screenshot} is missing from evidence`);
    else if (!existsSync(resolve("docs/game-certification", screenshot))) failures.push(`${gameId}: ${screenshot} file is missing`);
  }
}

if (failures.length) {
  console.error(`Certification gate failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}
console.log(`Certification gate passed: ${certified}/${certificationGameIds.length} core games certified; remaining games stay beta.`);
