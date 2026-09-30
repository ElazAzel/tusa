import assert from "node:assert/strict";
import test from "node:test";
import { initialServerGameState } from "../lib/games/engine";
import { GAME_MANIFEST } from "../lib/games/manifest";
import { commandTypesFor, parseGameCommand } from "../lib/games/commands";
import { botCandidatePayloads } from "../lib/games/bots";
import { isLocalSeatId, localPlayerNames, localSeatIds } from "../lib/games/bot-names";
import { applyLocalSeatCommand } from "../lib/games/local-play";
import { nextSeatAfterAction, turnOwner } from "../app/components/LocalPlay";

const HOST = "host-account";

function step(game: string, state: Record<string, unknown>, seats: string[], seat: string, now: number, allowFinish: boolean, seatOnly = false) {
  for (const actionType of commandTypesFor(game).filter((type) => allowFinish || type !== "finish")) {
    const payloads = [{}, { mode: "truth" }, { value: true }, { team: 0 }, { text: `ответ ${seat} ${now}` }, { answer: `слово${seat}${now}` }, ...botCandidatePayloads(seat, state, seats)];
    for (const payload of payloads) {
      const parsed = parseGameCommand(game, actionType, payload);
      if (!parsed.success) continue;
      const { result, actedAs } = applyLocalSeatCommand(game, state, actionType, parsed.payload, seat, { creatorId: HOST, participants: seats, now });
      if (seatOnly && actedAs === "host") continue;
      if (result && !result.error && result.changed) return { state: result.state, actedAs, actionType };
    }
  }
  return null;
}

test("local seats are recognisable and carry their names", () => {
  assert.deepEqual(localSeatIds(3), ["seat_1", "seat_2", "seat_3"]);
  assert.equal(isLocalSeatId("seat_12"), true);
  assert.equal(isLocalSeatId("bot_1"), false);
  assert.deepEqual(localPlayerNames({ localPlayers: { seat_1: "Дана", seat_2: 5, evil: "x" } }), { seat_1: "Дана" });
});

test("a seat that votes passes the phone to the next seat that has not voted", () => {
  const seats = ["seat_1", "seat_2", "seat_3"];
  assert.equal(nextSeatAfterAction(seats, "seat_1", { votes: {} }, { votes: { seat_1: "a" } }), "seat_2");
  assert.equal(nextSeatAfterAction(seats, "seat_2", { votes: { seat_1: "a" } }, { votes: { seat_1: "a", seat_2: "b" } }), "seat_3");
  assert.equal(nextSeatAfterAction(seats, "seat_3", { votes: { seat_1: "a", seat_2: "b" } }, { votes: { seat_1: "a", seat_2: "b", seat_3: "a" } }), "");
  assert.equal(nextSeatAfterAction(seats, "seat_1", { votes: {} }, { votes: { seat_1: "seat_2" }, alive: ["seat_1", "seat_3"] }), "seat_3");
  assert.equal(turnOwner({ phase: "judge", judgeId: "seat_2" }), "seat_2");
  assert.equal(turnOwner({ players: seats, currentIndex: 2 }), "seat_3");
  assert.equal(turnOwner({ game: "headsup", activePlayer: "seat_1" }), "");
});

test("every game can be played to the end on one phone", () => {
  const stuck: string[] = [];
  for (const game of GAME_MANIFEST) {
    const seats = localSeatIds(Math.max(game.minPlayers, 3));
    let now = 1_000_000;
    let state = initialServerGameState(game.id, seats, { locale: "ru" }, now)!;
    assert.ok(state, `${game.id}: initial state`);
    let seatIndex = 0;
    let transitions = 0;
    let seatMoves = 0;
    for (let turn = 0; turn < 400 && state.phase !== "finished" && !state.winner; turn += 1) {
      const owner = turnOwner(state);
      const order = owner && seats.includes(owner) ? [owner, ...seats.filter((id) => id !== owner)] : [...seats.slice(seatIndex), ...seats.slice(0, seatIndex)];
      let moved = null;
      for (const [jump, seatOnly] of [[2_000, true], [0, false], [61_000, false]] as const) {
        now += jump;
        for (const seat of order) {
          moved = step(game.id, state, seats, seat, now, turn > 300, seatOnly);
          if (moved) break;
        }
        if (moved) break;
      }
      if (!moved) break;
      state = moved.state;
      transitions += 1;
      if (moved.actedAs === "seat") seatMoves += 1;
      seatIndex = (seatIndex + 1) % seats.length;
    }
    const decided = () => state.phase === "finished" || Boolean(state.winner);
    if (!decided() && commandTypesFor(game.id).includes("finish")) {
      const { result } = applyLocalSeatCommand(game.id, state, "finish", {}, seats[0], { creatorId: HOST, participants: seats, now: now + 1 });
      if (result && !result.error) state = result.state;
    }
    const longGame = game.id === "uno" && transitions >= 200;
    if ((!decided() && !longGame) || transitions < 2) stuck.push(`${game.id}:${String(state.phase)}:${transitions}`);
    if (!["beer", "wheel", "uno"].includes(game.id)) assert.ok(seatMoves > 0 || ["codenames", "wavelength", "alias", "spyfall"].includes(game.id), `${game.id}: no player moves were made by local seats`);
  }
  assert.deepEqual(stuck, []);
});
