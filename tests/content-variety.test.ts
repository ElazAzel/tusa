import assert from "node:assert/strict";
import test from "node:test";
import { applyServerGameCommand, initialServerGameState } from "../lib/games/engine";
import { contentFamily, deckIndex } from "../lib/games/content-deck";
import { commandTypesFor, parseGameCommand } from "../lib/games/commands";
import { botCandidatePayloads, runBotAutopilot, sandboxBotIds } from "../lib/games/bots";
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

type State = Record<string, unknown>;
const HOST = "host";

const CONTENT: Record<string, (state: State) => string[]> = {
  wouldRather: (s) => [String((s.prompt as { a: string }).a)],
  twoTruths: (s) => [(s.statements as string[]).join("|")],
  fibbage: (s) => [String(s.question)],
  quiplash: (s) => [String(s.prompt)],
  blankSlate: (s) => [String(s.prompt)],
  wavelength: (s) => [(s.pair as string[]).join("|")],
  kissMarry: (s) => [(s.names as string[]).join("|")],
  cardsChaos: (s) => [String(s.prompt)],
  trivia: (s) => [String(s.question)],
  brainBurst: (s) => [String(s.question)],
  quiz: (s) => [String(s.question)],
  guessSong: (s) => [String(s.answer)],
  impostor: (s) => [String(s.word)],
  spyfall: (s) => [String(s.location)],
  codenames: (s) => (s.board as string[]).map(String),
  bombParty: (s) => [String(s.letter)],
  never: (s) => [String(s.prompt)],
  pairs: (s) => [String(s.prompt)],
  truth: (s) => [String(s.prompt)],
  musicQuiz: (s) => [String(s.answer)],
  headsup: (s) => [String(s.word)],
  charades: (s) => [String(s.word)],
  crocodil: (s) => [String(s.word)],
  pictionary: (s) => [String(s.word)],
};

const SOCIAL_STEPS: Record<string, number> = { never: 16, truth: 10, pairs: 4 };

function hostStep(game: string, state: State, participants: string[], now: number) {
  for (const actionType of commandTypesFor(game).filter((type) => type !== "finish")) {
    for (const payload of [{}, { mode: "truth" }, ...botCandidatePayloads(HOST, state, participants)]) {
      const parsed = parseGameCommand(game, actionType, payload);
      if (!parsed.success) continue;
      const result = applyServerGameCommand(game, state, actionType, parsed.payload, { actorId: HOST, creatorId: HOST, participants, now });
      if (result && !result.error && result.changed) return result.state;
    }
  }
  return null;
}

function playSession(game: string, participants: string[], config: State, maxSteps: number) {
  let now = 1_000_000;
  const shown: string[] = [];
  const record = (state: State) => {
    const items = CONTENT[game](state).filter((item) => item && item !== "undefined");
    for (const item of items) if (shown[shown.length - 1] !== item && !shown.slice(-items.length).includes(item)) shown.push(item);
  };
  let state = runBotAutopilot({ game, state: initialServerGameState(game, participants, config, now)!, participants, creatorId: HOST, now }).state;
  record(state);
  for (let step = 0; step < maxSteps && state.phase !== "finished"; step += 1) {
    now += 120_000;
    const advanced = hostStep(game, state, participants, now);
    if (!advanced) break;
    state = runBotAutopilot({ game, state: advanced, participants, creatorId: HOST, now }).state;
    if (state.phase !== "finished") record(state);
  }
  return { shown, used: Number(state.contentUsed ?? 0) };
}

test("ten sessions of every content game in one party never repeat a card", () => {
  for (const game of Object.keys(CONTENT)) {
    const family = contentFamily(game);
    const participants = [HOST, ...sandboxBotIds(4)];
    const seen = new Map<string, number>();
    let consumed = 0;
    for (let session = 0; session < GAMES_WITHOUT_REPEATS; session += 1) {
      const { shown, used } = playSession(game, participants, { locale: "ru", deckSeed: `party:${family[0]}`, deckStart: consumed }, SOCIAL_STEPS[game] ?? 200);
      assert.ok(shown.length > 0, `${game}: no content recorded`);
      for (const item of shown) {
        assert.ok(!seen.has(item), `${game}: "${item}" from session ${seen.get(item)} repeated in session ${session + 1}`);
        seen.set(item, session + 1);
      }
      assert.ok(used > 0, `${game}: contentUsed is not reported`);
      consumed += used;
    }
  }
});

test("games that share a content bank continue one deck instead of restarting it", () => {
  assert.deepEqual([...contentFamily("quiz")], ["trivia", "quiz", "brainBurst"]);
  assert.deepEqual([...contentFamily("headsup")], ["alias", "headsup", "impostor"]);
  assert.deepEqual([...contentFamily("wouldRather")], ["wouldRather"]);
});
