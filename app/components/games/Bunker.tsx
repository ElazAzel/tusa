"use client";

import { useEffect, useRef, useState } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useStageGame } from "@/app/components/useStageGame";

type State = { phase:"lobby"|"argue"|"vote"|"result"|"finished"; players:string[]; traits:Record<string,string>; votes:Record<string,string>; survivors:string[]; deadline:number; round:number; viewerId?:string };
const empty = (): State => ({ phase:"lobby", players:[], traits:{}, votes:{}, survivors:[], deadline:0, round:0 });

export default function Bunker({ sessionId, onSave, role }: { partyId:string; sessionId?:string|null; onSave:(score:number)=>void; role?:"stage"|"controller" }) {
  const stageRole = role === "stage";
  const stage = useStageGame<State>(stageRole ? sessionId ?? null : null, empty);
  const controller = useControllerGame<State>(!stageRole ? sessionId ?? null : null, empty());
  const state = stageRole ? stage.state : controller.state;
  const send = stageRole ? stage.sendAction : controller.sendAction;
  const [now, setNow] = useState(() => Date.now());
  const saved = useRef(false);
  useEffect(() => { if (!state.deadline) return; const id=setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, [state.deadline]);
  useEffect(() => { if (!stageRole || state.phase !== "result" || saved.current) return; saved.current=true; stage.complete(); onSave(state.survivors.length); }, [onSave, stage, stageRole, state.phase, state.survivors.length]);
  const seconds = state.deadline ? Math.max(0, Math.ceil((state.deadline-now)/1000)) : 0;
  const me = state.viewerId ?? "";
  const votes = Object.values(state.votes).reduce<Record<string,number>>((all, id) => ({ ...all, [id]:(all[id] ?? 0)+1 }), {});
  return <section className="party-game-board game-board-enter bunker-board">
    <span className="game-step">BUNKER · {state.phase}</span>
    {state.phase === "lobby" && <><h3>Кто попадёт в бункер?</h3><p>Нужно минимум 5 игроков. Сейчас: {state.players.length}</p>{stageRole && <button className="demo-action demo-action--lime" onClick={() => send("start")} type="button">Начать</button>}</>}
    {state.phase === "argue" && <><strong className="game-word-pop">{state.traits[me] ?? "Твоя карта скрыта до старта"}</strong><p>Защити своё место. Время: {seconds} сек.</p>{stageRole && <button className="demo-action demo-action--pink" onClick={() => send("openVote")} type="button">Открыть голосование</button>}</>}
    {state.phase === "vote" && <><p>Голосование · {seconds} сек.</p><div className="alias-actions">{state.players.filter((id) => id !== me).map((id) => <button className="demo-action demo-action--white" disabled={Boolean(state.votes[me])} key={id} onClick={() => send("vote", { target:id })} type="button">Игрок {id.slice(-5)} · {votes[id] ?? 0}</button>)}</div>{stageRole && <button className="demo-action demo-action--lime" onClick={() => send("resolve")} type="button">Подвести итог</button>}</>}
    {(state.phase === "result" || state.phase === "finished") && <><h3>В бункере: {state.survivors.length}</h3><p>{state.survivors.map((id) => id.slice(-5)).join(" · ")}</p>{stageRole && state.phase === "result" && <button className="demo-action demo-action--lime" onClick={() => send("finish")} type="button">Завершить</button>}</>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </section>;
}
