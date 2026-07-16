import { z } from "zod";
import { defineGame } from "../definition";

type Color = "red" | "yellow" | "green" | "blue";
type Kind = "number" | "skip" | "reverse" | "draw2" | "wild" | "wild4";
type Card = { id: string; color: Color | null; kind: Kind; value?: number };
type State = { engine: "server-v1"; game: "uno"; phase: "playing" | "finished"; players: string[]; hands: Record<string, Card[]>; drawPile: Card[]; discard: Card[]; currentIndex: number; direction: 1 | -1; activeColor: Color; winner: string; uno: string[]; turns: number };

const colors: Color[] = ["red", "yellow", "green", "blue"];

function deck() {
  let id = 0;
  const cards: Card[] = [];
  for (const color of colors) {
    cards.push({ id: `${id++}`, color, kind: "number", value: 0 });
    for (let value = 1; value <= 9; value += 1) for (let copy = 0; copy < 2; copy += 1) cards.push({ id: `${id++}`, color, kind: "number", value });
    for (const kind of ["skip", "reverse", "draw2"] as const) for (let copy = 0; copy < 2; copy += 1) cards.push({ id: `${id++}`, color, kind });
  }
  for (let copy = 0; copy < 4; copy += 1) cards.push({ id: `${id++}`, color: null, kind: "wild" }, { id: `${id++}`, color: null, kind: "wild4" });
  return cards;
}

function shuffled<T>(items: T[], seed: number) {
  const result = [...items];
  let value = Math.abs(seed) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    value = (value * 48271) % 2147483647;
    const target = value % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function nextIndex(index: number, direction: 1 | -1, count: number, steps = 1) {
  return (index + direction * steps + count * 8) % count;
}

function canPlay(card: Card, top: Card, activeColor: Color) {
  return !card.color || card.color === activeColor || card.kind === top.kind || (card.kind === "number" && top.kind === "number" && card.value === top.value);
}

function drawCards(state: State, count: number) {
  let drawPile = [...state.drawPile];
  let discard = [...state.discard];
  const drawn: Card[] = [];
  while (drawn.length < count) {
    if (!drawPile.length && discard.length > 1) {
      const top = discard.pop()!;
      drawPile = shuffled(discard, state.turns + drawn.length + 1);
      discard = [top];
    }
    const card = drawPile.pop();
    if (!card) break;
    drawn.push(card);
  }
  return { drawPile, discard, drawn };
}

export default defineGame<State>({
  id: "uno",
  version: 1,
  createInitialState(participants, _config, now = Date.now()) {
    if (participants.length < 2) return null;
    const pile = shuffled(deck(), now);
    const hands = Object.fromEntries(participants.map((player) => [player, Array.from({ length: 7 }, () => pile.pop()!)])) as Record<string, Card[]>;
    let top = pile.pop()!;
    while (top.kind !== "number") { pile.unshift(top); top = pile.pop()!; }
    return { engine: "server-v1", game: "uno", phase: "playing", players: participants, hands, drawPile: pile, discard: [top], currentIndex: 0, direction: 1, activeColor: top.color!, winner: "", uno: [], turns: 0 };
  },
  commandSchemas: {
    draw: z.object({}).strict(),
    play: z.object({ cardId: z.string().min(1).max(80), color: z.enum(colors) }).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (state.phase !== "playing") return { state, changed: false, error: "The match is finished." };
    const actorIndex = state.players.indexOf(ctx.actorId);
    if (actorIndex < 0 || actorIndex !== state.currentIndex) return { state, changed: false, error: "Wait for your turn." };
    if (actionType === "draw") {
      const dealt = drawCards(state, 1);
      return { changed: true, state: { ...state, drawPile: dealt.drawPile, discard: dealt.discard, hands: { ...state.hands, [ctx.actorId]: [...(state.hands[ctx.actorId] ?? []), ...dealt.drawn] }, currentIndex: nextIndex(state.currentIndex, state.direction, state.players.length), turns: state.turns + 1 } };
    }
    if (actionType === "play") {
      const { cardId, color } = payload as { cardId: string; color: Color };
      const hand = state.hands[ctx.actorId] ?? [];
      const card = hand.find((item) => item.id === cardId);
      const top = state.discard.at(-1);
      if (!card || !top || !canPlay(card, top, state.activeColor)) return { state, changed: false, error: "That card cannot be played now." };
      const hands = { ...state.hands, [ctx.actorId]: hand.filter((item) => item.id !== card.id) };
      const nextDirection = card.kind === "reverse" && state.players.length > 2 ? (state.direction === 1 ? -1 : 1) : state.direction;
      const target = nextIndex(state.currentIndex, nextDirection, state.players.length);
      const penalty = card.kind === "draw2" ? 2 : card.kind === "wild4" ? 4 : 0;
      const dealt = drawCards({ ...state, discard: [...state.discard, card] }, penalty);
      if (penalty) hands[state.players[target]] = [...(hands[state.players[target]] ?? []), ...dealt.drawn];
      const steps = card.kind === "skip" || card.kind === "draw2" || card.kind === "wild4" || (card.kind === "reverse" && state.players.length === 2) ? 2 : 1;
      const winner = hands[ctx.actorId].length === 0 ? ctx.actorId : "";
      const uno = hands[ctx.actorId].length === 1 ? [...new Set([...state.uno, ctx.actorId])] : state.uno.filter((player) => player !== ctx.actorId);
      return { changed: true, state: { ...state, hands, drawPile: dealt.drawPile, discard: dealt.discard, activeColor: card.color ?? color, direction: nextDirection, currentIndex: nextIndex(state.currentIndex, nextDirection, state.players.length, steps), winner, uno, phase: winner ? "finished" : "playing", turns: state.turns + 1 } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  sanitizeForViewer(state, viewerId) { return viewerId === "__stage__" ? state : { ...state, hands: state.hands[viewerId] ? { [viewerId]: state.hands[viewerId] } : {}, drawPile: [] }; },
  deriveScore(state) { return state.winner ? Math.max(1, state.hands[state.winner]?.length ?? 0) : 0; },
});
