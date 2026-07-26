import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/sign-in", "/games", "/games/word-blast", "/partners"];

for (const route of routes) {
  test(`${route} has no WCAG A/AA violations on mobile`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations, results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(" | ")}`).join("\n")).toEqual([]);
    await context.close();
  });
}
