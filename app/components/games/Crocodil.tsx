"use client";

import { useEffect, useRef, useState } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";

type Team = "A" | "B";
type GameState = {
  engine: "server-v1";
  viewerId?: string;
  phase: "play" | "result" | "finished";
  round: number;
  teams: Record<Team, string[]>;
  activeTeam: Team;
  activePlayer: string;
  deadline: number;
  word: string;
  scores: Record<Team, number>;
  roundScore: number;
  players: string[];
};

const emptyState = (): GameState => ({
  engine: "server-v1",
  phase: "play",
  round: 0,
  teams: { A: [], B: [] },
  activeTeam: "A",
  activePlayer: "",
  deadline: 0,
  word: "",
  scores: { A: 0, B: 0 },
  roundScore: 0,
  players: [],
});

export default function Crocodil({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
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
  const copy = locale === "ru"
    ? { title: "Mime Riot", round: "Раунд", active: "Показывает", team: "Команда", teamA: "Команда A", teamB: "Команда B", yourWord: "Твоё задание", watch: "Смотри жесты активного игрока. Подсказывать словами нельзя.", correct: "Угадали", pass: "Пас", turn: "За ход", score: "Счёт", next: "Следующий ход", finish: "Завершить" }
    : { title: "Mime Riot", round: "Round", active: "Acting", team: "Team", teamA: "Team A", teamB: "Team B", yourWord: "Your prompt", watch: "Watch the active player's gestures. No spoken hints.", correct: "Correct", pass: "Pass", turn: "This turn", score: "Score", next: "Next turn", finish: "Finish" };

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
    onSave(Math.max(state.scores.A, state.scores.B));
  }, [isHost, onSave, stage, state.phase, state.scores.A, state.scores.B]);

  const activeLabel = state.activeTeam === "A" ? copy.teamA : copy.teamB;
  const activeShort = state.activePlayer ? state.activePlayer.slice(-8) : "stage";

  return <div className="party-game-board game-board-enter charades-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/6</span><strong className={seconds <= 10 ? "is-ending" : ""}>{seconds}s</strong></div>
    <h3>{copy.title}</h3>
    <p>{copy.active}: <b>{activeShort}</b> · {copy.team}: <b>{activeLabel}</b></p>
    <div className="charades-score"><span>{copy.teamA}: <b>{state.scores.A}</b></span><span>{copy.teamB}: <b>{state.scores.B}</b></span></div>
    {state.phase === "play" && <>
      {isActive ? <div className="charades-secret"><span>{copy.yourWord}</span><strong>{state.word}</strong></div> : <p className="controller-answered">{copy.watch}</p>}
      <div className="charades-score"><span>{copy.turn}: <b>{state.roundScore}</b></span><span>{copy.score}: <b>{state.scores.A + state.scores.B}</b></span></div>
      {isActive && <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={() => sendAction("correct")} type="button">{copy.correct}</button><button className="demo-action demo-action--white" onClick={() => sendAction("pass")} type="button">{copy.pass}</button></div>}
    </>}
    {state.phase === "result" && <div className="trivia-result"><p>{activeLabel}: <b>{state.roundScore}</b> · {copy.score}: <b>{state.scores.A}:{state.scores.B}</b></p>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 5 ? copy.finish : copy.next}</button>}</div>}
  </div>;
}
