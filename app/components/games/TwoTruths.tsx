"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; phase: "vote" | "reveal" | "finished"; round: number; statements: string[]; lie: number; votes: Record<string, number>; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", phase: "vote", round: 0, statements: [], lie: -1, votes: {}, players: [] });

export default function TwoTruths({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [chosen, setChosen] = useState<number | null>(null);
  const completed = useRef(false);
  const copy = locale === "ru" ? { round: "Раунд", title: "Две правды и ложь", prompt: "Какое утверждение — ложь?", accepted: "Выбор принят", votes: "голосов", reveal: "Раскрыть ложь", lie: "Это ложь", next: "Следующий раунд", finish: "Завершить" } : { round: "Round", title: "Two Truths and a Lie", prompt: "Which statement is the lie?", accepted: "Vote accepted", votes: "votes", reveal: "Reveal the lie", lie: "This is the lie", next: "Next round", finish: "Finish" };

  useEffect(() => { setChosen(null); }, [state.round]);
  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(0);
  }, [isHost, onSave, stage, state.phase]);

  const tally = useMemo(() => state.statements.map((_, index) => Object.values(state.votes).filter((vote) => vote === index).length), [state.statements, state.votes]);
  const totalVotes = Object.keys(state.votes).length;
  function vote(index: number) {
    if (chosen !== null || state.phase !== "vote") return;
    setChosen(index);
    sendAction("vote", { index });
  }

  return <div className="party-game-board game-board-enter two-truths-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/5</span><span className="multiplayer-badge">LIVE · {totalVotes}/{Math.max(totalVotes, state.players.length)}</span></div>
    <h3>{copy.title}</h3><p className="tt-prompt">{copy.prompt}</p>
    <div className="quiz-options">{state.statements.map((statement, index) => <button key={statement} className={`${chosen === index ? "selected" : ""} ${state.phase === "reveal" && state.lie === index ? "tt-lie" : ""}`} disabled={chosen !== null || state.phase !== "vote"} onClick={() => vote(index)} type="button"><b>{index + 1}</b><span>{statement}</span>{state.phase === "reveal" && <strong>{tally[index]} {copy.votes}</strong>}</button>)}</div>
    {chosen !== null && state.phase === "vote" && <p className="controller-answered">{copy.accepted}</p>}
    {state.phase === "reveal" && state.lie >= 0 && <div className="trivia-result"><p><b>{copy.lie}:</b> {state.statements[state.lie]}</p>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}</div>}
    {isHost && state.phase === "vote" && totalVotes > 0 && <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={() => sendAction("reveal")} type="button">{copy.reveal}</button></div>}
  </div>;
}
