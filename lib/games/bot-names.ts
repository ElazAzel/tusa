export const SANDBOX_BOT_NAMES = ["Алекс", "Дана", "Макс", "София", "Тимур", "Аружан", "Ерлан", "Мира"];
const BOT_PATTERN = /^bot_\d+$/;

export function isBotId(id: string) {
  return BOT_PATTERN.test(id);
}

export function sandboxBotIds(count: number) {
  return Array.from({ length: Math.max(0, count) }, (_, index) => `bot_${index + 1}`);
}

export function botDisplayName(id: string) {
  const index = Number(id.slice(4)) - 1;
  return `${SANDBOX_BOT_NAMES[index] ?? `Бот ${index + 1}`} (бот)`;
}
