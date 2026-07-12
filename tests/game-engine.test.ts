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
