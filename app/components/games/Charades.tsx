"use client";

import { useEffect, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; viewerId?: string; phase: "play" | "result" | "finished"; round: number; activePlayer: string; deadline: number; word: string; score: number; roundScore: number; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", phase: "play", round: 0, activePlayer: "", deadline: 0, word: "", score: 0, roundScore: 0, players: [] });

export default function Charades({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [now, setNow] = useState(0);
  const finalized = useRef(-1);
  const completed = useRef(false);
  const me = state.viewerId ?? "";
  const isActive = me === state.activePlayer;
  const copy = locale === "ru" ? { title: "Шарады", round: "Раунд", active: "Объясняет", yourWord: "Твоё слово", watch: "Следи за жестами активного игрока", correct: "Угадано", skip: "Пропустить", roundScore: "За раунд", total: "Всего", next: "Следующий игрок", finish: "Завершить" } : { title: "Charades", round: "Round", active: "Acting", yourWord: "Your word", watch: "Watch the active player's gestures", correct: "Correct", skip: "Skip", roundScore: "This turn", total: "Total", next: "Next player", finish: "Finish" };

  useEffect(() => { if (state.phase !== "play") return; const timer = window.setInterval(() => setNow(Date.now()), 200); return () => window.clearInterval(timer); }, [state.phase, state.round]);
  const seconds = now ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : 60;
  useEffect(() => { if (!isHost || state.phase !== "play" || seconds > 0 || finalized.current === state.round) return; finalized.current = state.round; sendAction("finalize"); }, [isHost, seconds, sendAction, state.phase, state.round]);
  useEffect(() => { if (!isHost || state.phase !== "finished" || completed.current) return; completed.current = true; stage.complete(); onSave(0); }, [isHost, onSave, stage, state.phase]);

  return <div className="party-game-board game-board-enter charades-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/5</span><strong className={seconds <= 10 ? "is-ending" : ""}>{seconds}s</strong></div>
    <h3>{copy.title}</h3><p>{copy.active}: <b>{state.activePlayer.slice(-8)}</b></p>
    {state.phase === "play" && <>{isActive ? <div className="charades-secret"><span>{copy.yourWord}</span><strong>{state.word}</strong></div> : <p className="controller-answered">{copy.watch}</p>}<div className="charades-score"><span>{copy.roundScore}: <b>{state.roundScore}</b></span><span>{copy.total}: <b>{state.score}</b></span></div>{isActive && <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={() => sendAction("correct")} type="button">{copy.correct}</button><button className="demo-action demo-action--white" onClick={() => sendAction("skip")} type="button">{copy.skip}</button></div>}</>}
    {state.phase === "result" && <div className="trivia-result"><p>{copy.roundScore}: <b>{state.roundScore}</b> · {copy.total}: <b>{state.score}</b></p>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}</div>}
  </div>;
}
