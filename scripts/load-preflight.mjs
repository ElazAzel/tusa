import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const baseUrl = (process.env.PREFLIGHT_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const requestCount = Math.max(10, Number(process.env.PREFLIGHT_REQUESTS ?? 120));
const concurrency = Math.min(20, Math.max(1, Number(process.env.PREFLIGHT_CONCURRENCY ?? 6)));
const outputPath = process.env.PREFLIGHT_OUTPUT ? resolve(process.env.PREFLIGHT_OUTPUT) : null;
const targets = ["/", "/api/public/content", "/api/auth/session", "/api/health"];
const results = [];
let cursor = 0;

async function worker() {
  while (cursor < requestCount) {
    const index = cursor++;
    const path = targets[index % targets.length];
    const startedAt = performance.now();
    try {
      const response = await fetch(`${baseUrl}${path}`, { headers: { "User-Agent": "TUSA-safe-preflight/1.0" }, signal: AbortSignal.timeout(8_000) });
      await response.arrayBuffer();
      results.push({ path, status: response.status, ok: response.ok, latencyMs: Math.round(performance.now() - startedAt) });
    } catch (error) {
      results.push({ path, status: 0, ok: false, latencyMs: Math.round(performance.now() - startedAt), error: error instanceof Error ? error.message : String(error) });
    }
  }
}

const startedAt = new Date();
await Promise.all(Array.from({ length: concurrency }, () => worker()));
const sorted = results.map((item) => item.latencyMs).sort((a, b) => a - b);
const percentile = (value) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * value) - 1))] ?? 0;
const failures = results.filter((item) => !item.ok);
const report = {
  kind: "safe-read-only-preflight",
  baseUrl,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  requestCount,
  concurrency,
  successRate: Number((((requestCount - failures.length) / requestCount) * 100).toFixed(2)),
  latencyMs: { p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99), max: sorted.at(-1) ?? 0 },
  byPath: Object.fromEntries(targets.map((path) => {
    const rows = results.filter((item) => item.path === path);
    return [path, { requests: rows.length, failures: rows.filter((item) => !item.ok).length, maxLatencyMs: Math.max(...rows.map((item) => item.latencyMs)) }];
  })),
  failures: failures.slice(0, 20),
};

if (outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
console.log(JSON.stringify(report, null, 2));
if (report.successRate < 99 || report.latencyMs.p95 > 3_000) process.exitCode = 1;
