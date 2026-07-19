import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const room = readFileSync(new URL("../app/party/[inviteCode]/PartyRoom.tsx", import.meta.url), "utf8");
const manifest = readFileSync(new URL("../lib/games/manifest.ts", import.meta.url), "utf8");
const ids = [...manifest.matchAll(/game\(\{ id: "([^"]+)"/g)].map((match) => match[1]);

test("all 32 canonical modes are routed by PartyRoom", () => {
  assert.equal(ids.length, 32);
  for (const id of ids) assert.match(room, new RegExp(`selectedGame === "${id}"`), `${id} is missing from the renderer`);
});

test("manifest distinguishes full games from quick tools", () => {
  assert.match(manifest, /category: "full_game"/);
  assert.match(manifest, /category: "quick_tool"/);
  assert.match(manifest, /releaseStatus: "beta"/);
});

test("core eight are pinned in certification priority order", () => {
  assert.match(manifest, /CORE_GAME_IDS = \["impostor", "alias", "trivia", "bombParty", "quiplash", "fibbage", "wouldRather", "twoTruths"\]/);
  assert.match(manifest, /certificationOwner: "games"/);
});
