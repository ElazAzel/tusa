import { z } from "zod";
import { defineGame } from "../definition";
import { LOST_LOCATION_ROUNDS } from "../lost-location-content";

type State = {
  engine: "server-v1";
  game: "spyfall";
  locale: "ru" | "en";
  phase: "qa" | "vote" | "reveal" | "finished";
  round: number;
  location: string;
  spyId: string;
  turnIndex: number;
  votes: Record<string, string>;
  spyGuess: string;
  accusedId: string;
  outcome: "" | "citizens" | "spy";
  scores: Record<string, number>;
  players: string[];
};

function locationFor(round: number, locale: "ru" | "en") {
  return LOST_LOCATION_ROUNDS[round % LOST_LOCATION_ROUNDS.length][locale];
}

function tallyVotes(votes: Record<string, string>) {
  return Object.values(votes).reduce<Record<string, number>>((tally, target) => ({ ...tally, [target]: (tally[target] ?? 0) + 1 }), {});
}

export default defineGame<State>({
  id: "spyfall",
  version: 1,
  createInitialState(participants, config, now = Date.now()) {
    const locale = config.locale === "en" ? "en" : "ru";
    return { engine: "server-v1", game: "spyfall", locale, phase: "qa", round: 0, location: locationFor(0, locale), spyId: participants[Math.abs(now) % Math.max(1, participants.length)] ?? "", turnIndex: 0, votes: {}, spyGuess: "", accusedId: "", outcome: "", scores: {}, players: participants };
  },
  commandSchemas: {
    openVote: z.object({}).strict(),
    spyGuess: z.object({ location: z.string().trim().min(1).max(120) }).strict(),
    vote: z.object({ target: z.string().min(1).max(128) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "openVote") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "qa") return { state, changed: false, error: "Only the stage can open voting." };
      return { changed: true, state: { ...state, phase: "vote", votes: {} } };
    }
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state, changed: false, error: "Voting is closed." };
      if (state.votes[ctx.actorId]) return { state, changed: false };
      const targetId = (payload as { target: string }).target;
      if (!ctx.participants.includes(targetId)) return { state, changed: false, error: "Choose a player in this session." };
      return { changed: true, state: { ...state, votes: { ...state.votes, [ctx.actorId]: targetId } } };
    }
    if (actionType === "spyGuess") {
      if (state.phase !== "qa" && state.phase !== "vote") return { state, changed: false, error: "The round is already revealed." };
      if (ctx.actorId !== state.spyId) return { state, changed: false, error: "Only the spy can guess the location." };
      const spyGuess = (payload as { location: string }).location.trim();
      const correct = spyGuess.toLocaleLowerCase(state.locale) === state.location.toLocaleLowerCase(state.locale);
      if (!correct) return { changed: true, state: { ...state, spyGuess } };
      return { changed: true, state: { ...state, phase: "reveal", spyGuess, outcome: "spy", scores: { ...state.scores, [state.spyId]: (state.scores[state.spyId] ?? 0) + 3 } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "vote") return { state, changed: false, error: "Only the stage can reveal voting." };
      if (!Object.keys(state.votes).length) return { state, changed: false, error: "No votes to reveal." };
      const accusedId = Object.entries(tallyVotes(state.votes)).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "";
      const citizensWin = accusedId === state.spyId;
      const scores = { ...state.scores };
      if (citizensWin) ctx.participants.filter((id) => id !== state.spyId).forEach((id) => { scores[id] = (scores[id] ?? 0) + 1; });
      else scores[state.spyId] = (scores[state.spyId] ?? 0) + 2;
      return { changed: true, state: { ...state, phase: "reveal", accusedId, outcome: citizensWin ? "citizens" : "spy", scores } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "reveal") return { state, changed: false, error: "Only the stage can start the next round." };
      const round = state.round + 1;
      if (round >= 5) return { changed: true, state: { ...state, phase: "finished" } };
      return { changed: true, state: { ...state, phase: "qa", round, location: locationFor(round, state.locale), spyId: ctx.participants[round % ctx.participants.length] ?? "", turnIndex: round % Math.max(1, ctx.participants.length), votes: {}, spyGuess: "", accusedId: "", outcome: "", players: ctx.participants } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(state) { return Math.max(0, ...Object.values(state.scores)); },
});
