import { DAILY_TRIVIA } from "./daily-trivia";
import { WOULD_RATHER_PROMPTS } from "./would-rather-content";
import { TWO_TRUTHS_ROUNDS } from "./two-truths-content";
import { PICK_THREE_SETS } from "./pick-three-content";
import { BRAIN_BURST_QUESTIONS } from "./brain-burst-content";
import { SAME_WORD_PROMPTS } from "./same-word-content";
import { WORD_BOMB_LETTERS } from "./word-bomb-content";
import { SPECTRUM_PAIRS } from "./spectrum-content";
import { PUNCHLINE_PROMPTS } from "./punchline-content";
import { FAKE_FACT_QUESTIONS } from "./fake-fact-content";
import { CHAOS_CARDS, CHAOS_PROMPTS } from "./cards-chaos-content";
import { CHARADES_WORDS } from "./charades-content";
import { FOREHEAD_GUESS_WORDS } from "./forehead-guess-content";
import { MIME_RIOT_WORDS } from "./mime-riot-content";

export type ServerGameContext = { actorId: string; creatorId: string; participants: string[]; now: number };
export type ServerGameResult = { state: Record<string, unknown>; changed: boolean; error?: string };

type TriviaState = {
  engine: "server-v1";
  locale: "ru" | "en";
  phase: "question" | "result" | "finished";
  round: number;
  question: string;
  options: string[];
  correct: number;
  deadline: number;
  scores: Record<string, number>;
  answered: Record<string, boolean>;
  game: "trivia" | "quiz" | "brainBurst";
};

const TRIVIA_ROUNDS = 5;

function triviaQuestion(round: number, locale: "ru" | "en") {
  const question = DAILY_TRIVIA[round % DAILY_TRIVIA.length];
  return { question: question.prompt[locale], options: question.options[locale], correct: question.correct };
}

function brainBurstQuestion(round: number, locale: "ru" | "en") {
  const question = BRAIN_BURST_QUESTIONS[round % BRAIN_BURST_QUESTIONS.length];
  return { question: question.prompt[locale], options: question.options[locale], correct: question.correct };
}

function dealChaosHands(players: string[], locale: "ru" | "en", round: number) {
  const cards = CHAOS_CARDS[locale];
  return Object.fromEntries(players.map((id, player) => [id, Array.from({ length: 4 }, (_, slot) => cards[(round * 5 + player * 3 + slot) % cards.length])]));
}

function mimeTeams(players: string[]) {
  return {
    A: players.filter((_, index) => index % 2 === 0),
    B: players.filter((_, index) => index % 2 === 1),
  };
}

function mimeActivePlayer(players: string[], round: number) {
  const activeTeam = round % 2 === 0 ? "A" : "B";
  const team = mimeTeams(players)[activeTeam];
  return team[Math.floor(round / 2) % Math.max(1, team.length)] ?? players[round % Math.max(1, players.length)] ?? "";
}

export function initialServerGameState(gameId: string, participants: string[], config: Record<string, unknown>, now = Date.now()): Record<string, unknown> | null {
  const locale = config.locale === "en" ? "en" : "ru";
  if (gameId === "wouldRather") return { engine: "server-v1", game: "wouldRather", locale, phase: "vote", round: 0, prompt: WOULD_RATHER_PROMPTS[0][locale], votes: {}, players: participants };
  if (gameId === "twoTruths") return { engine: "server-v1", game: "twoTruths", locale, phase: "vote", round: 0, statements: TWO_TRUTHS_ROUNDS[0][locale], lie: TWO_TRUTHS_ROUNDS[0].lie, votes: {}, players: participants };
  if (gameId === "kissMarry") return { engine: "server-v1", game: "kissMarry", locale, phase: "vote", round: 0, names: PICK_THREE_SETS[0], votes: {}, players: participants };
  if (gameId === "brainBurst") return { engine: "server-v1", game: "brainBurst", locale, phase: "question", round: 0, ...brainBurstQuestion(0, locale), deadline: now + 10_000, scores: {}, answered: {}, players: participants };
  if (gameId === "blankSlate") return { engine: "server-v1", game: "blankSlate", locale, phase: "write", round: 0, prompt: SAME_WORD_PROMPTS[locale][0], submissions: {}, roundMatches: 0, totalMatches: 0, players: participants };
  if (gameId === "bombParty") return { engine: "server-v1", game: "bombParty", locale, phase: "play", round: 0, letter: WORD_BOMB_LETTERS[locale][0], deadline: now + 20_000, submissions: {}, usedWords: [], eliminated: [], players: participants };
  if (gameId === "wavelength") return { engine: "server-v1", game: "wavelength", locale, phase: "clue", round: 0, pair: SPECTRUM_PAIRS[locale][0], target: (Math.abs(now) % 10) + 1, clue: "", guesses: {}, teamScore: 0, roundScore: 0, players: participants };
  if (gameId === "quiplash") return { engine: "server-v1", game: "quiplash", locale, phase: "answer", round: 0, prompt: PUNCHLINE_PROMPTS[locale][0], submissions: {}, votes: {}, scores: {}, players: participants };
  if (gameId === "fibbage") return { engine: "server-v1", game: "fibbage", locale, phase: "answer", round: 0, ...FAKE_FACT_QUESTIONS[0][locale], submissions: {}, choices: [], choiceOwners: {}, truthChoiceId: "", votes: {}, scores: {}, players: participants };
  if (gameId === "cardsChaos") return { engine: "server-v1", game: "cardsChaos", locale, phase: "play", round: 0, prompt: CHAOS_PROMPTS[locale][0], judgeId: participants[0] ?? "", hands: dealChaosHands(participants, locale, 0), submissions: {}, winner: "", scores: {}, players: participants };
  if (gameId === "charades") return { engine: "server-v1", game: "charades", locale, phase: "play", round: 0, activePlayer: participants[0] ?? "", deadline: now + 60_000, wordIndex: 0, word: CHARADES_WORDS[locale][0], score: 0, roundScore: 0, players: participants };
  if (gameId === "crocodil") return { engine: "server-v1", game: "crocodil", locale, phase: "play", round: 0, teams: mimeTeams(participants), activeTeam: "A", activePlayer: mimeActivePlayer(participants, 0), deadline: now + 60_000, wordIndex: 0, word: MIME_RIOT_WORDS[locale][0], scores: { A: 0, B: 0 }, roundScore: 0, players: participants };
  if (gameId === "headsup") return { engine: "server-v1", game: "headsup", locale, phase: "play", round: 0, activePlayer: participants[0] ?? "", deadline: now + 60_000, wordIndex: 0, word: FOREHEAD_GUESS_WORDS[locale][0], score: 0, roundScore: 0, skipped: 0, players: participants };
  if (gameId !== "trivia" && gameId !== "quiz") return null;
  const game = gameId;
  return { engine: "server-v1", game, locale, phase: "question", round: 0, ...triviaQuestion(0, locale), deadline: now + (game === "quiz" ? 12_000 : 15_000), scores: {}, answered: {}, players: participants } satisfies TriviaState & { players: string[] };
}

export function applyServerGameCommand(gameId: string, rawState: Record<string, unknown>, actionType: string, payload: unknown, context: ServerGameContext): ServerGameResult | null {
  if (gameId === "headsup" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "play" | "result" | "finished"; round: number; locale: "ru" | "en"; activePlayer: string; deadline: number; wordIndex: number; score: number; roundScore: number; skipped: number };
    if (actionType === "correct" || actionType === "skip") {
      if (state.phase !== "play" || context.now > state.deadline) return { state: rawState, changed: false, error: "This turn is closed." };
      if (context.actorId === state.activePlayer) return { state: rawState, changed: false, error: "The active player cannot see or score their own word." };
      if (!context.participants.includes(context.actorId)) return { state: rawState, changed: false, error: "Only session participants can score the turn." };
      const wordIndex = state.wordIndex + 1;
      const scored = actionType === "correct" ? 1 : 0;
      return {
        changed: true,
        state: {
          ...rawState,
          wordIndex,
          word: FOREHEAD_GUESS_WORDS[state.locale][wordIndex % FOREHEAD_GUESS_WORDS[state.locale].length],
          score: state.score + scored,
          roundScore: state.roundScore + scored,
          skipped: state.skipped + (actionType === "skip" ? 1 : 0),
          lastAction: actionType,
        },
      };
    }
    if (actionType === "finalize") {
      if (context.actorId !== context.creatorId || state.phase !== "play") return { state: rawState, changed: false, error: "Only the stage can close the turn." };
      if (context.now < state.deadline) return { state: rawState, changed: false, error: "The turn is still active." };
      return { changed: true, state: { ...rawState, phase: "result" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId || state.phase !== "result") return { state: rawState, changed: false, error: "Only the stage can advance after results." };
      const round = state.round + 1;
      if (round >= 5) return { changed: true, state: { ...rawState, phase: "finished" } };
      const wordIndex = state.wordIndex + 1;
      return { changed: true, state: { ...rawState, phase: "play", round, activePlayer: context.participants[round % context.participants.length] ?? "", deadline: context.now + 60_000, wordIndex, word: FOREHEAD_GUESS_WORDS[state.locale][wordIndex % FOREHEAD_GUESS_WORDS[state.locale].length], roundScore: 0, skipped: 0, lastAction: "", players: context.participants } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "crocodil" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "play" | "result" | "finished"; round: number; locale: "ru" | "en"; activeTeam: "A" | "B"; activePlayer: string; deadline: number; wordIndex: number; scores: Record<"A" | "B", number>; roundScore: number };
    if (actionType === "correct" || actionType === "pass") {
      if (state.phase !== "play" || context.now > state.deadline) return { state: rawState, changed: false, error: "This turn is closed." };
      if (context.actorId !== state.activePlayer) return { state: rawState, changed: false, error: "Only the active player can control the turn." };
      const wordIndex = state.wordIndex + 1;
      const scored = actionType === "correct" ? 1 : 0;
      return {
        changed: true,
        state: {
          ...rawState,
          wordIndex,
          word: MIME_RIOT_WORDS[state.locale][wordIndex % MIME_RIOT_WORDS[state.locale].length],
          scores: { ...state.scores, [state.activeTeam]: state.scores[state.activeTeam] + scored },
          roundScore: state.roundScore + scored,
        },
      };
    }
    if (actionType === "finalize") {
      if (context.actorId !== context.creatorId || state.phase !== "play") return { state: rawState, changed: false, error: "Only the stage can close the turn." };
      if (context.now < state.deadline) return { state: rawState, changed: false, error: "The turn is still active." };
      return { changed: true, state: { ...rawState, phase: "result" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId || state.phase !== "result") return { state: rawState, changed: false, error: "Only the stage can advance after results." };
      const round = state.round + 1;
      if (round >= 6) return { changed: true, state: { ...rawState, phase: "finished" } };
      const activeTeam = round % 2 === 0 ? "A" : "B";
      const wordIndex = state.wordIndex + 1;
      return { changed: true, state: { ...rawState, phase: "play", round, activeTeam, activePlayer: mimeActivePlayer(context.participants, round), deadline: context.now + 60_000, wordIndex, word: MIME_RIOT_WORDS[state.locale][wordIndex % MIME_RIOT_WORDS[state.locale].length], roundScore: 0, teams: mimeTeams(context.participants), players: context.participants } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "charades" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "play" | "result" | "finished"; round: number; locale: "ru" | "en"; activePlayer: string; deadline: number; wordIndex: number; score: number; roundScore: number };
    if (actionType === "correct" || actionType === "skip") {
      if (state.phase !== "play" || context.now > state.deadline) return { state: rawState, changed: false, error: "This turn is closed." };
      if (context.actorId !== state.activePlayer) return { state: rawState, changed: false, error: "Only the active player can control the turn." };
      const wordIndex = state.wordIndex + 1;
      const scored = actionType === "correct" ? 1 : 0;
      return { changed: true, state: { ...rawState, wordIndex, word: CHARADES_WORDS[state.locale][wordIndex % CHARADES_WORDS[state.locale].length], score: state.score + scored, roundScore: state.roundScore + scored } };
    }
    if (actionType === "finalize") {
      if (context.actorId !== context.creatorId || state.phase !== "play") return { state: rawState, changed: false, error: "Only the stage can close the turn." };
      if (context.now < state.deadline) return { state: rawState, changed: false, error: "The turn is still active." };
      return { changed: true, state: { ...rawState, phase: "result" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId || state.phase !== "result") return { state: rawState, changed: false, error: "Only the stage can advance after results." };
      const round = state.round + 1;
      if (round >= 5) return { changed: true, state: { ...rawState, phase: "finished" } };
      const wordIndex = state.wordIndex + 1;
      return { changed: true, state: { ...rawState, phase: "play", round, activePlayer: context.participants[round % context.participants.length], deadline: context.now + 60_000, wordIndex, word: CHARADES_WORDS[state.locale][wordIndex % CHARADES_WORDS[state.locale].length], roundScore: 0 } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "cardsChaos" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "play" | "judge" | "result" | "finished"; round: number; locale: "ru" | "en"; judgeId: string; hands: Record<string, string[]>; submissions: Record<string, string>; scores: Record<string, number> };
    if (actionType === "submit") {
      if (state.phase !== "play") return { state: rawState, changed: false, error: "Card submissions are closed." };
      if (context.actorId === state.judgeId) return { state: rawState, changed: false, error: "The judge cannot submit a card." };
      if (state.submissions[context.actorId]) return { state: rawState, changed: false };
      const card = (payload as { card: string }).card;
      if (!state.hands[context.actorId]?.includes(card)) return { state: rawState, changed: false, error: "That card is not in your hand." };
      const submissions = { ...state.submissions, [context.actorId]: card };
      const expected = context.participants.filter((id) => id !== state.judgeId);
      const phase = expected.length > 0 && expected.every((id) => submissions[id]) ? "judge" : "play";
      return { changed: true, state: { ...rawState, phase, submissions } };
    }
    if (actionType === "judge") {
      if (state.phase !== "judge" || context.actorId !== state.judgeId) return { state: rawState, changed: false, error: "Only the current judge can choose a winner." };
      const winner = (payload as { winner: string }).winner;
      if (!state.submissions[winner]) return { state: rawState, changed: false, error: "Choose a submitted card." };
      return { changed: true, state: { ...rawState, phase: "result", winner, scores: { ...state.scores, [winner]: (state.scores[winner] ?? 0) + 1 } } };
    }
    if (actionType === "next") {
      if (state.phase !== "result" || context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance after judging." };
      const round = state.round + 1;
      if (round >= CHAOS_PROMPTS[state.locale].length) return { changed: true, state: { ...rawState, phase: "finished" } };
      const judgeId = context.participants[round % context.participants.length];
      return { changed: true, state: { ...rawState, phase: "play", round, prompt: CHAOS_PROMPTS[state.locale][round], judgeId, hands: dealChaosHands(context.participants, state.locale, round), submissions: {}, winner: "" } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "fibbage" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "answer" | "vote" | "reveal" | "finished"; round: number; locale: "ru" | "en"; truth: string; submissions: Record<string, string>; choices: Array<{ id: string; text: string }>; choiceOwners: Record<string, string>; truthChoiceId: string; votes: Record<string, string>; scores: Record<string, number> };
    if (actionType === "answer") {
      if (state.phase !== "answer") return { state: rawState, changed: false, error: "Answers are closed." };
      if (state.submissions[context.actorId]) return { state: rawState, changed: false };
      const answer = (payload as { text: string }).text.trim();
      const normalized = answer.toLocaleLowerCase(state.locale);
      if (normalized === state.truth.toLocaleLowerCase(state.locale)) return { state: rawState, changed: false, error: "That is the real answer. Try a lie." };
      if (Object.values(state.submissions).some((value) => value.toLocaleLowerCase(state.locale) === normalized)) return { state: rawState, changed: false, error: "That answer is already in play." };
      return { changed: true, state: { ...rawState, submissions: { ...state.submissions, [context.actorId]: answer } } };
    }
    if (actionType === "openVote") {
      if (context.actorId !== context.creatorId || state.phase !== "answer") return { state: rawState, changed: false, error: "Only the stage can open voting." };
      if (Object.keys(state.submissions).length < 2) return { state: rawState, changed: false, error: "At least two lies are required." };
      const answers = Object.entries(state.submissions);
      const truthPosition = (state.round * 2 + 1) % (answers.length + 1);
      const source = [...answers.map(([owner, text]) => ({ owner, text }))];
      source.splice(truthPosition, 0, { owner: "truth", text: state.truth });
      const choices = source.map((item, index) => ({ id: `option-${state.round}-${index}`, text: item.text }));
      const choiceOwners = Object.fromEntries(choices.map((choice, index) => [choice.id, source[index].owner]));
      const truthChoiceId = choices.find((choice) => choiceOwners[choice.id] === "truth")!.id;
      return { changed: true, state: { ...rawState, phase: "vote", choices, choiceOwners, truthChoiceId } };
    }
    if (actionType === "vote") {
      if (state.phase !== "vote" || state.votes[context.actorId]) return { state: rawState, changed: false, error: state.phase !== "vote" ? "Voting is closed." : undefined };
      const targetId = (payload as { target: string }).target;
      const owner = state.choiceOwners[targetId];
      if (!owner || owner === context.actorId) return { state: rawState, changed: false, error: "Choose the truth or another player's lie." };
      return { changed: true, state: { ...rawState, votes: { ...state.votes, [context.actorId]: targetId } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId || state.phase !== "vote") return { state: rawState, changed: false, error: "Only the stage can reveal the truth." };
      if (!Object.keys(state.votes).length) return { state: rawState, changed: false, error: "No votes to reveal." };
      const scores = { ...state.scores };
      Object.entries(state.votes).forEach(([voter, target]) => { const owner = state.choiceOwners[target]; if (target === state.truthChoiceId) scores[voter] = (scores[voter] ?? 0) + 200; else if (owner) scores[owner] = (scores[owner] ?? 0) + 100; });
      return { changed: true, state: { ...rawState, phase: "reveal", scores } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId || state.phase !== "reveal") return { state: rawState, changed: false, error: "Only the stage can advance after reveal." };
      const round = state.round + 1;
      if (round >= FAKE_FACT_QUESTIONS.length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "answer", round, ...FAKE_FACT_QUESTIONS[round][state.locale], submissions: {}, choices: [], choiceOwners: {}, truthChoiceId: "", votes: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "quiplash" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "answer" | "vote" | "reveal" | "finished"; round: number; locale: "ru" | "en"; submissions: Record<string, string>; votes: Record<string, string>; scores: Record<string, number> };
    if (actionType === "answer") {
      if (state.phase !== "answer") return { state: rawState, changed: false, error: "Answers are closed." };
      if (state.submissions[context.actorId]) return { state: rawState, changed: false };
      return { changed: true, state: { ...rawState, submissions: { ...state.submissions, [context.actorId]: (payload as { text: string }).text.trim() } } };
    }
    if (actionType === "openVote") {
      if (context.actorId !== context.creatorId || state.phase !== "answer") return { state: rawState, changed: false, error: "Only the stage can open voting." };
      if (Object.keys(state.submissions).length < 2) return { state: rawState, changed: false, error: "At least two answers are required." };
      return { changed: true, state: { ...rawState, phase: "vote" } };
    }
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state: rawState, changed: false, error: "Voting is closed." };
      if (state.votes[context.actorId]) return { state: rawState, changed: false };
      const targetId = (payload as { target: string }).target;
      if (!state.submissions[targetId] || targetId === context.actorId) return { state: rawState, changed: false, error: "Choose another player's answer." };
      return { changed: true, state: { ...rawState, votes: { ...state.votes, [context.actorId]: targetId } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId || state.phase !== "vote") return { state: rawState, changed: false, error: "Only the stage can reveal votes." };
      if (!Object.keys(state.votes).length) return { state: rawState, changed: false, error: "No votes to reveal." };
      const scores = { ...state.scores };
      Object.values(state.votes).forEach((id) => { scores[id] = (scores[id] ?? 0) + 100; });
      return { changed: true, state: { ...rawState, phase: "reveal", scores } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId || state.phase !== "reveal") return { state: rawState, changed: false, error: "Only the stage can advance after reveal." };
      const round = state.round + 1;
      if (round >= PUNCHLINE_PROMPTS[state.locale].length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "answer", round, prompt: PUNCHLINE_PROMPTS[state.locale][round], submissions: {}, votes: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "wavelength" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "clue" | "guess" | "reveal" | "finished"; round: number; locale: "ru" | "en"; target: number; guesses: Record<string, number>; teamScore: number };
    if (actionType === "clue") {
      if (context.actorId !== context.creatorId || state.phase !== "clue") return { state: rawState, changed: false, error: "Only the stage can submit the clue." };
      const clue = (payload as { text: string }).text.trim();
      return { changed: true, state: { ...rawState, phase: "guess", clue } };
    }
    if (actionType === "guess") {
      if (state.phase !== "guess") return { state: rawState, changed: false, error: "Guessing is closed." };
      if (context.actorId === context.creatorId) return { state: rawState, changed: false, error: "The clue giver cannot guess." };
      if (state.guesses[context.actorId] !== undefined) return { state: rawState, changed: false };
      return { changed: true, state: { ...rawState, guesses: { ...state.guesses, [context.actorId]: (payload as { value: number }).value } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId || state.phase !== "guess") return { state: rawState, changed: false, error: "Only the stage can reveal the target." };
      const guesses = Object.values(state.guesses);
      if (!guesses.length) return { state: rawState, changed: false, error: "No guesses to reveal." };
      const average = guesses.reduce((sum, value) => sum + value, 0) / guesses.length;
      const distance = Math.abs(average - state.target);
      const roundScore = distance <= .5 ? 4 : distance <= 1.5 ? 3 : distance <= 2.5 ? 2 : distance <= 3.5 ? 1 : 0;
      return { changed: true, state: { ...rawState, phase: "reveal", average, roundScore, teamScore: state.teamScore + roundScore } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId || state.phase !== "reveal") return { state: rawState, changed: false, error: "Only the stage can advance after reveal." };
      const round = state.round + 1;
      if (round >= SPECTRUM_PAIRS[state.locale].length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "clue", round, pair: SPECTRUM_PAIRS[state.locale][round], target: ((state.target + round * 3) % 10) + 1, clue: "", guesses: {}, roundScore: 0, average: null } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "bombParty" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "play" | "result" | "finished"; round: number; locale: "ru" | "en"; letter: string; deadline: number; submissions: Record<string, string>; usedWords: string[]; eliminated: string[] };
    const alive = context.participants.filter((id) => !state.eliminated.includes(id));
    if (actionType === "submit") {
      if (state.phase !== "play" || context.now > state.deadline) return { state: rawState, changed: false, error: "This round is closed." };
      if (!alive.includes(context.actorId)) return { state: rawState, changed: false, error: "Eliminated players cannot submit." };
      if (state.submissions[context.actorId]) return { state: rawState, changed: false };
      const word = (payload as { word: string }).word.trim().replace(/\s+/g, " ");
      const normalized = word.toLocaleLowerCase(state.locale);
      if (word.length < 2 || !word.toLocaleUpperCase(state.locale).startsWith(state.letter)) return { state: rawState, changed: false, error: `The word must start with ${state.letter}.` };
      if (state.usedWords.includes(normalized) || Object.values(state.submissions).some((value) => value.toLocaleLowerCase(state.locale) === normalized)) return { state: rawState, changed: false, error: "That word was already used." };
      return { changed: true, state: { ...rawState, submissions: { ...state.submissions, [context.actorId]: word } } };
    }
    if (actionType === "finalize") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can close the round." };
      const everyoneAnswered = alive.length > 0 && alive.every((id) => state.submissions[id]);
      if (state.phase !== "play" || (context.now < state.deadline && !everyoneAnswered)) return { state: rawState, changed: false, error: "The round is still active." };
      const eliminated = [...new Set([...state.eliminated, ...alive.filter((id) => !state.submissions[id])])];
      const usedWords = [...state.usedWords, ...Object.values(state.submissions).map((word) => word.toLocaleLowerCase(state.locale))];
      return { changed: true, state: { ...rawState, phase: "result", eliminated, usedWords } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "result") return { state: rawState, changed: false, error: "Close the current round first." };
      const survivors = context.participants.filter((id) => !state.eliminated.includes(id));
      const round = state.round + 1;
      if (survivors.length <= 1 || round >= WORD_BOMB_LETTERS[state.locale].length) return { changed: true, state: { ...rawState, phase: "finished", winner: survivors[0] ?? null } };
      return { changed: true, state: { ...rawState, phase: "play", round, letter: WORD_BOMB_LETTERS[state.locale][round], deadline: context.now + 20_000, submissions: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "blankSlate" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "write" | "reveal" | "finished"; round: number; locale: "ru" | "en"; submissions: Record<string, string>; totalMatches: number };
    if (actionType === "submit") {
      if (state.phase !== "write") return { state: rawState, changed: false, error: "Submissions are closed." };
      if (state.submissions[context.actorId]) return { state: rawState, changed: false };
      const answer = (payload as { answer: string }).answer.trim().replace(/\s+/g, " ");
      return { changed: true, state: { ...rawState, submissions: { ...state.submissions, [context.actorId]: answer } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal answers." };
      if (state.phase !== "write" || Object.keys(state.submissions).length === 0) return { state: rawState, changed: false, error: "No answers to reveal." };
      const counts = Object.values(state.submissions).reduce<Record<string, number>>((all, answer) => { const key = answer.toLocaleLowerCase(state.locale); all[key] = (all[key] ?? 0) + 1; return all; }, {});
      const roundMatches = Object.values(counts).filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
      return { changed: true, state: { ...rawState, phase: "reveal", roundMatches, totalMatches: state.totalMatches + roundMatches } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state: rawState, changed: false, error: "Reveal answers first." };
      const round = state.round + 1;
      if (round >= SAME_WORD_PROMPTS[state.locale].length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "write", round, prompt: SAME_WORD_PROMPTS[state.locale][round], submissions: {}, roundMatches: 0 } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "kissMarry" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "vote" | "reveal" | "finished"; round: number; votes: Record<string, number[]> };
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state: rawState, changed: false, error: "Voting is closed." };
      if (state.votes[context.actorId]) return { state: rawState, changed: false };
      const assignment = (payload as { assignment: number[] }).assignment;
      if (assignment.length !== 3 || new Set(assignment).size !== 3) return { state: rawState, changed: false, error: "Assign each action exactly once." };
      return { changed: true, state: { ...rawState, votes: { ...state.votes, [context.actorId]: assignment } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal results." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state: rawState, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...rawState, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state: rawState, changed: false, error: "Reveal the results first." };
      const round = state.round + 1;
      if (round >= PICK_THREE_SETS.length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "vote", round, names: PICK_THREE_SETS[round], votes: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "twoTruths" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "vote" | "reveal" | "finished"; round: number; locale: "ru" | "en"; votes: Record<string, number> };
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state: rawState, changed: false, error: "Voting is closed." };
      if (state.votes[context.actorId] !== undefined) return { state: rawState, changed: false };
      const index = (payload as { index: number }).index;
      return { changed: true, state: { ...rawState, votes: { ...state.votes, [context.actorId]: index } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal the lie." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state: rawState, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...rawState, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state: rawState, changed: false, error: "Reveal the lie first." };
      const round = state.round + 1;
      if (round >= TWO_TRUTHS_ROUNDS.length) return { changed: true, state: { ...rawState, phase: "finished" } };
      const content = TWO_TRUTHS_ROUNDS[round];
      return { changed: true, state: { ...rawState, phase: "vote", round, statements: content[state.locale], lie: content.lie, votes: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "wouldRather" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "vote" | "reveal" | "finished"; round: number; locale: "ru" | "en"; votes: Record<string, "a" | "b"> };
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state: rawState, changed: false, error: "Voting is closed." };
      if (state.votes[context.actorId]) return { state: rawState, changed: false };
      const choice = (payload as { choice: "a" | "b" }).choice;
      return { changed: true, state: { ...rawState, votes: { ...state.votes, [context.actorId]: choice } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal votes." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state: rawState, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...rawState, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state: rawState, changed: false, error: "Reveal the vote first." };
      const round = state.round + 1;
      if (round >= WOULD_RATHER_PROMPTS.length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "vote", round, prompt: WOULD_RATHER_PROMPTS[round][state.locale], votes: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if ((gameId !== "trivia" && gameId !== "quiz" && gameId !== "brainBurst") || rawState.engine !== "server-v1") return null;
  const state = rawState as unknown as TriviaState;
  if (actionType === "answer") {
    if (state.phase !== "question") return { state: rawState, changed: false, error: "This round is not accepting answers." };
    if (context.now > state.deadline) return { state: rawState, changed: false, error: "The answer deadline has passed." };
    if (state.answered[context.actorId]) return { state: rawState, changed: false };
    const answer = Number((payload as { index?: unknown }).index);
    const secondsLeft = Math.max(0, Math.ceil((state.deadline - context.now) / 1000));
    const fastThreshold = state.game === "quiz" ? 6 : state.game === "brainBurst" ? 5 : 8;
    const points = answer === state.correct ? (secondsLeft > fastThreshold ? (state.game === "quiz" ? 3 : 2) : 1) : 0;
    return { changed: true, state: { ...state, answered: { ...state.answered, [context.actorId]: true }, scores: points ? { ...state.scores, [context.actorId]: (state.scores[context.actorId] ?? 0) + points } : state.scores } };
  }
  if (actionType === "reveal") {
    if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal an answer." };
    if (state.phase !== "question") return { state: rawState, changed: false };
    const everyoneAnswered = context.participants.length > 0 && context.participants.every((id) => state.answered[id]);
    if (context.now < state.deadline && !everyoneAnswered) return { state: rawState, changed: false, error: "The round is still active." };
    return { changed: true, state: { ...state, phase: "result" } };
  }
  if (actionType === "next") {
    if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
    if (state.phase !== "result") return { state: rawState, changed: false, error: "Reveal the current answer first." };
    const round = state.round + 1;
    const rounds = state.game === "brainBurst" ? BRAIN_BURST_QUESTIONS.length : TRIVIA_ROUNDS;
    if (round >= rounds) return { changed: true, state: { ...state, phase: "finished" } };
    const content = state.game === "brainBurst" ? brainBurstQuestion(round, state.locale) : triviaQuestion(round, state.locale);
    const duration = state.game === "brainBurst" ? 10_000 : state.game === "quiz" ? 12_000 : 15_000;
    return { changed: true, state: { ...state, phase: "question", round, ...content, deadline: context.now + duration, answered: {} } };
  }
  return { state: rawState, changed: false, error: "Unsupported server game command." };
}

export function isServerGameState(state: Record<string, unknown>) { return state.engine === "server-v1"; }
