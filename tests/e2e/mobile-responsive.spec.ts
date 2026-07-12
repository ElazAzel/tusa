import { expect, test } from "@playwright/test";

const widths = [320, 360, 375, 390, 412, 430, 768, 1024];
const publicRoutes = ["/", "/demo", "/partners", "/sign-in", "/games", "/games/word-blast"];

for (const width of widths) {
  for (const route of publicRoutes) {
    test(`${route} stays inside ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: width >= 768 ? 1024 : 812 }, serviceWorkers: "block" });
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
