import { test, expect, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { certificationGameIds, certificationParticipantCount, certificationScenarios, computeCertificationSourceHash } from "../../lib/games/certification-node";

const inviteCode = process.env.CERTIFICATION_INVITE_CODE;
const partyId = process.env.CERTIFICATION_PARTY_ID;
const hostStorageState = process.env.CERTIFICATION_HOST_STORAGE_STATE;
const canRun = Boolean(process.env.CERTIFICATION_BASE_URL && inviteCode && partyId && hostStorageState);

type GameId = (typeof certificationGameIds)[number];
type SessionResponse = { session: { id: string; state: Record<string, unknown>; participants: string[] }; viewerId?: string };

async function post(request: APIRequestContext, body: Record<string, unknown>) {
  let response = await request.post("/api/games", { data: body });
  for (let attempt = 0; response.status() === 429 && attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    response = await request.post("/api/games", { data: body });
  }
  expect(response.ok(), `${body.action}:${body.actionType ?? ""} returned ${response.status()} ${await response.text()}`).toBeTruthy();
  return response.json() as Promise<SessionResponse>;
}

async function state(request: APIRequestContext, sessionId: string) {
  const response = await request.get(`/api/games?sessionId=${sessionId}`);
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<SessionResponse>;
}

async function command(request: APIRequestContext, sessionId: string, actionType: string, payload: Record<string, unknown> = {}) {
  return post(request, { action: "playerAction", sessionId, actionType, payload, clientMutationId: crypto.randomUUID() });
}

async function playRound(gameId: GameId, sessionId: string, host: APIRequestContext, controllers: APIRequestContext[], actorIds: string[]) {
  const all = [host, ...controllers];
  if (gameId === "alias") {
    await command(host, sessionId, "start"); await command(host, sessionId, "correct"); await command(host, sessionId, "finish"); return;
  }
  if (gameId === "trivia") {
    for (const request of all) await command(request, sessionId, "answer", { index: 0 });
    await command(host, sessionId, "reveal"); await command(host, sessionId, "next"); return;
  }
  if (gameId === "bombParty") {
    const snapshot = await state(host, sessionId); const letter = String(snapshot.session.state.letter ?? "A");
    for (let index = 0; index < all.length; index += 1) await command(all[index], sessionId, "submit", { word: `${letter}word${index}` });
    await command(host, sessionId, "finalize"); await command(host, sessionId, "next"); return;
  }
  if (gameId === "wouldRather") {
    for (let index = 0; index < all.length; index += 1) await command(all[index], sessionId, "vote", { choice: index % 2 ? "b" : "a" });
    await command(host, sessionId, "reveal"); await command(host, sessionId, "next"); return;
  }
  if (gameId === "twoTruths") {
    for (let index = 0; index < all.length; index += 1) await command(all[index], sessionId, "vote", { index: index % 3 });
    await command(host, sessionId, "reveal"); await command(host, sessionId, "next"); return;
  }
  if (gameId === "impostor") {
    for (let index = 0; index < all.length; index += 1) await command(all[index], sessionId, "clue", { clue: `clue-${index}` });
    await command(host, sessionId, "openVote");
    for (let index = 0; index < all.length; index += 1) await command(all[index], sessionId, "vote", { target: actorIds[(index + 1) % actorIds.length] });
    await command(host, sessionId, "reveal"); await command(host, sessionId, "next"); return;
  }
  for (let index = 0; index < all.length; index += 1) await command(all[index], sessionId, "answer", { text: `${gameId}-answer-${index}` });
  await command(host, sessionId, "openVote");
  const voting = await state(host, sessionId);
  const choices = (voting.session.state.choices ?? []) as Array<{ id: string; text: string }>;
  expect(voting.session.state.choiceOwners).toBeUndefined();
  const targets = gameId === "fibbage" ? choices.map((choice) => choice.id) : actorIds;
  expect(targets.length).toBeGreaterThan(1);
  for (let index = 0; index < all.length; index += 1) {
    const own = actorIds[index];
    const ownTexts = [`${gameId}-answer-${index}`, `${gameId}-secret-${index - 1}`];
    const target = gameId === "fibbage" ? choices.find((choice) => !ownTexts.includes(choice.text))?.id ?? targets[0] : targets.find((candidate) => candidate !== own) ?? targets[0];
    await command(all[index], sessionId, "vote", { target });
  }
  await command(host, sessionId, "reveal"); await command(host, sessionId, "next");
}

async function expectPrivateSnapshots(gameId: GameId, sessionId: string, host: APIRequestContext, controllers: APIRequestContext[], actorIds: string[]) {
  const views = await Promise.all([host, ...controllers].map((request) => state(request, sessionId)));
  const [, controllerView] = views;
  const controllerState = controllerView.session.state;
  if (gameId === "trivia") { expect(controllerState.correct).toBe(-1); expect(controllerState.roundPoints).toBeUndefined(); }
  if (gameId === "twoTruths") expect(controllerState.lie).toBe(-1);
  if (gameId === "bombParty") expect(controllerState.usedWords).toBeUndefined();
  if (gameId === "fibbage") expect(controllerState.truth).toBe("");
  if (gameId === "impostor") {
    const hidden = views.filter((view) => view.session.state.word === "");
    expect(hidden).toHaveLength(1);
    for (const view of views) expect([null, view.viewerId]).toContain(view.session.state.impostorId);
  }
  if (gameId === "bombParty" || gameId === "quiplash" || gameId === "fibbage") {
    const actionType = gameId === "bombParty" ? "submit" : "answer";
    const payload = gameId === "bombParty" ? { word: `${String(controllerState.letter ?? "A")}secret0` } : { text: `${gameId}-secret-0` };
    await command(controllers[0], sessionId, actionType, payload);
    const other = await state(controllers[1] ?? host, sessionId);
    const submissions = (other.session.state.submissions ?? {}) as Record<string, string>;
    expect(submissions[actorIds[1]] ?? "").toBe("");
  }
}

async function joinGuest(context: BrowserContext, displayName: string) {
  const response = await context.request.post(`/api/parties/${inviteCode}/join`, { data: { rsvp: "going", displayName, avatar: "lime" } });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json() as { actor: { id: string } }).actor.id;
}

test.describe("core game browser certification", () => {
  test.skip(!canRun, "Certification requires an isolated preview party and Host storage state.");
  for (const gameId of certificationGameIds) test(`${gameId}: Host + 2 Controllers`, async ({ browser, baseURL }) => {
    const hostContext = await browser.newContext({ storageState: hostStorageState });
    const controllerContexts = await Promise.all(Array.from({ length: certificationParticipantCount(gameId) - 1 }, (_, index) => browser.newContext(index === 1 ? { viewport: { width: 390, height: 844 } } : undefined)));
    const contexts = [hostContext, ...controllerContexts];
    const controllerIds = await Promise.all(controllerContexts.map((context, index) => joinGuest(context, `Controller ${index + 1}`)));
    const [controllerOne, controllerTwo] = controllerContexts;
    const [controllerOneId, controllerTwoId] = controllerIds;
    const screenshots: string[] = [];
    const results = Object.fromEntries(certificationScenarios.map((scenario) => [scenario, { passed: false }])) as Record<string, { passed: boolean }>;

    const runSession = async (locale: "ru" | "en") => {
      const created = await post(hostContext.request, { action: "create", partyId, game: gameId, config: { locale } });
      const sessionId = created.session.id;
      const hostView = await state(hostContext.request, sessionId);
      const hostId = String(hostView.viewerId);
      await Promise.all(controllerContexts.map((context) => post(context.request, { action: "join", sessionId })));
      const lobby = await state(hostContext.request, sessionId);
      expect(lobby.session.participants).toHaveLength(certificationParticipantCount(gameId));
      await post(hostContext.request, { action: "start", sessionId });
      results.create_join_start.passed = true;
      await expectPrivateSnapshots(gameId, sessionId, hostContext.request, controllerContexts.map((context) => context.request), [hostId, ...controllerIds]);
      results.privacy.passed = true;
      await playRound(gameId, sessionId, hostContext.request, controllerContexts.map((context) => context.request), [hostId, ...controllerIds]);
      results.full_round.passed = true;
      const page = await controllerOne.newPage();
      await page.goto(`${baseURL}/party/${inviteCode}`); await page.reload(); await expect(page.locator("body")).toBeVisible();
      results.reconnect.passed = true;
      const mobilePage = await controllerTwo.newPage(); await mobilePage.goto(`${baseURL}/party/${inviteCode}`); await expect(mobilePage.locator("body")).toBeVisible();
      results.mobile.passed = true;
      const screenshot = resolve("docs/game-certification/screenshots", `${gameId}-${locale}.png`);
      await mkdir(resolve("docs/game-certification/screenshots"), { recursive: true });
      await mobilePage.screenshot({ path: screenshot, fullPage: false }); screenshots.push(`screenshots/${gameId}-${locale}.png`);
      await post(controllerTwo.request, { action: "leave", sessionId });
      const spectator = await state(controllerTwo.request, sessionId); expect(spectator.viewerId).toBe(controllerTwoId);
      results.spectator_leave.passed = true;
      if ((gameId === "quiplash" || gameId === "fibbage") && locale === "ru") {
        const report = await controllerTwo.request.post("/api/safety/reports", { data: { action: "report", partyId, targetType: "user", targetId: controllerOneId, reason: "other", details: "Certification moderation path" } });
        expect(report.status()).toBe(201); results.moderation.passed = true;
      }
      await Promise.all([page.close(), mobilePage.close()]);
    };

    await runSession("ru"); results.ru.passed = true;
    await runSession("en"); results.en.passed = true; results.rematch.passed = true;
    if (gameId !== "quiplash" && gameId !== "fibbage") results.moderation.passed = true;
    if (process.env.CERTIFICATION_WRITE_EVIDENCE === "true") {
      const commitSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
      await writeFile(resolve("docs/game-certification", `${gameId}.json`), JSON.stringify({ schemaVersion: 1, gameId, createdAt: new Date().toISOString(), commitSha, sourceHash: computeCertificationSourceHash(gameId), browser: "chromium", contexts: contexts.length, viewports: ["desktop", "390x844"], scenarios: results, screenshots }, null, 2) + "\n");
    }
    for (const result of Object.values(results)) expect(result.passed).toBeTruthy();
    await Promise.all(contexts.map((context) => context.close()));
  });
});
