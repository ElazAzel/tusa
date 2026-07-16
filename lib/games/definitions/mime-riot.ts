import { z } from "zod";
import { defineGame } from "../definition";
import { MIME_RIOT_WORDS } from "../mime-riot-content";

type Team = "A" | "B";
type State = {
  engine: "server-v1";
  game: "crocodil";
  locale: "ru" | "en";
  phase: "play" | "result" | "finished";
  round: number;
  teams: Record<Team, string[]>;
  activeTeam: Team;
  activePlayer: string;
  deadline: number;
  wordIndex: number;
  word: string;
  scores: Record<Team, number>;
  roundScore: number;
  players: string[];
};

function teamsFor(players: string[]): Record<Team, string[]> {
  return { A: players.filter((_, index) => index % 2 === 0), B: players.filter((_, index) => index % 2 === 1) };
}

function activePlayerFor(players: string[], round: number) {
  const team = teamsFor(players)[round % 2 === 0 ? "A" : "B"];
  return team[Math.floor(round / 2) % Math.max(1, team.length)] ?? players[round % Math.max(1, players.length)] ?? "";
}

function wordFor(index: number, locale: "ru" | "en") {
  return MIME_RIOT_WORDS[locale][index % MIME_RIOT_WORDS[locale].length];
}

export default defineGame<State>({
  id: "crocodil",
  version: 1,
  createInitialState(participants, config, now = Date.now()) {
    const locale = config.locale === "en" ? "en" : "ru";
    return { engine: "server-v1", game: "crocodil", locale, phase: "play", round: 0, teams: teamsFor(participants), activeTeam: "A", activePlayer: activePlayerFor(participants, 0), deadline: now + 60_000, wordIndex: 0, word: wordFor(0, locale), scores: { A: 0, B: 0 }, roundScore: 0, players: participants };
  },
  commandSchemas: { correct: z.object({}).strict(), pass: z.object({}).strict(), finalize: z.object({}).strict(), next: z.object({}).strict() },
  reducer(state, actionType, _payload, ctx) {
    if (actionType === "correct" || actionType === "pass") {
      if (state.phase !== "play" || ctx.now > state.deadline) return { state, changed: false, error: "This turn is closed." };
      if (ctx.actorId !== state.activePlayer) return { state, changed: false, error: "Only the active player can control the turn." };
      const wordIndex = state.wordIndex + 1;
      const scored = actionType === "correct" ? 1 : 0;
      return { changed: true, state: { ...state, wordIndex, word: wordFor(wordIndex, state.locale), scores: { ...state.scores, [state.activeTeam]: state.scores[state.activeTeam] + scored }, roundScore: state.roundScore + scored } };
    }
    if (actionType === "finalize") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "play") return { state, changed: false, error: "Only the stage can close the turn." };
      if (ctx.now < state.deadline) return { state, changed: false, error: "The turn is still active." };
      return { changed: true, state: { ...state, phase: "result" } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "result") return { state, changed: false, error: "Only the stage can advance after results." };
      const round = state.round + 1;
      if (round >= 6) return { changed: true, state: { ...state, phase: "finished" } };
      const activeTeam: Team = round % 2 === 0 ? "A" : "B";
      const wordIndex = state.wordIndex + 1;
      return { changed: true, state: { ...state, phase: "play", round, activeTeam, activePlayer: activePlayerFor(ctx.participants, round), deadline: ctx.now + 60_000, wordIndex, word: wordFor(wordIndex, state.locale), roundScore: 0, teams: teamsFor(ctx.participants), players: ctx.participants } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(state) { return Math.max(state.scores.A, state.scores.B); },
});
