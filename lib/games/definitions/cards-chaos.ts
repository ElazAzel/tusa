import { z } from "zod";
import { defineGame } from "../definition";
import { CHAOS_CARDS, CHAOS_PROMPTS } from "../cards-chaos-content";

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
};

function dealHands(players: string[], locale: "ru" | "en", round: number) {
  const cards = CHAOS_CARDS[locale];
  return Object.fromEntries(players.map((id, player) => [id, Array.from({ length: 4 }, (_, slot) => cards[(round * 5 + player * 3 + slot) % cards.length])])) as Record<string, string[]>;
}

export default defineGame<State>({
  id: "cardsChaos",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: "cardsChaos",
      locale,
      phase: "play",
      round: 0,
      prompt: CHAOS_PROMPTS[locale][0],
      judgeId: participants[0] ?? "",
      hands: dealHands(participants, locale, 0),
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
      if (round >= CHAOS_PROMPTS[state.locale].length) return { changed: true, state: { ...state, phase: "finished" } };
      const players = ctx.participants;
      return {
        changed: true,
        state: {
          ...state,
          phase: "play",
          round,
          prompt: CHAOS_PROMPTS[state.locale][round],
          judgeId: players[round % players.length] ?? "",
          hands: dealHands(players, state.locale, round),
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
