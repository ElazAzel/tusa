import { expect, test } from "@playwright/test";
import { E2E_ADMIN_PASSWORD } from "./test-auth";

test("waitlist applications are stored, managed and exported by an admin", async ({ page }) => {
  const contact = `waitlist-${Date.now()}@example.com`;
  await page.goto("/");
  await page.locator(".waitlist-grid").scrollIntoViewIfNeeded();
  await page.getByLabel("Имя").fill("Тестовый Участник");
  await page.getByLabel("Город").fill("Алматы");
  await page.getByLabel("Email / WhatsApp").fill(contact);
  await page.locator(".waitlist-grid .checkbox-label").click();
  await page.locator(".waitlist-grid").getByRole("button", { name: /Присоединиться к TUSA/ }).click();
  await expect(page.getByRole("status")).toContainText("Заявка в очереди", { timeout: 25000 });

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Пароль администратора").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Открыть реестр" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByLabel("Поиск заявок").fill(contact);
  const row = page.locator(".admin-application").filter({ hasText: contact });
  await expect(row).toContainText("Тестовый Участник");
  await row.getByLabel(/Статус Тестовый Участник/).selectOption("invited");
  await expect(row.getByLabel(/Статус Тестовый Участник/)).toHaveValue("invited");
  const note = row.getByLabel(/Заметка Тестовый Участник/);
  await note.fill("Проверено E2E");
  await note.blur();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "CSV export" }).click();
  expect((await download).suggestedFilename()).toBe("tusa-game-waitlist.csv");

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: /Удалить Тестовый Участник/ }).click();
  await expect(page.locator(".admin-application").filter({ hasText: contact })).toHaveCount(0);
}, 90000);
