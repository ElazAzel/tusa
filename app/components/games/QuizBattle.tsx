"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type QuizState = { engine: string; game: string; round: number; phase: "question" | "result" | "finished"; question: string; options: string[]; correct: number; deadline: number; scores: Record<string, number>; answered: Record<string, boolean>; players: string[] };
const initial = (): QuizState => ({ engine: "server-v1", game: "quiz", round: 0, phase: "question", question: "", options: [], correct: -1, deadline: 0, scores: {}, answered: {}, players: [] });

export default function QuizBattle({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<QuizState>(isHost ? sessionId ?? null : null, initial);
  const controller = useControllerGame<QuizState>(!isHost ? sessionId ?? null : null, initial());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const complete = stage.complete;
  const [chosen, setChosen] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const revealRequested = useRef(-1);
  const completionRequested = useRef(false);

  useEffect(() => { setChosen(null); revealRequested.current = -1; }, [state.round]);
  useEffect(() => { if (state.phase !== "question") return; const timer = window.setInterval(() => setNow(Date.now()), 200); return () => window.clearInterval(timer); }, [state.phase, state.round]);
  const seconds = now > 0 ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : 12;
  const everyoneAnswered = state.players.length > 0 && state.players.every((id) => state.answered[id]);

  useEffect(() => {
    if (!isHost || state.phase !== "question" || (seconds > 0 && !everyoneAnswered) || revealRequested.current === state.round) return;
    revealRequested.current = state.round; sendAction("reveal");
  }, [everyoneAnswered, isHost, seconds, sendAction, state.phase, state.round]);

  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completionRequested.current) return;
    completionRequested.current = true; complete(); onSave(0);
  }, [complete, isHost, onSave, state.phase]);

  const sorted = useMemo(() => Object.entries(state.scores).sort(([, a], [, b]) => b - a), [state.scores]);
  const copy = locale === "ru" ? { title: "Квиз-баттл", round: "Вопрос", correct: "Верный ответ", accepted: "Ответ зафиксирован", next: "Следующий вопрос", finish: "Финиш", points: "балл." } : { title: "Quiz Battle", round: "Question", correct: "Correct answer", accepted: "Answer locked", next: "Next question", finish: "Finish", points: "pts" };

  function answer(index: number) { if (chosen !== null || state.phase !== "question" || seconds <= 0) return; setChosen(index); sendAction("answer", { index }); }

  return <div className="party-game-board game-board-enter quiz-battle-board">
    <div className="trivia-head"><span className="game-step">{copy.title} · {copy.round} {state.round + 1}/5</span><strong className={seconds <= 4 ? "is-ending" : ""}>{seconds}s</strong></div>
    <h3>{state.question}</h3>
    {state.phase === "question" && <div className="quiz-options">{state.options.map((option, index) => <button key={option} className={chosen === index ? "selected" : ""} disabled={chosen !== null || seconds <= 0} onClick={() => answer(index)} type="button"><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>)}</div>}
    {chosen !== null && state.phase === "question" && <p className="controller-answered">{copy.accepted}</p>}
    {state.phase === "result" && <div className="trivia-result"><p><b>{copy.correct}:</b> {state.options[state.correct]}</p><div className="trivia-scores">{sorted.map(([userId, score], rank) => <p key={userId}><span>#{rank + 1} {userId.slice(-8)}</span><strong>{score} {copy.points}</strong></p>)}</div>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}</div>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}
