import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const room = readFileSync(new URL("../app/party/[inviteCode]/PartyRoom.tsx", import.meta.url), "utf8");
const documented = ["alias","mafia","werewolf","codenames","spyfall","impostor","crocodil","headsup","pictionary","quiplash","fibbage","cardsChaos","truth","never","wouldRather","twoTruths","blankSlate","wavelength","brainBurst","guessSong","bombParty","gartic","bunker","wheel","kissMarry","charades","musicQuiz","trivia"];

test("all 28 documented game modes are in the live catalogue and renderer", () => {
  for (const id of documented) {
    assert.match(room, new RegExp(`id: "${id}"`), `${id} is missing from the catalogue`);
    assert.match(room, new RegExp(`selectedGame === "${id}"`), `${id} is missing from the renderer`);
  }
});

test("catalogue keeps the four additional TUSA modes", () => {
  for (const id of ["beer", "quiz", "pairs", "uno"]) assert.match(room, new RegExp(`id: "${id}"`));
});
