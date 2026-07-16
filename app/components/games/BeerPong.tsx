"use client";

import { useEffect, useRef } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";

type CupState = { engine: string; phase: "active" | "finished"; scores: [number, number]; moves: number };
const initial = (): CupState => ({ engine: "server-v1", phase: "active", scores: [10, 10], moves: 0 });

export default function BeerPong({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const stageRole = role === "stage";
  const stage = useStageGame<CupState>(stageRole ? sessionId ?? null : null, initial);
  const controller = useControllerGame<CupState>(!stageRole ? sessionId ?? null : null, initial());
  const state = stageRole ? stage.state : controller.state;
  const sendAction = stageRole ? stage.sendAction : controller.sendAction;
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Счёт кубков", teamA: "Команда A", teamB: "Команда B", hit: "Попадание", restore: "Вернуть", finish: "Завершить", win: "Победа" } : { title: "Cup Toss Score", teamA: "Team A", teamB: "Team B", hit: "Hit", restore: "Restore", finish: "Finish", win: "Winner" };
  useEffect(() => { if (!stageRole || state.phase !== "finished" || completed.current) return; completed.current = true; stage.complete(); onSave(20 - state.scores[0] - state.scores[1]); }, [onSave, stage, stageRole, state.phase, state.scores]);
  return <section className="party-game-board game-board-enter" aria-label={copy.title}><span className="game-step">{copy.title}</span><div className="beer-teams">{([0, 1] as const).map((team) => <div key={team}><label>{team === 0 ? copy.teamA : copy.teamB}</label><strong className="score-bump" key={`${team}-${state.scores[team]}`}>{state.scores[team]}</strong><div><button className="demo-action demo-action--lime" onClick={() => sendAction("hit", { team })} disabled={state.phase !== "active"} type="button">{copy.hit}</button><button className="demo-action demo-action--white" onClick={() => sendAction("returnCup", { team })} disabled={state.phase !== "active"} type="button">{copy.restore}</button></div></div>)}<b>VS</b></div>{state.phase === "finished" && <p className="trivia-result">{copy.win}: {state.scores[0] === state.scores[1] ? "—" : state.scores[0] < state.scores[1] ? copy.teamA : copy.teamB}</p>}{stageRole && state.phase === "active" && <div className="game-primary-actions"><button className="demo-action demo-action--white" onClick={() => sendAction("finish")} type="button">{copy.finish}</button></div>}{sessionId && <span className="multiplayer-badge">LIVE</span>}</section>;
}
