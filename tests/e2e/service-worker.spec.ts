import { expect, test } from "@playwright/test";

test("service worker never intercepts the web manifest", async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  const hydrationErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|React error #418/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });

  const [sw] = await Promise.all([
    context.waitForEvent("serviceworker", { timeout: 10_000 }),
    page.evaluate(async () => {
      if ("serviceWorker" in navigator) await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    }),
  ]);
  expect(sw).toBeDefined();

  await page.reload({ waitUntil: "networkidle" });

  const response = await page.request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/manifest+json");
  const body = await response.json();
  expect(body.name).toContain("TUSA.game");
  expect(hydrationErrors).toEqual([]);
  await context.close();
});
