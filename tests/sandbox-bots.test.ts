import assert from "node:assert/strict";
import test from "node:test";
import { applyServerGameCommand, initialServerGameState } from "../lib/games/engine";
import { GAME_MANIFEST } from "../lib/games/manifest";
import { commandTypesFor, parseGameCommand } from "../lib/games/commands";
import { botCandidatePayloads, isBotId, runBotAutopilot, sandboxBotIds } from "../lib/games/bots";

const HOST = "host";

function hostStep(game: string, state: Record<string, unknown>, participants: string[], now: number) {
  for (const actionType of commandTypesFor(game)) {
    for (const payload of [{}, ...botCandidatePayloads(HOST, state, participants)]) {
      const parsed = parseGameCommand(game, actionType, payload);
      if (!parsed.success) continue;
      const result = applyServerGameCommand(game, state, actionType, parsed.payload, { actorId: HOST, creatorId: HOST, participants, now });
      if (result && !result.error && result.changed) return result.state;
    }
  }
  return null;
}

test("sandbox bot ids are recognisable and never collide with account or guest ids", () => {
  assert.deepEqual(sandboxBotIds(2), ["bot_1", "bot_2"]);
  assert.equal(isBotId("bot_3"), true);
  assert.equal(isBotId("guest_bot_3"), false);
  assert.equal(isBotId("user_123"), false);
});

test("every game keeps moving in a solo sandbox run with bots", () => {
  const stuck: string[] = [];
  for (const game of GAME_MANIFEST) {
    const participants = [HOST, ...sandboxBotIds(Math.max(1, game.minPlayers - 1))];
    let now = 1_000_000;
    const created = initialServerGameState(game.id, participants, { locale: "ru" }, now);
    assert.ok(created, `${game.id} has an initial state`);
    let state = runBotAutopilot({ game: game.id, state: created, participants, creatorId: HOST, now }).state;
    let transitions = 0;
    for (let step = 0; step < 12; step += 1) {
      now += 120_000;
      const advanced = hostStep(game.id, state, participants, now);
      if (!advanced) break;
      transitions += 1;
      state = runBotAutopilot({ game: game.id, state: advanced, participants, creatorId: HOST, now }).state;
    }
    if (transitions === 0 && state.phase !== "finished") stuck.push(`${game.id}:${String(state.phase ?? "")}`);
  }
  assert.deepEqual(stuck, []);
});

test("bots answer and vote on their own in a judged card game", () => {
  const participants = [HOST, ...sandboxBotIds(2)];
  const created = initialServerGameState("cardsChaos", participants, { locale: "ru" }, 1_000)!;
  const played = runBotAutopilot({ game: "cardsChaos", state: created, participants, creatorId: HOST, now: 2_000 });
  assert.equal(played.changed, true);
  assert.ok(Object.keys(played.state.submissions as Record<string, string>).every(isBotId));
});
