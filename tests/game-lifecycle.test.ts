import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { initialServerGameState } from "../lib/games/engine";
import { GAME_MANIFEST } from "../lib/games/manifest";
import { sanitizeSdkState } from "../lib/games/sdk";

test("every game can be viewed in the lobby before its state exists", () => {
  for (const game of GAME_MANIFEST) {
    for (const viewer of ["__stage__", "guest_1"]) {
      assert.doesNotThrow(() => sanitizeSdkState(game.id, {}, viewer), `${game.id} lobby view for ${viewer}`);
    }
  }
});

test("every game sanitizes its initial state for the stage and each player", () => {
  const players = ["host", "guest_1", "guest_2", "guest_3", "guest_4"];
  for (const game of GAME_MANIFEST) {
    const state = initialServerGameState(game.id, players.slice(0, Math.max(game.minPlayers, 3)), { locale: "ru" }, 1_000);
    assert.ok(state, `${game.id} starts`);
    for (const viewer of ["__stage__", ...players]) {
      assert.doesNotThrow(() => sanitizeSdkState(game.id, structuredClone(state), viewer), `${game.id} view for ${viewer}`);
    }
  }
});

test("idempotent inserts target the partial unique indexes they rely on", () => {
  const source = readFileSync(new URL("../lib/parties.ts", import.meta.url), "utf8");
  const conflicts = [...source.matchAll(/ON CONFLICT \(([^)]*client_mutation_id[^)]*)\)([^\n]*)/g)];
  assert.ok(conflicts.length >= 3);
  for (const [, columns, rest] of conflicts) assert.match(rest, /WHERE client_mutation_id IS NOT NULL/, `ON CONFLICT (${columns}) must repeat the partial index predicate`);
});

test("night council deals roles independently of join order", async () => {
  const { applyServerGameCommand } = await import("../lib/games/engine");
  const players = ["host", "p1", "p2", "p3", "p4"];
  const mafiaHolders = new Set<string>();
  for (let now = 1_000; now < 1_040; now += 1) {
    const lobby = initialServerGameState("mafia", players, { locale: "ru" }, now)!;
    const started = applyServerGameCommand("mafia", lobby, "start", {}, { actorId: "host", creatorId: "host", participants: players, now })!;
    const roles = started.state.roles as Record<string, string>;
    assert.equal(Object.values(roles).filter((role) => role === "mafia").length, 1);
    mafiaHolders.add(Object.entries(roles).find(([, role]) => role === "mafia")![0]);
  }
  assert.ok(mafiaHolders.size >= 3, `mafia went to ${[...mafiaHolders].join(",")}`);
});

test("only the session creator gets the stage by default and nobody else inherits it", async () => {
  const { useGameRole } = await import("../app/components/useGameRole");
  assert.equal(useGameRole(["host", "guest"], "host", "active", null, "host"), "stage");
  assert.equal(useGameRole(["host", "guest"], "guest", "active", null, "host"), "controller");
  assert.equal(useGameRole(["host", "guest"], "guest", "active", "stage", "host"), "controller");
  assert.equal(useGameRole(["host", "guest"], "outsider", "active", null, "host"), "spectator");
  assert.equal(useGameRole([], "guest", "completed", null, undefined), "controller");
  assert.equal(useGameRole(["host"], "host", "lobby", "controller", "host"), "controller");
});
