"use client";

import { useEffect, useRef, useState } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";

type GameState = {
  engine: "server-v1";
  viewerId?: string;
  phase: "play" | "result" | "finished";
  round: number;
  activePlayer: string;
  deadline: number;
  word: string;
  score: number;
  roundScore: number;
  skipped: number;
  lastAction?: "correct" | "skip" | "";
  players: string[];
};

const emptyState = (): GameState => ({
  engine: "server-v1",
  phase: "play",
  round: 0,
  activePlayer: "",
  deadline: 0,
  word: "",
  score: 0,
  roundScore: 0,
  skipped: 0,
  lastAction: "",
  players: [],
});

export default function HeadsUp({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, emptyState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, emptyState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [now, setNow] = useState(0);
  const finalized = useRef(-1);
  const completed = useRef(false);
  const me = state.viewerId ?? "";
  const isActive = me === state.activePlayer;
  const canScore = state.phase === "play" && !isActive && Boolean(state.word);
  const copy = locale === "ru"
    ? { title: "Forehead Guess", round: "Раунд", active: "Угадывает", hidden: "Держи телефон у лба. Слово видят остальные.", word: "Слово для подсказок", explain: "Объясняйте без однокоренных слов и без показа экрана.", correct: "Угадал", skip: "Пас", turn: "За ход", total: "Всего", skipped: "Пасов", next: "Следующий игрок", finish: "Завершить" }
    : { title: "Forehead Guess", round: "Round", active: "Guessing", hidden: "Hold the phone to your forehead. Everyone else sees the word.", word: "Word to explain", explain: "Give clues without saying the root word or showing the screen.", correct: "Correct", skip: "Pass", turn: "This turn", total: "Total", skipped: "Passes", next: "Next player", finish: "Finish" };

  useEffect(() => {
    if (state.phase !== "play") return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [state.phase, state.round]);

  const seconds = now ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : 60;

  useEffect(() => {
    if (!isHost || state.phase !== "play" || seconds > 0 || finalized.current === state.round) return;
    finalized.current = state.round;
    sendAction("finalize");
  }, [isHost, seconds, sendAction, state.phase, state.round]);

  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(state.score);
  }, [isHost, onSave, stage, state.phase, state.score]);

  const activeLabel = state.activePlayer ? state.activePlayer.slice(-8) : "stage";

  return <div className="party-game-board game-board-enter charades-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/5</span><strong className={seconds <= 10 ? "is-ending" : ""}>{seconds}s</strong></div>
    <h3>{copy.title}</h3>
    <p>{copy.active}: <b>{activeLabel}</b></p>
    {state.phase === "play" && <>
      {isActive ? <div className="charades-secret"><span>{copy.word}</span><strong>••••••</strong><p>{copy.hidden}</p></div> : <div className="charades-secret"><span>{copy.word}</span><strong>{state.word || "..."}</strong><p>{copy.explain}</p></div>}
      <div className="charades-score"><span>{copy.turn}: <b>{state.roundScore}</b></span><span>{copy.total}: <b>{state.score}</b></span><span>{copy.skipped}: <b>{state.skipped}</b></span></div>
      {state.lastAction && <p className={state.lastAction === "correct" ? "controller-answered is-correct" : "controller-answered"}>{state.lastAction === "correct" ? copy.correct : copy.skip}</p>}
      {canScore && <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={() => sendAction("correct")} type="button">{copy.correct}</button><button className="demo-action demo-action--white" onClick={() => sendAction("skip")} type="button">{copy.skip}</button></div>}
    </>}
    {state.phase === "result" && <div className="trivia-result"><p>{copy.turn}: <b>{state.roundScore}</b> · {copy.total}: <b>{state.score}</b></p>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}</div>}
  </div>;
}
