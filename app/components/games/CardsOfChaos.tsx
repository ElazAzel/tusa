"use client";

import { useEffect, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; viewerId?: string; phase: "play" | "judge" | "result" | "finished"; round: number; prompt: string; judgeId: string; hands: Record<string, string[]>; submissions: Record<string, string>; winner: string; scores: Record<string, number>; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", phase: "play", round: 0, prompt: "", judgeId: "", hands: {}, submissions: {}, winner: "", scores: {}, players: [] });

export default function CardsOfChaos({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const me = state.viewerId ?? "";
  const isJudge = me === state.judgeId;
  const [picked, setPicked] = useState("");
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Карты хаоса", round: "Раунд", judge: "Судья", yourJudge: "Ты судья этого раунда", choose: "Выбери карту для ответа", waiting: "Ждём карты игроков", judging: "Судья выбирает победителя", pickWinner: "Выбери лучшую карту", winner: "Победитель раунда", next: "Следующий раунд", finish: "Завершить", points: "побед" } : { title: "Cards of Chaos", round: "Round", judge: "Judge", yourJudge: "You are this round's judge", choose: "Choose a card to complete the prompt", waiting: "Waiting for player cards", judging: "The judge is choosing", pickWinner: "Choose the best card", winner: "Round winner", next: "Next round", finish: "Finish", points: "wins" };

  useEffect(() => { setPicked(""); }, [state.round]);
  useEffect(() => { if (!isHost || state.phase !== "finished" || completed.current) return; completed.current = true; stage.complete(); onSave(0); }, [isHost, onSave, stage, state.phase]);
  const hand = state.hands[me] ?? [];

  return <div className="party-game-board game-board-enter cards-chaos-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/5</span><span className="multiplayer-badge">LIVE · {Object.keys(state.submissions).length}</span></div>
    <h3>{state.prompt}</h3><p>{isJudge ? copy.yourJudge : `${copy.judge}: ${state.judgeId.slice(-8)}`}</p>
    {state.phase === "play" && !isJudge && <div className="chaos-hand"><p>{copy.choose}</p>{hand.map((card) => <button className={picked === card ? "active" : ""} disabled={Boolean(picked)} key={card} onClick={() => { setPicked(card); sendAction("submit", { card }); }} type="button">{card}</button>)}</div>}
    {state.phase === "play" && isJudge && <p className="controller-answered">{copy.waiting}</p>}
    {state.phase === "judge" && isJudge && <div className="chaos-hand"><p>{copy.pickWinner}</p>{Object.entries(state.submissions).map(([id, card]) => <button key={id} onClick={() => sendAction("judge", { winner: id })} type="button">{card}</button>)}</div>}
    {state.phase === "judge" && !isJudge && <p className="controller-answered">{copy.judging}</p>}
    {state.phase === "result" && <div className="trivia-result"><p><b>{copy.winner}:</b> {state.submissions[state.winner]}</p><div className="trivia-scores">{Object.entries(state.scores).sort(([, a], [, b]) => b - a).map(([id, score]) => <p key={id}><span>{id.slice(-8)}</span><strong>{score} {copy.points}</strong></p>)}</div>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}</div>}
  </div>;
}
