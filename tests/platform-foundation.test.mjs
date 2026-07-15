import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manifest = readFileSync(new URL("../lib/games/manifest.ts", import.meta.url), "utf8");
const room = readFileSync(new URL("../app/party/[inviteCode]/PartyRoom.tsx", import.meta.url), "utf8");
const gamesApi = readFileSync(new URL("../app/api/games/route.ts", import.meta.url), "utf8");
const liveApi = readFileSync(new URL("../app/api/live/route.ts", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
const scoring = readFileSync(new URL("../lib/games/scoring.ts", import.meta.url), "utf8");
const dailyApi = readFileSync(new URL("../app/api/daily/route.ts", import.meta.url), "utf8");
const dailyUi = readFileSync(new URL("../app/components/DailyChallenge.tsx", import.meta.url), "utf8");
const passApi = readFileSync(new URL("../app/api/pass/route.ts", import.meta.url), "utf8");
const questsApi = readFileSync(new URL("../app/api/quests/route.ts", import.meta.url), "utf8");
const gratitudeApi = readFileSync(new URL("../app/api/gratitude/route.ts", import.meta.url), "utf8");
const partiesSource = readFileSync(new URL("../lib/parties.ts", import.meta.url), "utf8");
const commandClient = readFileSync(new URL("../app/components/sendGameCommand.ts", import.meta.url), "utf8");
const commandMigration = readFileSync(new URL("../drizzle/0001_game_command_idempotency.sql", import.meta.url), "utf8");
const commandRegistry = readFileSync(new URL("../lib/games/commands.ts", import.meta.url), "utf8");

test("canonical manifest contains exactly 32 unique game ids and slugs", () => {
  const ids = [...manifest.matchAll(/game\(\{ id: "([^"]+)"/g)].map((match) => match[1]);
  const slugs = [...manifest.matchAll(/seo: \{ slug: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 32);
  assert.equal(new Set(ids).size, 32);
  assert.equal(slugs.length, 32);
  assert.equal(new Set(slugs).size, 32);
});

test("party room consumes the canonical game manifest", () => {
  assert.match(room, /GAME_MANIFEST/);
  assert.doesNotMatch(room, /type GameId = "/);
});

test("game endpoints validate input and authorize party access", () => {
  assert.match(gamesApi, /gameRequestSchema\.safeParse/);
  assert.match(gamesApi, /requirePartyMember/);
  assert.match(gamesApi, /current\.createdBy !== userId/);
  assert.match(liveApi, /Publishing directly to live channels is not allowed/);
  assert.match(gamesApi, /deriveVerifiedScore\(current\.state\)/);
  assert.doesNotMatch(gamesApi, /body\.score/);
  assert.match(scoring, /persisted server snapshot/i);
});

test("sitemap and AI discovery are manifest driven", () => {
  assert.match(sitemap, /GAME_MANIFEST/);
  assert.match(readFileSync(new URL("../app/llms.txt/route.ts", import.meta.url), "utf8"), /GAME_MANIFEST/);
});

test("daily challenge is server-scored and never uses a random client score", () => {
  assert.match(dailyApi, /submitDailyAnswers/);
  assert.match(dailyApi, /submissionSchema\.safeParse/);
  assert.doesNotMatch(dailyApi, /Access-Control-Allow-Origin.*\*/);
  assert.doesNotMatch(dailyUi, /Math\.random/);
  assert.match(dailyUi, /answers: nextAnswers/);
});

test("XP and quest progress cannot be directly incremented by a client", () => {
  assert.doesNotMatch(passApi, /export async function POST/);
  assert.doesNotMatch(questsApi, /trackQuestProgress/);
  assert.match(gamesApi, /addPassXp\(userId/);
  assert.match(gamesApi, /trackQuestProgress\("playgames"/);
});

test("KOINS gratitude transfers are validated and executed atomically", () => {
  assert.match(gratitudeApi, /tipSchema\.safeParse/);
  assert.match(gratitudeApi, /distributedRateLimit/);
  assert.doesNotMatch(gratitudeApi, /Access-Control-Allow-Origin/);
  assert.match(partiesSource, /WITH debit AS \(/);
  assert.match(partiesSource, /Cannot send KOINS to yourself/);
});

test("multiplayer commands are idempotent across retries and reconnects", () => {
  assert.match(commandClient, /clientMutationId/);
  assert.match(commandClient, /attempt < 3/);
  assert.match(partiesSource, /ON CONFLICT \(session_id, clerk_user_id, client_mutation_id\)/);
  assert.match(commandMigration, /CREATE UNIQUE INDEX IF NOT EXISTS game_actions_command_unique/);
});

test("every accepted multiplayer command is game-scoped and payload-validated", () => {
  assert.match(gamesApi, /parseGameCommand\(current\.game/);
  assert.match(commandRegistry, /stroke: z\.object/);
  assert.match(commandRegistry, /nightAction: z\.object/);
  assert.doesNotMatch(commandRegistry, /z\.unknown/);
});

test("server multiplayer games visibly identify active live sessions", () => {
  const games = ["BombParty", "BrainBurst", "Charades", "Crocodil", "GuessSong", "HeadsUp", "Impostor", "Spyfall", "Wheel"];
  for (const game of games) {
    const source = readFileSync(new URL(`../app/components/games/${game}.tsx`, import.meta.url), "utf8");
    assert.match(source, /sessionId && <span className="multiplayer-badge">LIVE<\/span>/, game);
  }
});
