import { z } from "zod";
import { defineGame } from "../definition";
import { CHAOS_CARDS, CHAOS_PROMPTS } from "../cards-chaos-content";
import { deckItem, deckOf, initialDeck, type DeckState } from "../content-deck";

export const CARDS_CHAOS_ROUNDS = 5;
const HAND_SIZE = 4;
const CARDS_PER_PROMPT = 12;

type State = {
  engine: "server-v1";
  game: "cardsChaos";
  locale: "ru" | "en";
  phase: "play" | "judge" | "result" | "finished";
  round: number;
  prompt: string;
  judgeId: string;
  hands: Record<string, string[]>;
  submissions: Record<string, string>;
  winner: string;
  scores: Record<string, number>;
  players: string[];
  cardsDealt: number;
} & DeckState;

type DeckSource = { deckSeed?: string; deckStart?: number; locale: "ru" | "en" };

function promptAt(source: DeckSource, round: number) {
  return deckItem(CHAOS_PROMPTS[source.locale], deckOf(source), round);
}

function cardAt(source: DeckSource, position: number) {
  const deck = deckOf(source);
  return deckItem(CHAOS_CARDS[source.locale], { deckSeed: `${deck.deckSeed}:cards`, deckStart: deck.deckStart * CARDS_PER_PROMPT }, position);
}

function refillHands(source: DeckSource, players: string[], previous: Record<string, string[]>, played: Record<string, string>, cardsDealt: number) {
  let dealt = cardsDealt;
  const hands: Record<string, string[]> = {};
  for (const id of players) {
    const hand = (previous[id] ?? []).filter((card) => card !== played[id]);
    while (hand.length < HAND_SIZE) {
      hand.push(cardAt(source, dealt));
      dealt += 1;
    }
    hands[id] = hand;
  }
  return { hands, cardsDealt: dealt };
}

export default defineGame<State>({
  id: "cardsChaos",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    const deck = initialDeck(config, "cardsChaos");
    const dealt = refillHands({ ...deck, locale }, participants, {}, {}, 0);
    return {
      ...deck,
      engine: "server-v1",
      game: "cardsChaos",
      locale,
      phase: "play",
      round: 0,
      prompt: promptAt({ ...deck, locale }, 0),
      judgeId: participants[0] ?? "",
      hands: dealt.hands,
      cardsDealt: dealt.cardsDealt,
      submissions: {},
      winner: "",
      scores: {},
      players: participants,
    };
  },
  commandSchemas: {
    submit: z.object({ card: z.string().min(1).max(120) }).strict(),
    judge: z.object({ winner: z.string().min(1).max(128) }).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "submit") {
      if (state.phase !== "play") return { state, changed: false, error: "Card submissions are closed." };
      if (ctx.actorId === state.judgeId) return { state, changed: false, error: "The judge cannot submit a card." };
      if (state.submissions[ctx.actorId]) return { state, changed: false };
      const card = (payload as { card: string }).card;
      if (!state.hands[ctx.actorId]?.includes(card)) return { state, changed: false, error: "That card is not in your hand." };
      const submissions = { ...state.submissions, [ctx.actorId]: card };
      const expected = ctx.participants.filter((id) => id !== state.judgeId);
      return { changed: true, state: { ...state, phase: expected.length > 0 && expected.every((id) => submissions[id]) ? "judge" : "play", submissions } };
    }
    if (actionType === "judge") {
      if (state.phase !== "judge" || ctx.actorId !== state.judgeId) return { state, changed: false, error: "Only the current judge can choose a winner." };
      const winner = (payload as { winner: string }).winner;
      if (!state.submissions[winner]) return { state, changed: false, error: "Choose a submitted card." };
      return { changed: true, state: { ...state, phase: "result", winner, scores: { ...state.scores, [winner]: (state.scores[winner] ?? 0) + 1 } } };
    }
    if (actionType === "next") {
      if (state.phase !== "result" || ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can advance after judging." };
      const round = state.round + 1;
      if (round >= CARDS_CHAOS_ROUNDS) return { changed: true, state: { ...state, phase: "finished" } };
      const players = ctx.participants;
      const dealt = refillHands(state, players, state.hands, state.submissions, state.cardsDealt ?? 0);
      return {
        changed: true,
        state: {
          ...state,
          phase: "play",
          round,
          prompt: promptAt(state, round),
          contentUsed: round + 1,
          judgeId: players[round % players.length] ?? "",
          hands: dealt.hands,
          cardsDealt: dealt.cardsDealt,
          submissions: {},
          winner: "",
          players,
        },
      };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(state) {
    return Math.max(0, ...Object.values(state.scores));
  },
});
