"use client";

import { useEffect, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; viewerId?: string; phase: "play" | "judge" | "result" | "finished"; round: number; prompt: string; judgeId: string; hands: Record<string, string[]>; submissions: Record<string, string>; winner: string; scores: Record<string, number>; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", phase: "play", round: 0, prompt: "", judgeId: "", hands: {}, submissions: {}, winner: "", scores: {}, players: [] });

export default function CardsOfChaos({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { t } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const me = state.viewerId ?? "";
  const isJudge = me === state.judgeId;
  const [picked, setPicked] = useState("");
  const completed = useRef(false);

  useEffect(() => { setPicked(""); }, [state.round]);
  useEffect(() => { if (!isHost || state.phase !== "finished" || completed.current) return; completed.current = true; stage.complete(); onSave(0); }, [isHost, onSave, stage, state.phase]);
  const hand = state.hands[me] ?? [];

  return <div className="party-game-board game-board-enter cards-chaos-board">
    <div className="trivia-head"><span className="game-step">{t("cardsRound")} {state.round + 1}/5</span><span className="multiplayer-badge">LIVE · {Object.keys(state.submissions).length}</span></div>
    <h3>{state.prompt}</h3><p>{isJudge ? t("cardsYourJudge") : `${t("cardsJudge")}: ${state.judgeId.slice(-8)}`}</p>
    {state.phase === "play" && !isJudge && <div className="chaos-hand"><p>{t("cardsChoose")}</p>{hand.map((card) => <button className={picked === card ? "active" : ""} disabled={Boolean(picked)} key={card} onClick={() => { setPicked(card); sendAction("submit", { card }); }} type="button">{card}</button>)}</div>}
    {state.phase === "play" && isJudge && <p className="controller-answered">{t("cardsWaiting")}</p>}
    {state.phase === "judge" && isJudge && <div className="chaos-hand"><p>{t("cardsPickWinner")}</p>{Object.entries(state.submissions).map(([id, card]) => <button key={id} onClick={() => sendAction("judge", { winner: id })} type="button">{card}</button>)}</div>}
    {state.phase === "judge" && !isJudge && <p className="controller-answered">{t("cardsJudging")}</p>}
    {state.phase === "result" && <div className="trivia-result"><p><b>{t("cardsWinner")}:</b> {state.submissions[state.winner]}</p><div className="trivia-scores">{Object.entries(state.scores).sort(([, a], [, b]) => b - a).map(([id, score]) => <p key={id}><span>{id.slice(-8)}</span><strong>{score} {t("cardsPoints")}</strong></p>)}</div>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? t("cardsFinish") : t("cardsNext")}</button>}</div>}
  </div>;
}
