import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = (process.env.VENUE_BASE_URL ?? "").replace(/\/$/, "");
const inviteCode = process.env.VENUE_INVITE_CODE ?? "";
const clients = Number(process.env.VENUE_CLIENTS ?? 30);
const durationSeconds = Number(process.env.VENUE_DURATION_SECONDS ?? 1200);
const sessionId = process.env.VENUE_SESSION_ID ?? "";
const confirmed = process.env.VENUE_LOAD_CONFIRM === "I_UNDERSTAND";
if (!baseUrl || !inviteCode) throw new Error("Set VENUE_BASE_URL and VENUE_INVITE_CODE.");
if (!confirmed) throw new Error("Set VENUE_LOAD_CONFIRM=I_UNDERSTAND. This harness creates real guest sessions and traffic.");
if (/tusagame\.vercel\.app|tusa\.game/i.test(baseUrl) && process.env.VENUE_ALLOW_PRODUCTION !== "true") throw new Error("Production load requires VENUE_ALLOW_PRODUCTION=true.");
if (!Number.isInteger(clients) || clients < 2 || clients > 50) throw new Error("VENUE_CLIENTS must be between 2 and 50.");

const latencies = { join: [], action: [], reconnect: [] };
let requests = 0;
let errors = 0;
const percentile = (items, ratio) => items.length ? [...items].sort((a, b) => a - b)[Math.min(items.length - 1, Math.ceil(items.length * ratio) - 1)] : null;

async function timed(bucket, work) {
  const startedAt = performance.now(); requests += 1;
  try {
    const result = await work();
    if (!result.ok) { errors += 1; throw new Error(`HTTP ${result.status}: ${await result.text()}`); }
    bucket.push(Math.round(performance.now() - startedAt));
    return result;
  } catch (error) { errors += 1; throw error; }
}

async function join(index) {
  const response = await timed(latencies.join, () => fetch(`${baseUrl}/api/parties/${inviteCode}/join`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rsvp: "going", displayName: `Load Client ${String(index + 1).padStart(2, "0")}`, avatar: ["lime", "pink", "blue", "cream"][index % 4] }),
  }));
  const cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  if (!cookie) throw new Error("Guest cookie was not returned.");
  return { cookie, actor: (await response.json()).actor };
}

async function connectSse(client, signal) {
  const startedAt = performance.now(); requests += 1;
  const response = await fetch(`${baseUrl}/api/live?channel=party:${process.env.VENUE_PARTY_ID ?? "unknown"}`, { headers: { Cookie: client.cookie, Accept: "text/event-stream" }, signal });
  if (!response.ok || !response.body) { errors += 1; throw new Error(`SSE HTTP ${response.status}`); }
  latencies.reconnect.push(Math.round(performance.now() - startedAt));
  const reader = response.body.getReader();
  while (!signal.aborted) { const { done } = await reader.read(); if (done) break; }
}

async function sendAction(client, index) {
  if (!sessionId) return;
  await timed(latencies.action, () => fetch(`${baseUrl}/api/games`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: client.cookie },
    body: JSON.stringify({ action: "playerAction", sessionId, actionType: "vote", payload: { choice: index % 2 ? "b" : "a" }, clientMutationId: crypto.randomUUID() }),
  }));
}

const joined = await Promise.all(Array.from({ length: clients }, (_, index) => join(index)));
const aborters = joined.map(() => new AbortController());
const streams = joined.map((client, index) => connectSse(client, aborters[index].signal).catch(() => undefined));
const deadline = Date.now() + durationSeconds * 1000;
while (Date.now() < deadline) {
  await Promise.all(joined.map((client, index) => sendAction(client, index).catch(() => undefined)));
  await new Promise((resolve) => setTimeout(resolve, 5_000));
}
aborters.forEach((controller) => controller.abort());
await Promise.all(streams);

const report = {
  createdAt: new Date().toISOString(), baseUrl, clients, durationSeconds, requests, errors,
  errorRate: requests ? errors / requests : 0,
  p95: { joinMs: percentile(latencies.join, .95), actionMs: percentile(latencies.action, .95), reconnectMs: percentile(latencies.reconnect, .95) },
  thresholds: { errorRate: .005, joinP95Ms: 1500, actionP95Ms: 750, reconnectP95Ms: 5000 },
};
report.passed = report.errorRate < report.thresholds.errorRate && report.p95.joinMs <= report.thresholds.joinP95Ms && (!sessionId || report.p95.actionMs <= report.thresholds.actionP95Ms) && report.p95.reconnectMs <= report.thresholds.reconnectP95Ms;
await mkdir("docs/evidence", { recursive: true });
await writeFile(`docs/evidence/venue-load-${Date.now()}.json`, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
