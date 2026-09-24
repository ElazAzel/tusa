import { commandTypesFor, parseGameCommand } from "./commands";
import { applyServerGameCommand } from "./engine";
import { isBotId } from "./bot-names";

export { botDisplayName, isBotId, sandboxBotIds } from "./bot-names";

const PASSIVE_COMMANDS = new Set(["join", "draw"]);
const RISKY_COMMANDS = new Set(["impostor:guess", "spyfall:spyGuess"]);
const MAX_AUTOPILOT_PASSES = 40;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function botCandidatePayloads(botId: string, state: Record<string, unknown>, participants: string[]) {
  const botNumber = Number(botId.slice(4)) || 1;
  const others = participants.filter((id) => id !== botId);
  const humans = others.filter((id) => !isBotId(id));
  const targets = [...humans, ...others].slice(0, 3);
  const submissions = Object.keys(record(state.submissions)).filter((id) => id !== botId);
  const hand = Array.isArray(record(state.hands)[botId]) ? record(state.hands)[botId] as unknown[] : [];
  const letter = typeof state.letter === "string" ? state.letter : "";
  const word = `${letter}${letter ? "" : "бот"}${"абвгдежзик"[botNumber % 10]}${"ромтлнкс"[botNumber % 8]}${botNumber}`;
  const revealed = Array.isArray(state.revealed) ? state.revealed as unknown[] : [];
  const unrevealed = revealed.map((value, idx) => value ? -1 : idx).filter((idx) => idx >= 0);
  const choiceOwners = record(state.choiceOwners);
  const choices = (Array.isArray(state.choices) ? state.choices as unknown[] : []).map((choice) => String(record(choice).id ?? "")).filter((id) => id && choiceOwners[id] !== botId);
  const payloads: Record<string, unknown>[] = [
    { index: botNumber % 2 },
    { index: 0 },
    { choice: botNumber % 2 ? "a" : "b" },
    { value: ((botNumber * 3) % 10) + 1 },
    { assignment: botNumber % 2 ? [0, 1, 2] : [2, 1, 0] },
    { text: `Ответ бота ${botNumber}` },
    { answer: `бот${botNumber}` },
    { word },
    { clue: `подсказка ${botNumber}` },
    { title: `Песня бота ${botNumber}` },
    { location: "Кафе" },
    { tm: botNumber % 2 ? "a" : "b" },
    { tm: botNumber % 2 ? "b" : "a" },
    { wd: `слово${botNumber}`, nm: 1 },
    ...unrevealed.slice(0, 3).map((idx) => ({ idx })),
    ...targets.map((target) => ({ target })),
    ...choices.slice(0, 3).map((target) => ({ target })),
    ...submissions.slice(0, 3).map((winner) => ({ winner })),
  ];
  for (const card of hand.slice(0, 10)) {
    if (typeof card === "string") payloads.push({ card });
    const cardRecord = record(card);
    if (typeof cardRecord.id === "string") {
      const color = typeof cardRecord.color === "string" ? cardRecord.color : typeof state.activeColor === "string" ? state.activeColor : "red";
      payloads.push({ cardId: cardRecord.id, color });
    }
  }
  payloads.push({});
  return payloads;
}

export function runBotAutopilot(input: { game: string; state: Record<string, unknown>; participants: string[]; creatorId: string; now?: number }) {
  const bots = input.participants.filter(isBotId);
  const actions: { botId: string; actionType: string }[] = [];
  if (!bots.length) return { state: input.state, changed: false, actions };
  const commands = commandTypesFor(input.game).filter((type) => !RISKY_COMMANDS.has(`${input.game}:${type}`)).sort((a, b) => Number(PASSIVE_COMMANDS.has(a)) - Number(PASSIVE_COMMANDS.has(b)));
  let state = input.state;
  for (let pass = 0; pass < MAX_AUTOPILOT_PASSES; pass += 1) {
    const actedBefore = actions.length;
    for (const botId of bots) {
      const next = botMove(input.game, state, botId, commands, { actorId: botId, creatorId: input.creatorId, participants: input.participants, now: input.now ?? Date.now() });
      if (!next) continue;
      state = next.state;
      actions.push({ botId, actionType: next.actionType });
    }
    if (actions.length === actedBefore) break;
  }
  return { state, changed: actions.length > 0, actions };
}

function botMove(game: string, state: Record<string, unknown>, botId: string, commands: string[], context: { actorId: string; creatorId: string; participants: string[]; now: number }) {
  for (const actionType of commands) {
    for (const payload of botCandidatePayloads(botId, state, context.participants)) {
      if (Object.keys(payload).length === 0 && !PASSIVE_COMMANDS.has(actionType)) continue;
      const parsed = parseGameCommand(game, actionType, payload);
      if (!parsed.success) continue;
      const result = applyServerGameCommand(game, state, actionType, parsed.payload, context);
      if (result && !result.error && result.changed) return { state: result.state, actionType };
    }
  }
  return null;
}
