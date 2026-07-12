import { expect, test } from "@playwright/test";

const widths = [375, 390, 430];
const publicRoutes = ["/", "/demo", "/partners", "/sign-in"];

for (const width of widths) {
  for (const route of publicRoutes) {
    test(`${route} stays inside ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
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
    });
  }
}
