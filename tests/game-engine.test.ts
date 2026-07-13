import assert from "node:assert/strict";
import test from "node:test";
import { applyServerGameCommand, initialServerGameState } from "../lib/games/engine";

const players = ["host", "guest"];
const context = (actorId: string, now: number) => ({ actorId, creatorId: "host", participants: players, now });

test("server trivia scores an answer once and ignores a duplicate", () => {
  const started = initialServerGameState("trivia", players, { locale: "en" }, 1_000)!;
  const correct = Number(started.correct);
  const first = applyServerGameCommand("trivia", started, "answer", { index: correct }, context("guest", 2_000))!;
  assert.equal(first.changed, true);
  assert.equal((first.state.scores as Record<string, number>).guest, 2);
  const duplicate = applyServerGameCommand("trivia", first.state, "answer", { index: correct }, context("guest", 2_500))!;
  assert.equal(duplicate.changed, false);
  assert.equal((duplicate.state.scores as Record<string, number>).guest, 2);
});

test("server trivia enforces deadline and stage-only transitions", () => {
  const started = initialServerGameState("trivia", players, { locale: "ru" }, 10_000)!;
  const late = applyServerGameCommand("trivia", started, "answer", { index: started.correct }, context("guest", 26_000))!;
  assert.match(late.error ?? "", /deadline/);
  const earlyReveal = applyServerGameCommand("trivia", started, "reveal", {}, context("host", 12_000))!;
  assert.match(earlyReveal.error ?? "", /still active/);
  const guestReveal = applyServerGameCommand("trivia", started, "reveal", {}, context("guest", 26_000))!;
  assert.match(guestReveal.error ?? "", /Only the stage/);
  const reveal = applyServerGameCommand("trivia", started, "reveal", {}, context("host", 26_000))!;
  assert.equal(reveal.state.phase, "result");
  const next = applyServerGameCommand("trivia", reveal.state, "next", {}, context("host", 27_000))!;
  assert.equal(next.state.phase, "question");
  assert.equal(next.state.round, 1);
  assert.deepEqual(next.state.answered, {});
});

test("Quiz Battle reuses the engine with a faster deadline and bonus", () => {
  const started = initialServerGameState("quiz", players, { locale: "en" }, 5_000)!;
  assert.equal(started.game, "quiz");
  assert.equal(started.deadline, 17_000);
  const answer = applyServerGameCommand("quiz", started, "answer", { index: started.correct }, context("guest", 6_000))!;
  assert.equal((answer.state.scores as Record<string, number>).guest, 3);
});

test("Would You Rather keeps voting and round transitions on the server", () => {
  const started = initialServerGameState("wouldRather", players, { locale: "ru" }, 1_000)!;
  assert.equal(started.phase, "vote");
  assert.equal((started.prompt as { a: string }).a, "Уметь летать");

  const vote = applyServerGameCommand("wouldRather", started, "vote", { choice: "b" }, context("guest", 2_000))!;
  assert.equal(vote.changed, true);
  assert.equal((vote.state.votes as Record<string, string>).guest, "b");
  const duplicate = applyServerGameCommand("wouldRather", vote.state, "vote", { choice: "a" }, context("guest", 2_100))!;
  assert.equal(duplicate.changed, false);
  assert.equal((duplicate.state.votes as Record<string, string>).guest, "b");

  const forbidden = applyServerGameCommand("wouldRather", vote.state, "reveal", {}, context("guest", 2_200))!;
  assert.match(forbidden.error ?? "", /Only the stage/);
  const reveal = applyServerGameCommand("wouldRather", vote.state, "reveal", {}, context("host", 2_300))!;
  assert.equal(reveal.state.phase, "reveal");
  const next = applyServerGameCommand("wouldRather", reveal.state, "next", {}, context("host", 2_400))!;
  assert.equal(next.state.phase, "vote");
  assert.equal(next.state.round, 1);
  assert.deepEqual(next.state.votes, {});
});

test("Two Truths keeps the lie and votes authoritative", () => {
  const started = initialServerGameState("twoTruths", players, { locale: "en" }, 1_000)!;
  const vote = applyServerGameCommand("twoTruths", started, "vote", { index: 2 }, context("guest", 2_000))!;
  assert.equal((vote.state.votes as Record<string, number>).guest, 2);
  const duplicate = applyServerGameCommand("twoTruths", vote.state, "vote", { index: 1 }, context("guest", 2_100))!;
  assert.equal(duplicate.changed, false);
  const reveal = applyServerGameCommand("twoTruths", vote.state, "reveal", {}, context("host", 2_200))!;
  assert.equal(reveal.state.phase, "reveal");
  const next = applyServerGameCommand("twoTruths", reveal.state, "next", {}, context("host", 2_300))!;
  assert.equal(next.state.round, 1);
  assert.deepEqual(next.state.votes, {});
});

test("Pick Three accepts one complete assignment per player", () => {
  const started = initialServerGameState("kissMarry", players, { locale: "en" }, 1_000)!;
  const invalid = applyServerGameCommand("kissMarry", started, "vote", { assignment: [0, 0, 2] }, context("guest", 2_000))!;
  assert.match(invalid.error ?? "", /exactly once/);
  const vote = applyServerGameCommand("kissMarry", started, "vote", { assignment: [0, 2, 1] }, context("guest", 2_100))!;
  assert.deepEqual((vote.state.votes as Record<string, number[]>).guest, [0, 2, 1]);
  const duplicate = applyServerGameCommand("kissMarry", vote.state, "vote", { assignment: [2, 1, 0] }, context("guest", 2_200))!;
  assert.equal(duplicate.changed, false);
  const reveal = applyServerGameCommand("kissMarry", vote.state, "reveal", {}, context("host", 2_300))!;
  assert.equal(reveal.state.phase, "reveal");
});

test("Brain Burst uses a ten-second server timer and server scoring", () => {
  const started = initialServerGameState("brainBurst", players, { locale: "ru" }, 5_000)!;
  assert.equal(started.deadline, 15_000);
  assert.equal(started.question, "Столица Казахстана?");
  const answer = applyServerGameCommand("brainBurst", started, "answer", { index: started.correct }, context("guest", 6_000))!;
  assert.equal((answer.state.scores as Record<string, number>).guest, 2);
  const late = applyServerGameCommand("brainBurst", started, "answer", { index: started.correct }, context("guest", 16_000))!;
  assert.match(late.error ?? "", /deadline/);
});

test("Same Word keeps submissions private and scores matching answers", () => {
  const started = initialServerGameState("blankSlate", players, { locale: "en" }, 1_000)!;
  const host = applyServerGameCommand("blankSlate", started, "submit", { answer: " cheese " }, context("host", 2_000))!;
  const guest = applyServerGameCommand("blankSlate", host.state, "submit", { answer: "Cheese" }, context("guest", 2_100))!;
  const duplicate = applyServerGameCommand("blankSlate", guest.state, "submit", { answer: "bread" }, context("guest", 2_200))!;
  assert.equal(duplicate.changed, false);
  const reveal = applyServerGameCommand("blankSlate", guest.state, "reveal", {}, context("host", 2_300))!;
  assert.equal(reveal.state.roundMatches, 2);
  assert.equal(reveal.state.totalMatches, 2);
});

test("Word Bomb validates letters, uniqueness, deadlines, and elimination", () => {
  const started = initialServerGameState("bombParty", players, { locale: "en" }, 1_000)!;
  const wrong = applyServerGameCommand("bombParty", started, "submit", { word: "apple" }, context("guest", 2_000))!;
  assert.match(wrong.error ?? "", /start with C/);
  const valid = applyServerGameCommand("bombParty", started, "submit", { word: "Cloud" }, context("guest", 2_100))!;
  assert.equal((valid.state.submissions as Record<string, string>).guest, "Cloud");
  const duplicateWord = applyServerGameCommand("bombParty", valid.state, "submit", { word: "cloud" }, context("host", 2_200))!;
  assert.match(duplicateWord.error ?? "", /already used/);
  const finalized = applyServerGameCommand("bombParty", valid.state, "finalize", {}, context("host", 22_000))!;
  assert.deepEqual(finalized.state.eliminated, ["host"]);
});

test("Spectrum hides authority on the server and scores the team average", () => {
  const started = initialServerGameState("wavelength", players, { locale: "en" }, 1_003)!;
  assert.equal(started.target, 4);
  const clue = applyServerGameCommand("wavelength", started, "clue", { text: "A warm shower" }, context("host", 2_000))!;
  const hostGuess = applyServerGameCommand("wavelength", clue.state, "guess", { value: 4 }, context("host", 2_100))!;
  assert.match(hostGuess.error ?? "", /cannot guess/);
  const guess = applyServerGameCommand("wavelength", clue.state, "guess", { value: 4 }, context("guest", 2_200))!;
  const reveal = applyServerGameCommand("wavelength", guess.state, "reveal", {}, context("host", 2_300))!;
  assert.equal(reveal.state.roundScore, 4);
  assert.equal(reveal.state.teamScore, 4);
});

test("Punchline keeps answers server-owned and prevents self voting", () => {
  const started = initialServerGameState("quiplash", players, { locale: "en" }, 1_000)!;
  const first = applyServerGameCommand("quiplash", started, "answer", { text: "My cat drove" }, context("host", 2_000))!;
  const second = applyServerGameCommand("quiplash", first.state, "answer", { text: "Traffic was shy" }, context("guest", 2_100))!;
  const opened = applyServerGameCommand("quiplash", second.state, "openVote", {}, context("host", 2_200))!;
  const selfVote = applyServerGameCommand("quiplash", opened.state, "vote", { target: "guest" }, context("guest", 2_300))!;
  assert.match(selfVote.error ?? "", /another player/);
  const vote = applyServerGameCommand("quiplash", opened.state, "vote", { target: "host" }, context("guest", 2_400))!;
  const reveal = applyServerGameCommand("quiplash", vote.state, "reveal", {}, context("host", 2_500))!;
  assert.equal((reveal.state.scores as Record<string, number>).host, 100);
});

test("Fake Fact protects the truth and scores correct and deceptive votes", () => {
  const started = initialServerGameState("fibbage", players, { locale: "en" }, 1_000)!;
  const truthLeak = applyServerGameCommand("fibbage", started, "answer", { text: "11" }, context("guest", 2_000))!;
  assert.match(truthLeak.error ?? "", /real answer/);
  const first = applyServerGameCommand("fibbage", started, "answer", { text: "Nine" }, context("host", 2_100))!;
  const second = applyServerGameCommand("fibbage", first.state, "answer", { text: "Twelve" }, context("guest", 2_200))!;
  const opened = applyServerGameCommand("fibbage", second.state, "openVote", {}, context("host", 2_300))!;
  const truthVote = applyServerGameCommand("fibbage", opened.state, "vote", { target: opened.state.truthChoiceId }, context("guest", 2_400))!;
  const reveal = applyServerGameCommand("fibbage", truthVote.state, "reveal", {}, context("host", 2_500))!;
  assert.equal((reveal.state.scores as Record<string, number>).guest, 200);
});

test("Cards of Chaos enforces hands, judge authority, and round scoring", () => {
  const cardPlayers = ["host", "guest", "third"];
  const ctx = (actorId: string) => ({ actorId, creatorId: "host", participants: cardPlayers, now: 2_000 });
  const started = initialServerGameState("cardsChaos", cardPlayers, { locale: "en" }, 1_000)!;
  const hands = started.hands as Record<string, string[]>;
  const judgeSubmit = applyServerGameCommand("cardsChaos", started, "submit", { card: hands.host[0] }, ctx("host"))!;
  assert.match(judgeSubmit.error ?? "", /judge cannot/);
  const first = applyServerGameCommand("cardsChaos", started, "submit", { card: hands.guest[0] }, ctx("guest"))!;
  const second = applyServerGameCommand("cardsChaos", first.state, "submit", { card: hands.third[0] }, ctx("third"))!;
  assert.equal(second.state.phase, "judge");
  const judged = applyServerGameCommand("cardsChaos", second.state, "judge", { winner: "guest" }, ctx("host"))!;
  assert.equal((judged.state.scores as Record<string, number>).guest, 1);
});

test("Charades rotates active players and keeps turn scoring authoritative", () => {
  const started = initialServerGameState("charades", players, { locale: "ru" }, 1_000)!;
  const forbidden = applyServerGameCommand("charades", started, "correct", {}, context("guest", 2_000))!;
  assert.match(forbidden.error ?? "", /active player/);
  const correct = applyServerGameCommand("charades", started, "correct", {}, context("host", 2_100))!;
  assert.equal(correct.state.score, 1);
  const early = applyServerGameCommand("charades", correct.state, "finalize", {}, context("host", 10_000))!;
  assert.match(early.error ?? "", /still active/);
  const result = applyServerGameCommand("charades", correct.state, "finalize", {}, context("host", 62_000))!;
  const next = applyServerGameCommand("charades", result.state, "next", {}, context("host", 63_000))!;
  assert.equal(next.state.activePlayer, "guest");
});

test("Mime Riot keeps team turns and active player prompts server-side", () => {
  const mimePlayers = ["host", "guest", "third", "fourth"];
  const ctx = (actorId: string, now: number) => ({ actorId, creatorId: "host", participants: mimePlayers, now });
  const started = initialServerGameState("crocodil", mimePlayers, { locale: "en" }, 1_000)!;
  assert.equal(started.activeTeam, "A");
  assert.equal(started.activePlayer, "host");
  const blocked = applyServerGameCommand("crocodil", started, "correct", {}, ctx("guest", 2_000))!;
  assert.match(blocked.error ?? "", /active player/);
  const correct = applyServerGameCommand("crocodil", started, "correct", {}, ctx("host", 2_100))!;
  assert.equal((correct.state.scores as Record<string, number>).A, 1);
  const result = applyServerGameCommand("crocodil", correct.state, "finalize", {}, ctx("host", 62_000))!;
  assert.equal(result.state.phase, "result");
  const next = applyServerGameCommand("crocodil", result.state, "next", {}, ctx("host", 63_000))!;
  assert.equal(next.state.activeTeam, "B");
  assert.equal(next.state.activePlayer, "guest");
});
