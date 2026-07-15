"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";

type Color = "red" | "yellow" | "green" | "blue";
type Kind = "number" | "skip" | "reverse" | "draw2" | "wild" | "wild4";
type Card = { id: string; color: Color | null; kind: Kind; value?: number };
type UnoState = { phase: "lobby" | "playing" | "finished"; players: string[]; hands: Record<string, Card[]>; drawPile: Card[]; discard: Card[]; currentIndex: number; direction: 1 | -1; activeColor: Color; winner: string; uno: string[] };

const COLORS: Color[] = ["red", "yellow", "green", "blue"];
const shuffle = <T,>(items: T[]) => { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; };
function deck() { let id = 0; const cards: Card[] = []; for (const color of COLORS) { cards.push({ id: `${id++}`, color, kind: "number", value: 0 }); for (let n = 1; n <= 9; n++) for (let copy = 0; copy < 2; copy++) cards.push({ id: `${id++}`, color, kind: "number", value: n }); for (const kind of ["skip", "reverse", "draw2"] as const) for (let copy = 0; copy < 2; copy++) cards.push({ id: `${id++}`, color, kind }); } for (let i = 0; i < 4; i++) { cards.push({ id: `${id++}`, color: null, kind: "wild" }, { id: `${id++}`, color: null, kind: "wild4" }); } return shuffle(cards); }
function label(card: Card) { return card.kind === "number" ? String(card.value) : card.kind === "reverse" ? "↻" : card.kind === "skip" ? "⊘" : card.kind === "draw2" ? "+2" : card.kind === "wild4" ? "+4" : "W"; }
function canPlay(card: Card, top: Card, active: Color) { return !card.color || card.color === active || card.kind === top.kind || (card.kind === "number" && top.kind === "number" && card.value === top.value); }
function nextIndex(index: number, direction: 1 | -1, count: number, steps = 1) { return (index + direction * steps + count * 4) % count; }

export default function UnoTracker({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { user } = useUser(); const me = user?.id ?? ""; const { t } = useLocale(); const isHost = role === "stage";
  const initial = (): UnoState => ({ phase: "lobby", players: [], hands: {}, drawPile: [], discard: [], currentIndex: 0, direction: 1, activeColor: "red", winner: "", uno: [] });
  const stage = useStageGame<UnoState>(isHost ? sessionId ?? null : null, initial);
  const controller = useControllerGame<UnoState>(!isHost ? sessionId ?? null : null, initial());
  const state = isHost ? stage.state : controller.state; const sendAction = isHost ? stage.sendAction : controller.sendAction; const setState = isHost ? stage.setState : undefined;
  const actions = isHost ? stage.playerActions : []; const clearActions = isHost ? stage.clearActions : undefined; const [colorChoice, setColorChoice] = useState<Color>("red");

  const start = useCallback(() => { if (!isHost || state.players.length < 2) return; const pile = deck(); const hands: Record<string, Card[]> = {}; state.players.forEach((id) => { hands[id] = []; for (let i = 0; i < 7; i++) hands[id].push(pile.pop()!); }); let first = pile.pop()!; while (first.kind !== "number") { pile.unshift(first); first = pile.pop()!; } setState?.((prev) => ({ ...prev, phase: "playing", hands, drawPile: pile, discard: [first], activeColor: first.color!, currentIndex: 0, direction: 1, winner: "", uno: [] })); }, [isHost, state.players, setState]);

  useEffect(() => { if (!isHost || !actions.length) return; for (const action of actions) {
    if (action.actionType === "join") setState?.((prev) => prev.phase === "lobby" ? { ...prev, players: prev.players.includes(action.userId) ? prev.players : [...prev.players, action.userId] } : prev);
    if (action.actionType === "play") setState?.((prev) => { if (prev.phase !== "playing" || prev.players[prev.currentIndex] !== action.userId) return prev; const hand = prev.hands[action.userId] ?? []; const card = hand.find((item) => item.id === String((action.payload as { cardId?: string }).cardId)); const top = prev.discard.at(-1); if (!card || !top || !canPlay(card, top, prev.activeColor)) return prev; const hands = { ...prev.hands, [action.userId]: hand.filter((item) => item.id !== card.id) }; const chosen = card.color ?? ((action.payload as { color?: Color }).color || prev.activeColor); let direction = prev.direction; let steps = 1; let draw = 0; if (card.kind === "reverse") direction = prev.players.length === 2 ? prev.direction : (prev.direction === 1 ? -1 : 1); if (card.kind === "skip" || (card.kind === "reverse" && prev.players.length === 2)) steps = 2; if (card.kind === "draw2") { draw = 2; steps = 2; } if (card.kind === "wild4") { draw = 4; steps = 2; } const target = nextIndex(prev.currentIndex, direction, prev.players.length); const drawPile = [...prev.drawPile]; if (draw) { const targetId = prev.players[target]; const targetHand = [...(hands[targetId] ?? [])]; for (let i = 0; i < draw && drawPile.length; i++) targetHand.push(drawPile.pop()!); hands[targetId] = targetHand; } const winner = hands[action.userId].length === 0 ? action.userId : ""; return { ...prev, hands, drawPile, discard: [...prev.discard, card], activeColor: chosen, direction, currentIndex: nextIndex(prev.currentIndex, direction, prev.players.length, steps), winner, phase: winner ? "finished" : "playing", uno: hands[action.userId].length === 1 ? [...new Set([...prev.uno, action.userId])] : prev.uno.filter((id) => id !== action.userId) }; });
    if (action.actionType === "draw") setState?.((prev) => { if (prev.phase !== "playing" || prev.players[prev.currentIndex] !== action.userId || !prev.drawPile.length) return prev; const drawPile = [...prev.drawPile]; const card = drawPile.pop()!; return { ...prev, drawPile, hands: { ...prev.hands, [action.userId]: [...(prev.hands[action.userId] ?? []), card] }, currentIndex: nextIndex(prev.currentIndex, prev.direction, prev.players.length) }; });
  } clearActions?.(); }, [actions, clearActions, isHost, setState]);

  useEffect(() => { if (isHost && state.phase === "finished" && state.winner) { stage.complete(); onSave(1); } }, [isHost, onSave, stage, state.phase, state.winner]);
  const hand = state.hands[me] ?? []; const top = state.discard.at(-1); const myTurn = state.phase === "playing" && state.players[state.currentIndex] === me;
  const play = (card: Card) => sendAction("play", { cardId: card.id, color: colorChoice });

  return <div className="party-game-board game-board-enter uno-multiplayer">
    <span className="game-step">UNO · {state.phase === "lobby" ? t("unoLobby") : `${state.currentIndex + 1}/${state.players.length}`}</span>
    {state.phase === "lobby" && <><h3>{t("unoPlayersJoining")}</h3><div className="uno-player-chips">{state.players.map((id, index) => <span key={id}>{index + 1}. {id === me ? t("unoYou") : id.slice(-6)}</span>)}</div>{isHost && <button className="demo-action demo-action--lime" disabled={state.players.length < 2} onClick={start} type="button">{t("unoDeal")}</button>}</>}
    {state.phase !== "lobby" && <><div className="uno-table"><button className="uno-card uno-card--back" disabled={!myTurn} onClick={() => sendAction("draw")} type="button">+{state.drawPile.length}</button>{top && <div className={`uno-card uno-card--${top.color ?? "wild"}`}><strong>{label(top)}</strong><small>{state.activeColor}</small></div>}</div><p className={myTurn ? "controller-answered" : ""}>{myTurn ? t("unoYourTurn") : t("unoOtherTurn")}</p><div className="uno-color-choice">{COLORS.map((color) => <button aria-label={color} className={colorChoice === color ? "active" : ""} key={color} onClick={() => setColorChoice(color)} style={{ background: color }} type="button" />)}</div><div className="uno-hand">{hand.map((card) => <button className={`uno-card uno-card--${card.color ?? "wild"}`} disabled={!myTurn || !top || !canPlay(card, top, state.activeColor)} key={card.id} onClick={() => play(card)} type="button"><strong>{label(card)}</strong></button>)}</div>{state.uno.includes(me) && <strong className="uno-callout">UNO!</strong>}</>}
    {state.phase === "finished" && <h3>{state.winner === me ? t("unoYouWon") : `${t("unoWinner")}: ${state.winner.slice(-6)}`}</h3>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}
