"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type Choice = "a" | "b";
type GameState = {
  engine: "server-v1";
  game: "wouldRather";
  locale: "ru" | "en";
  phase: "vote" | "reveal" | "finished";
  round: number;
  prompt: { a: string; b: string };
  votes: Record<string, Choice>;
  players: string[];
};

const initialState = (): GameState => ({
  engine: "server-v1",
  game: "wouldRather",
  locale: "ru",
  phase: "vote",
  round: 0,
  prompt: { a: "", b: "" },
  votes: {},
  players: [],
});

export default function WouldYouRather({ sessionId, onSave, role }: {
  partyId: string;
  sessionId?: string | null;
  onSave: (score: number) => void;
  role?: "stage" | "controller";
}) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [chosen, setChosen] = useState<Choice | null>(null);
  const completionRequested = useRef(false);

  const copy = locale === "ru"
    ? { round: "Раунд", title: "Что выберешь?", votes: "голосов", voted: "Твой выбор принят", reveal: "Показать результат", winner: "Выбор большинства", tie: "Поровну", finish: "Завершить", next: "Следующий раунд", waiting: "Ждём вопрос…" }
    : { round: "Round", title: "Would You Rather?", votes: "votes", voted: "Your vote is in", reveal: "Reveal result", winner: "Majority choice", tie: "It's a tie", finish: "Finish", next: "Next round", waiting: "Waiting for the prompt…" };

  useEffect(() => { setChosen(null); }, [state.round]);
  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completionRequested.current) return;
    completionRequested.current = true;
    stage.complete();
    onSave(0);
  }, [isHost, onSave, stage, state.phase]);

  const counts = useMemo(() => Object.values(state.votes).reduce((total, vote) => {
    total[vote] += 1;
    return total;
  }, { a: 0, b: 0 }), [state.votes]);
  const totalVotes = counts.a + counts.b;
  const prompt = state.prompt.a ? state.prompt : { a: copy.waiting, b: copy.waiting };

  function vote(choice: Choice) {
    if (chosen || state.phase !== "vote") return;
    setChosen(choice);
    sendAction("vote", { choice });
  }

  const winningChoice = counts.a === counts.b ? null : counts.a > counts.b ? "a" : "b";

  return <div className="party-game-board game-board-enter would-rather-board">
    <div className="trivia-head">
      <span className="game-step">{copy.round} {state.round + 1}/8</span>
      <span className="multiplayer-badge">LIVE · {totalVotes}/{Math.max(state.players.length, totalVotes)}</span>
    </div>
    <h3>{copy.title}</h3>
    <div className="quiz-options would-rather-options">
      {(["a", "b"] as const).map((choice) => <button
        key={choice}
        className={chosen === choice ? "selected" : ""}
        disabled={Boolean(chosen) || state.phase !== "vote"}
        onClick={() => vote(choice)}
        type="button"
      >
        <b>{choice.toUpperCase()}</b>
        <span>{prompt[choice]}</span>
        {state.phase === "reveal" && <strong>{counts[choice]} {copy.votes}</strong>}
      </button>)}
    </div>
    {chosen && state.phase === "vote" && <p className="controller-answered">{copy.voted}</p>}
    {state.phase === "reveal" && <div className="trivia-result">
      <p><b>{winningChoice ? copy.winner : copy.tie}:</b> {winningChoice ? prompt[winningChoice] : `${counts.a} : ${counts.b}`}</p>
      {isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 7 ? copy.finish : copy.next}</button>}
    </div>}
    {isHost && state.phase === "vote" && totalVotes > 0 && <div className="game-primary-actions">
      <button className="demo-action demo-action--lime" onClick={() => sendAction("reveal")} type="button">{copy.reveal}</button>
    </div>}
  </div>;
}
