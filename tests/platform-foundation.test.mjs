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
const chatApi = readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
const systemApi = readFileSync(new URL("../app/api/admin/system/route.ts", import.meta.url), "utf8");
const runtimeStatus = readFileSync(new URL("../lib/runtime-status.ts", import.meta.url), "utf8");
const cosmeticsApi = readFileSync(new URL("../app/api/cosmetics/route.ts", import.meta.url), "utf8");
const cosmeticsAdminApi = readFileSync(new URL("../app/api/admin/cosmetics/route.ts", import.meta.url), "utf8");
const profileApi = readFileSync(new URL("../app/api/profile/route.ts", import.meta.url), "utf8");
const runtimeRepairMigration = readFileSync(new URL("../drizzle/0002_runtime_schema_repair.sql", import.meta.url), "utf8");
const safetyMigration = readFileSync(new URL("../drizzle/0003_safety_and_media.sql", import.meta.url), "utf8");
const authMigration = readFileSync(new URL("../drizzle/0004_local_auth_lifecycle.sql", import.meta.url), "utf8");
const mediaApi = readFileSync(new URL("../app/api/media/route.ts", import.meta.url), "utf8");
const moderationApi = readFileSync(new URL("../app/api/admin/moderation/route.ts", import.meta.url), "utf8");
const localAuth = readFileSync(new URL("../lib/local-auth/server.ts", import.meta.url), "utf8");
const liveSource = readFileSync(new URL("../lib/live.ts", import.meta.url), "utf8");
const rateLimitSource = readFileSync(new URL("../lib/rate-limit.ts", import.meta.url), "utf8");
const observabilitySource = readFileSync(new URL("../lib/observability.ts", import.meta.url), "utf8");
const observabilityMigration = readFileSync(new URL("../drizzle/0008_platform_observability.sql", import.meta.url), "utf8");
const verificationMigration = readFileSync(new URL("../drizzle/0009_auth_verification.sql", import.meta.url), "utf8");
const adminAuth = readFileSync(new URL("../lib/admin-auth.ts", import.meta.url), "utf8");

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

test("runtime schema repairs support chat and versioned game sessions", () => {
  assert.match(partiesSource, /ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1/);
  assert.match(runtimeRepairMigration, /ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1/);
  assert.match(partiesSource, /ON CONFLICT \(party_id, clerk_user_id, client_mutation_id\) WHERE client_mutation_id IS NOT NULL DO NOTHING/);
});

test("engagement and game retries cannot duplicate rewards", () => {
  const rewardFunction = partiesSource.slice(partiesSource.indexOf("export async function grantEngagementReward"), partiesSource.indexOf("export async function getEngagementStats"));
  assert.match(rewardFunction, /WITH allowance AS/);
  assert.match(rewardFunction, /ledger AS/);
  assert.doesNotMatch(rewardFunction, /addKoinsTransaction/);
  assert.match(gamesApi, /if \(score\.created\)/);
});

test("every accepted multiplayer command is game-scoped and payload-validated", () => {
  assert.match(gamesApi, /parseGameCommand\(current\.game/);
  assert.match(commandRegistry, /stroke: z\.object/);
  assert.match(commandRegistry, /nightAction: z\.object/);
  assert.doesNotMatch(commandRegistry, /z\.unknown/);
});

test("chat messages are member-scoped, idempotent and recover after reconnect", () => {
  assert.match(chatApi, /requirePartyMember\(body\.partyId, actor\.id\)/);
  assert.match(chatApi, /clientMutationId: z\.string\(\)\.uuid\(\)/);
  assert.match(chatApi, /duplicate: !created/);
  assert.match(partiesSource, /chat_messages_mutation_idx/);
  assert.match(partiesSource, /ON CONFLICT \(party_id, clerk_user_id, client_mutation_id\) WHERE client_mutation_id IS NOT NULL DO NOTHING/);
  assert.match(room, /liveChat\.connectionEpoch/);
  assert.match(room, /chatSendFailed/);
});

test("runtime health never exposes secrets and strict realtime can fail closed", () => {
  assert.match(systemApi, /getAdminAccess/);
  assert.match(systemApi, /system_read/);
  assert.match(systemApi, /getRuntimeStatus/);
  assert.match(runtimeStatus, /TUSA_REQUIRE_DISTRIBUTED_SERVICES/);
  assert.match(liveApi, /isRealtimeTransportAvailable/);
  assert.doesNotMatch(systemApi, /ABLY_API_KEY|UPSTASH_REDIS_REST_TOKEN|DATABASE_URL/);
});

test("runtime schema upgrades do not drop and recreate idempotency constraints", () => {
  assert.doesNotMatch(partiesSource, /DROP CONSTRAINT IF EXISTS chat_messages_mutation_unique/);
  assert.match(partiesSource, /CREATE UNIQUE INDEX IF NOT EXISTS chat_messages_mutation_idx/);
  assert.match(partiesSource, /CREATE UNIQUE INDEX IF NOT EXISTS game_scores_mutation_idx/);
});

test("cosmetics are catalogue-backed, entitlement-gated and safe to render in chat", () => {
  assert.match(cosmeticsApi, /items\.filter\(\(item\) => item\.active\)/);
  assert.match(cosmeticsAdminApi, /getAdminAccess/);
  assert.match(cosmeticsAdminApi, /itemSchema/);
  assert.match(profileApi, /profileSchema/);
  assert.match(partiesSource, /chatBackground/);
  assert.match(partiesSource, /chat_effect TEXT NOT NULL DEFAULT 'none'/);
  assert.match(partiesSource, /Unknown cosmetic item/);
  assert.match(partiesSource, /This cosmetic item is not unlocked/);
});

test("KOINS bets debit, settle and refund with single-statement state guards", () => {
  const join = partiesSource.slice(partiesSource.indexOf("export async function joinBet"), partiesSource.indexOf("export async function settleBet"));
  const settle = partiesSource.slice(partiesSource.indexOf("export async function settleBet"), partiesSource.indexOf("export async function cancelBet"));
  const cancel = partiesSource.slice(partiesSource.indexOf("export async function cancelBet"), partiesSource.indexOf("function rowToBet"));
  assert.match(join, /WITH candidate AS/);
  assert.match(join, /refund_race AS/);
  assert.match(join, /koins_balance >=/);
  assert.doesNotMatch(join, /addKoinsTransaction/);
  assert.match(settle, /UPDATE party_bets bet SET status = 'settled'/);
  assert.match(settle, /UPDATE user_profiles profile/);
  assert.doesNotMatch(settle, /for \(const entry/);
  assert.match(cancel, /UPDATE party_bets bet SET status = 'cancelled'/);
  assert.match(cancel, /FROM refunds refund/);
  assert.doesNotMatch(cancel, /for \(const entry/);
});

test("UGC has controlled media, retention and a moderation audit trail", () => {
  assert.match(mediaApi, /storeMedia/);
  assert.match(mediaApi, /requirePartyMember/);
  assert.match(mediaApi, /consent/);
  assert.match(safetyMigration, /CREATE TABLE IF NOT EXISTS safety_reports/);
  assert.match(safetyMigration, /CREATE TABLE IF NOT EXISTS moderation_actions/);
  assert.match(safetyMigration, /CREATE TABLE IF NOT EXISTS safety_blocks/);
  assert.match(moderationApi, /moderation_write/);
  assert.match(partiesSource, /retention_until <= NOW\(\)/);
  assert.match(partiesSource, /moderation_status = 'removed'/);
});

test("local auth supports reset tokens and global session revocation", () => {
  assert.match(localAuth, /session_version/);
  assert.match(localAuth, /revokeAllSessions/);
  assert.match(localAuth, /password_reset_tokens/);
  assert.match(localAuth, /used_at = NOW\(\)/);
  assert.match(authMigration, /CREATE TABLE IF NOT EXISTS password_reset_tokens/);
});

test("production realtime and rate limits have distributed database fallbacks", () => {
  assert.match(liveSource, /INSERT INTO live_events/);
  assert.match(liveSource, /SELECT id, payload, created_at FROM live_events/);
  assert.match(rateLimitSource, /INSERT INTO rate_limit_windows/);
  assert.match(rateLimitSource, /ON CONFLICT \(key, window_start\) DO UPDATE/);
  assert.doesNotMatch(rateLimitSource, /if \(!limiter\) return \{ \.\.\.rateLimit/);
});

test("first-party observability records sanitized errors and exposes a health gate", () => {
  assert.match(observabilityMigration, /CREATE TABLE IF NOT EXISTS platform_error_events/);
  assert.match(observabilitySource, /safeContext/);
  assert.match(observabilitySource, /platform_error_events/);
  assert.match(systemApi, /getPlatformErrorSummary/);
  assert.match(observabilitySource, /token\|secret\|password\|cookie\|authorization\|email/);
});

test("local auth supports email verification and optional root-admin TOTP", () => {
  assert.match(verificationMigration, /CREATE TABLE IF NOT EXISTS email_verification_tokens/);
  assert.match(localAuth, /requestEmailVerification/);
  assert.match(localAuth, /verifyEmail/);
  assert.match(localAuth, /email_verified_at/);
  assert.match(adminAuth, /isValidAdminTotp/);
  assert.match(adminAuth, /createHmac\("sha1"/);
});
