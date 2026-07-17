import assert from "node:assert/strict";
import test from "node:test";
import { initialServerGameState } from "../lib/games/engine";
import { GAME_MANIFEST } from "../lib/games/manifest";
import { parseGameCommand } from "../lib/games/commands";
import { getDefinition } from "../lib/games/sdk";

function players(count: number) {
  return Array.from({ length: Math.max(3, count) }, (_, index) => `player-${index + 1}`);
}

test("every catalogued mode starts as an isolated server-owned multiplayer snapshot", () => {
  for (const game of GAME_MANIFEST) {
    const participants = players(game.minPlayers);
    const first = initialServerGameState(game.id, participants, { locale: "en" }, 1_000);
    const second = initialServerGameState(game.id, participants, { locale: "en" }, 1_000);

    assert.ok(first, `${game.id} must create a server state`);
    assert.ok(second, `${game.id} must create a recoverable snapshot`);
    assert.notStrictEqual(first, second, `${game.id} must not share state between sessions`);
    assert.match(String(first.engine), /^server-v1|sdk-v1$/, `${game.id} must use a server game engine`);
  }
});

test("every catalogued mode rejects unknown or malformed multiplayer commands", () => {
  for (const game of GAME_MANIFEST) {
    const definition = getDefinition(game.id);
    assert.ok(definition, `${game.id} must expose an SDK definition`);
    assert.ok(Object.keys(definition.commandSchemas).length > 0, `${game.id} must expose at least one command`);

    const unsupported = parseGameCommand(game.id, "__unsupported__", {});
    assert.equal(unsupported.success, false, `${game.id} must reject unknown commands`);

    for (const actionType of Object.keys(definition.commandSchemas)) {
      const malformed = parseGameCommand(game.id, actionType, { unexpected: true });
      assert.equal(malformed.success, false, `${game.id}:${actionType} must reject unexpected client payload fields`);
    }
  }
});
