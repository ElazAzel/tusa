"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; round: number; phase: "question" | "result" | "finished"; question: string; options: string[]; correct: number; deadline: number; scores: Record<string, number>; answered: Record<string, boolean>; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", round: 0, phase: "question", question: "", options: [], correct: -1, deadline: 0, scores: {}, answered: {}, players: [] });

export default function BrainBurst({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [chosen, setChosen] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const revealRequested = useRef(-1);
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Мозговой штурм", round: "Раунд", waiting: "Готовим вопрос…", accepted: "Ответ принят", correct: "Правильный ответ", points: "очк.", next: "Дальше", finish: "Завершить" } : { title: "Brain Burst", round: "Round", waiting: "Preparing the question…", accepted: "Answer accepted", correct: "Correct answer", points: "pts", next: "Next", finish: "Finish" };

  useEffect(() => { setChosen(null); revealRequested.current = -1; }, [state.round]);
  useEffect(() => {
    if (state.phase !== "question") return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [state.phase, state.round]);
  const seconds = now ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : 10;
  const everyoneAnswered = state.players.length > 0 && state.players.every((id) => state.answered[id]);
  useEffect(() => {
    if (!isHost || state.phase !== "question" || (seconds > 0 && !everyoneAnswered) || revealRequested.current === state.round) return;
    revealRequested.current = state.round;
    sendAction("reveal");
  }, [everyoneAnswered, isHost, seconds, sendAction, state.phase, state.round]);
  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(0);
  }, [isHost, onSave, stage, state.phase]);

  const ranking = useMemo(() => Object.entries(state.scores).sort(([, a], [, b]) => b - a), [state.scores]);
  function answer(index: number) {
    if (chosen !== null || seconds <= 0 || state.phase !== "question") return;
    setChosen(index);
    sendAction("answer", { index });
  }

  return <div className="party-game-board game-board-enter trivia-board brain-burst-board">
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/8</span><strong className={seconds <= 3 ? "is-ending" : ""}>{seconds}s</strong></div>
    <h3>{state.question || copy.waiting}</h3>
    {state.phase === "question" && <div className="quiz-options">{state.options.map((option, index) => <button className={chosen === index ? "selected" : ""} disabled={chosen !== null || seconds <= 0} key={option} onClick={() => answer(index)} type="button"><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>)}</div>}
    {chosen !== null && state.phase === "question" && <p className="controller-answered">{copy.accepted}</p>}
    {state.phase === "result" && <div className="trivia-result"><p><b>{copy.correct}:</b> {state.options[state.correct]}</p><div className="trivia-scores">{ranking.map(([userId, score], index) => <p key={userId}><span>#{index + 1} {userId.slice(-8)}</span><strong>{score} {copy.points}</strong></p>)}</div>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 7 ? copy.finish : copy.next}</button>}</div>}
  </div>;
}
