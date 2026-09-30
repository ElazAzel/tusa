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

const LOCAL_SEAT_PATTERN = /^seat_\d{1,2}$/;
export const MAX_LOCAL_PLAYERS = 16;

export function isLocalSeatId(id: string) {
  return LOCAL_SEAT_PATTERN.test(id);
}

export function localSeatIds(count: number) {
  return Array.from({ length: Math.max(0, Math.min(MAX_LOCAL_PLAYERS, count)) }, (_, index) => `seat_${index + 1}`);
}

export function localPlayerNames(config: Record<string, unknown> | undefined): Record<string, string> {
  const raw = config?.localPlayers;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter((entry): entry is [string, string] => isLocalSeatId(entry[0]) && typeof entry[1] === "string"));
}
