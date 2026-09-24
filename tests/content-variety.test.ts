import assert from "node:assert/strict";
import test from "node:test";
import { applyServerGameCommand, initialServerGameState } from "../lib/games/engine";
import { deckIndex } from "../lib/games/content-deck";
import { sanitizeSdkState } from "../lib/games/sdk";
import { ALIAS_WORDS_EN } from "../lib/games/content/alias-en";
import { ALIAS_WORDS_RU } from "../lib/games/content/alias-ru";

const WORDS_PER_GAME = 150;
const GAMES_WITHOUT_REPEATS = 10;

test("alias ships a large, clean word bank in both languages", () => {
  for (const [locale, words] of [["ru", ALIAS_WORDS_RU], ["en", ALIAS_WORDS_EN]] as const) {
    assert.ok(words.length >= WORDS_PER_GAME * GAMES_WITHOUT_REPEATS, `${locale}: ${words.length} words`);
    assert.equal(new Set(words.map((word) => word.toLocaleLowerCase(locale))).size, words.length, `${locale} has duplicates`);
    for (const word of words) assert.ok(word.trim() === word && word.length > 0 && word.length <= 40, `${locale}: "${word}"`);
  }
});

test("a deck never repeats while the pool lasts and differs between parties", () => {
  const deck = { deckSeed: "party-a:alias", deckStart: 0 };
  const seen = new Set<number>();
  for (let position = 0; position < 1500; position += 1) seen.add(deckIndex(1500, deck, position));
  assert.equal(seen.size, 1500);
  const other = Array.from({ length: 20 }, (_, position) => deckIndex(1500, { deckSeed: "party-b:alias", deckStart: 0 }, position));
  const first = Array.from({ length: 20 }, (_, position) => deckIndex(1500, deck, position));
  assert.notDeepEqual(other, first);
});

test("ten alias games in one party show no repeated word", () => {
  const players = ["host", "guest"];
  const shown = new Set<string>();
  let consumed = 0;
  for (let game = 0; game < GAMES_WITHOUT_REPEATS; game += 1) {
    let state = initialServerGameState("alias", players, { locale: "ru", deckSeed: "party-secret:alias", deckStart: consumed }, 0)!;
    state = applyServerGameCommand("alias", state, "start", {}, { actorId: "host", creatorId: "host", participants: players, now: 1_000 })!.state;
    shown.add(String(state.word));
    for (let turn = 1; turn < WORDS_PER_GAME; turn += 1) {
      state = applyServerGameCommand("alias", state, turn % 3 ? "correct" : "skip", {}, { actorId: "host", creatorId: "host", participants: players, now: 2_000 })!.state;
      assert.ok(!shown.has(String(state.word)), `game ${game + 1}: "${state.word}" repeated`);
      shown.add(String(state.word));
    }
    consumed += Number(state.contentUsed);
  }
  assert.equal(shown.size, WORDS_PER_GAME * GAMES_WITHOUT_REPEATS);
});

test("deck position and seed never reach any viewer", () => {
  const state = initialServerGameState("alias", ["host", "guest"], { locale: "en", deckSeed: "secret", deckStart: 40 }, 0)!;
  for (const viewer of ["__stage__", "guest"]) {
    const visible = sanitizeSdkState("alias", structuredClone(state), viewer);
    assert.equal(visible.deckSeed, undefined);
    assert.equal(visible.deckStart, undefined);
  }
});
