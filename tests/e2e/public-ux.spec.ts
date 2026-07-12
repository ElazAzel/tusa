import { expect, test } from "@playwright/test";

test.describe("public product UX", () => {
  test("catalogue search and category filters remain usable on mobile", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto("/games", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const search = page.getByRole("searchbox");
    await expect(search).toBeVisible();
    await search.fill("zzzz-no-such-game");
    await expect(page.locator(".catalogue-empty")).toBeVisible();
    await search.fill("");
    await page.locator(".catalogue-filters button").last().click();
    await expect(page.locator(".catalogue-grid .game-card").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await context.close();
  });

  test("cookie consent and auth shell fit a small phone", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 568 }, serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".auth-shell .brand-logo--long")).toBeVisible();
    const banner = page.locator(".cookie-banner");
    if (await banner.isVisible()) {
      const box = await banner.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(320);
      await expect(banner.getByRole("button")).toHaveCSS("min-height", "44px");
    }
    await context.close();
  });

  test("sign-up uses the same branded mobile shell", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 568 }, serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".auth-shell .brand-logo--long")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await context.close();
  });
});
