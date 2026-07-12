"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type Action = 0 | 1 | 2;
type GameState = { engine: "server-v1"; phase: "vote" | "reveal" | "finished"; round: number; names: string[]; votes: Record<string, Action[]>; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", phase: "vote", round: 0, names: [], votes: {}, players: [] });

export default function KissMarryKill({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [assignment, setAssignment] = useState<Array<Action | null>>([null, null, null]);
  const [submitted, setSubmitted] = useState(false);
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Выбери для троих", round: "Раунд", hint: "Назначь каждому свой вариант — каждый используется один раз", actions: ["Поцеловать", "Пожениться", "Исключить"], submit: "Подтвердить выбор", accepted: "Выбор принят", reveal: "Показать итоги", next: "Следующий раунд", finish: "Завершить", votes: "ответов" } : { title: "Pick Three", round: "Round", hint: "Assign one option to each person — use every option once", actions: ["Kiss", "Marry", "Drop"], submit: "Lock choices", accepted: "Choices locked", reveal: "Reveal results", next: "Next round", finish: "Finish", votes: "responses" };

  useEffect(() => { setAssignment([null, null, null]); setSubmitted(false); }, [state.round]);
  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(0);
  }, [isHost, onSave, stage, state.phase]);

  const tallies = useMemo(() => state.names.map((_, person) => [0, 0, 0].map((__, action) => Object.values(state.votes).filter((vote) => vote[person] === action).length)), [state.names, state.votes]);
  const totalVotes = Object.keys(state.votes).length;
  const ready = assignment.every((value) => value !== null) && new Set(assignment).size === 3;
  function choose(person: number, action: Action) {
    if (submitted || state.phase !== "vote") return;
    setAssignment((current) => current.map((value, index) => index === person ? action : value === action ? null : value));
  }
  function submit() {
    if (!ready || submitted) return;
    setSubmitted(true);
    sendAction("vote", { assignment });
  }

  return <div className="party-game-board game-board-enter pick-three-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/5</span><span className="multiplayer-badge">LIVE · {totalVotes}/{Math.max(totalVotes, state.players.length)}</span></div>
    <h3>{copy.title}</h3><p className="tt-prompt">{copy.hint}</p>
    <div className="kmk-names">{state.names.map((name, person) => <section className="kmk-person" key={name}><strong className="kmk-name">{name}</strong><div className="kmk-choice-row">{copy.actions.map((label, action) => <button className={assignment[person] === action ? "selected" : ""} disabled={submitted || state.phase !== "vote"} key={label} onClick={() => choose(person, action as Action)} type="button">{label}</button>)}</div>{state.phase === "reveal" && <div className="kmk-results">{copy.actions.map((label, action) => <span key={label}>{label}: <b>{tallies[person]?.[action] ?? 0}</b></span>)}</div>}</section>)}</div>
    {!submitted && state.phase === "vote" && <button className="demo-action demo-action--lime" disabled={!ready} onClick={submit} type="button">{copy.submit}</button>}
    {submitted && state.phase === "vote" && <p className="controller-answered">{copy.accepted}</p>}
    {isHost && state.phase === "vote" && totalVotes > 0 && <button className="demo-action demo-action--lime" onClick={() => sendAction("reveal")} type="button">{copy.reveal}</button>}
    {isHost && state.phase === "reveal" && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}
  </div>;
}
