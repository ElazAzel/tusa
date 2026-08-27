"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";

type WheelState = { engine: string; phase: "collect" | "result" | "finished"; options: string[]; result: string; resultIndex: number; angle: number; round: number };
const initial = (): WheelState => ({ engine: "server-v1", phase: "collect", options: [], result: "", resultIndex: -1, angle: 0, round: 0 });

export default function Wheel({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const stageRole = role === "stage";
  const stage = useStageGame<WheelState>(stageRole ? sessionId ?? null : null, initial);
  const controller = useControllerGame<WheelState>(!stageRole ? sessionId ?? null : null, initial());
  const state = stageRole ? stage.state : controller.state;
  const sendAction = stageRole ? stage.sendAction : controller.sendAction;
  const [text, setText] = useState("");
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Колесо выбора", placeholder: "Добавить вариант", add: "Добавить", spin: "Крутить", next: "Ещё раз", finish: "Завершить", result: "Выпало", options: "вариантов" } : { title: "Choice Wheel", placeholder: "Add an option", add: "Add", spin: "Spin", next: "Spin again", finish: "Finish", result: "It chose", options: "options" };
  const segment = state.options.length ? 360 / state.options.length : 360;
  const palette = ["var(--lime)", "#ffb3d4", "#c7b8ff", "var(--cream)", "#ffc857", "#6ee7b7", "#a78bfa", "#fb7185"];
  const add = () => { if (!text.trim()) return; sendAction("addOption", { text: text.trim() }); setText(""); };
  const wedges = useMemo(() => state.options.map((option, index) => ({ option, index })), [state.options]);
  useEffect(() => { if (!stageRole || state.phase !== "finished" || completed.current) return; completed.current = true; stage.complete(); onSave(state.round + 1); }, [onSave, stage, stageRole, state.phase, state.round]);
  return <section className="party-game-board game-board-enter" aria-label={copy.title}><span className="game-step">{copy.title}</span><div className="bs-input-group"><input className="bs-input" value={text} aria-label={copy.placeholder} maxLength={60} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") add(); }} placeholder={copy.placeholder} disabled={state.phase !== "collect"} /><button className="demo-action demo-action--lime" onClick={add} disabled={!text.trim() || state.phase !== "collect"} type="button">{copy.add}</button></div><p>{state.options.length} {copy.options}</p><div className="wheel-stage"><svg viewBox="0 0 260 260" style={{ transform: `rotate(${state.angle}deg)`, transition: state.phase === "result" ? "transform 1.2s cubic-bezier(.17,.67,.12,.99)" : "none" }}>{wedges.map(({ option, index }) => { const start = index * segment; const end = start + segment; const rad = 130; const x1 = rad + rad * Math.sin(start * Math.PI / 180); const y1 = rad - rad * Math.cos(start * Math.PI / 180); const x2 = rad + rad * Math.sin(end * Math.PI / 180); const y2 = rad - rad * Math.cos(end * Math.PI / 180); const mid = start + segment / 2; return <g key={`${option}-${index}`}><path d={`M130,130 L${x1},${y1} A130,130 0 ${segment > 180 ? 1 : 0},1 ${x2},${y2} Z`} fill={palette[index % palette.length]} stroke="var(--black)" strokeWidth="3" /><text x={130 + 76 * Math.sin(mid * Math.PI / 180)} y={130 - 76 * Math.cos(mid * Math.PI / 180)} textAnchor="middle" dominantBaseline="middle" fill="var(--black)" fontSize="11" fontWeight="800">{option.slice(0, 14)}</text></g>; })}</svg><span className="wheel-pointer" aria-hidden="true" /></div>{state.phase === "result" && <div className="trivia-result"><p>{copy.result}</p><h3>{state.result}</h3></div>}{stageRole && <div className="game-primary-actions">{state.phase === "collect" && <button className="demo-action demo-action--lime" onClick={() => sendAction("spin")} disabled={state.options.length < 2} type="button">{copy.spin}</button>}{state.phase === "result" && <><button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{copy.next}</button><button className="demo-action demo-action--white" onClick={() => sendAction("finish")} type="button">{copy.finish}</button></>}</div>}{sessionId && <span className="multiplayer-badge">LIVE</span>}</section>;
}
