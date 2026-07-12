import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manifest = readFileSync(new URL("../lib/games/manifest.ts", import.meta.url), "utf8");
const room = readFileSync(new URL("../app/party/[inviteCode]/PartyRoom.tsx", import.meta.url), "utf8");
const gamesApi = readFileSync(new URL("../app/api/games/route.ts", import.meta.url), "utf8");
const liveApi = readFileSync(new URL("../app/api/live/route.ts", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");

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
});

test("sitemap and AI discovery are manifest driven", () => {
  assert.match(sitemap, /GAME_MANIFEST/);
  assert.match(readFileSync(new URL("../app/llms.txt/route.ts", import.meta.url), "utf8"), /GAME_MANIFEST/);
});
