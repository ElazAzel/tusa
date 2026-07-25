import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
];
const publicRoutes = ["/", "/demo", "/partners", "/sign-in", "/games", "/games/word-blast"];

for (const viewport of viewports) {
  for (const route of publicRoutes) {
    test(`${route} stays inside ${viewport.width}x${viewport.height}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, serviceWorkers: "block" });
      const page = await context.newPage();
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1_100);
      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll<HTMLElement>("body *")]
          .filter((node) => {
            if (node.matches(".waitlist-honeypot, script, style")) return false;
            const box = node.getBoundingClientRect();
            return box.left < -2 || box.right > document.documentElement.clientWidth + 2;
          })
          .slice(0, 8)
          .map((node) => `${node.tagName}.${node.className}`),
      }));
      expect(layout.scroll, `overflow: ${layout.offenders.join(", ")}`).toBeLessThanOrEqual(layout.viewport + 2);
      await context.close();
    });
  }
}
