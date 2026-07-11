import path from "node:path";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/demo");
  await page.locator(".demo-shell").waitFor();
});

test("event lifecycle works", async ({ page }) => {
  await page.getByRole("button", { name: /Новый ивент/ }).click();
  await page.getByLabel("Название").fill("E2E Rooftop");
  await page.getByLabel("Дата").fill("2026-07-18");
  await page.getByLabel("Время").fill("20:30");
  await page.getByLabel("Место").fill("Алматы · Терраса");
  await page.getByRole("button", { name: /Создать ивент/ }).click();
  await expect(page.locator(".demo-hero-card h2")).toHaveText("E2E Rooftop");

  await page.getByRole("button", { name: /Дублировать/ }).click();
  await expect(page.getByLabel("Выбрать ивент").locator("option")).toHaveCount(3);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Удалить/ }).click();
  await expect(page.getByLabel("Выбрать ивент").locator("option")).toHaveCount(2);
});

test("all eight game modes launch and Alias scores", async ({ page }) => {
  await page.locator(".demo-nav").getByRole("button", { name: "Игры" }).click();
  await expect(page.locator(".game-launch-card")).toHaveCount(8);
  await page.getByRole("button", { name: /Alias/ }).click();
  await page.getByRole("button", { name: /Старт раунда/ }).click();
  await page.getByRole("button", { name: /Угадали/ }).click();
  await expect(page.locator(".alias-score")).toContainText("1");
});

test("shopping, chat, KOINS and profile change state", async ({ page }) => {
  await page.locator(".demo-nav").getByRole("button", { name: "Покупки" }).click();
  await page.getByLabel("Что берём").fill("Вода E2E");
  await page.locator(".shopping-add-form > button").click();
  const water = page.locator(".shopping-list--detailed article").filter({ hasText: "Вода E2E" });
  await water.getByRole("button", { name: /Отметить Вода E2E/ }).click();
  await water.getByLabel("Стоимость Вода E2E").fill("4000");
  await expect(page.locator(".split-head h3")).toContainText("13");

  await page.locator(".demo-nav").getByRole("button", { name: /Чат/ }).click();
  await page.getByRole("textbox", { name: "Сообщение" }).fill("E2E сообщение");
  await page.getByRole("button", { name: "Отправить сообщение" }).click();
  await expect(page.locator(".chat-stream")).toContainText("E2E сообщение");

  await page.locator(".demo-nav").getByRole("button", { name: "KOINS" }).click();
  await page.getByLabel("Вопрос").fill("E2E пари?");
  await page.getByLabel("Исход A").fill("Да E2E");
  await page.getByLabel("Исход B").fill("Нет E2E");
  await page.getByRole("button", { name: /Открыть пари/ }).click();
  const bet = page.locator(".bets-list--full article").filter({ hasText: "E2E пари?" });
  await bet.locator(".bet-options button").first().click();
  await expect(page.locator(".koins-balance strong")).toContainText("315");

  await page.locator(".demo-nav").getByRole("button", { name: "Профиль" }).click();
  await page.getByRole("button", { name: /Редактировать/ }).click();
  await page.getByLabel("Имя").fill("E2E User");
  await page.getByRole("button", { name: /Сохранить/ }).click();
  await expect(page.locator(".profile-hero h2")).toHaveText("E2E User");
});

test("320px Alias and uploaded gallery never overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.reload();
  await page.locator(".demo-shell").waitFor();

  await page.locator(".demo-mobile-nav").getByRole("button", { name: "Игры" }).click();
  await page.getByRole("button", { name: /Alias/ }).click();
  const fitsAlias = await page.evaluate(() => {
    const board = document.querySelector(".alias-board")!.getBoundingClientRect();
    const word = document.querySelector(".alias-board > strong")!.getBoundingClientRect();
    return word.left >= board.left && word.right <= board.right;
  });
  expect(fitsAlias).toBe(true);

  await page.locator(".demo-mobile-nav").getByRole("button", { name: "Галерея" }).click();
  await page.locator(".gallery-control-button input").setInputFiles([
    path.join(process.cwd(), "public", "brand", "tusa-game-icon.png"),
    path.join(process.cwd(), "public", "brand", "tusa-game-logo.png"),
  ]);
  await expect(page.locator(".gallery-grid--real > article")).toHaveCount(2);
  const geometry = await page.evaluate(() => {
    const grid = document.querySelector(".gallery-grid--real")!.getBoundingClientRect();
    const cards = [...document.querySelectorAll(".gallery-grid--real > article")].map((element) => element.getBoundingClientRect());
    return {
      documentFits: document.documentElement.scrollWidth === document.documentElement.clientWidth,
      cardsFit: cards.every((card) => card.left >= grid.left - 0.5 && card.right <= grid.right + 0.5),
    };
  });
  expect(geometry).toEqual({ documentFits: true, cardsFit: true });
});
