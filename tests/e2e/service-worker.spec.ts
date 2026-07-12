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

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => navigator.serviceWorker?.ready);
  await page.reload({ waitUntil: "domcontentloaded" });

  const manifest = await page.evaluate(async () => {
    const response = await fetch("/manifest.webmanifest", { cache: "no-store" });
    return { status: response.status, contentType: response.headers.get("content-type"), body: await response.text() };
  });

  expect(manifest.status).toBe(200);
  expect(manifest.contentType).toContain("application/manifest+json");
  expect(JSON.parse(manifest.body).name).toContain("TUSA.game");
  expect(hydrationErrors).toEqual([]);
  await context.close();
});
