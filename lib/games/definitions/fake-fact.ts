import { z } from "zod";
import { defineGame } from "../definition";
import { FAKE_FACT_QUESTIONS } from "../fake-fact-content";

type State = {
  engine: "server-v1";
  game: "fibbage";
  locale: "ru" | "en";
  phase: "answer" | "vote" | "reveal" | "finished";
  round: number;
  truth: string;
  submissions: Record<string, string>;
  choices: Array<{ id: string; text: string }>;
  choiceOwners: Record<string, string>;
  truthChoiceId: string;
  votes: Record<string, string>;
  scores: Record<string, number>;
  players: string[];
};

export default defineGame<State>({
  id: "fibbage",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    const q = FAKE_FACT_QUESTIONS[0][locale];
    return {
      engine: "server-v1",
      game: "fibbage",
      locale,
      phase: "answer",
      round: 0,
      truth: q.truth,
      submissions: {},
      choices: [],
      choiceOwners: {},
      truthChoiceId: "",
      votes: {},
      scores: {},
      players: participants,
    };
  },
  commandSchemas: {
    answer: z.object({ text: z.string().trim().min(1).max(100) }).strict(),
    openVote: z.object({}).strict(),
    vote: z.object({ target: z.string().min(1).max(128) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "answer") {
      if (state.phase !== "answer") return { state, changed: false, error: "Answers are closed." };
      if (state.submissions[ctx.actorId]) return { state, changed: false };
      const answer = (payload as { text: string }).text.trim();
      const normalized = answer.toLocaleLowerCase(state.locale);
      if (normalized === state.truth.toLocaleLowerCase(state.locale)) return { state, changed: false, error: "That is the real answer. Try a lie." };
      if (Object.values(state.submissions).some((value) => value.toLocaleLowerCase(state.locale) === normalized)) return { state, changed: false, error: "That answer is already in play." };
      return { changed: true, state: { ...state, submissions: { ...state.submissions, [ctx.actorId]: answer } } };
    }
    if (actionType === "openVote") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "answer") return { state, changed: false, error: "Only the stage can open voting." };
      if (Object.keys(state.submissions).length < 2) return { state, changed: false, error: "At least two lies are required." };
      const answers = Object.entries(state.submissions);
      const truthPosition = (state.round * 2 + 1) % (answers.length + 1);
      const source = [...answers.map(([owner, text]) => ({ owner, text }))];
      source.splice(truthPosition, 0, { owner: "truth", text: state.truth });
      const choices = source.map((item, index) => ({ id: `option-${state.round}-${index}`, text: item.text }));
      const choiceOwners = Object.fromEntries(choices.map((choice, index) => [choice.id, source[index].owner]));
      const truthChoiceId = choices.find((choice) => choiceOwners[choice.id] === "truth")!.id;
      return { changed: true, state: { ...state, phase: "vote", choices, choiceOwners, truthChoiceId } };
    }
    if (actionType === "vote") {
      if (state.phase !== "vote" || state.votes[ctx.actorId]) return { state, changed: false, error: state.phase !== "vote" ? "Voting is closed." : undefined };
      const targetId = (payload as { target: string }).target;
      const owner = state.choiceOwners[targetId];
      if (!owner || owner === ctx.actorId) return { state, changed: false, error: "Choose the truth or another player's lie." };
      return { changed: true, state: { ...state, votes: { ...state.votes, [ctx.actorId]: targetId } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "vote") return { state, changed: false, error: "Only the stage can reveal the truth." };
      if (!Object.keys(state.votes).length) return { state, changed: false, error: "No votes to reveal." };
      const scores = { ...state.scores };
      Object.entries(state.votes).forEach(([voter, target]) => {
        const owner = state.choiceOwners[target];
        if (target === state.truthChoiceId) scores[voter] = (scores[voter] ?? 0) + 200;
        else if (owner) scores[owner] = (scores[owner] ?? 0) + 100;
      });
      return { changed: true, state: { ...state, phase: "reveal", scores } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "reveal") return { state, changed: false, error: "Only the stage can advance after reveal." };
      const round = state.round + 1;
      if (round >= FAKE_FACT_QUESTIONS.length) return { changed: true, state: { ...state, phase: "finished" } };
      const q = FAKE_FACT_QUESTIONS[round][state.locale];
      return { changed: true, state: { ...state, phase: "answer", round, truth: q.truth, submissions: {}, choices: [], choiceOwners: {}, truthChoiceId: "", votes: {} } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(s) {
    return Math.max(0, ...Object.values(s.scores));
  },
});
