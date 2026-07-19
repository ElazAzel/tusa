const expected = (process.env.CANONICAL_BASE_URL ?? "https://tusa.game").replace(/\/$/, "");
const checks = [];
async function check(name, url, validate, options = {}) {
  const startedAt = performance.now();
  try {
    const response = await fetch(url, { redirect: options.redirect ?? "follow", signal: AbortSignal.timeout(10_000) });
    const body = options.body === false ? "" : await response.text();
    const passed = validate(response, body);
    checks.push({ name, passed, status: response.status, finalUrl: response.url, latencyMs: Math.round(performance.now() - startedAt) });
  } catch (error) { checks.push({ name, passed: false, error: error instanceof Error ? error.message : String(error) }); }
}
await check("canonical home", expected, (response, body) => response.ok && body.includes(`<link rel="canonical" href="${expected}`));
await check("www redirect", expected.replace("https://", "https://www."), (response) => response.status >= 300 && response.status < 400 && response.headers.get("location")?.startsWith(expected), { redirect: "manual", body: false });
await check("robots", `${expected}/robots.txt`, (response, body) => response.ok && body.includes(`${expected}/sitemap.xml`));
await check("sitemap", `${expected}/sitemap.xml`, (response, body) => response.ok && body.includes(expected));
console.table(checks);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
