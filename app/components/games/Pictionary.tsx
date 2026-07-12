"use client";

import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";

type Point = { x: number; y: number; draw: boolean };
type State = { phase: "lobby" | "drawing" | "result"; players: string[]; drawerId: string; word: string; points: Point[]; guesses: Array<{ userId: string; text: string }>; round: number; scores: Record<string, number>; winner: string };
const WORDS = { ru: ["Космонавт", "Жираф", "Пылесос", "Вулкан", "Попкорн", "Динозавр", "Зонтик", "Самолёт"], en: ["Astronaut", "Giraffe", "Vacuum", "Volcano", "Popcorn", "Dinosaur", "Umbrella", "Airplane"] };

export default function Pictionary({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { user } = useUser(); const me = user?.id ?? ""; const { locale } = useLocale(); const ru = locale === "ru"; const isHost = role === "stage";
  const initial = (): State => ({ phase: "lobby", players: [], drawerId: "", word: "", points: [], guesses: [], round: 0, scores: {}, winner: "" });
  const stage = useStageGame<State>(isHost ? sessionId ?? null : null, initial); const controller = useControllerGame<State>(!isHost ? sessionId ?? null : null, initial());
  const state = isHost ? stage.state : controller.state; const sendAction = isHost ? stage.sendAction : controller.sendAction; const setState = isHost ? stage.setState : undefined;
  const actions = isHost ? stage.playerActions : []; const clearActions = isHost ? stage.clearActions : undefined; const drawing = useRef(false); const pending = useRef<Point[]>([]); const [guess, setGuess] = useState("");

  useEffect(() => { if (!isHost || !actions.length) return; for (const action of actions) {
    if (action.actionType === "join" && state.phase === "lobby") setState?.((prev) => ({ ...prev, players: prev.players.includes(action.userId) ? prev.players : [...prev.players, action.userId] }));
    if (action.actionType === "stroke" && action.userId === state.drawerId && state.phase === "drawing") { const points = (action.payload as { points?: Point[] }).points ?? []; setState?.((prev) => ({ ...prev, points: [...prev.points, ...points].slice(-2500) })); }
    if (action.actionType === "guess" && action.userId !== state.drawerId && state.phase === "drawing") { const text = String((action.payload as { text?: string }).text ?? "").trim(); if (!text) continue; if (text.toLocaleLowerCase() === state.word.toLocaleLowerCase()) setState?.((prev) => ({ ...prev, phase: "result", winner: action.userId, guesses: [...prev.guesses, { userId: action.userId, text }], scores: { ...prev.scores, [action.userId]: (prev.scores[action.userId] ?? 0) + 3, [prev.drawerId]: (prev.scores[prev.drawerId] ?? 0) + 2 } })); else setState?.((prev) => ({ ...prev, guesses: [...prev.guesses, { userId: action.userId, text }].slice(-10) })); }
  } clearActions?.(); }, [actions, clearActions, isHost, setState, state.drawerId, state.phase, state.word]);

  const startRound = useCallback(() => { if (!isHost || state.players.length < 2) return; const round = state.round + 1; const word = WORDS[ru ? "ru" : "en"][round % WORDS.en.length]; setState?.((prev) => ({ ...prev, phase: "drawing", round, drawerId: prev.players[round % prev.players.length], word, points: [], guesses: [], winner: "" })); }, [isHost, ru, setState, state.players, state.round]);
  const point = (event: PointerEvent<SVGSVGElement>, draw: boolean) => { if (state.drawerId !== me || state.phase !== "drawing") return; const rect = event.currentTarget.getBoundingClientRect(); pending.current.push({ x: Math.round(((event.clientX - rect.left) / rect.width) * 600), y: Math.round(((event.clientY - rect.top) / rect.height) * 360), draw }); if (pending.current.length >= 5 || !draw) { sendAction("stroke", { points: pending.current }); pending.current = []; } };
  const submitGuess = () => { if (!guess.trim()) return; sendAction("guess", { text: guess.trim() }); setGuess(""); };
  const path = state.points.reduce((value, item) => `${value}${item.draw ? " L" : " M"}${item.x} ${item.y}`, "");

  return <div className="party-game-board game-board-enter drawing-game"><span className="game-step">Pictionary · {ru ? "Раунд" : "Round"} {state.round}</span>
    {state.phase === "lobby" && <><h3>{ru ? "Рисуем на разных телефонах" : "Draw together across devices"}</h3><p>{state.players.length} {ru ? "игроков в лобби" : "players in lobby"}</p>{isHost && <button className="demo-action demo-action--lime" disabled={state.players.length < 2} onClick={startRound} type="button">{ru ? "Начать" : "Start"}</button>}</>}
    {state.phase !== "lobby" && <><div className="drawing-status"><strong>{state.drawerId === me ? (ru ? `Нарисуй: ${state.word}` : `Draw: ${state.word}`) : (ru ? "Угадай рисунок" : "Guess the drawing")}</strong></div><svg className="drawing-canvas" viewBox="0 0 600 360" onPointerDown={(e) => { drawing.current = true; point(e, false); }} onPointerMove={(e) => { if (drawing.current) point(e, true); }} onPointerUp={(e) => { drawing.current = false; point(e, false); }}><path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" /></svg>{state.phase === "drawing" && state.drawerId !== me && <div className="bs-input-group"><input className="bs-input" value={guess} onChange={(e) => setGuess(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitGuess(); }} placeholder={ru ? "Твоя догадка" : "Your guess"} /><button className="demo-action demo-action--lime" onClick={submitGuess} type="button">{ru ? "Ответить" : "Guess"}</button></div>}<div className="drawing-guesses">{state.guesses.map((item, index) => <span key={`${item.userId}-${index}`}>{item.userId.slice(-5)}: {item.text}</span>)}</div>{state.phase === "result" && <><h3>{ru ? "Угадано!" : "Correct!"} {state.word}</h3>{isHost && <button className="demo-action demo-action--lime" onClick={state.round >= 5 ? () => { stage.complete(); onSave(Math.max(0, ...Object.values(state.scores))); } : startRound} type="button">{state.round >= 5 ? (ru ? "Завершить" : "Finish") : (ru ? "Следующий раунд" : "Next round")}</button>}</>}</>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}
