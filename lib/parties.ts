import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { dailyQuestionIds, scoreDailyAnswers } from "@/lib/games/daily-trivia";

export const PROMO_STATUS = ["active", "paused"] as const;
export type PromoStatus = (typeof PROMO_STATUS)[number];
export type PartyRole = "owner" | "co_host" | "guest";
export type RsvpStatus = "going" | "maybe" | "pass";
export type PromoMode = "single" | "multi";
export type PromoBenefitType = "beta_access" | "profile_cover" | "avatar_frame" | "chat_effect" | "name_color" | "badge" | "xp_multiplier" | "party_creation";
export type PromoBenefit = { type: PromoBenefitType; value?: string | number };
export type CosmeticsItemType = "cover" | "avatarFrame" | "chatEffect" | "nameColor" | "badge";
export type CosmeticsItem = { id: string; type: CosmeticsItemType; slug: string; nameRu: string; nameEn: string; value: string; imageUrl: string; sortOrder: number; active: boolean; createdAt: string };
export type ProfileCosmetics = { cover: string; avatarFrame: string; chatEffect: string; nameColor: string; badge: string; xpMultiplier: number; betaAccess: boolean; unlocked: PromoBenefitType[] };

export type UserProfile = {
  id: string;
  displayName: string;
  handle: string;
  city: string;
  bio: string;
  imageUrl: string;
  cosmetics: ProfileCosmetics;
  compashka: string;
  xp: number;
  hasPartyCreation: boolean;
  updatedAt: string;
};

export type PromoRedemption = {
  id: string;
  promoCodeId: string;
  code: string;
  clerkUserId: string;
  partyId: string | null;
  benefits: PromoBenefit[];
  redeemedAt: string;
};

export type FriendStatus = "pending" | "accepted" | "blocked";

export type FriendConnection = {
  requesterId: string;
  targetId: string;
  status: FriendStatus;
  displayName: string;
  imageUrl: string;
  handle: string;
  createdAt: string;
};

export type FriendList = { id: string; clerkUserId: string; name: string; createdAt: string; updatedAt: string; members: string[] };

export type Party = {
  id: string;
  title: string;
  slug: string;
  inviteCode: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerImageUrl: string;
  memberCount: number;
  rsvpCounts: { going: number; maybe: number; pass: number };
  myRsvp?: RsvpStatus;
  role?: PartyRole;
  createdAt: string;
  adultOnly: boolean;
  theme: Record<string, string>;
  ownedThemes: string[];
};

export type PromoCode = {
  id: string;
  code: string;
  status: PromoStatus;
  maxRedemptions: number | null;
  usesCount: number;
  mode: PromoMode;
  expiresAt: string | null;
  benefits: PromoBenefit[];
  createdAt: string;
};

export type PartyHighlight = { id: string; partyId: string; sessionId: string | null; userId: string; displayName: string; type: "score" | "achievement" | "funny" | "quote" | "photo"; data: Record<string, unknown>; thumbnail: string; createdAt: string };
export type GratitudeTip = { id: string; partyId: string; fromUser: string; toUser: string; amount: number; message: string; createdAt: string };
export type SocialQuest = { id: string; titleKey: string; descKey: string; icon: string; requirements: Record<string, unknown>; rewardKoins: number; rewardXp: number; rewardCosmetic: string; active: boolean };
export type QuestProgress = { id: string; questId: string; partyId: string; userId: string; progress: number; target: number; claimed: boolean; completedAt: string | null };
export type PartyPassSeason = { id: string; name: string; startDate: string; endDate: string; tiers: PassTier[]; active: boolean };
export type PassTier = { tier: number; xpRequired: number; rewards: Array<{ type: string; value: string }> };
export type DailyChallenge = { id: string; game: string; date: string; config: Record<string, unknown>; active: boolean };
export type DailyScore = { id: string; challengeId: string; userId: string; score: number; playedAt: string };

let sqlClient: ReturnType<typeof neon> | null = null;
let schemaPromise: Promise<void> | null = null;

function db() {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

const asNumber = (value: unknown) => Number(value ?? 0);
const iso = (value: string | Date) => new Date(value).toISOString();

function cleanHandle(value: string) {
  const handle = value.toLowerCase().trim().replace(/[^a-z0-9_]/g, "").slice(0, 24);
  return handle || `tusa${Math.random().toString(36).slice(2, 8)}`;
}

function slug(value: string, suffix: string) {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${normalized || "tusa"}-${suffix.slice(0, 6)}`;
}

function partyFromRow(row: Record<string, unknown>): Party {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    inviteCode: String(row.invite_code),
    date: String(row.date),
    time: String(row.time),
    venue: String(row.venue),
    category: String(row.category),
    description: String(row.description ?? ""),
    ownerId: String(row.owner_id),
    ownerName: String(row.owner_name ?? "Организатор"),
    ownerImageUrl: String(row.owner_image_url ?? ""),
    memberCount: asNumber(row.member_count),
    rsvpCounts: { going: asNumber(row.going_count), maybe: asNumber(row.maybe_count), pass: asNumber(row.pass_count) },
    myRsvp: row.my_rsvp === "going" || row.my_rsvp === "maybe" || row.my_rsvp === "pass" ? row.my_rsvp : undefined,
    role: row.role === "owner" || row.role === "co_host" || row.role === "guest" ? row.role : undefined,
    createdAt: iso(row.created_at as string | Date),
    adultOnly: row.adult_only !== false,
    theme: (() => { try { const raw = row.theme; return typeof raw === "string" ? JSON.parse(raw) : raw ?? {}; } catch { return {}; } })(),
    ownedThemes: (() => { try { const raw = row.owned_themes; const arr = typeof raw === "string" ? JSON.parse(raw) : raw; return Array.isArray(arr) ? arr : ["lime"]; } catch { return ["lime"]; } })(),
  };
}

function profileFromRow(row: Record<string, unknown>): UserProfile {
  const defaults: ProfileCosmetics = { cover: "lime", avatarFrame: "none", chatEffect: "none", nameColor: "#000000", badge: "newcomer", xpMultiplier: 1, betaAccess: false, unlocked: [] };
  const raw = row.cosmetics;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const cosmetics = parsed && typeof parsed === "object" ? { ...defaults, ...(parsed as Partial<ProfileCosmetics>) } : defaults;
  return {
    id: String(row.clerk_user_id),
    displayName: String(row.display_name),
    handle: String(row.handle),
    city: String(row.city ?? ""),
    bio: String(row.bio ?? ""),
    imageUrl: String(row.image_url ?? ""),
    compashka: String(row.compashka ?? ""),
    cosmetics: { ...cosmetics, unlocked: Array.isArray(cosmetics.unlocked) ? cosmetics.unlocked : [] },
    xp: asNumber(row.xp),
    hasPartyCreation: row.has_party_creation === true,
    updatedAt: iso(row.updated_at as string | Date),
  };
}

function promoFromRow(row: Record<string, unknown>): PromoCode {
  const rawBenefits = row.benefits;
  const parsedBenefits = typeof rawBenefits === "string" ? JSON.parse(rawBenefits) : rawBenefits;
  return {
    id: String(row.id),
    code: String(row.code),
    status: row.status === "paused" ? "paused" : "active",
    maxRedemptions: row.max_redemptions === null ? null : asNumber(row.max_redemptions),
    usesCount: asNumber(row.uses_count),
    mode: row.redemption_mode === "multi" ? "multi" : "single",
    expiresAt: row.expires_at ? iso(row.expires_at as string | Date) : null,
    benefits: Array.isArray(parsedBenefits) ? parsedBenefits as PromoBenefit[] : [],
    createdAt: iso(row.created_at as string | Date),
  };
}

async function getSessionPartyId(sessionId: string): Promise<string | null> {
  const [row] = await db()`SELECT party_id FROM game_sessions WHERE id = ${sessionId} LIMIT 1` as unknown as Record<string, unknown>[];
  return row ? String(row.party_id) : null;
}

let schemaV2Promise: Promise<void> | null = null;
export function ensurePartyV2() {
  if (schemaV2Promise) return schemaV2Promise;
  schemaV2Promise = (async () => {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS game_actions (id UUID PRIMARY KEY, session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, action_type TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS game_actions_session_idx ON game_actions (session_id, created_at ASC)`;
  await sql`ALTER TABLE game_actions ADD COLUMN IF NOT EXISTS client_mutation_id TEXT`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS game_actions_command_unique ON game_actions(session_id, clerk_user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL`;
  await sql`CREATE TABLE IF NOT EXISTS party_highlights (id UUID PRIMARY KEY, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL, clerk_user_id TEXT NOT NULL, display_name TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'score' CHECK (type IN ('score','achievement','funny','quote','photo')), data JSONB NOT NULL DEFAULT '{}'::jsonb, thumbnail TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS highlights_party_idx ON party_highlights (party_id, created_at DESC)`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS theme JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS spectators JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS handle TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS name_color TEXT NOT NULL DEFAULT '#000000'`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_xp INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_tier INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_season TEXT NOT NULL DEFAULT ''`;
  await sql`CREATE TABLE IF NOT EXISTS party_pass_seasons (id TEXT PRIMARY KEY, name TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, tiers JSONB NOT NULL DEFAULT '[]'::jsonb, active BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS gratitude_tips (id UUID PRIMARY KEY, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, from_user TEXT NOT NULL, to_user TEXT NOT NULL, amount INTEGER NOT NULL CHECK (amount > 0), message TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS gratitude_party_idx ON gratitude_tips (party_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS gratitude_to_idx ON gratitude_tips (to_user, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS social_quests (id TEXT PRIMARY KEY, title_key TEXT NOT NULL, desc_key TEXT NOT NULL, icon TEXT NOT NULL DEFAULT 'emoji_events', requirements JSONB NOT NULL DEFAULT '{}'::jsonb, reward_koins INTEGER NOT NULL DEFAULT 0, reward_xp INTEGER NOT NULL DEFAULT 0, reward_cosmetic TEXT NOT NULL DEFAULT '', active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS social_quest_progress (id UUID PRIMARY KEY, quest_id TEXT NOT NULL REFERENCES social_quests(id) ON DELETE CASCADE, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0, target INTEGER NOT NULL DEFAULT 1, claimed BOOLEAN NOT NULL DEFAULT FALSE, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (quest_id, party_id, clerk_user_id))`;
  await sql`CREATE TABLE IF NOT EXISTS daily_challenges (id UUID PRIMARY KEY, game TEXT NOT NULL, date DATE NOT NULL DEFAULT CURRENT_DATE, config JSONB NOT NULL DEFAULT '{}'::jsonb, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (game, date))`;
  await sql`CREATE TABLE IF NOT EXISTS daily_challenge_scores (id UUID PRIMARY KEY, challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0, played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (challenge_id, clerk_user_id))`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS owned_themes JSONB NOT NULL DEFAULT '["lime"]'::jsonb`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS highlight_count INTEGER NOT NULL DEFAULT 0`;
  await sql`CREATE TABLE IF NOT EXISTS friend_lists (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, clerk_user_id TEXT NOT NULL REFERENCES user_profiles(clerk_user_id), name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS friend_list_members (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, list_id UUID NOT NULL REFERENCES friend_lists(id) ON DELETE CASCADE, friend_id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(list_id, friend_id))`;
  await sql`CREATE TABLE IF NOT EXISTS cosmetics_catalogue (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, type TEXT NOT NULL, slug TEXT NOT NULL, name_ru TEXT NOT NULL, name_en TEXT NOT NULL, value TEXT NOT NULL, image_url TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(type, slug))`;
  try { await seedCosmetics(sql); } catch { /* already seeded */ }
  try { await seedQuests(sql); } catch { /* already seeded */ }
  })().catch((error) => {
    schemaV2Promise = null;
    throw error;
  });
  return schemaV2Promise;
}

async function seedQuests(sql: ReturnType<typeof db>) {
  const existing = await sql`SELECT COUNT(*)::int AS cnt FROM social_quests` as unknown as { cnt: number }[];
  if (existing[0]?.cnt > 0) return;
  const quests = [
    { id: "hostparty", title_key: "questHostParty", desc_key: "questDescHostParty", icon: "celebration", requirements: '{"minPlayers":4}', reward_koins: 50, reward_xp: 100 },
    { id: "playgames", title_key: "questPlayGames", desc_key: "questDescPlayGames", icon: "sports_esports", requirements: '{"minGames":3}', reward_koins: 30, reward_xp: 60 },
    { id: "winrounds", title_key: "questWinRounds", desc_key: "questDescWinRounds", icon: "emoji_events", requirements: '{"wins":5}', reward_koins: 40, reward_xp: 80 },
    { id: "thankothers", title_key: "questThankOthers", desc_key: "questDescThankOthers", icon: "favorite", requirements: '{"tips":3}', reward_koins: 20, reward_xp: 40 },
  ];
  for (const q of quests) {
    await sql`INSERT INTO social_quests (id, title_key, desc_key, icon, requirements, reward_koins, reward_xp) VALUES (${q.id}, ${q.title_key}, ${q.desc_key}, ${q.icon}, ${q.requirements}, ${q.reward_koins}, ${q.reward_xp}) ON CONFLICT (id) DO NOTHING`;
  }
}

async function seedCosmetics(sql: ReturnType<typeof db>) {
  const items: { type: string; slug: string; name_ru: string; name_en: string; value: string; image_url: string; sort_order: number }[] = [
    { type: "cover", slug: "lime", name_ru: "Лайм", name_en: "Lime", value: "lime", image_url: "/cosmetics/covers/lime.svg", sort_order: 0 },
    { type: "cover", slug: "beta", name_ru: "Бета", name_en: "Beta", value: "beta", image_url: "/cosmetics/covers/beta.svg", sort_order: 1 },
    { type: "cover", slug: "midnight", name_ru: "Полночь", name_en: "Midnight", value: "midnight", image_url: "/cosmetics/covers/midnight.svg", sort_order: 2 },
    { type: "cover", slug: "sunset", name_ru: "Закат", name_en: "Sunset", value: "sunset", image_url: "/cosmetics/covers/sunset.svg", sort_order: 3 },
    { type: "cover", slug: "ocean", name_ru: "Океан", name_en: "Ocean", value: "ocean", image_url: "/cosmetics/covers/ocean.svg", sort_order: 4 },
    { type: "cover", slug: "forest", name_ru: "Лес", name_en: "Forest", value: "forest", image_url: "/cosmetics/covers/forest.svg", sort_order: 5 },
    { type: "cover", slug: "nebula", name_ru: "Туманность", name_en: "Nebula", value: "nebula", image_url: "/cosmetics/covers/nebula.svg", sort_order: 6 },
    { type: "cover", slug: "cosmos", name_ru: "Космос", name_en: "Cosmos", value: "cosmos", image_url: "/cosmetics/covers/cosmos.svg", sort_order: 7 },
    { type: "cover", slug: "retro", name_ru: "Ретро", name_en: "Retro", value: "retro", image_url: "/cosmetics/covers/retro.svg", sort_order: 8 },
    { type: "cover", slug: "gold", name_ru: "Золото", name_en: "Gold", value: "gold", image_url: "/cosmetics/covers/gold.svg", sort_order: 9 },
    { type: "avatarFrame", slug: "none", name_ru: "Нет", name_en: "None", value: "none", image_url: "/cosmetics/frames/none.svg", sort_order: 0 },
    { type: "avatarFrame", slug: "lime", name_ru: "Лайм", name_en: "Lime", value: "lime", image_url: "/cosmetics/frames/lime.svg", sort_order: 1 },
    { type: "avatarFrame", slug: "pink", name_ru: "Розовый", name_en: "Pink", value: "pink", image_url: "/cosmetics/frames/pink.svg", sort_order: 2 },
    { type: "avatarFrame", slug: "blue", name_ru: "Синий", name_en: "Blue", value: "blue", image_url: "/cosmetics/frames/blue.svg", sort_order: 3 },
    { type: "avatarFrame", slug: "neon", name_ru: "Неон", name_en: "Neon", value: "neon", image_url: "/cosmetics/frames/neon.svg", sort_order: 4 },
    { type: "avatarFrame", slug: "rainbow", name_ru: "Радуга", name_en: "Rainbow", value: "rainbow", image_url: "/cosmetics/frames/rainbow.svg", sort_order: 5 },
    { type: "avatarFrame", slug: "gold", name_ru: "Золото", name_en: "Gold", value: "gold", image_url: "/cosmetics/frames/gold.svg", sort_order: 6 },
    { type: "avatarFrame", slug: "crystal", name_ru: "Кристалл", name_en: "Crystal", value: "crystal", image_url: "/cosmetics/frames/crystal.svg", sort_order: 7 },
    { type: "avatarFrame", slug: "inferno", name_ru: "Инферно", name_en: "Inferno", value: "inferno", image_url: "/cosmetics/frames/inferno.svg", sort_order: 8 },
    { type: "avatarFrame", slug: "frost", name_ru: "Мороз", name_en: "Frost", value: "frost", image_url: "/cosmetics/frames/frost.svg", sort_order: 9 },
    { type: "chatEffect", slug: "none", name_ru: "Нет", name_en: "None", value: "none", image_url: "/cosmetics/chat-effects/none.svg", sort_order: 0 },
    { type: "chatEffect", slug: "sparkle", name_ru: "Искры", name_en: "Sparkle", value: "sparkle", image_url: "/cosmetics/chat-effects/sparkle.svg", sort_order: 1 },
    { type: "chatEffect", slug: "glow", name_ru: "Свечение", name_en: "Glow", value: "glow", image_url: "/cosmetics/chat-effects/glow.svg", sort_order: 2 },
    { type: "chatEffect", slug: "rainbow", name_ru: "Радуга", name_en: "Rainbow", value: "rainbow", image_url: "/cosmetics/chat-effects/rainbow.svg", sort_order: 3 },
    { type: "chatEffect", slug: "matrix", name_ru: "Матрица", name_en: "Matrix", value: "matrix", image_url: "/cosmetics/chat-effects/matrix.svg", sort_order: 4 },
    { type: "chatEffect", slug: "fire", name_ru: "Огонь", name_en: "Fire", value: "fire", image_url: "/cosmetics/chat-effects/fire.svg", sort_order: 5 },
    { type: "chatEffect", slug: "ice", name_ru: "Лёд", name_en: "Ice", value: "ice", image_url: "/cosmetics/chat-effects/ice.svg", sort_order: 6 },
    { type: "chatEffect", slug: "lightning", name_ru: "Молния", name_en: "Lightning", value: "lightning", image_url: "/cosmetics/chat-effects/lightning.svg", sort_order: 7 },
    { type: "chatEffect", slug: "heart", name_ru: "Сердце", name_en: "Heart", value: "heart", image_url: "/cosmetics/chat-effects/heart.svg", sort_order: 8 },
    { type: "chatEffect", slug: "star", name_ru: "Звезда", name_en: "Star", value: "star", image_url: "/cosmetics/chat-effects/star.svg", sort_order: 9 },
    { type: "nameColor", slug: "black", name_ru: "Чёрный", name_en: "Black", value: "#000000", image_url: "/cosmetics/name-colors/black.svg", sort_order: 0 },
    { type: "nameColor", slug: "lime", name_ru: "Лаймовый", name_en: "Lime", value: "#c9ff05", image_url: "/cosmetics/name-colors/lime.svg", sort_order: 1 },
    { type: "nameColor", slug: "pink", name_ru: "Розовый", name_en: "Pink", value: "#ff1791", image_url: "/cosmetics/name-colors/pink.svg", sort_order: 2 },
    { type: "nameColor", slug: "blue", name_ru: "Синий", name_en: "Blue", value: "#2196f3", image_url: "/cosmetics/name-colors/blue.svg", sort_order: 3 },
    { type: "nameColor", slug: "neon", name_ru: "Неоновый", name_en: "Neon", value: "#b829ff", image_url: "/cosmetics/name-colors/neon.svg", sort_order: 4 },
    { type: "nameColor", slug: "red", name_ru: "Красный", name_en: "Red", value: "#f44336", image_url: "/cosmetics/name-colors/red.svg", sort_order: 5 },
    { type: "nameColor", slug: "orange", name_ru: "Оранжевый", name_en: "Orange", value: "#ff9800", image_url: "/cosmetics/name-colors/orange.svg", sort_order: 6 },
    { type: "nameColor", slug: "teal", name_ru: "Бирюзовый", name_en: "Teal", value: "#009688", image_url: "/cosmetics/name-colors/teal.svg", sort_order: 7 },
    { type: "nameColor", slug: "white", name_ru: "Белый", name_en: "White", value: "#ffffff", image_url: "/cosmetics/name-colors/white.svg", sort_order: 8 },
    { type: "nameColor", slug: "cream", name_ru: "Кремовый", name_en: "Cream", value: "#f7f7f2", image_url: "/cosmetics/name-colors/cream.svg", sort_order: 9 },
    { type: "badge", slug: "newcomer", name_ru: "Новичок", name_en: "Newcomer", value: "newcomer", image_url: "/cosmetics/badges/newcomer.svg", sort_order: 0 },
    { type: "badge", slug: "veteran", name_ru: "Ветеран", name_en: "Veteran", value: "veteran", image_url: "/cosmetics/badges/veteran.svg", sort_order: 1 },
    { type: "badge", slug: "legend", name_ru: "Легенда", name_en: "Legend", value: "legend", image_url: "/cosmetics/badges/legend.svg", sort_order: 2 },
    { type: "badge", slug: "party_king", name_ru: "Король вечеринок", name_en: "Party King", value: "party_king", image_url: "/cosmetics/badges/party_king.svg", sort_order: 3 },
    { type: "badge", slug: "game_master", name_ru: "Мастер игр", name_en: "Game Master", value: "game_master", image_url: "/cosmetics/badges/game_master.svg", sort_order: 4 },
    { type: "badge", slug: "social_butterfly", name_ru: "Социальная бабочка", name_en: "Social Butterfly", value: "social_butterfly", image_url: "/cosmetics/badges/social_butterfly.svg", sort_order: 5 },
    { type: "badge", slug: "early_adopter", name_ru: "Первопроходец", name_en: "Early Adopter", value: "early_adopter", image_url: "/cosmetics/badges/early_adopter.svg", sort_order: 6 },
    { type: "badge", slug: "night_owl", name_ru: "Ночная сова", name_en: "Night Owl", value: "night_owl", image_url: "/cosmetics/badges/night_owl.svg", sort_order: 7 },
    { type: "badge", slug: "trivia_champ", name_ru: "Чемпион викторин", name_en: "Trivia Champ", value: "trivia_champ", image_url: "/cosmetics/badges/trivia_champ.svg", sort_order: 8 },
    { type: "badge", slug: "vibe_curator", name_ru: "Куратор вайба", name_en: "Vibe Curator", value: "vibe_curator", image_url: "/cosmetics/badges/vibe_curator.svg", sort_order: 9 },
    // animated badges
    { type: "badge", slug: "animated_pulse", name_ru: "Пульсирующий", name_en: "Pulse", value: "animated_pulse", image_url: "/cosmetics/badges/animated_pulse.svg", sort_order: 10 },
    { type: "badge", slug: "animated_glow", name_ru: "Свечение", name_en: "Glow", value: "animated_glow", image_url: "/cosmetics/badges/animated_glow.svg", sort_order: 11 },
    { type: "badge", slug: "animated_shimmer", name_ru: "Мерцание", name_en: "Shimmer", value: "animated_shimmer", image_url: "/cosmetics/badges/animated_shimmer.svg", sort_order: 12 },
    { type: "badge", slug: "animated_rotate", name_ru: "Вращение", name_en: "Spin", value: "animated_rotate", image_url: "/cosmetics/badges/animated_rotate.svg", sort_order: 13 },
    { type: "badge", slug: "animated_bounce", name_ru: "Подпрыгивающий", name_en: "Bounce", value: "animated_bounce", image_url: "/cosmetics/badges/animated_bounce.svg", sort_order: 14 },
    // animated covers
    { type: "cover", slug: "animated_wave", name_ru: "Волна", name_en: "Wave", value: "animated_wave", image_url: "/cosmetics/covers/animated_wave.svg", sort_order: 10 },
    { type: "cover", slug: "animated_aurora", name_ru: "Аврора", name_en: "Aurora", value: "animated_aurora", image_url: "/cosmetics/covers/animated_aurora.svg", sort_order: 11 },
    { type: "cover", slug: "animated_fireflies", name_ru: "Светлячки", name_en: "Fireflies", value: "animated_fireflies", image_url: "/cosmetics/covers/animated_fireflies.svg", sort_order: 12 },
    { type: "cover", slug: "animated_storm", name_ru: "Гроза", name_en: "Storm", value: "animated_storm", image_url: "/cosmetics/covers/animated_storm.svg", sort_order: 13 },
    { type: "cover", slug: "animated_rainbow", name_ru: "Радуга", name_en: "Rainbow", value: "animated_rainbow", image_url: "/cosmetics/covers/animated_rainbow.svg", sort_order: 14 },
    // animated frames
    { type: "avatarFrame", slug: "animated_pulse", name_ru: "Пульсирующая", name_en: "Pulse", value: "animated_pulse", image_url: "/cosmetics/frames/animated_pulse.svg", sort_order: 10 },
    { type: "avatarFrame", slug: "animated_glow", name_ru: "Светящаяся", name_en: "Glow", value: "animated_glow", image_url: "/cosmetics/frames/animated_glow.svg", sort_order: 11 },
    { type: "avatarFrame", slug: "animated_rotate", name_ru: "Вращающаяся", name_en: "Rotate", value: "animated_rotate", image_url: "/cosmetics/frames/animated_rotate.svg", sort_order: 12 },
    { type: "avatarFrame", slug: "animated_chrome", name_ru: "Хром", name_en: "Chrome", value: "animated_chrome", image_url: "/cosmetics/frames/animated_chrome.svg", sort_order: 13 },
    { type: "avatarFrame", slug: "animated_neon_pulse", name_ru: "Неон-пульс", name_en: "Neon Pulse", value: "animated_neon_pulse", image_url: "/cosmetics/frames/animated_neon_pulse.svg", sort_order: 14 },
    // animated chat effects
    { type: "chatEffect", slug: "animated_confetti", name_ru: "Конфетти", name_en: "Confetti", value: "animated_confetti", image_url: "/cosmetics/chat-effects/animated_confetti.svg", sort_order: 10 },
    { type: "chatEffect", slug: "animated_rain", name_ru: "Дождь", name_en: "Rain", value: "animated_rain", image_url: "/cosmetics/chat-effects/animated_rain.svg", sort_order: 11 },
    { type: "chatEffect", slug: "animated_bubbles", name_ru: "Пузырьки", name_en: "Bubbles", value: "animated_bubbles", image_url: "/cosmetics/chat-effects/animated_bubbles.svg", sort_order: 12 },
    { type: "chatEffect", slug: "animated_rings", name_ru: "Кольца", name_en: "Rings", value: "animated_rings", image_url: "/cosmetics/chat-effects/animated_rings.svg", sort_order: 13 },
    { type: "chatEffect", slug: "animated_comet", name_ru: "Комета", name_en: "Comet", value: "animated_comet", image_url: "/cosmetics/chat-effects/animated_comet.svg", sort_order: 14 },
    // animated name colors
    { type: "nameColor", slug: "animated_cycle", name_ru: "Цикл", name_en: "Cycle", value: "animated_cycle", image_url: "/cosmetics/name-colors/animated_cycle.svg", sort_order: 10 },
    { type: "nameColor", slug: "animated_gradient", name_ru: "Градиент", name_en: "Gradient", value: "animated_gradient", image_url: "/cosmetics/name-colors/animated_gradient.svg", sort_order: 11 },
    { type: "nameColor", slug: "animated_pulse", name_ru: "Пульс", name_en: "Pulse", value: "animated_pulse", image_url: "/cosmetics/name-colors/animated_pulse.svg", sort_order: 12 },
    { type: "nameColor", slug: "animated_shift", name_ru: "Сдвиг", name_en: "Shift", value: "animated_shift", image_url: "/cosmetics/name-colors/animated_shift.svg", sort_order: 13 },
    { type: "nameColor", slug: "animated_neon", name_ru: "Неон", name_en: "Neon", value: "animated_neon", image_url: "/cosmetics/name-colors/animated_neon.svg", sort_order: 14 },
  ];
  for (const item of items) await sql`INSERT INTO cosmetics_catalogue (type, slug, name_ru, name_en, value, image_url, sort_order) VALUES (${item.type}, ${item.slug}, ${item.name_ru}, ${item.name_en}, ${item.value}, ${item.image_url}, ${item.sort_order}) ON CONFLICT (type, slug) DO UPDATE SET name_ru = EXCLUDED.name_ru, name_en = EXCLUDED.name_en, image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order`;
}

export function ensurePartySchema() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
  const sql = db();
  const check = await sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' LIMIT 1` as unknown as Record<string, unknown>[];
  if (check.length > 0) { await ensurePartyV2(); return; }
  await sql`CREATE TABLE IF NOT EXISTS user_profiles (
    clerk_user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    cosmetics JSONB NOT NULL DEFAULT '{"cover":"lime","avatarFrame":"none","chatEffect":"none","nameColor":"#000000","badge":"newcomer","xpMultiplier":1,"betaAccess":false,"unlocked":[]}'::jsonb,
    xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
    uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
    redemption_mode TEXT NOT NULL DEFAULT 'single' CHECK (redemption_mode IN ('single', 'multi')),
    expires_at TIMESTAMPTZ,
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    invite_code TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    adult_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS party_members (
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'guest')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (party_id, clerk_user_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS promo_redemptions (
    id UUID PRIMARY KEY,
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
    clerk_user_id TEXT NOT NULL,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (promo_code_id, clerk_user_id),
    UNIQUE (party_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS profile_promo_redemptions (
    id UUID PRIMARY KEY,
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
    clerk_user_id TEXT NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (promo_code_id, clerk_user_id)
  )`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cosmetics JSONB NOT NULL DEFAULT '{"cover":"lime","avatarFrame":"none","chatEffect":"none","nameColor":"#000000","badge":"newcomer","xpMultiplier":1,"betaAccess":false,"unlocked":[]}'::jsonb`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS compashka TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS redemption_mode TEXT NOT NULL DEFAULT 'single'`;
  await sql`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;
  await sql`ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS benefits JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE promo_redemptions ALTER COLUMN party_id DROP NOT NULL`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS adult_only BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`ALTER TABLE party_members ADD COLUMN IF NOT EXISTS rsvp_status TEXT NOT NULL DEFAULT 'going' CHECK (rsvp_status IN ('going', 'maybe', 'pass'))`;
  await sql`ALTER TABLE party_members DROP CONSTRAINT IF EXISTS party_members_role_check`;
  await sql`ALTER TABLE party_members ADD CONSTRAINT party_members_role_check CHECK (role IN ('owner', 'co_host', 'guest'))`;
  await sql`CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'sticker')),
    voice_url TEXT NOT NULL DEFAULT '',
    sticker_id TEXT NOT NULL DEFAULT '',
    reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS parties_owner_idx ON parties (owner_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS party_members_user_idx ON party_members (clerk_user_id, joined_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS party_shopping_items (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'шт.',
    price INTEGER NOT NULL DEFAULT 0,
    purchased BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS party_gallery_photos (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    src TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    cover BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS party_gallery_party_idx ON party_gallery_photos (party_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS party_shopping_party_idx ON party_shopping_items (party_id, created_at ASC)`;
  await sql`CREATE INDEX IF NOT EXISTS chat_messages_party_idx ON chat_messages (party_id, created_at ASC)`;
  await sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'sticker'))`;
  await sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS voice_url TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sticker_id TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS client_mutation_id TEXT`;
  await sql`ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_mutation_unique`;
  await sql`ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_mutation_unique UNIQUE (party_id, client_mutation_id)`;
  await sql`ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS client_mutation_id TEXT`;
  await sql`ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS game_scores_mutation_unique`;
  await sql`ALTER TABLE game_scores ADD CONSTRAINT game_scores_mutation_unique UNIQUE (session_id, client_mutation_id)`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS koins_balance INTEGER NOT NULL DEFAULT 100`;
  await sql`CREATE TABLE IF NOT EXISTS koins_transactions (
    id UUID PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS koins_tx_user_idx ON koins_transactions (clerk_user_id, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS party_bets (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled', 'cancelled')),
    winner TEXT NOT NULL DEFAULT '',
    entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS party_bets_party_idx ON party_bets (party_id, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS engagement_rewards (
    id UUID PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    activity TEXT NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    granted_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS engagement_rewards_idx ON engagement_rewards (clerk_user_id, activity, granted_at)`;
  await sql`ALTER TABLE party_members ADD COLUMN IF NOT EXISTS custom_role TEXT NOT NULL DEFAULT ''`;
  await sql`CREATE TABLE IF NOT EXISTS party_notes (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'blast')),
    text TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS party_notes_party_idx ON party_notes (party_id, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY,
    clerk_user_id TEXT NOT NULL DEFAULT '',
    party_id TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS analytics_action_idx ON analytics_events (action, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS friend_connections (
    requester_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (requester_id, target_id)
  )`;
  await sql`ALTER TABLE party_members ADD COLUMN IF NOT EXISTS paid_by TEXT NOT NULL DEFAULT ''`;
  await sql`CREATE INDEX IF NOT EXISTS friend_connections_target_idx ON friend_connections (target_id, status)`;
  await sql`CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    game TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'paused', 'completed', 'cancelled')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS participants JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1`;
  await sql`CREATE TABLE IF NOT EXISTS game_actions (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS game_actions_session_idx ON game_actions (session_id, created_at ASC)`;
  await sql`ALTER TABLE game_actions ADD COLUMN IF NOT EXISTS client_mutation_id TEXT`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS game_actions_command_unique ON game_actions(session_id, clerk_user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL`;
  await sql`CREATE TABLE IF NOT EXISTS game_scores (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  const earlyBenefits: PromoBenefit[] = [{ type: "beta_access" }, { type: "profile_cover", value: "beta" }, { type: "avatar_frame", value: "neon" }, { type: "chat_effect", value: "sparkle" }, { type: "badge", value: "beta" }, { type: "party_creation" }];
  const earlyBenefitsJson = JSON.stringify(earlyBenefits);
  await sql`UPDATE promo_codes SET benefits = ${earlyBenefitsJson}::jsonb WHERE benefits = '[]'::jsonb`;
  await sql`UPDATE user_profiles SET cosmetics = ${JSON.stringify(mergedCosmetics({ cover: "lime", avatarFrame: "none", chatEffect: "none", nameColor: "#000000", badge: "newcomer", xpMultiplier: 1, betaAccess: false, unlocked: [] }, earlyBenefits))}::jsonb, xp = GREATEST(xp, 120) WHERE clerk_user_id IN (SELECT clerk_user_id FROM promo_redemptions redemptions JOIN promo_codes promos ON promos.id = redemptions.promo_code_id WHERE promos.code IN ('ELAZ', 'JEDAI', 'TUSA02'))`;
  await sql`CREATE TABLE IF NOT EXISTS party_highlights (id UUID PRIMARY KEY, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL, clerk_user_id TEXT NOT NULL, display_name TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'score' CHECK (type IN ('score','achievement','funny','quote','photo')), data JSONB NOT NULL DEFAULT '{}'::jsonb, thumbnail TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS highlights_party_idx ON party_highlights (party_id, created_at DESC)`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS theme JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS spectators JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_xp INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_tier INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_season TEXT NOT NULL DEFAULT ''`;
  await sql`CREATE TABLE IF NOT EXISTS party_pass_seasons (id TEXT PRIMARY KEY, name TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, tiers JSONB NOT NULL DEFAULT '[]'::jsonb, active BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS gratitude_tips (id UUID PRIMARY KEY, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, from_user TEXT NOT NULL, to_user TEXT NOT NULL, amount INTEGER NOT NULL CHECK (amount > 0), message TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS gratitude_party_idx ON gratitude_tips (party_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS gratitude_to_idx ON gratitude_tips (to_user, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS social_quests (id TEXT PRIMARY KEY, title_key TEXT NOT NULL, desc_key TEXT NOT NULL, icon TEXT NOT NULL DEFAULT 'emoji_events', requirements JSONB NOT NULL DEFAULT '{}'::jsonb, reward_koins INTEGER NOT NULL DEFAULT 0, reward_xp INTEGER NOT NULL DEFAULT 0, reward_cosmetic TEXT NOT NULL DEFAULT '', active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS social_quest_progress (id UUID PRIMARY KEY, quest_id TEXT NOT NULL REFERENCES social_quests(id) ON DELETE CASCADE, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0, target INTEGER NOT NULL DEFAULT 1, claimed BOOLEAN NOT NULL DEFAULT FALSE, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (quest_id, party_id, clerk_user_id))`;
  await sql`CREATE TABLE IF NOT EXISTS daily_challenges (id UUID PRIMARY KEY, game TEXT NOT NULL, date DATE NOT NULL DEFAULT CURRENT_DATE, config JSONB NOT NULL DEFAULT '{}'::jsonb, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (game, date))`;
  await sql`CREATE TABLE IF NOT EXISTS daily_challenge_scores (id UUID PRIMARY KEY, challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0, played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (challenge_id, clerk_user_id))`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS owned_themes JSONB NOT NULL DEFAULT '["lime"]'::jsonb`;
  await sql`ALTER TABLE parties ADD COLUMN IF NOT EXISTS highlight_count INTEGER NOT NULL DEFAULT 0`;
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

export async function syncProfile(input: { id: string; displayName: string; imageUrl?: string }) {
  await ensurePartySchema();
  const sql = db();
  const existing = await sql`SELECT up.*,
    EXISTS(SELECT 1 FROM promo_redemptions pr JOIN promo_codes pc ON pc.id = pr.promo_code_id WHERE pr.clerk_user_id = ${input.id} AND pc.benefits @> '[{"type":"party_creation"}]'::jsonb) AS has_party_creation
    FROM user_profiles up WHERE up.clerk_user_id = ${input.id} LIMIT 1` as unknown as Record<string, unknown>[];
  if (existing[0]) return profileFromRow(existing[0]);
  const baseHandle = cleanHandle(input.displayName).slice(0, 18);
  const uniqueHandle = `${baseHandle}${input.id.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase()}`.slice(0, 24);
  const [row] = await sql`INSERT INTO user_profiles (clerk_user_id, display_name, handle, image_url)
    VALUES (${input.id}, ${input.displayName.slice(0, 80) || "TUSA friend"}, ${uniqueHandle}, ${input.imageUrl ?? ""})
    RETURNING *` as unknown as Record<string, unknown>[];
  return profileFromRow({ ...row, has_party_creation: false });
}

export async function getProfile(userId: string) {
  await ensurePartySchema();
  const sql = db();
  const rows = await sql`SELECT up.*,
    EXISTS(SELECT 1 FROM promo_redemptions pr JOIN promo_codes pc ON pc.id = pr.promo_code_id WHERE pr.clerk_user_id = ${userId} AND pc.benefits @> '[{"type":"party_creation"}]'::jsonb) AS has_party_creation
    FROM user_profiles up WHERE up.clerk_user_id = ${userId} LIMIT 1` as unknown as Record<string, unknown>[];
  return rows[0] ? profileFromRow(rows[0]) : null;
}

export async function updateProfile(userId: string, input: { displayName: string; handle: string; city: string; bio: string; compashka?: string; cosmetics?: Partial<Pick<ProfileCosmetics, "cover" | "avatarFrame" | "chatEffect" | "nameColor" | "badge">> }) {
  await ensurePartySchema();
  const current = await getProfile(userId);
  if (!current) throw new Error("Profile not found");
  const cosmetics = { ...current.cosmetics, ...(input.cosmetics ?? {}) };
  const permissions: Record<keyof NonNullable<typeof input.cosmetics>, PromoBenefitType> = { cover: "profile_cover", avatarFrame: "avatar_frame", chatEffect: "chat_effect", nameColor: "name_color", badge: "badge" };
  for (const [key, benefit] of Object.entries(permissions) as [keyof typeof permissions, PromoBenefitType][]) {
    if (input.cosmetics?.[key] !== undefined && input.cosmetics[key] !== current.cosmetics[key] && !current.cosmetics.unlocked.includes(benefit)) {
      if (current.handle !== "elazart") throw new Error("Этот предмет пока не открыт.");
      current.cosmetics.unlocked.push(benefit);
    }
  }
  const compashka = input.compashka !== undefined ? input.compashka : current.compashka;
  const [row] = await db()`UPDATE user_profiles SET display_name = ${input.displayName.slice(0, 80)}, handle = ${cleanHandle(input.handle)}, city = ${input.city.slice(0, 80)}, bio = ${input.bio.slice(0, 300)}, compashka = ${compashka.slice(0, 80)}, cosmetics = ${JSON.stringify(cosmetics)}::jsonb, updated_at = NOW()
    WHERE clerk_user_id = ${userId} RETURNING *` as unknown as Record<string, unknown>[];
  return profileFromRow(row);
}

export type KoinsTransaction = {
  id: string;
  userId: string;
  partyId: string | null;
  amount: number;
  label: string;
  createdAt: string;
};

export type PartyBet = {
  id: string;
  partyId: string;
  userId: string;
  text: string;
  options: string[];
  status: "open" | "settled" | "cancelled";
  winner: string;
  entries: Array<{ userId: string; option: string; stake: number }>;
  createdAt: string;
};

export async function addKoinsTransaction(userId: string, partyId: string | null, amount: number, label: string) {
  await ensurePartySchema();
  const [row] = await db()`INSERT INTO koins_transactions (id, clerk_user_id, party_id, amount, label)
    VALUES (${randomUUID()}, ${userId}, ${partyId}, ${amount}, ${label.slice(0, 200)})
    RETURNING *` as unknown as Record<string, unknown>[];
  await db()`UPDATE user_profiles SET koins_balance = GREATEST(0, koins_balance + ${amount}), updated_at = NOW() WHERE clerk_user_id = ${userId}`;
  return {
    id: String(row.id), userId: String(row.clerk_user_id), partyId: row.party_id ? String(row.party_id) : null,
    amount: Number(row.amount), label: String(row.label), createdAt: new Date(row.created_at as string | Date).toISOString(),
  } as KoinsTransaction;
}

export async function getKoinsBalance(userId: string) {
  await ensurePartySchema();
  const [row] = await db()`SELECT koins_balance FROM user_profiles WHERE clerk_user_id = ${userId} LIMIT 1` as unknown as { koins_balance: number }[];
  return row ? Number(row.koins_balance) : 0;
}

export async function getKoinsTransactions(userId: string, limit = 50) {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM koins_transactions WHERE clerk_user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id), userId: String(row.clerk_user_id), partyId: row.party_id ? String(row.party_id) : null,
    amount: Number(row.amount), label: String(row.label), createdAt: new Date(row.created_at as string | Date).toISOString(),
  } as KoinsTransaction));
}

const ENGAGEMENT_LIMITS: Record<string, { daily: number; amount: number }> = {
  photo: { daily: 5, amount: 5 },
  chat: { daily: 20, amount: 1 },
  game_play: { daily: 10, amount: 5 },
  game_win: { daily: 5, amount: 10 },
  streak: { daily: 1, amount: 15 },
  friend_add: { daily: 3, amount: 10 },
};

export async function grantEngagementReward(userId: string, activity: string, partyId?: string) {
  await ensurePartySchema();
  const config = ENGAGEMENT_LIMITS[activity];
  if (!config) return { granted: false, reason: "unknown activity" };

  const today = new Date().toISOString().split("T")[0];
  const [countRow] = await db()`SELECT COUNT(*)::int AS cnt FROM engagement_rewards WHERE clerk_user_id = ${userId} AND activity = ${activity} AND granted_at = ${today}` as unknown as { cnt: number }[];
  const usedToday = countRow?.cnt ?? 0;
  if (usedToday >= config.daily) return { granted: false, reason: "daily limit reached", usedToday, daily: config.daily };

  await db()`INSERT INTO engagement_rewards (id, clerk_user_id, activity, party_id, amount, granted_at) VALUES (${randomUUID()}, ${userId}, ${activity}, ${partyId ?? null}, ${config.amount}, ${today})`;
  await db()`UPDATE user_profiles SET koins_balance = GREATEST(0, koins_balance + ${config.amount}), xp = xp + ${config.amount}, updated_at = NOW() WHERE clerk_user_id = ${userId}`;
  await addKoinsTransaction(userId, partyId ?? null, config.amount, `Reward: ${activity}`);
  return { granted: true, amount: config.amount, activity, usedToday: usedToday + 1, daily: config.daily };
}

export async function getEngagementStats(userId: string) {
  await ensurePartySchema();
  const today = new Date().toISOString().split("T")[0];
  const rows = await db()`SELECT activity, COUNT(*)::int AS cnt, SUM(amount)::int AS total FROM engagement_rewards WHERE clerk_user_id = ${userId} AND granted_at = ${today} GROUP BY activity` as unknown as Array<{ activity: string; cnt: number; total: number }>;
  const stats: Record<string, { count: number; total: number; daily: number; amount: number }> = {};
  for (const [key, config] of Object.entries(ENGAGEMENT_LIMITS)) {
    const row = rows.find((r) => r.activity === key);
    stats[key] = { count: row?.cnt ?? 0, total: row?.total ?? 0, daily: config.daily, amount: config.amount };
  }
  return stats;
}

export async function requirePartyMember(partyId: string, clerkUserId: string) {
  const rows = await db()`SELECT 1 FROM party_members WHERE party_id = ${partyId} AND clerk_user_id = ${clerkUserId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!rows[0]) throw new Error("Not a party member");
}

async function requireOwner(partyId: string, clerkUserId: string) {
  const rows = await db()`SELECT 1 FROM parties WHERE id = ${partyId} AND owner_id = ${clerkUserId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!rows[0]) throw new Error("Only owner can perform this action");
}

export async function createBet(userId: string, partyId: string, input: { text: string; options: string[] }) {
  await ensurePartySchema();
  const member = await db()`SELECT clerk_user_id FROM party_members WHERE party_id = ${partyId} AND clerk_user_id = ${userId} LIMIT 1` as unknown as { clerk_user_id: string }[];
  if (!member[0]) throw new Error("Not a party member");
  const [row] = await db()`INSERT INTO party_bets (id, party_id, clerk_user_id, text, options, entries)
    VALUES (${randomUUID()}, ${partyId}, ${userId}, ${input.text.slice(0, 300)}, ${JSON.stringify(input.options)}::jsonb, '[]'::jsonb)
    RETURNING *` as unknown as Record<string, unknown>[];
  return rowToBet(row);
}

export async function getBets(partyId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM party_bets WHERE party_id = ${partyId} ORDER BY created_at DESC` as unknown as Record<string, unknown>[];
  return rows.map(rowToBet);
}

export async function joinBet(userId: string, betId: string, option: string, stake: number) {
  await ensurePartySchema();
  const [balanceRow] = await db()`SELECT koins_balance FROM user_profiles WHERE clerk_user_id = ${userId} LIMIT 1` as unknown as { koins_balance: number }[];
  const balance = balanceRow ? Number(balanceRow.koins_balance) : 0;
  if (stake < 1 || stake > balance) throw new Error("Not enough KOINS");
  const [betRow] = await db()`SELECT * FROM party_bets WHERE id = ${betId} AND status = 'open' LIMIT 1` as unknown as Record<string, unknown>[];
  if (!betRow) throw new Error("Bet not found or not open");
  await requirePartyMember(String(betRow.party_id), userId);
  const entries = (typeof betRow.entries === "string" ? JSON.parse(betRow.entries) : betRow.entries) as Array<{ userId: string; option: string; stake: number }>;
  if (entries.some((e) => e.userId === userId)) throw new Error("Already bet on this");
  entries.push({ userId, option, stake });
  await db()`UPDATE party_bets SET entries = ${JSON.stringify(entries)}::jsonb, updated_at = NOW() WHERE id = ${betId}`;
  await addKoinsTransaction(userId, String(betRow.party_id), -stake, `Bet: ${betRow.text} · ${option}`);
  return rowToBet({ ...betRow, entries });
}

export async function settleBet(userId: string, betId: string, winner: string) {
  await ensurePartySchema();
  const [betRow] = await db()`SELECT * FROM party_bets WHERE id = ${betId} AND status = 'open' LIMIT 1` as unknown as Record<string, unknown>[];
  if (!betRow) throw new Error("Bet not found or already settled");
  await requirePartyMember(String(betRow.party_id), userId);
  if (String(betRow.clerk_user_id) !== userId) await requireOwner(String(betRow.party_id), userId);
  const entries = (typeof betRow.entries === "string" ? JSON.parse(betRow.entries) : betRow.entries) as Array<{ userId: string; option: string; stake: number }>;
  const total = entries.reduce((s, e) => s + e.stake, 0);
  const winnerPool = entries.filter((e) => e.option === winner).reduce((s, e) => s + e.stake, 0);
  await db()`UPDATE party_bets SET status = 'settled', winner = ${winner.slice(0, 100)}, updated_at = NOW() WHERE id = ${betId}`;
  for (const entry of entries) {
    if (entry.option === winner && winnerPool > 0) {
      const payout = Math.round(entry.stake * (total / winnerPool));
      await addKoinsTransaction(entry.userId, String(betRow.party_id), payout, `Win: ${betRow.text} · ${winner}`);
    }
  }
  return rowToBet({ ...betRow, status: "settled", winner });
}

export async function cancelBet(userId: string, betId: string) {
  await ensurePartySchema();
  const [betRow] = await db()`SELECT * FROM party_bets WHERE id = ${betId} AND status = 'open' LIMIT 1` as unknown as Record<string, unknown>[];
  if (!betRow) throw new Error("Bet not found or already settled");
  await requirePartyMember(String(betRow.party_id), userId);
  if (String(betRow.clerk_user_id) !== userId) await requireOwner(String(betRow.party_id), userId);
  const entries = (typeof betRow.entries === "string" ? JSON.parse(betRow.entries) : betRow.entries) as Array<{ userId: string; option: string; stake: number }>;
  await db()`UPDATE party_bets SET status = 'cancelled', updated_at = NOW() WHERE id = ${betId}`;
  for (const entry of entries) {
    await addKoinsTransaction(entry.userId, String(betRow.party_id), entry.stake, `Refund: ${betRow.text}`);
  }
  return rowToBet({ ...betRow, status: "cancelled" });
}

function rowToBet(row: Record<string, unknown>): PartyBet {
  const rawOptions = row.options;
  const parsedOptions = typeof rawOptions === "string" ? JSON.parse(rawOptions) : rawOptions;
  const rawEntries = row.entries;
  const parsedEntries = typeof rawEntries === "string" ? JSON.parse(rawEntries) : rawEntries;
  return {
    id: String(row.id),
    partyId: String(row.party_id),
    userId: String(row.clerk_user_id),
    text: String(row.text),
    options: Array.isArray(parsedOptions) ? parsedOptions.map(String) : [],
    status: (row.status === "settled" ? "settled" : row.status === "cancelled" ? "cancelled" : "open") as "open" | "settled" | "cancelled",
    winner: String(row.winner ?? ""),
    entries: Array.isArray(parsedEntries) ? parsedEntries as Array<{ userId: string; option: string; stake: number }> : [],
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export type PartyNote = {
  id: string;
  partyId: string;
  userId: string;
  type: "note" | "blast";
  text: string;
  pinned: boolean;
  createdAt: string;
};

export async function addNote(userId: string, partyId: string, text: string, type: "note" | "blast" = "note") {
  await ensurePartySchema();
  const member = await db()`SELECT clerk_user_id FROM party_members WHERE party_id = ${partyId} AND clerk_user_id = ${userId} LIMIT 1` as unknown as { clerk_user_id: string }[];
  if (!member[0]) throw new Error("Not a party member");
  const [row] = await db()`INSERT INTO party_notes (id, party_id, clerk_user_id, type, text)
    VALUES (${randomUUID()}, ${partyId}, ${userId}, ${type}, ${text.slice(0, 500)})
    RETURNING *` as unknown as Record<string, unknown>[];
  return rowToNote(row);
}

export async function getNotes(partyId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM party_notes WHERE party_id = ${partyId} ORDER BY pinned DESC, created_at DESC LIMIT 100` as unknown as Record<string, unknown>[];
  return rows.map(rowToNote);
}

export async function updateNote(noteId: string, userId: string, updates: { pinned?: boolean; text?: string }) {
  await ensurePartySchema();
  const [noteRow] = await db()`SELECT party_id, clerk_user_id FROM party_notes WHERE id = ${noteId}` as unknown as Record<string, unknown>[];
  if (!noteRow) return null;
  const noteUserId = String(noteRow.clerk_user_id);
  if (noteUserId !== userId) await requireOwner(String(noteRow.party_id), userId);
  const text = updates.text !== undefined ? updates.text.slice(0, 500) : undefined;
  const [row] = await db()`UPDATE party_notes SET
    pinned = COALESCE(${updates.pinned ?? null}, pinned),
    text = COALESCE(${text ?? null}, text)
    WHERE id = ${noteId} RETURNING *` as unknown as Record<string, unknown>[];
  return row ? rowToNote(row) : null;
}

export async function deleteNote(noteId: string, userId: string) {
  await ensurePartySchema();
  const [noteRow] = await db()`SELECT party_id, clerk_user_id FROM party_notes WHERE id = ${noteId}` as unknown as Record<string, unknown>[];
  if (!noteRow) return false;
  const noteUserId = String(noteRow.clerk_user_id);
  if (noteUserId !== userId) await requireOwner(String(noteRow.party_id), userId);
  const rows = await db()`DELETE FROM party_notes WHERE id = ${noteId} RETURNING id` as unknown as { id: string }[];
  return rows.length > 0;
}

function rowToNote(row: Record<string, unknown>): PartyNote {
  return {
    id: String(row.id), partyId: String(row.party_id), userId: String(row.clerk_user_id),
    type: row.type === "blast" ? "blast" : "note",
    text: String(row.text), pinned: Boolean(row.pinned),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export async function setCustomRole(partyId: string, ownerId: string, targetUserId: string, customRole: string) {
  await ensurePartySchema();
  const partyRows = await db()`SELECT owner_id FROM parties WHERE id = ${partyId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!partyRows[0] || String(partyRows[0].owner_id) !== ownerId) throw new Error("Only owner can change roles");
  const [row] = await db()`UPDATE party_members SET custom_role = ${customRole.slice(0, 40)} WHERE party_id = ${partyId} AND clerk_user_id = ${targetUserId} RETURNING *` as unknown as Record<string, unknown>[];
  return row ? { clerkUserId: String(row.clerk_user_id), customRole: String(row.custom_role) } : null;
}

export async function trackAnalytics(userId: string, action: string, metadata?: Record<string, unknown>) {
  await ensurePartySchema();
  await db()`INSERT INTO analytics_events (id, clerk_user_id, action, metadata)
    VALUES (${randomUUID()}, ${userId}, ${action.slice(0, 100)}, ${JSON.stringify(metadata ?? {})}::jsonb)`;
}

export async function getAnalyticsSummary() {
  await ensurePartySchema();
  const rows = await db()`SELECT
    COUNT(*)::int AS total_events,
    (SELECT COUNT(*)::int FROM analytics_events WHERE created_at > NOW() - INTERVAL '24 hours') AS last_24h,
    (SELECT action FROM analytics_events GROUP BY action ORDER BY COUNT(*) DESC LIMIT 1) AS top_action,
    (SELECT COUNT(*)::int FROM analytics_events WHERE action = 'party_created') AS parties_created,
    (SELECT COUNT(*)::int FROM analytics_events WHERE action = 'game_played') AS games_played,
    (SELECT COUNT(*)::int FROM analytics_events WHERE action = 'photo_uploaded') AS photos_uploaded
    FROM analytics_events` as unknown as Record<string, unknown>[];
  return rows[0] ? {
    totalEvents: Number(rows[0].total_events), last24h: Number(rows[0].last_24h),
    topAction: String(rows[0].top_action ?? "—"), partiesCreated: Number(rows[0].parties_created),
    gamesPlayed: Number(rows[0].games_played), photosUploaded: Number(rows[0].photos_uploaded),
  } : null;
}

function mergedCosmetics(current: ProfileCosmetics, benefits: PromoBenefit[]) {
  const next: ProfileCosmetics = { ...current, unlocked: [...current.unlocked] };
  for (const benefit of benefits) {
    if (!next.unlocked.includes(benefit.type)) next.unlocked.push(benefit.type);
    if (benefit.type === "beta_access") next.betaAccess = true;
    if (benefit.type === "profile_cover") next.cover = String(benefit.value ?? "beta");
    if (benefit.type === "avatar_frame") next.avatarFrame = String(benefit.value ?? "neon");
    if (benefit.type === "chat_effect") next.chatEffect = String(benefit.value ?? "sparkle");
    if (benefit.type === "name_color") next.nameColor = String(benefit.value ?? "#c9ff05");
    if (benefit.type === "badge") next.badge = String(benefit.value ?? "beta");
    if (benefit.type === "xp_multiplier") next.xpMultiplier = Number(benefit.value ?? 1.25);
  }
  return next;
}

export async function redeemPromo(userId: string, codeInput: string) {
  await ensurePartySchema();
  const sql = db();
  const code = codeInput.trim().toUpperCase();
  const rows = await sql`SELECT * FROM promo_codes WHERE code = ${code} LIMIT 1` as unknown as Record<string, unknown>[];
  const promo = rows[0] ? promoFromRow(rows[0]) : null;
  if (!promo || promo.status !== "active" || (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now())) return { kind: "invalid" as const };
  const already = await sql`SELECT id FROM promo_redemptions WHERE promo_code_id = ${promo.id} AND clerk_user_id = ${userId} LIMIT 1` as unknown as { id: string }[];
  if (already[0]) return { kind: "used" as const };
  if (promo.maxRedemptions !== null && promo.usesCount >= promo.maxRedemptions) return { kind: "exhausted" as const };
  const claimed = await sql`UPDATE promo_codes SET uses_count = uses_count + 1, updated_at = NOW() WHERE id = ${promo.id} AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) AND (max_redemptions IS NULL OR uses_count < max_redemptions) RETURNING id` as unknown as { id: string }[];
  if (!claimed[0]) return { kind: "exhausted" as const };
  try {
    const profile = await getProfile(userId);
    if (!profile) throw new Error("Profile not found");
    const cosmetics = mergedCosmetics(profile.cosmetics, promo.benefits);
    const xp = profile.xp + (promo.benefits.some((benefit) => benefit.type === "beta_access") ? 120 : 30);
    const [row] = await sql`UPDATE user_profiles SET cosmetics = ${JSON.stringify(cosmetics)}::jsonb, xp = ${xp}, updated_at = NOW() WHERE clerk_user_id = ${userId} RETURNING *` as unknown as Record<string, unknown>[];
    const hasPC = promo.benefits.some((b) => b.type === "party_creation");
    await sql`INSERT INTO promo_redemptions (id, promo_code_id, clerk_user_id, party_id) VALUES (${randomUUID()}, ${promo.id}, ${userId}, NULL)`;
    return { kind: "redeemed" as const, profile: profileFromRow({ ...row, has_party_creation: hasPC }), promo };
  } catch (error) {
    await sql`UPDATE promo_codes SET uses_count = GREATEST(uses_count - 1, 0), updated_at = NOW() WHERE id = ${promo.id}`;
    throw error;
  }
}

export async function getUserRedemptions(userId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT pr.*, pc.code, pc.benefits FROM promo_redemptions pr
    JOIN promo_codes pc ON pc.id = pr.promo_code_id
    WHERE pr.clerk_user_id = ${userId}
    ORDER BY pr.redeemed_at DESC` as unknown as Record<string, unknown>[];
  return rows.map((row) => {
    const rawBenefits = row.benefits;
    const parsedBenefits = typeof rawBenefits === "string" ? JSON.parse(rawBenefits) : rawBenefits;
    return {
      id: String(row.id),
      promoCodeId: String(row.promo_code_id),
      code: String(row.code),
      clerkUserId: String(row.clerk_user_id),
      partyId: row.party_id ? String(row.party_id) : null,
      benefits: Array.isArray(parsedBenefits) ? parsedBenefits as PromoBenefit[] : [],
      redeemedAt: new Date(row.redeemed_at as string | Date).toISOString(),
    } as PromoRedemption;
  });
}

export async function getDashboard(userId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT p.*, pm.role, pm.rsvp_status AS my_rsvp, COALESCE(owner.display_name, 'Организатор') AS owner_name, COALESCE(owner.image_url, '') AS owner_image_url,
    (SELECT COUNT(*)::int FROM party_members members WHERE members.party_id = p.id) AS member_count,
    (SELECT COUNT(*)::int FROM party_members members WHERE members.party_id = p.id AND members.rsvp_status = 'going') AS going_count,
    (SELECT COUNT(*)::int FROM party_members members WHERE members.party_id = p.id AND members.rsvp_status = 'maybe') AS maybe_count,
    (SELECT COUNT(*)::int FROM party_members members WHERE members.party_id = p.id AND members.rsvp_status = 'pass') AS pass_count
    FROM parties p JOIN party_members pm ON pm.party_id = p.id
    LEFT JOIN user_profiles owner ON owner.clerk_user_id = p.owner_id
    WHERE pm.clerk_user_id = ${userId} ORDER BY p.date ASC, p.time ASC` as unknown as Record<string, unknown>[];
  return rows.map(partyFromRow);
}

export async function getPartyByInvite(inviteCode: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT p.*, COALESCE(owner.display_name, 'Организатор') AS owner_name, COALESCE(owner.image_url, '') AS owner_image_url,
    (SELECT COUNT(*)::int FROM party_members members WHERE members.party_id = p.id) AS member_count,
    (SELECT COUNT(*)::int FROM party_members members WHERE members.party_id = p.id AND members.rsvp_status = 'going') AS going_count,
    (SELECT COUNT(*)::int FROM party_members members WHERE members.party_id = p.id AND members.rsvp_status = 'maybe') AS maybe_count,
    (SELECT COUNT(*)::int FROM party_members members WHERE members.party_id = p.id AND members.rsvp_status = 'pass') AS pass_count
    FROM parties p LEFT JOIN user_profiles owner ON owner.clerk_user_id = p.owner_id
    WHERE p.invite_code = ${inviteCode.toUpperCase()} LIMIT 1` as unknown as Record<string, unknown>[];
  return rows[0] ? partyFromRow(rows[0]) : null;
}

export async function createPartyWithPromo(ownerId: string, input: { title: string; date: string; time: string; venue: string; category: string; description: string; promoCode?: string; adultOnly: boolean }) {
  await ensurePartySchema();
  const sql = db();
  const profile = await getProfile(ownerId);
  if (!profile) return { kind: "invalid" as const };
  const hasPromoCode = !!input.promoCode?.trim();
  if (!hasPromoCode && !profile.hasPartyCreation) return { kind: "no_access" as const };
  if (!hasPromoCode && profile.hasPartyCreation) {
    const partyId = randomUUID();
    const inviteCode = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    const partySlug = slug(input.title, partyId.replaceAll("-", ""));
    const [partyRow] = await sql`INSERT INTO parties (id, owner_id, title, slug, invite_code, date, time, venue, category, description, adult_only)
      VALUES (${partyId}, ${ownerId}, ${input.title.slice(0, 100)}, ${partySlug}, ${inviteCode}, ${input.date}, ${input.time}, ${input.venue.slice(0, 120)}, ${input.category.slice(0, 80)}, ${input.description.slice(0, 500)}, ${input.adultOnly}) RETURNING *` as unknown as Record<string, unknown>[];
    await sql`INSERT INTO party_members (party_id, clerk_user_id, role) VALUES (${partyId}, ${ownerId}, 'owner')`;
    return { kind: "created" as const, party: partyFromRow({ ...partyRow, owner_name: profile.displayName ?? "Организатор", owner_image_url: profile.imageUrl ?? "", member_count: 1, role: "owner" }) };
  }
  const code = input.promoCode?.trim().toUpperCase() ?? "";
  const promoRows = await sql`SELECT * FROM promo_codes WHERE code = ${code} LIMIT 1` as unknown as Record<string, unknown>[];
  const promo = promoRows[0] ? promoFromRow(promoRows[0]) : null;
  if (!promo || promo.status !== "active") return { kind: "invalid" as const };
  const redemption = await sql`SELECT id FROM promo_redemptions WHERE promo_code_id = ${promo.id} AND clerk_user_id = ${ownerId} LIMIT 1` as unknown as { id: string }[];
  if (redemption[0]) return { kind: "used" as const };
  if (promo.maxRedemptions !== null && promo.usesCount >= promo.maxRedemptions) return { kind: "exhausted" as const };

  const partyId = randomUUID();
  const inviteCode = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
  const partySlug = slug(input.title, partyId.replaceAll("-", ""));
  const updated = await sql`UPDATE promo_codes SET uses_count = uses_count + 1, updated_at = NOW()
    WHERE id = ${promo.id} AND status = 'active' AND (max_redemptions IS NULL OR uses_count < max_redemptions)
    RETURNING id` as unknown as { id: string }[];
  if (!updated[0]) return { kind: "exhausted" as const };

  try {
    const [partyRow] = await sql`INSERT INTO parties (id, owner_id, title, slug, invite_code, date, time, venue, category, description, adult_only)
      VALUES (${partyId}, ${ownerId}, ${input.title.slice(0, 100)}, ${partySlug}, ${inviteCode}, ${input.date}, ${input.time}, ${input.venue.slice(0, 120)}, ${input.category.slice(0, 80)}, ${input.description.slice(0, 500)}, ${input.adultOnly}) RETURNING *` as unknown as Record<string, unknown>[];
    await sql`INSERT INTO party_members (party_id, clerk_user_id, role) VALUES (${partyId}, ${ownerId}, 'owner')`;
    await sql`INSERT INTO promo_redemptions (id, promo_code_id, clerk_user_id, party_id) VALUES (${randomUUID()}, ${promo.id}, ${ownerId}, ${partyId})`;
    const profile = await getProfile(ownerId);
    const rewardedProfile = profile && promo.benefits.length ? (() => { const cosmetics = mergedCosmetics(profile.cosmetics, promo.benefits); return { cosmetics, xp: profile.xp + 50 }; })() : null;
    if (rewardedProfile) await sql`UPDATE user_profiles SET cosmetics = ${JSON.stringify(rewardedProfile.cosmetics)}::jsonb, xp = ${rewardedProfile.xp}, updated_at = NOW() WHERE clerk_user_id = ${ownerId}`;
    return { kind: "created" as const, party: partyFromRow({ ...partyRow, owner_name: profile?.displayName ?? "Организатор", owner_image_url: profile?.imageUrl ?? "", member_count: 1, role: "owner" }) };
  } catch (error) {
    await sql`UPDATE promo_codes SET uses_count = GREATEST(uses_count - 1, 0), updated_at = NOW() WHERE id = ${promo.id}`;
    throw error;
  }
}

export async function joinParty(userId: string, inviteCode: string, rsvp?: RsvpStatus) {
  const party = await getPartyByInvite(inviteCode);
  if (!party) return null;
  const rsvpStatus = rsvp === "maybe" || rsvp === "pass" ? rsvp : "going";
  await db()`INSERT INTO party_members (party_id, clerk_user_id, role, rsvp_status) VALUES (${party.id}, ${userId}, ${party.ownerId === userId ? "owner" : "guest"}, ${rsvpStatus}) ON CONFLICT (party_id, clerk_user_id) DO UPDATE SET rsvp_status = ${rsvpStatus}`;
  return getPartyByInvite(inviteCode);
}

export async function updateParty(partyId: string, userId: string, input: { title?: string; date?: string; time?: string; venue?: string; category?: string; description?: string; adultOnly?: boolean }) {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM parties WHERE id = ${partyId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!rows[0]) return null;
  const current = rows[0];
  const isOwner = String(current.owner_id) === userId;
  if (!isOwner) return null;
  const [row] = await db()`UPDATE parties SET
    title = COALESCE(${input.title ?? null}, title),
    date = COALESCE(${input.date ?? null}, date),
    time = COALESCE(${input.time ?? null}, time),
    venue = COALESCE(${input.venue ?? null}, venue),
    category = COALESCE(${input.category ?? null}, category),
    description = COALESCE(${input.description ?? null}, description),
    adult_only = COALESCE(${input.adultOnly ?? null}, adult_only),
    updated_at = NOW()
    WHERE id = ${partyId} RETURNING *` as unknown as Record<string, unknown>[];
  return row ? partyFromRow(row) : null;
}

export async function deleteParty(partyId: string, userId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT owner_id FROM parties WHERE id = ${partyId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!rows[0] || String(rows[0].owner_id) !== userId) return false;
  await db()`DELETE FROM parties WHERE id = ${partyId}`;
  return true;
}

export async function getPartyMembers(partyId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT pm.*, up.display_name, up.image_url
    FROM party_members pm
    LEFT JOIN user_profiles up ON up.clerk_user_id = pm.clerk_user_id
    WHERE pm.party_id = ${partyId} ORDER BY pm.joined_at ASC` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    clerkUserId: String(row.clerk_user_id),
    displayName: String(row.display_name ?? row.clerk_user_id),
    imageUrl: String(row.image_url ?? ""),
    role: (row.role === "owner" || row.role === "co_host" ? row.role : "guest") as PartyRole,
    rsvpStatus: (row.rsvp_status === "going" || row.rsvp_status === "maybe" || row.rsvp_status === "pass" ? row.rsvp_status : "going") as RsvpStatus,
    joinedAt: new Date(row.joined_at as string | Date).toISOString(),
  }));
}

export async function setMemberRole(partyId: string, ownerId: string, targetUserId: string, role: "co_host" | "guest") {
  await ensurePartySchema();
  const partyRows = await db()`SELECT owner_id FROM parties WHERE id = ${partyId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!partyRows[0] || String(partyRows[0].owner_id) !== ownerId) throw new Error("Only owner can change roles");
  if (targetUserId === ownerId) throw new Error("Cannot change owner role");
  const [row] = await db()`UPDATE party_members SET role = ${role} WHERE party_id = ${partyId} AND clerk_user_id = ${targetUserId} RETURNING *` as unknown as Record<string, unknown>[];
  return row ? { clerkUserId: String(row.clerk_user_id), role: row.role as PartyRole } : null;
}

export async function updateRsvp(partyId: string, userId: string, rsvp: RsvpStatus) {
  await ensurePartySchema();
  const [row] = await db()`UPDATE party_members SET rsvp_status = ${rsvp} WHERE party_id = ${partyId} AND clerk_user_id = ${userId} RETURNING rsvp_status` as unknown as { rsvp_status: string }[];
  return row ? (row.rsvp_status as RsvpStatus) : null;
}

export async function listPromoCodes() {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM promo_codes ORDER BY created_at DESC` as unknown as Record<string, unknown>[];
  return rows.map(promoFromRow);
}

export async function createPromoCode(input: { code: string; maxRedemptions: number | null; mode?: PromoMode; expiresAt?: string | null; benefits?: PromoBenefit[] }) {
  await ensurePartySchema();
  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
  if (!code) throw new Error("Укажите код.");
  const mode = input.mode === "multi" ? "multi" : "single";
  const maxRedemptions = mode === "single" ? 1 : input.maxRedemptions;
  const expiresAt = input.expiresAt ? new Date(input.expiresAt).toISOString() : null;
  const [row] = await db()`INSERT INTO promo_codes (id, code, max_redemptions, redemption_mode, expires_at, benefits) VALUES (${randomUUID()}, ${code}, ${maxRedemptions}, ${mode}, ${expiresAt}, ${JSON.stringify(input.benefits ?? [])}::jsonb) RETURNING *` as unknown as Record<string, unknown>[];
  return promoFromRow(row);
}

export async function updatePromoCode(id: string, input: { code?: string; status?: PromoStatus; maxRedemptions?: number | null; mode?: PromoMode; expiresAt?: string | null; benefits?: PromoBenefit[] }) {
  const currentRows = await db()`SELECT * FROM promo_codes WHERE id = ${id} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!currentRows[0]) return null;
  const current = promoFromRow(currentRows[0]);
  const code = input.code ?? current.code;
  const status = input.status ?? current.status;
  const maxRedemptions = input.maxRedemptions === undefined ? current.maxRedemptions : input.maxRedemptions;
  const mode = input.mode ?? current.mode;
  const actualMax = mode === "single" ? 1 : maxRedemptions;
  const expiresAt = input.expiresAt === undefined ? current.expiresAt : input.expiresAt;
  const benefits = input.benefits ?? current.benefits;
  const [row] = await db()`UPDATE promo_codes SET code = ${code}, status = ${status}, max_redemptions = ${actualMax}, redemption_mode = ${mode}, expires_at = ${expiresAt}, benefits = ${JSON.stringify(benefits)}::jsonb, updated_at = NOW() WHERE id = ${id} RETURNING *` as unknown as Record<string, unknown>[];
  return promoFromRow(row);
}

export async function deletePromoCode(id: string) {
  const rows = await db()`DELETE FROM promo_codes WHERE id = ${id} AND uses_count = 0 RETURNING id` as unknown as { id: string }[];
  return rows.length > 0;
}

export type ChatMessage = {
  id: string;
  partyId: string;
  userId: string;
  displayName: string;
  handle: string;
  nameColor: string;
  text: string;
  type: "text" | "voice" | "sticker";
  voiceUrl: string;
  stickerId: string;
  reactions: Record<string, string[]>;
  createdAt: string;
};

export async function sendMessage(userId: string, partyId: string, text: string, extra?: { type?: string; voiceUrl?: string; stickerId?: string; clientMutationId?: string }) {
  await ensurePartySchema();
  const member = await db()`SELECT clerk_user_id FROM party_members WHERE party_id = ${partyId} AND clerk_user_id = ${userId} LIMIT 1` as unknown as { clerk_user_id: string }[];
  if (!member[0]) throw new Error("Not a party member");
  const profile = await getProfile(userId);
  const type = extra?.type ?? "text";
  const voiceUrl = extra?.voiceUrl ?? "";
  const stickerId = extra?.stickerId ?? "";
  const mutationId = extra?.clientMutationId ? extra.clientMutationId.slice(0, 64) : null;
  const handle = profile?.handle ?? "";
  const nameColor = profile?.cosmetics?.nameColor ?? "#000000";
  let [row] = await db()`INSERT INTO chat_messages (id, party_id, clerk_user_id, display_name, handle, name_color, text, type, voice_url, sticker_id, client_mutation_id)
    VALUES (${randomUUID()}, ${partyId}, ${userId}, ${profile?.displayName ?? "TUSA friend"}, ${handle}, ${nameColor}, ${text.slice(0, 1000)}, ${type}, ${voiceUrl}, ${stickerId}, ${mutationId})
    ON CONFLICT (party_id, client_mutation_id) DO NOTHING
    RETURNING *` as unknown as Record<string, unknown>[];
  if (!row && mutationId) {
    const [existing] = await db()`SELECT * FROM chat_messages WHERE party_id = ${partyId} AND client_mutation_id = ${mutationId} LIMIT 1` as unknown as Record<string, unknown>[];
    row = existing;
  }
  return row ? {
    id: String(row.id), partyId: String(row.party_id), userId: String(row.clerk_user_id),
    displayName: String(row.display_name), handle: String(row.handle ?? ""), nameColor: String(row.name_color ?? "#000000"),
    text: String(row.text), type: String(row.type) as ChatMessage["type"],
    voiceUrl: String(row.voice_url), stickerId: String(row.sticker_id),
    reactions: (row.reactions ?? {}) as Record<string, string[]>,
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  } as ChatMessage : null;
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  await ensurePartySchema();
  const [msgRow] = await db()`SELECT reactions, party_id FROM chat_messages WHERE id = ${messageId}` as unknown as { reactions: Record<string, string[]>; party_id: string }[];
  if (!msgRow) return null;
  await requirePartyMember(String(msgRow.party_id), userId);
  const row = msgRow;
  const reactions = row.reactions ?? {};
  const users = reactions[emoji] ?? [];
  if (users.includes(userId)) {
    reactions[emoji] = users.filter((id) => id !== userId);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji] = [...users, userId];
  }
  await db()`UPDATE chat_messages SET reactions = ${JSON.stringify(reactions)}::jsonb WHERE id = ${messageId}`;
  return reactions;
}

export async function getMessages(partyId: string, limit = 50, after?: string) {
  await ensurePartySchema();
  const rows = after
    ? await db()`SELECT * FROM chat_messages WHERE party_id = ${partyId} AND created_at > ${after}::timestamptz
        ORDER BY created_at ASC LIMIT ${limit}` as unknown as Record<string, unknown>[]
    : await db()`SELECT * FROM chat_messages WHERE party_id = ${partyId}
        ORDER BY created_at DESC LIMIT ${limit}` as unknown as Record<string, unknown>[];
  const ordered = after ? rows : rows.reverse();
  return ordered.map((row) => ({
    id: String(row.id), partyId: String(row.party_id), userId: String(row.clerk_user_id),
    displayName: String(row.display_name), text: String(row.text), type: String(row.type ?? "text") as ChatMessage["type"],
    voiceUrl: String(row.voice_url ?? ""), stickerId: String(row.sticker_id ?? ""),
    reactions: (row.reactions ?? {}) as Record<string, string[]>,
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  } as ChatMessage));
}

export type GameSession = {
  id: string;
  partyId: string;
  game: string;
  status: "lobby" | "active" | "paused" | "completed" | "cancelled";
  config: Record<string, unknown>;
  state: Record<string, unknown>;
  participants?: string[];
  createdBy?: string;
  version?: number;
  createdAt: string;
};

export type ShoppingItem = {
  id: string;
  partyId: string;
  text: string;
  quantity: number;
  unit: string;
  buyerId: string;
  buyerName: string;
  price: number;
  purchased: boolean;
  createdAt: string;
};

export type GalleryPhoto = {
  id: string;
  partyId: string;
  userId: string;
  displayName: string;
  name: string;
  src: string;
  tags: string[];
  cover: boolean;
  createdAt: string;
};

export type GameScore = {
  id: string;
  sessionId: string;
  userId: string;
  displayName?: string;
  score: number;
  metadata: Record<string, unknown>;
};

export type GameAction = {
  id: string;
  sessionId: string;
  userId: string;
  actionType: string;
  payload: unknown;
  clientMutationId?: string;
  createdAt: string;
};

export async function createGameSession(partyId: string, game: string, config?: Record<string, unknown>, createdBy?: string) {
  await ensurePartySchema();
  if (createdBy) await requirePartyMember(partyId, createdBy);
  const [row] = await db()`INSERT INTO game_sessions (id, party_id, game, config, state, created_by)
    VALUES (${randomUUID()}, ${partyId}, ${game}, ${JSON.stringify(config ?? {})}::jsonb, '{}'::jsonb, ${createdBy ?? ""}) RETURNING *` as unknown as Record<string, unknown>[];
  return { id: String(row.id), partyId: String(row.party_id), game: String(row.game), status: String(row.status), config: row.config as Record<string, unknown>, state: row.state as Record<string, unknown>, version: Number(row.version), createdBy: String(row.created_by ?? ""), createdAt: new Date(row.created_at as string | Date).toISOString() } as GameSession;
}

export async function addGameAction(sessionId: string, userId: string, actionType: string, payload: unknown, clientMutationId: string) {
  await ensurePartySchema();
  const partyId = await getSessionPartyId(sessionId);
  if (!partyId) throw new Error("Session not found");
  await requirePartyMember(partyId, userId);
  const [session] = await db()`SELECT participants, status FROM game_sessions WHERE id = ${sessionId}` as unknown as { participants: string[]; status: string }[];
  const participants = Array.isArray(session?.participants) ? session.participants : [];
  if (!participants.includes(userId) || session.status === "completed" || session.status === "cancelled") throw new Error("Not an active player");
  let [row] = await db()`INSERT INTO game_actions (id, session_id, clerk_user_id, action_type, payload, client_mutation_id)
    VALUES (${randomUUID()}, ${sessionId}, ${userId}, ${actionType.slice(0, 80)}, ${JSON.stringify(payload ?? {})}::jsonb, ${clientMutationId})
    ON CONFLICT (session_id, clerk_user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL DO NOTHING
    RETURNING *` as unknown as Record<string, unknown>[];
  if (!row) [row] = await db()`SELECT * FROM game_actions WHERE session_id = ${sessionId} AND clerk_user_id = ${userId} AND client_mutation_id = ${clientMutationId} LIMIT 1` as unknown as Record<string, unknown>[];
  return { id: String(row.id), sessionId: String(row.session_id), userId: String(row.clerk_user_id), actionType: String(row.action_type), payload: row.payload, clientMutationId: String(row.client_mutation_id), createdAt: new Date(row.created_at as string | Date).toISOString() } as GameAction;
}

export async function getGameActionByMutationId(sessionId: string, userId: string, clientMutationId: string) {
  await ensurePartySchema();
  const [row] = await db()`SELECT * FROM game_actions WHERE session_id = ${sessionId} AND clerk_user_id = ${userId} AND client_mutation_id = ${clientMutationId} LIMIT 1` as unknown as Record<string, unknown>[];
  return row ? { id: String(row.id), sessionId: String(row.session_id), userId: String(row.clerk_user_id), actionType: String(row.action_type), payload: row.payload, clientMutationId: String(row.client_mutation_id), createdAt: new Date(row.created_at as string | Date).toISOString() } as GameAction : null;
}

export async function getGameActions(sessionId: string, limit = 200) {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM game_actions WHERE session_id = ${sessionId} ORDER BY created_at ASC LIMIT ${Math.min(Math.max(limit, 1), 500)}` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({ id: String(row.id), sessionId: String(row.session_id), userId: String(row.clerk_user_id), actionType: String(row.action_type), payload: row.payload, createdAt: new Date(row.created_at as string | Date).toISOString() } as GameAction));
}

export async function getPendingGameActions(sessionId: string, limit = 200) {
  await ensurePartySchema();
  const rows = await db()`SELECT ga.* FROM game_actions ga
    JOIN game_sessions gs ON gs.id = ga.session_id
    WHERE ga.session_id = ${sessionId} AND ga.created_at > gs.updated_at
    ORDER BY ga.created_at ASC LIMIT ${Math.min(Math.max(limit, 1), 500)}` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({ id: String(row.id), sessionId: String(row.session_id), userId: String(row.clerk_user_id), actionType: String(row.action_type), payload: row.payload, createdAt: new Date(row.created_at as string | Date).toISOString() } as GameAction));
}

export async function getActiveGameSessions(partyId: string, userId?: string) {
  await ensurePartySchema();
  if (userId) await requirePartyMember(partyId, userId);
  const rows = await db()`SELECT * FROM game_sessions WHERE party_id = ${partyId} AND status IN ('lobby', 'active') ORDER BY created_at DESC` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({ id: String(row.id), partyId: String(row.party_id), game: String(row.game), status: String(row.status), config: row.config as Record<string, unknown>, state: row.state as Record<string, unknown>, participants: (row.participants ?? []) as string[], createdBy: String(row.created_by ?? ""), createdAt: new Date(row.created_at as string | Date).toISOString() } as GameSession & { participants: string[] }));
}

export async function getGameSessionById(sessionId: string) {
  await ensurePartySchema();
  const [row] = await db()`SELECT * FROM game_sessions WHERE id = ${sessionId}` as unknown as Record<string, unknown>[];
  if (!row) return null;
  return { id: String(row.id), partyId: String(row.party_id), game: String(row.game), status: String(row.status), config: row.config as Record<string, unknown>, state: row.state as Record<string, unknown>, version: Number(row.version), participants: (row.participants ?? []) as string[], createdBy: String(row.created_by ?? ""), createdAt: new Date(row.created_at as string | Date).toISOString() } as GameSession & { participants: string[] };
}

export async function joinGameSession(sessionId: string, userId: string) {
  await ensurePartySchema();
  const [existing] = await db()`SELECT participants, party_id FROM game_sessions WHERE id = ${sessionId}` as unknown as { participants: string[]; party_id: string }[];
  if (!existing) return null;
  await requirePartyMember(String(existing.party_id), userId);
  const current = Array.isArray(existing.participants) ? existing.participants : [];
  if (!current.includes(userId)) {
    current.push(userId);
    await db()`UPDATE game_sessions SET participants = ${JSON.stringify(current)}::jsonb, updated_at = NOW() WHERE id = ${sessionId}`;
  }
  return getGameSessionById(sessionId);
}

export async function leaveGameSession(sessionId: string, userId: string) {
  await ensurePartySchema();
  const [existing] = await db()`SELECT participants, party_id FROM game_sessions WHERE id = ${sessionId}` as unknown as { participants: string[]; party_id: string }[];
  if (!existing) return null;
  await requirePartyMember(String(existing.party_id), userId);
  const current = (Array.isArray(existing.participants) ? existing.participants : []).filter((id) => id !== userId);
  await db()`UPDATE game_sessions SET participants = ${JSON.stringify(current)}::jsonb, updated_at = NOW() WHERE id = ${sessionId}`;
  return getGameSessionById(sessionId);
}

export async function setPaymentAssignee(partyId: string, userId: string, targetUserId: string) {
  await ensurePartySchema();
  await requireOwner(partyId, userId);
  await db()`UPDATE party_members SET paid_by = ${targetUserId} WHERE party_id = ${partyId} AND clerk_user_id = ${userId}`;
  return { partyId, ownerId: userId, paidBy: targetUserId };
}

export async function getPaymentAssignee(partyId: string) {
  await ensurePartySchema();
  const [row] = await db()`SELECT pm.paid_by, up.display_name FROM party_members pm LEFT JOIN user_profiles up ON up.clerk_user_id = pm.paid_by WHERE pm.party_id = ${partyId} AND pm.role = 'owner'` as unknown as Record<string, unknown>[];
  return row ? { paidBy: String(row.paid_by || ""), displayName: String(row.display_name || "") } : { paidBy: "", displayName: "" };
}

export async function updateGameSession(sessionId: string, userId: string, updates: { status?: string; state?: Record<string, unknown>; expectedVersion?: number }) {
  const partyId = await getSessionPartyId(sessionId);
  if (!partyId) return null;
  await requirePartyMember(partyId, userId);
  const [access] = await db()`SELECT created_by FROM game_sessions WHERE id = ${sessionId}` as unknown as { created_by: string }[];
  if (!access || String(access.created_by) !== userId) throw new Error("Only the session creator can update game state");
  const status = updates.status;
  const state = updates.state ? JSON.stringify(updates.state) : undefined;
  const rows = updates.expectedVersion !== undefined
    ? await db()`UPDATE game_sessions SET
        ${status ? db()`status = ${status},` : db()``}
        ${state ? db()`state = ${state}::jsonb,` : db()``}
        version = version + 1, updated_at = NOW()
        WHERE id = ${sessionId} AND version = ${updates.expectedVersion} RETURNING *` as unknown as Record<string, unknown>[]
    : await db()`UPDATE game_sessions SET
        ${status ? db()`status = ${status},` : db()``}
        ${state ? db()`state = ${state}::jsonb,` : db()``}
        version = version + 1, updated_at = NOW()
        WHERE id = ${sessionId} RETURNING *` as unknown as Record<string, unknown>[];
  const [row] = rows;
  if (!row) return null;
  return { id: String(row.id), partyId: String(row.party_id), game: String(row.game), status: String(row.status), config: row.config as Record<string, unknown>, state: row.state as Record<string, unknown>, version: Number(row.version), createdAt: new Date(row.created_at as string | Date).toISOString() } as GameSession & { version: number };
}

export async function addGameScore(sessionId: string, userId: string, score: number, metadata?: Record<string, unknown>) {
  const partyId = await getSessionPartyId(sessionId);
  if (!partyId) throw new Error("Session not found");
  await requirePartyMember(partyId, userId);
  const [access] = await db()`SELECT created_by, status FROM game_sessions WHERE id = ${sessionId}` as unknown as { created_by: string; status: string }[];
  if (!access || String(access.created_by) !== userId) throw new Error("Only the session creator can submit results");
  if (access.status === "cancelled") throw new Error("Cancelled sessions cannot be scored");
  const safeScore = Math.min(Math.max(Math.trunc(Number(score) || 0), 0), 100000);
  const mutationId = (metadata?.clientMutationId as string)?.slice(0, 64) ?? null;
  let [row] = await db()`INSERT INTO game_scores (id, session_id, clerk_user_id, score, metadata, client_mutation_id)
    VALUES (${randomUUID()}, ${sessionId}, ${userId}, ${safeScore}, ${JSON.stringify(metadata ?? {})}::jsonb, ${mutationId})
    ON CONFLICT (session_id, client_mutation_id) DO NOTHING
    RETURNING *` as unknown as Record<string, unknown>[];
  if (!row && mutationId) {
    const [existing] = await db()`SELECT * FROM game_scores WHERE session_id = ${sessionId} AND client_mutation_id = ${mutationId} LIMIT 1` as unknown as Record<string, unknown>[];
    row = existing;
  }
  return { id: String(row.id), sessionId: String(row.session_id), userId: String(row.clerk_user_id), score: Number(row.score), metadata: row.metadata as Record<string, unknown> } as GameScore;
}

export async function addShoppingItem(userId: string, partyId: string, input: { text: string; quantity: number; unit: string }) {
  await ensurePartySchema();
  const member = await db()`SELECT clerk_user_id FROM party_members WHERE party_id = ${partyId} AND clerk_user_id = ${userId} LIMIT 1` as unknown as { clerk_user_id: string }[];
  if (!member[0]) throw new Error("Not a party member");
  const profile = await getProfile(userId);
  const [row] = await db()`INSERT INTO party_shopping_items (id, party_id, clerk_user_id, display_name, text, quantity, unit)
    VALUES (${randomUUID()}, ${partyId}, ${userId}, ${profile?.displayName ?? "TUSA friend"}, ${input.text.slice(0, 200)}, ${Math.max(1, input.quantity)}, ${input.unit.slice(0, 10)})
    RETURNING *` as unknown as Record<string, unknown>[];
  return rowToShoppingItem(row);
}

export async function getShoppingItems(partyId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM party_shopping_items WHERE party_id = ${partyId} ORDER BY created_at ASC` as unknown as Record<string, unknown>[];
  return rows.map(rowToShoppingItem);
}

export async function updateShoppingItem(itemId: string, userId: string, updates: { text?: string; quantity?: number; unit?: string; price?: number; purchased?: boolean; buyerId?: string }) {
  await ensurePartySchema();
  const [itemRow] = await db()`SELECT party_id, clerk_user_id FROM party_shopping_items WHERE id = ${itemId}` as unknown as Record<string, unknown>[];
  if (!itemRow) return null;
  const itemUserId = String(itemRow.clerk_user_id);
  if (itemUserId !== userId) await requireOwner(String(itemRow.party_id), userId);
  const text = updates.text !== undefined ? updates.text.slice(0, 200) : undefined;
  const quantity = updates.quantity !== undefined ? Math.max(1, updates.quantity) : undefined;
  const unit = updates.unit !== undefined ? updates.unit.slice(0, 10) : undefined;
  const price = updates.price !== undefined ? Math.max(0, updates.price) : undefined;
  const purchased = updates.purchased;
  const buyerId = updates.buyerId;
  const buyerProfile = buyerId ? await getProfile(buyerId) : null;
  const buyerName = buyerProfile?.displayName;
  const [row] = await db()`UPDATE party_shopping_items SET
    text = COALESCE(${text ?? null}, text),
    quantity = COALESCE(${quantity ?? null}, quantity),
    unit = COALESCE(${unit ?? null}, unit),
    price = COALESCE(${price ?? null}, price),
    purchased = COALESCE(${purchased ?? null}, purchased),
    clerk_user_id = COALESCE(${buyerId ?? null}, clerk_user_id),
    display_name = COALESCE(${buyerName ?? null}, display_name)
    WHERE id = ${itemId} RETURNING *` as unknown as Record<string, unknown>[];
  return row ? rowToShoppingItem(row) : null;
}

export async function deleteShoppingItem(itemId: string, userId: string) {
  await ensurePartySchema();
  const [itemRow] = await db()`SELECT party_id, clerk_user_id FROM party_shopping_items WHERE id = ${itemId}` as unknown as Record<string, unknown>[];
  if (!itemRow) return false;
  const itemUserId = String(itemRow.clerk_user_id);
  if (itemUserId !== userId) await requireOwner(String(itemRow.party_id), userId);
  const rows = await db()`DELETE FROM party_shopping_items WHERE id = ${itemId} RETURNING id` as unknown as { id: string }[];
  return rows.length > 0;
}

function rowToShoppingItem(row: Record<string, unknown>): ShoppingItem {
  return {
    id: String(row.id),
    partyId: String(row.party_id),
    text: String(row.text),
    quantity: Number(row.quantity),
    unit: String(row.unit),
    buyerId: String(row.clerk_user_id),
    buyerName: String(row.display_name),
    price: Number(row.price),
    purchased: Boolean(row.purchased),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export async function addGalleryPhoto(userId: string, partyId: string, input: { name: string; src: string }) {
  await ensurePartySchema();
  const member = await db()`SELECT clerk_user_id FROM party_members WHERE party_id = ${partyId} AND clerk_user_id = ${userId} LIMIT 1` as unknown as { clerk_user_id: string }[];
  if (!member[0]) throw new Error("Not a party member");
  const profile = await getProfile(userId);
  const existing = await db()`SELECT COUNT(*)::int AS cnt FROM party_gallery_photos WHERE party_id = ${partyId}` as unknown as { cnt: number }[];
  const isFirst = existing[0].cnt === 0;
  const [row] = await db()`INSERT INTO party_gallery_photos (id, party_id, clerk_user_id, display_name, name, src, cover)
    VALUES (${randomUUID()}, ${partyId}, ${userId}, ${profile?.displayName ?? "TUSA friend"}, ${input.name.slice(0, 200)}, ${input.src}, ${isFirst})
    RETURNING *` as unknown as Record<string, unknown>[];
  return rowToGalleryPhoto(row);
}

export async function getGalleryPhotos(partyId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM party_gallery_photos WHERE party_id = ${partyId} ORDER BY cover DESC, created_at DESC` as unknown as Record<string, unknown>[];
  return rows.map(rowToGalleryPhoto);
}

export async function updateGalleryPhoto(photoId: string, userId: string, updates: { cover?: boolean; tags?: string[]; name?: string }) {
  await ensurePartySchema();
  const [photoRow] = await db()`SELECT party_id, clerk_user_id FROM party_gallery_photos WHERE id = ${photoId}` as unknown as Record<string, unknown>[];
  if (!photoRow) return null;
  const photoUserId = String(photoRow.clerk_user_id);
  if (photoUserId !== userId) await requireOwner(String(photoRow.party_id), userId);
  const cover = updates.cover !== undefined ? updates.cover : undefined;
  const tags = updates.tags !== undefined ? JSON.stringify(updates.tags) : undefined;
  const name = updates.name !== undefined ? updates.name.slice(0, 200) : undefined;
  const [row] = await db()`UPDATE party_gallery_photos SET
    cover = COALESCE(${cover ?? null}, cover),
    tags = COALESCE(${tags ?? null}::jsonb, tags),
    name = COALESCE(${name ?? null}, name)
    WHERE id = ${photoId} RETURNING *` as unknown as Record<string, unknown>[];
  if (!row) return null;
  if (updates.cover) {
    await db()`UPDATE party_gallery_photos SET cover = FALSE WHERE id != ${photoId} AND party_id = ${String(row.party_id)}`;
  }
  return row ? rowToGalleryPhoto(row) : null;
}

export async function deleteGalleryPhoto(photoId: string, userId: string) {
  await ensurePartySchema();
  const [photoRow] = await db()`SELECT party_id, clerk_user_id FROM party_gallery_photos WHERE id = ${photoId}` as unknown as Record<string, unknown>[];
  if (!photoRow) return false;
  const photoUserId = String(photoRow.clerk_user_id);
  if (photoUserId !== userId) await requireOwner(String(photoRow.party_id), userId);
  const rows = await db()`DELETE FROM party_gallery_photos WHERE id = ${photoId} RETURNING id` as unknown as { id: string }[];
  return rows.length > 0;
}

function rowToGalleryPhoto(row: Record<string, unknown>): GalleryPhoto {
  const rawTags = row.tags;
  const parsedTags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
  return {
    id: String(row.id),
    partyId: String(row.party_id),
    userId: String(row.clerk_user_id),
    displayName: String(row.display_name),
    name: String(row.name),
    src: String(row.src),
    tags: Array.isArray(parsedTags) ? parsedTags.map(String) : [],
    cover: Boolean(row.cover),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export async function getGameScores(sessionId: string) {
  const rows = await db()`SELECT gs.*, up.display_name FROM game_scores gs LEFT JOIN user_profiles up ON up.clerk_user_id = gs.clerk_user_id WHERE gs.session_id = ${sessionId} ORDER BY gs.score DESC` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({ id: String(row.id), sessionId: String(row.session_id), userId: String(row.clerk_user_id), displayName: String(row.display_name ?? ""), score: Number(row.score), metadata: row.metadata as Record<string, unknown> } as GameScore));
}

export async function getUserGameStats(userId: string) {
  await ensurePartySchema();
  const [row] = await db()`SELECT
    COUNT(DISTINCT gs.id)::int AS games_played,
    COALESCE(SUM(gs2.score), 0)::int AS total_score
    FROM party_members pm
    JOIN game_sessions gs ON gs.party_id = pm.party_id AND gs.status = 'completed'
    LEFT JOIN game_scores gs2 ON gs2.session_id = gs.id AND gs2.clerk_user_id = ${userId}
    WHERE pm.clerk_user_id = ${userId}` as unknown as Record<string, unknown>[];
  return { gamesPlayed: Number(row.games_played), totalScore: Number(row.total_score) };
}

export async function getPromoRedemptions(promoCodeId?: string) {
  await ensurePartySchema();
  const sql = db();
  if (promoCodeId) {
    const rows = await sql`SELECT pr.*, pc.code, pc.benefits, up.display_name FROM promo_redemptions pr
      JOIN promo_codes pc ON pc.id = pr.promo_code_id
      LEFT JOIN user_profiles up ON up.clerk_user_id = pr.clerk_user_id
      WHERE pr.promo_code_id = ${promoCodeId}
      ORDER BY pr.redeemed_at DESC` as unknown as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id), promoCodeId: String(row.promo_code_id), code: String(row.code),
      clerkUserId: String(row.clerk_user_id), displayName: String(row.display_name ?? row.clerk_user_id),
      partyId: row.party_id ? String(row.party_id) : null,
      redeemedAt: new Date(row.redeemed_at as string | Date).toISOString(),
    }));
  }
  const rows = await sql`SELECT pr.*, pc.code, pc.benefits, up.display_name FROM promo_redemptions pr
    JOIN promo_codes pc ON pc.id = pr.promo_code_id
    LEFT JOIN user_profiles up ON up.clerk_user_id = pr.clerk_user_id
    ORDER BY pr.redeemed_at DESC LIMIT 50` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id), promoCodeId: String(row.promo_code_id), code: String(row.code),
    clerkUserId: String(row.clerk_user_id), displayName: String(row.display_name ?? row.clerk_user_id),
    partyId: row.party_id ? String(row.party_id) : null,
    redeemedAt: new Date(row.redeemed_at as string | Date).toISOString(),
  }));
}

export async function resolveHandleToUserId(handle: string): Promise<string | null> {
  await ensurePartySchema();
  const [row] = await db()`SELECT clerk_user_id FROM user_profiles WHERE handle = ${handle}` as unknown as Record<string, unknown>[];
  return row ? String(row.clerk_user_id) : null;
}

export async function sendFriendRequest(requesterId: string, targetId: string) {
  await ensurePartySchema();
  if (requesterId === targetId) throw new Error("Cannot friend yourself");
  await db()`INSERT INTO friend_connections (requester_id, target_id, status)
    VALUES (${requesterId}, ${targetId}, 'pending')
    ON CONFLICT (requester_id, target_id) DO UPDATE SET status = 'pending', updated_at = NOW()
    WHERE friend_connections.status = 'blocked'`;
  return { requesterId, targetId, status: "pending" as const };
}

export async function respondToFriendRequest(userId: string, requesterId: string, accept: boolean) {
  await ensurePartySchema();
  const [row] = await db()`UPDATE friend_connections SET status = ${accept ? "accepted" : "blocked"}, updated_at = NOW()
    WHERE target_id = ${userId} AND requester_id = ${requesterId} AND status = 'pending'
    RETURNING *` as unknown as Record<string, unknown>[];
  return row ? { requesterId, targetId: userId, status: row.status as FriendStatus } : null;
}

export async function getFriends(userId: string) {
  await ensurePartySchema();
  const sql = db();
  const sent = await sql`SELECT fc.*, up.display_name, up.image_url, up.handle FROM friend_connections fc
    LEFT JOIN user_profiles up ON up.clerk_user_id = fc.target_id
    WHERE fc.requester_id = ${userId} AND fc.status = 'accepted'` as unknown as Record<string, unknown>[];
  const received = await sql`SELECT fc.*, up.display_name, up.image_url, up.handle FROM friend_connections fc
    LEFT JOIN user_profiles up ON up.clerk_user_id = fc.requester_id
    WHERE fc.target_id = ${userId} AND fc.status = 'accepted'` as unknown as Record<string, unknown>[];
  const map = (row: Record<string, unknown>): FriendConnection => ({
    requesterId: String(row.requester_id), targetId: String(row.target_id),
    status: row.status as FriendStatus, displayName: String(row.display_name ?? row.target_id),
    imageUrl: String(row.image_url ?? ""), handle: String(row.handle ?? ""),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  });
  return [...sent.map(map), ...received.map(map)];
}

export async function getFriendRequests(userId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT fc.*, up.display_name, up.image_url, up.handle FROM friend_connections fc
    LEFT JOIN user_profiles up ON up.clerk_user_id = fc.requester_id
    WHERE fc.target_id = ${userId} AND fc.status = 'pending'
    ORDER BY fc.created_at DESC` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    requesterId: String(row.requester_id), targetId: String(row.target_id),
    status: "pending" as const, displayName: String(row.display_name ?? row.requester_id),
    imageUrl: String(row.image_url ?? ""), handle: String(row.handle ?? ""),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  }));
}

export async function removeFriend(userId: string, friendId: string) {
  await ensurePartySchema();
  await db()`DELETE FROM friend_connections WHERE (requester_id = ${userId} AND target_id = ${friendId}) OR (requester_id = ${friendId} AND target_id = ${userId})`;
  return true;
}

export async function getFriendLists(userId: string): Promise<FriendList[]> {
  await ensurePartySchema();
  const lists = await db()`SELECT * FROM friend_lists WHERE clerk_user_id = ${userId} ORDER BY created_at DESC` as unknown as Record<string, unknown>[];
  const result: FriendList[] = [];
  for (const list of lists) {
    const members = await db()`SELECT friend_id FROM friend_list_members WHERE list_id = ${String(list.id)}` as unknown as { friend_id: string }[];
    result.push({
      id: String(list.id),
      clerkUserId: String(list.clerk_user_id),
      name: String(list.name),
      createdAt: new Date(list.created_at as string | Date).toISOString(),
      updatedAt: new Date(list.updated_at as string | Date).toISOString(),
      members: members.map((m) => m.friend_id),
    });
  }
  return result;
}

export async function createFriendList(userId: string, name: string): Promise<FriendList> {
  await ensurePartySchema();
  const [row] = await db()`INSERT INTO friend_lists (clerk_user_id, name) VALUES (${userId}, ${name.slice(0, 80)}) RETURNING *` as unknown as Record<string, unknown>[];
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    name: String(row.name),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
    updatedAt: new Date(row.updated_at as string | Date).toISOString(),
    members: [],
  };
}

export async function updateFriendList(userId: string, listId: string, name: string): Promise<FriendList> {
  await ensurePartySchema();
  const [row] = await db()`UPDATE friend_lists SET name = ${name.slice(0, 80)}, updated_at = NOW() WHERE id = ${listId} AND clerk_user_id = ${userId} RETURNING *` as unknown as Record<string, unknown>[];
  if (!row) throw new Error("Friend list not found");
  const members = await db()`SELECT friend_id FROM friend_list_members WHERE list_id = ${listId}` as unknown as { friend_id: string }[];
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    name: String(row.name),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
    updatedAt: new Date(row.updated_at as string | Date).toISOString(),
    members: members.map((m) => m.friend_id),
  };
}

export async function deleteFriendList(userId: string, listId: string): Promise<void> {
  await ensurePartySchema();
  const [row] = await db()`DELETE FROM friend_lists WHERE id = ${listId} AND clerk_user_id = ${userId} RETURNING id` as unknown as { id: string }[];
  if (!row) throw new Error("Friend list not found");
}

export async function addFriendToList(listId: string, friendId: string): Promise<void> {
  await ensurePartySchema();
  const [list] = await db()`SELECT clerk_user_id FROM friend_lists WHERE id = ${listId} LIMIT 1` as unknown as { clerk_user_id: string }[];
  if (!list) throw new Error("Friend list not found");
  const [friend] = await db()`SELECT 1 FROM friend_connections WHERE ((requester_id = ${list.clerk_user_id} AND target_id = ${friendId}) OR (requester_id = ${friendId} AND target_id = ${list.clerk_user_id})) AND status = 'accepted' LIMIT 1` as unknown as Record<string, unknown>[];
  if (!friend) throw new Error("Not a friend");
  await db()`INSERT INTO friend_list_members (list_id, friend_id) VALUES (${listId}, ${friendId}) ON CONFLICT (list_id, friend_id) DO NOTHING`;
}

export async function removeFriendFromList(listId: string, friendId: string): Promise<void> {
  await ensurePartySchema();
  const [list] = await db()`SELECT clerk_user_id FROM friend_lists WHERE id = ${listId} LIMIT 1` as unknown as { clerk_user_id: string }[];
  if (!list) throw new Error("Friend list not found");
  await db()`DELETE FROM friend_list_members WHERE list_id = ${listId} AND friend_id = ${friendId}`;
}

export async function getCosmeticsCatalogue(): Promise<CosmeticsItem[]> {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM cosmetics_catalogue ORDER BY type, sort_order` as unknown as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id), type: String(r.type) as CosmeticsItemType, slug: String(r.slug),
    nameRu: String(r.name_ru), nameEn: String(r.name_en), value: String(r.value),
    imageUrl: String(r.image_url), sortOrder: Number(r.sort_order), active: Boolean(r.active),
    createdAt: new Date(r.created_at as string | Date).toISOString(),
  }));
}

export async function createCosmeticsItem(data: { type: string; slug: string; nameRu: string; nameEn: string; value: string; imageUrl?: string; sortOrder?: number }): Promise<CosmeticsItem> {
  await ensurePartySchema();
  const [row] = await db()`INSERT INTO cosmetics_catalogue (type, slug, name_ru, name_en, value, image_url, sort_order) VALUES (${data.type}, ${data.slug}, ${data.nameRu}, ${data.nameEn}, ${data.value}, ${data.imageUrl || ""}, ${data.sortOrder ?? 0}) RETURNING *` as unknown as Record<string, unknown>[];
  return {
    id: String(row.id), type: String(row.type) as CosmeticsItemType, slug: String(row.slug),
    nameRu: String(row.name_ru), nameEn: String(row.name_en), value: String(row.value),
    imageUrl: String(row.image_url), sortOrder: Number(row.sort_order), active: Boolean(row.active),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export async function updateCosmeticsItem(id: string, data: Partial<{ type: string; slug: string; nameRu: string; nameEn: string; value: string; imageUrl: string; sortOrder: number; active: boolean }>): Promise<CosmeticsItem> {
  await ensurePartySchema();
  const existing = (await db()`SELECT * FROM cosmetics_catalogue WHERE id = ${id}` as unknown as Record<string, unknown>[])[0];
  if (!existing) throw new Error("Cosmetics item not found");
  const [row] = await db()`UPDATE cosmetics_catalogue SET type = COALESCE(${data.type ?? String(existing.type)}::text, type), slug = COALESCE(${data.slug ?? String(existing.slug)}, slug), name_ru = COALESCE(${data.nameRu ?? String(existing.name_ru)}, name_ru), name_en = COALESCE(${data.nameEn ?? String(existing.name_en)}, name_en), value = COALESCE(${data.value ?? String(existing.value)}, value), image_url = COALESCE(${data.imageUrl ?? String(existing.image_url)}, image_url), sort_order = COALESCE(${data.sortOrder ?? Number(existing.sort_order)}::int, sort_order), active = COALESCE(${data.active ?? Boolean(existing.active)}::bool, active) WHERE id = ${id} RETURNING *` as unknown as Record<string, unknown>[];
  return {
    id: String(row.id), type: String(row.type) as CosmeticsItemType, slug: String(row.slug),
    nameRu: String(row.name_ru), nameEn: String(row.name_en), value: String(row.value),
    imageUrl: String(row.image_url), sortOrder: Number(row.sort_order), active: Boolean(row.active),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export async function deleteCosmeticsItem(id: string): Promise<void> {
  await ensurePartySchema();
  const [row] = await db()`DELETE FROM cosmetics_catalogue WHERE id = ${id} RETURNING id` as unknown as { id: string }[];
  if (!row) throw new Error("Cosmetics item not found");
}

export async function getCosmeticsByType(type: string): Promise<CosmeticsItem[]> {
  await ensurePartySchema();
  const catalogue = await getCosmeticsCatalogue();
  return catalogue.filter((item) => item.type === type && item.active);
}

export async function getGlobalLeaderboard(limit = 20) {
  await ensurePartySchema();
  const rows = await db()`SELECT up.clerk_user_id, up.display_name, up.image_url, up.xp,
    (SELECT COUNT(*)::int FROM game_scores gs WHERE gs.clerk_user_id = up.clerk_user_id) AS games_played
    FROM user_profiles up ORDER BY up.xp DESC LIMIT ${limit}` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    userId: String(row.clerk_user_id), displayName: String(row.display_name),
    imageUrl: String(row.image_url ?? ""), xp: asNumber(row.xp), gamesPlayed: asNumber(row.games_played),
  }));
}

function rowToHighlight(row: Record<string, unknown>): PartyHighlight {
  return { id: String(row.id), partyId: String(row.party_id), sessionId: row.session_id ? String(row.session_id) : null, userId: String(row.clerk_user_id), displayName: String(row.display_name ?? ""), type: (row.type as PartyHighlight["type"]), data: (row.data ?? {}) as Record<string, unknown>, thumbnail: String(row.thumbnail ?? ""), createdAt: new Date(row.created_at as string | Date).toISOString() };
}
export async function saveHighlight(input: { partyId: string; sessionId?: string; userId: string; displayName?: string; type: PartyHighlight["type"]; data?: Record<string, unknown>; thumbnail?: string }) {
  await ensurePartySchema();
  const [row] = await db()`INSERT INTO party_highlights (id, party_id, session_id, clerk_user_id, display_name, type, data, thumbnail) VALUES (${randomUUID()}, ${input.partyId}, ${input.sessionId ?? null}, ${input.userId}, ${input.displayName ?? ""}, ${input.type}, ${JSON.stringify(input.data ?? {})}::jsonb, ${input.thumbnail ?? ""}) RETURNING *` as unknown as Record<string, unknown>[];
  await db()`UPDATE parties SET highlight_count = highlight_count + 1 WHERE id = ${input.partyId}`;
  return row ? rowToHighlight(row) : null;
}
export async function getHighlights(partyId: string, limit = 20) {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM party_highlights WHERE party_id = ${partyId} ORDER BY created_at DESC LIMIT ${limit}` as unknown as Record<string, unknown>[];
  return rows.map(rowToHighlight);
}
export async function deleteHighlight(id: string, userId: string) {
  await ensurePartySchema();
  const [row] = await db()`DELETE FROM party_highlights WHERE id = ${id} AND clerk_user_id = ${userId} RETURNING party_id` as unknown as Record<string, unknown>[];
  if (row) await db()`UPDATE parties SET highlight_count = GREATEST(highlight_count - 1, 0) WHERE id = ${String(row.party_id)}`;
  return !!row;
}
export async function getOrCreateDailyChallenge(game: string) {
  await ensurePartySchema();
  const today = new Date().toISOString().split("T")[0];
  let [row] = await db()`SELECT * FROM daily_challenges WHERE game = ${game} AND date = ${today} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!row) {
    const config = { questionIds: dailyQuestionIds(today), timeLimit: 60 };
    [row] = await db()`INSERT INTO daily_challenges (id, game, date, config) VALUES (${randomUUID()}, ${game}, ${today}, ${JSON.stringify(config)}::jsonb) RETURNING *` as unknown as Record<string, unknown>[];
  }
  return row ? { id: String(row.id), game: String(row.game), date: String(row.date), config: row.config as Record<string, unknown>, active: row.active !== false } as DailyChallenge : null;
}
export async function submitDailyAnswers(challengeId: string, userId: string, answers: Array<{ questionId: string; answer: number }>) {
  await ensurePartySchema();
  const [challenge] = await db()`SELECT date, config FROM daily_challenges WHERE id = ${challengeId} AND active = TRUE LIMIT 1` as unknown as Record<string, unknown>[];
  if (!challenge) return null;
  const config = (challenge.config ?? {}) as Record<string, unknown>;
  const ids = Array.isArray(config.questionIds) ? config.questionIds.map(String) : dailyQuestionIds(String(challenge.date));
  const score = scoreDailyAnswers(ids, answers);
  const [row] = await db()`INSERT INTO daily_challenge_scores (id, challenge_id, clerk_user_id, score) VALUES (${randomUUID()}, ${challengeId}, ${userId}, ${score}) ON CONFLICT (challenge_id, clerk_user_id) DO UPDATE SET score = GREATEST(daily_challenge_scores.score, ${score}) RETURNING *` as unknown as Record<string, unknown>[];
  return row ? { id: String(row.id), challengeId: String(row.challenge_id), userId: String(row.clerk_user_id), score: asNumber(row.score), playedAt: new Date(row.played_at as string | Date).toISOString() } as DailyScore : null;
}
export async function getDailyLeaderboard(challengeId: string, limit = 20) {
  await ensurePartySchema();
  const rows = await db()`SELECT dcs.*, up.display_name, up.image_url FROM daily_challenge_scores dcs LEFT JOIN user_profiles up ON up.clerk_user_id = dcs.clerk_user_id WHERE dcs.challenge_id = ${challengeId} ORDER BY dcs.score DESC LIMIT ${limit}` as unknown as Record<string, unknown>[];
  return rows.map((r) => ({ id: String(r.id), challengeId: String(r.challenge_id), userId: String(r.clerk_user_id), displayName: String(r.display_name ?? r.clerk_user_id), imageUrl: String(r.image_url ?? ""), score: asNumber(r.score), playedAt: new Date(r.played_at as string | Date).toISOString() }));
}
export async function sendGratitudeTip(input: { partyId: string; fromUser: string; toUser: string; amount: number; message?: string }) {
  await ensurePartySchema();
  if (input.fromUser === input.toUser) throw new Error("Cannot send KOINS to yourself");
  await Promise.all([requirePartyMember(input.partyId, input.fromUser), requirePartyMember(input.partyId, input.toUser)]);
  const [row] = await db()`WITH debit AS (
      UPDATE user_profiles SET koins_balance = koins_balance - ${input.amount}
      WHERE clerk_user_id = ${input.fromUser} AND koins_balance >= ${input.amount}
        AND EXISTS (SELECT 1 FROM user_profiles target WHERE target.clerk_user_id = ${input.toUser})
      RETURNING clerk_user_id
    ), credit AS (
      UPDATE user_profiles SET koins_balance = koins_balance + ${input.amount}
      WHERE clerk_user_id = ${input.toUser} AND EXISTS (SELECT 1 FROM debit)
      RETURNING clerk_user_id
    )
    INSERT INTO gratitude_tips (id, party_id, from_user, to_user, amount, message)
    SELECT ${randomUUID()}, ${input.partyId}, ${input.fromUser}, ${input.toUser}, ${input.amount}, ${input.message ?? ""}
    WHERE EXISTS (SELECT 1 FROM debit) AND EXISTS (SELECT 1 FROM credit)
    RETURNING id` as unknown as Record<string, unknown>[];
  if (!row) throw new Error("Not enough KOINS");
  return true;
}
export async function getGratitudeTips(partyId: string, limit = 50) {
  await ensurePartySchema();
  const rows = await db()`SELECT gt.*, from_p.display_name AS from_name, to_p.display_name AS to_name FROM gratitude_tips gt LEFT JOIN user_profiles from_p ON from_p.clerk_user_id = gt.from_user LEFT JOIN user_profiles to_p ON to_p.clerk_user_id = gt.to_user WHERE gt.party_id = ${partyId} ORDER BY gt.created_at DESC LIMIT ${limit}` as unknown as Record<string, unknown>[];
  return rows.map((r) => ({ id: String(r.id), partyId: String(r.party_id), fromUser: String(r.from_user), fromName: String(r.from_name ?? ""), toUser: String(r.to_user), toName: String(r.to_name ?? ""), amount: asNumber(r.amount), message: String(r.message ?? ""), createdAt: new Date(r.created_at as string | Date).toISOString() }));
}
export async function getActivePartyPassSeason() {
  await ensurePartySchema();
  const [row] = await db()`SELECT * FROM party_pass_seasons WHERE active = TRUE AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE LIMIT 1` as unknown as Record<string, unknown>[];
  if (!row) return null;
  return { id: String(row.id), name: String(row.name), startDate: String(row.start_date), endDate: String(row.end_date), tiers: (row.tiers as PassTier[]) ?? [], active: row.active === true } as PartyPassSeason;
}
export async function getUserPassProgress(userId: string) {
  await ensurePartySchema();
  const [profile] = await db()`SELECT pass_xp, pass_tier, pass_season FROM user_profiles WHERE clerk_user_id = ${userId} LIMIT 1` as unknown as { pass_xp: number; pass_tier: number; pass_season: string }[];
  return profile ? { xp: asNumber(profile.pass_xp), tier: asNumber(profile.pass_tier), seasonId: String(profile.pass_season ?? "") } : { xp: 0, tier: 0, seasonId: "" };
}
export async function addPassXp(userId: string, amount: number) {
  await ensurePartySchema();
  const season = await getActivePartyPassSeason();
  if (!season) return { xp: 0, tier: 0 };
  const nextTier = season.tiers.find((t) => t.tier > 0);
  await db()`UPDATE user_profiles SET pass_xp = pass_xp + ${amount}, pass_season = ${season.id} WHERE clerk_user_id = ${userId}`;
  const tiers = season.tiers.sort((a, b) => a.tier - b.tier);
  for (const t of tiers) {
    await db()`UPDATE user_profiles SET pass_tier = GREATEST(pass_tier, ${t.tier}) WHERE clerk_user_id = ${userId} AND pass_xp >= ${t.xpRequired} AND pass_tier < ${t.tier}`;
  }
  return getUserPassProgress(userId);
}
export async function getSocialQuests() {
  await ensurePartySchema();
  const rows = await db()`SELECT * FROM social_quests WHERE active = TRUE ORDER BY reward_xp DESC` as unknown as Record<string, unknown>[];
  return rows.map((r) => ({ id: String(r.id), titleKey: String(r.title_key), descKey: String(r.desc_key), icon: String(r.icon ?? "emoji_events"), requirements: (r.requirements ?? {}) as Record<string, unknown>, rewardKoins: asNumber(r.reward_koins), rewardXp: asNumber(r.reward_xp), rewardCosmetic: String(r.reward_cosmetic ?? ""), active: r.active !== false } as SocialQuest));
}
export async function getQuestProgress(partyId: string, userId: string) {
  await ensurePartySchema();
  const rows = await db()`SELECT qp.*, sq.title_key, sq.desc_key, sq.icon, sq.reward_koins, sq.reward_xp, sq.reward_cosmetic FROM social_quest_progress qp JOIN social_quests sq ON sq.id = qp.quest_id WHERE qp.party_id = ${partyId} AND qp.clerk_user_id = ${userId} ORDER BY qp.created_at DESC` as unknown as Record<string, unknown>[];
  return rows.map((r) => ({ id: String(r.id), questId: String(r.quest_id), partyId: String(r.party_id), userId: String(r.clerk_user_id), titleKey: String(r.title_key), descKey: String(r.desc_key), icon: String(r.icon ?? "emoji_events"), progress: asNumber(r.progress), target: asNumber(r.target), rewardKoins: asNumber(r.reward_koins), rewardXp: asNumber(r.reward_xp), rewardCosmetic: String(r.reward_cosmetic ?? ""), claimed: r.claimed === true, completedAt: r.completed_at ? new Date(r.completed_at as string | Date).toISOString() : null }));
}
export async function trackQuestProgress(questId: string, partyId: string, userId: string, increment = 1) {
  await ensurePartySchema();
  const [row] = await db()`INSERT INTO social_quest_progress (id, quest_id, party_id, clerk_user_id, progress, target) VALUES (${randomUUID()}, ${questId}, ${partyId}, ${userId}, ${increment}, ${1}) ON CONFLICT (quest_id, party_id, clerk_user_id) DO UPDATE SET progress = social_quest_progress.progress + ${increment} RETURNING *` as unknown as Record<string, unknown>[];
  return row ? { id: String(row.id), questId: String(row.quest_id), partyId: String(row.party_id), userId: String(row.clerk_user_id), progress: asNumber(row.progress), target: asNumber(row.target), claimed: row.claimed === true, completedAt: row.completed_at ? new Date(row.completed_at as string | Date).toISOString() : null } as QuestProgress : null;
}
export async function claimQuestReward(questId: string, partyId: string, userId: string) {
  await ensurePartySchema();
  const [row] = await db()`SELECT * FROM social_quest_progress WHERE quest_id = ${questId} AND party_id = ${partyId} AND clerk_user_id = ${userId} AND claimed = FALSE AND progress >= target LIMIT 1` as unknown as Record<string, unknown>[];
  if (!row) return null;
  const quest = await db()`SELECT * FROM social_quests WHERE id = ${questId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!quest[0]) return null;
  await db()`UPDATE social_quest_progress SET claimed = TRUE, completed_at = NOW() WHERE id = ${String(row.id)}`;
  await db()`UPDATE user_profiles SET koins_balance = koins_balance + ${asNumber(quest[0].reward_koins)}, xp = xp + ${asNumber(quest[0].reward_xp)} WHERE clerk_user_id = ${userId}`;
  const rewardCosmetic = String(quest[0].reward_cosmetic ?? "");
  if (rewardCosmetic) {
    const profile = await getProfile(userId);
    if (profile) {
      const cosmetics = { ...profile.cosmetics, unlocked: [...profile.cosmetics.unlocked] };
      if (!cosmetics.unlocked.includes(rewardCosmetic as PromoBenefitType)) cosmetics.unlocked.push(rewardCosmetic as PromoBenefitType);
      await db()`UPDATE user_profiles SET cosmetics = ${JSON.stringify(cosmetics)}::jsonb WHERE clerk_user_id = ${userId}`;
    }
  }
  return { claimed: true, koins: asNumber(quest[0].reward_koins), xp: asNumber(quest[0].reward_xp) };
}
const THEME_COSTS: Record<string, number> = { lime: 0, pink: 50, blue: 50, dark: 100, cream: 100, red: 200 };

export async function updatePartyTheme(partyId: string, userId: string, theme: Record<string, string>, themeId?: string) {
  await ensurePartySchema();
  const [party] = await db()`SELECT owner_id, owned_themes FROM parties WHERE id = ${partyId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!party || String(party.owner_id) !== userId) throw new Error("Only owner can change theme");
  let owned = (() => { try { const raw = party.owned_themes; const arr = typeof raw === "string" ? JSON.parse(raw) : raw; return Array.isArray(arr) ? arr : ["lime"]; } catch { return ["lime"]; } })();
  if (themeId && themeId !== "lime" && !owned.includes(themeId)) {
    const cost = THEME_COSTS[themeId] ?? 50;
    const [profile] = await db()`SELECT koins_balance FROM user_profiles WHERE clerk_user_id = ${userId} LIMIT 1` as unknown as { koins_balance: number }[];
    const balance = profile ? Number(profile.koins_balance) : 0;
    if (balance < cost) throw new Error(`Need ${cost} KOINS to unlock this theme`);
    owned = [...owned, themeId];
    await db()`UPDATE parties SET theme = ${JSON.stringify(theme)}::jsonb, owned_themes = ${JSON.stringify(owned)}::jsonb WHERE id = ${partyId}`;
    await addKoinsTransaction(userId, partyId, -cost, `Theme unlock: ${themeId}`);
  } else {
    await db()`UPDATE parties SET theme = ${JSON.stringify(theme)}::jsonb WHERE id = ${partyId}`;
  }
  return { theme, ownedThemes: owned };
}
export async function scheduleParty(partyId: string, userId: string, scheduledAt: string) {
  await ensurePartySchema();
  const [party] = await db()`SELECT owner_id FROM parties WHERE id = ${partyId} LIMIT 1` as unknown as Record<string, unknown>[];
  if (!party || String(party.owner_id) !== userId) throw new Error("Only owner can schedule");
  await db()`UPDATE parties SET scheduled_at = ${new Date(scheduledAt).toISOString()}::timestamptz WHERE id = ${partyId}`;
  return { scheduledAt };
}

export async function getAdminProductStats() {
  await ensurePartySchema();
  const [row] = await db()`SELECT
    (SELECT COUNT(*)::int FROM user_profiles) AS users,
    (SELECT COUNT(*)::int FROM parties) AS parties,
    (SELECT COUNT(*)::int FROM party_members WHERE role = 'guest') AS joins,
    (SELECT COUNT(*)::int FROM promo_redemptions) AS redemptions` as unknown as Record<string, unknown>[];
  return { users: asNumber(row.users), parties: asNumber(row.parties), joins: asNumber(row.joins), redemptions: asNumber(row.redemptions) };
}

export async function getAdminUsers() {
  await ensurePartySchema();
  const rows = await db()`SELECT up.*,
    (SELECT COUNT(*)::int FROM party_members pm WHERE pm.clerk_user_id = up.clerk_user_id) AS party_count
    FROM user_profiles up ORDER BY up.updated_at DESC LIMIT 100` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.clerk_user_id),
    displayName: String(row.display_name),
    handle: String(row.handle),
    city: String(row.city),
    xp: asNumber(row.xp),
    partyCount: asNumber(row.party_count),
    updatedAt: new Date(row.updated_at as string | Date).toISOString(),
  }));
}

export async function getAdminParties() {
  await ensurePartySchema();
  const rows = await db()`SELECT p.*,
    (SELECT COUNT(*)::int FROM party_members pm WHERE pm.party_id = p.id) AS member_count,
    COALESCE(up.display_name, '—') AS owner_name
    FROM parties p LEFT JOIN user_profiles up ON up.clerk_user_id = p.owner_id
    ORDER BY p.created_at DESC LIMIT 100` as unknown as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    date: String(row.date),
    venue: String(row.venue),
    ownerName: String(row.owner_name),
    memberCount: asNumber(row.member_count),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  }));
}

export async function cleanupOldData(): Promise<{ deleted: { gameActions: number; gameSessions: number; chatMessages: number; analytics: number; koins: number } }> {
  await ensurePartySchema();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const gameActions = await db()`DELETE FROM game_actions WHERE created_at < ${cutoff}::timestamptz` as unknown as { count: number };
  const gameSessions = await db()`DELETE FROM game_sessions WHERE created_at < ${cutoff}::timestamptz` as unknown as { count: number };
  const chatMessages = await db()`DELETE FROM chat_messages WHERE created_at < ${cutoff}::timestamptz` as unknown as { count: number };
  const analytics = await db()`DELETE FROM analytics_events WHERE created_at < ${cutoff}::timestamptz` as unknown as { count: number };
  const koins = await db()`DELETE FROM koins_transactions WHERE created_at < ${cutoff}::timestamptz` as unknown as { count: number };
  return {
    deleted: {
      gameActions: asNumber(gameActions.count),
      gameSessions: asNumber(gameSessions.count),
      chatMessages: asNumber(chatMessages.count),
      analytics: asNumber(analytics.count),
      koins: asNumber(koins.count),
    },
  };
}
