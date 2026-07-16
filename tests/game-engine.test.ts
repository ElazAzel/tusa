import assert from "node:assert/strict";
import test from "node:test";
import { applyServerGameCommand, initialServerGameState } from "../lib/games/engine";
import { GAME_MANIFEST } from "../lib/games/manifest";
import { getDefinition, hasDefinition } from "../lib/games/sdk";

const players = ["host", "guest"];
const context = (actorId: string, now: number) => ({ actorId, creatorId: "host", participants: players, now });

test("every manifest game has a server-authoritative SDK definition", () => {
  assert.equal(GAME_MANIFEST.length, 32);
  assert.deepEqual(GAME_MANIFEST.filter((game) => !hasDefinition(game.id)).map((game) => game.id), []);
});

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
  assert.equal(hasDefinition("brainBurst"), true);
  const started = initialServerGameState("brainBurst", players, { locale: "ru" }, 5_000)!;
  assert.equal(started.deadline, 15_000);
  assert.equal(started.question, "Столица Казахстана?");
  const answer = applyServerGameCommand("brainBurst", started, "answer", { index: started.correct }, context("guest", 6_000))!;
  assert.equal((answer.state.scores as Record<string, number>).guest, 2);
  const late = applyServerGameCommand("brainBurst", started, "answer", { index: started.correct }, context("guest", 16_000))!;
  assert.match(late.error ?? "", /deadline/);
});

test("Same Word keeps submissions private and scores matching answers", () => {
  assert.equal(hasDefinition("blankSlate"), true);
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
  assert.equal(hasDefinition("wavelength"), true);
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
  assert.equal(hasDefinition("cardsChaos"), true);
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
  assert.equal(hasDefinition("charades"), true);
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

test("Forehead Guess hides scoring from the active player and rotates turns", () => {
  const started = initialServerGameState("headsup", players, { locale: "en" }, 1_000)!;
  assert.equal(started.activePlayer, "host");
  const activeScore = applyServerGameCommand("headsup", started, "correct", {}, context("host", 2_000))!;
  assert.match(activeScore.error ?? "", /active player/);
  const correct = applyServerGameCommand("headsup", started, "correct", {}, context("guest", 2_100))!;
  assert.equal(correct.state.score, 1);
  assert.equal(correct.state.roundScore, 1);
  const skip = applyServerGameCommand("headsup", correct.state, "skip", {}, context("guest", 2_200))!;
  assert.equal(skip.state.skipped, 1);
  const result = applyServerGameCommand("headsup", skip.state, "finalize", {}, context("host", 62_000))!;
  assert.equal(result.state.phase, "result");
  const next = applyServerGameCommand("headsup", result.state, "next", {}, context("host", 63_000))!;
  assert.equal(next.state.activePlayer, "guest");
  assert.equal(next.state.roundScore, 0);
});

test("Lost Location keeps spy identity private and resolves votes server-side", () => {
  const started = initialServerGameState("spyfall", players, { locale: "en" }, 1_001)!;
  assert.equal(started.spyId, "guest");
  const opened = applyServerGameCommand("spyfall", started, "openVote", {}, context("host", 2_000))!;
  assert.equal(opened.state.phase, "vote");
  const wrongGuess = applyServerGameCommand("spyfall", opened.state, "spyGuess", { location: "Beach" }, context("host", 2_100))!;
  assert.match(wrongGuess.error ?? "", /Only the spy/);
  const vote = applyServerGameCommand("spyfall", opened.state, "vote", { target: "guest" }, context("host", 2_200))!;
  const reveal = applyServerGameCommand("spyfall", vote.state, "reveal", {}, context("host", 2_300))!;
  assert.equal(reveal.state.outcome, "citizens");
  assert.equal((reveal.state.scores as Record<string, number>).host, 1);
});

test("Secret Grid keeps clue authority, card reveals and wins on the server", () => {
  const gridPlayers = ["host", "guest", "third", "fourth"];
  const ctx = (actorId: string) => ({ actorId, creatorId: "host", participants: gridPlayers, now: 2_000 });
  const started = initialServerGameState("codenames", gridPlayers, { locale: "en" }, 1_000)!;
  assert.equal(hasDefinition("codenames"), true);
  const firstLead = applyServerGameCommand("codenames", started, "setSpymaster", { tm: "a" }, ctx("host"))!;
  const secondLead = applyServerGameCommand("codenames", firstLead.state, "setSpymaster", { tm: "b" }, ctx("guest"))!;
  assert.equal(secondLead.state.phase, "clue");
  const blockedClue = applyServerGameCommand("codenames", secondLead.state, "giveClue", { wd: "fruit", nm: 2 }, ctx("third"))!;
  assert.match(blockedClue.error ?? "", /spymaster/);
  const clue = applyServerGameCommand("codenames", secondLead.state, "giveClue", { wd: "fruit", nm: 2 }, ctx("host"))!;
  assert.equal(clue.state.phase, "guess");
  const blockedPick = applyServerGameCommand("codenames", clue.state, "pickWord", { idx: 0 }, ctx("host"))!;
  assert.match(blockedPick.error ?? "", /Spymasters/);
  const picked = applyServerGameCommand("codenames", clue.state, "pickWord", { idx: 0 }, ctx("third"))!;
  assert.equal((picked.state.revealed as boolean[])[0], true);
});

test("Color Cards deals private hands and enforces player turns on the server", () => {
  const cardPlayers = ["host", "guest"];
  const ctx = (actorId: string) => ({ actorId, creatorId: "host", participants: cardPlayers, now: 2_000 });
  const started = initialServerGameState("uno", cardPlayers, {}, 1_000)!;
  assert.equal(hasDefinition("uno"), true);
  assert.equal((started.hands as Record<string, unknown[]>).host.length, 7);
  const blocked = applyServerGameCommand("uno", started, "draw", {}, ctx("guest"))!;
  assert.match(blocked.error ?? "", /turn/);
  const drawn = applyServerGameCommand("uno", started, "draw", {}, ctx("host"))!;
  assert.equal((drawn.state.hands as Record<string, unknown[]>).host.length, 8);
});

test("Secret Grid and Color Cards do not expose hidden state to another controller", () => {
  const grid = initialServerGameState("codenames", ["host", "guest", "third", "fourth"], { locale: "en" }, 1_000)!;
  const safeGrid = getDefinition("codenames")!.sanitizeForViewer!(grid, "guest");
  assert.equal((safeGrid.colors as string[]).every((color) => color === "neutral"), true);
  const cards = initialServerGameState("uno", ["host", "guest"], {}, 1_000)!;
  const safeCards = getDefinition("uno")!.sanitizeForViewer!(cards, "guest");
  assert.deepEqual(Object.keys(safeCards.hands as Record<string, unknown>), ["guest"]);
  assert.deepEqual(safeCards.drawPile, []);
});

test("Music quiz family keeps answers private and scores guesses on the server", () => {
  for (const game of ["guessSong", "musicQuiz"] as const) {
    assert.equal(hasDefinition(game), true);
    const started = initialServerGameState(game, players, { locale: "en" }, 1_000)!;
    assert.equal(started.phase, "clue");
    assert.equal(started.deadline, 7_000);
    const early = applyServerGameCommand(game, started, "openGuess", {}, context("host", 2_000))!;
    assert.match(early.error ?? "", /still playing/);
    const open = applyServerGameCommand(game, started, "openGuess", {}, context("host", 7_000))!;
    assert.equal(open.state.phase, "guess");
    const answer = String(open.state.answer);
    const guessed = applyServerGameCommand(game, open.state, "guess", { title: answer }, context("guest", 8_000))!;
    assert.equal(guessed.state.phase, "reveal");
    assert.equal((guessed.state.scores as Record<string, number>).guest, 3);
    const duplicate = applyServerGameCommand(game, guessed.state, "guess", { title: answer }, context("guest", 8_100))!;
    assert.equal(duplicate.changed, false);
    const safe = getDefinition(game)?.sanitizeForViewer?.(guessed.state, "host") as Record<string, unknown>;
    assert.equal("answer" in safe, false);
    assert.equal(safe.revealedTitle, answer);
  }
});

test("Party tools use a server-selected wheel and shared authoritative cup score", () => {
  const startedWheel = initialServerGameState("wheel", players, { locale: "en" }, 1_000)!;
  assert.equal(hasDefinition("wheel"), true);
  const added = applyServerGameCommand("wheel", startedWheel, "addOption", { text: "Dance" }, context("guest", 2_000))!;
  assert.equal((added.state.options as string[]).includes("Dance"), true);
  const spun = applyServerGameCommand("wheel", added.state, "spin", {}, context("host", 3_000))!;
  assert.equal(spun.state.phase, "result");
  assert.equal(spun.state.result, (spun.state.options as string[])[Number(spun.state.resultIndex)]);
  const blockedSpin = applyServerGameCommand("wheel", added.state, "spin", {}, context("guest", 3_000))!;
  assert.match(blockedSpin.error ?? "", /Only the stage/);

  const startedCup = initialServerGameState("beer", players, {}, 1_000)!;
  assert.equal(hasDefinition("beer"), true);
  const hit = applyServerGameCommand("beer", startedCup, "hit", { team: 0 }, context("guest", 2_000))!;
  assert.deepEqual(hit.state.scores, [9, 10]);
  const restore = applyServerGameCommand("beer", hit.state, "returnCup", { team: 0 }, context("host", 2_100))!;
  assert.deepEqual(restore.state.scores, [10, 10]);
});

test("Night Council keeps roles private and resolves votes on the server", () => {
  const councilPlayers = ["host", "guest", "third", "fourth", "fifth"];
  const ctx = (actorId: string, now = 2_000) => ({ actorId, creatorId: "host", participants: councilPlayers, now });
  for (const game of ["mafia", "werewolf"] as const) {
    const lobby = initialServerGameState(game, councilPlayers, {}, 1_000)!;
    assert.equal(hasDefinition(game), true);
    const started = applyServerGameCommand(game, lobby, "start", {}, ctx("host"))!;
    assert.equal(started.state.phase, "night");
    const safe = getDefinition(game)?.sanitizeForViewer?.(started.state, "guest") as Record<string, unknown>;
    assert.deepEqual(safe.roles, { guest: "doctor" });
    const mafiaAction = applyServerGameCommand(game, started.state, "nightAction", { target: "fifth" }, ctx("host"))!;
    const doctorAction = applyServerGameCommand(game, mafiaAction.state, "nightAction", { target: "guest" }, ctx("guest"))!;
    const night = applyServerGameCommand(game, doctorAction.state, "resolveNight", {}, ctx("host"))!;
    assert.equal(night.state.phase, "day");
    const vote = applyServerGameCommand(game, night.state, "openVote", {}, ctx("host"))!;
    let voted = vote.state;
    for (const actorId of voted.alive as string[]) voted = applyServerGameCommand(game, voted, "vote", { target: "host" }, ctx(actorId))!.state;
    const reveal = applyServerGameCommand(game, voted, "revealVote", {}, ctx("host"))!;
    assert.equal(reveal.state.eliminated, "host");
    assert.equal(reveal.state.phase, "reveal");
  }
});

test("Social tools keep rounds and responses in the server snapshot", () => {
  for (const game of ["truth", "never", "pairs"] as const) {
    assert.equal(hasDefinition(game), true);
    const started = initialServerGameState(game, players, { locale: "en" }, 1_000)!;
    const round = game === "truth" ? applyServerGameCommand(game, started, "choose", { mode: "dare" }, context("host", 2_000))! : { state: started };
    const response = game === "pairs" ? round : applyServerGameCommand(game, round.state, "respond", { value: true }, context("guest", 2_100))!;
    if (game !== "pairs") assert.equal((response.state.responses as Record<string, boolean>).guest, true);
    const next = applyServerGameCommand(game, response.state, "next", {}, context("host", 2_200))!;
    assert.equal(next.state.round, 1);
  }
});

test("Word Blast keeps timer and scoring on the server", () => {
  const lobby = initialServerGameState("alias", players, { locale: "en" }, 1_000)!;
  assert.equal(hasDefinition("alias"), true);
  const started = applyServerGameCommand("alias", lobby, "start", {}, context("host", 2_000))!;
  assert.equal(started.state.deadline, 62_000);
  const correct = applyServerGameCommand("alias", started.state, "correct", {}, context("host", 3_000))!;
  assert.equal(correct.state.score, 1);
  const blocked = applyServerGameCommand("alias", correct.state, "correct", {}, context("guest", 3_100))!;
  assert.match(blocked.error ?? "", /Only the stage/);
});

test("Bunker assigns private traits and resolves player voting on the server", () => {
  const party = ["host", "a", "b", "c", "d"];
  const ctx = (actorId: string, now = 1_000) => ({ actorId, creatorId: "host", participants: party, now });
  const lobby = initialServerGameState("bunker", party, {}, 1_000)!;
  const started = applyServerGameCommand("bunker", lobby, "start", {}, ctx("host", 2_000))!;
  assert.equal(started.state.phase, "argue");
  assert.equal(Object.keys(started.state.traits as Record<string,string>).length, 5);
  const vote = applyServerGameCommand("bunker", { ...started.state, phase:"vote" }, "vote", { target:"a" }, ctx("b"))!;
  assert.equal((vote.state.votes as Record<string,string>).b, "a");
  const resolved = applyServerGameCommand("bunker", vote.state, "resolve", {}, ctx("host"))!;
  assert.equal(resolved.state.phase, "result");
});

test("Pictionary protects drawing authority and scores a correct guess", () => {
  const party = ["host", "drawer", "guest"];
  const ctx = (actorId: string, now = 1_000) => ({ actorId, creatorId: "host", participants: party, now });
  const lobby = initialServerGameState("pictionary", party, {}, 1_000)!;
  const started = applyServerGameCommand("pictionary", lobby, "start", {}, ctx("host", 2_000))!;
  assert.equal(started.state.drawerId, "host");
  const blocked = applyServerGameCommand("pictionary", started.state, "stroke", { points:[{x:1,y:1,draw:false}] }, ctx("guest"))!;
  assert.match(blocked.error ?? "", /Only the drawer/);
  const guessed = applyServerGameCommand("pictionary", started.state, "guess", { text:started.state.word }, ctx("guest"))!;
  assert.equal(guessed.state.phase, "result");
  assert.equal((guessed.state.scores as Record<string,number>).guest, 3);
});

test("Draw Chain requires every player through prompt, drawing and guessing", () => {
  const party = ["host", "a", "b", "c"];
  const ctx = (actorId: string, now = 1_000) => ({ actorId, creatorId: "host", participants: party, now });
  let state = initialServerGameState("gartic", party, {}, 1_000)!;
  state = applyServerGameCommand("gartic", state, "start", {}, ctx("host", 2_000))!.state;
  for (const id of party) state = applyServerGameCommand("gartic", state, "prompt", { text:`prompt-${id}` }, ctx(id, 3_000))!.state;
  assert.equal(state.phase, "draw");
  for (const id of party) state = applyServerGameCommand("gartic", state, "drawingDone", {}, ctx(id, 4_000))!.state;
  assert.equal(state.phase, "guess");
  for (const id of party) state = applyServerGameCommand("gartic", state, "guess", { text:`guess-${id}` }, ctx(id, 5_000))!.state;
  assert.equal(state.phase, "reveal");
});

test("Impostor keeps the word private and resolves clues and votes on the server", () => {
  const started = initialServerGameState("impostor", players, { locale: "en" }, 1_001)!;
  assert.equal(started.impostorId, "guest");
  const clue = applyServerGameCommand("impostor", started, "clue", { clue: "round" }, context("host", 2_000))!;
  assert.equal((clue.state.clues as Record<string, string>).host, "round");
  const secondClue = applyServerGameCommand("impostor", clue.state, "clue", { clue: "space" }, context("guest", 2_050))!;
  const wrongGuess = applyServerGameCommand("impostor", secondClue.state, "guess", { word: "Pizza" }, context("host", 2_100))!;
  assert.match(wrongGuess.error ?? "", /Only the impostor/);
  const opened = applyServerGameCommand("impostor", secondClue.state, "openVote", {}, context("host", 2_200))!;
  assert.equal(opened.state.phase, "vote");
  const vote = applyServerGameCommand("impostor", opened.state, "vote", { target: "guest" }, context("host", 2_300))!;
  const reveal = applyServerGameCommand("impostor", vote.state, "reveal", {}, context("host", 2_400))!;
  assert.equal(reveal.state.outcome, "crew");
  assert.equal((reveal.state.scores as Record<string, number>).host, 1);
});
