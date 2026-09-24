"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerName } from "@/app/components/PlayerNames";
import { useLocale } from "@/app/components/LocaleProvider";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useStageGame } from "@/app/components/useStageGame";

type Card = { profession:string; health:string; hobby:string; baggage:string; secret:string };
type State = { phase:"lobby"|"argue"|"vote"|"result"|"finished"; players:string[]; scenario?:string; traits:Record<string,string>; cards?:Record<string,Card>; votes:Record<string,string>; survivors:string[]; deadline:number; round:number; viewerId?:string };
const empty = (): State => ({ phase:"lobby", players:[], traits:{}, votes:{}, survivors:[], deadline:0, round:0 });

export default function Bunker({ sessionId, onSave, role }: { partyId:string; sessionId?:string|null; onSave:(score:number)=>void; role?:"stage"|"controller" }) {
  const { locale } = useLocale(); const ru = locale === "ru";
  const playerName = usePlayerName();
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
  const card = state.cards?.[me];
  const cardRows: Array<[keyof Card, string]> = [["profession", ru?"Профессия":"Profession"], ["health", ru?"Здоровье":"Health"], ["hobby", ru?"Хобби":"Hobby"], ["baggage", ru?"Багаж":"Baggage"], ["secret", ru?"Секрет":"Secret"]];
  const votes = Object.values(state.votes).reduce<Record<string,number>>((all, id) => ({ ...all, [id]:(all[id] ?? 0)+1 }), {});
  return <section className="party-game-board game-board-enter bunker-board">
    <span className="game-step">BUNKER · {state.round}</span>
    {state.phase === "lobby" && <><h3>{ru?"Кто попадёт в бункер?":"Who gets into the bunker?"}</h3><p>{ru?"Нужно минимум 5 игроков. Сейчас":"At least 5 players are needed. Now"}: {state.players.length}</p>{stageRole && <button className="demo-action demo-action--lime" onClick={() => send("start")} type="button">{ru?"Начать":"Start"}</button>}</>}
    {state.scenario && state.phase !== "lobby" && <p className="tt-prompt"><b>{ru?"Катастрофа":"Disaster"}:</b> {state.scenario}</p>}
    {state.phase === "argue" && <>{card ? <dl className="bunker-card">{cardRows.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{card[key]}</dd></div>)}</dl> : <strong className="game-word-pop">{state.traits[me] ?? (ru?"Твоя карта скрыта до старта":"Your card stays hidden until the start")}</strong>}<p>{ru?"Защити своё место. Время":"Defend your seat. Time"}: {seconds} {ru?"сек.":"s"}</p>{stageRole && <button className="demo-action demo-action--pink" onClick={() => send("openVote")} type="button">{ru?"Открыть голосование":"Open voting"}</button>}</>}
    {state.phase === "vote" && <><p>{ru?"Голосование":"Voting"} · {seconds} {ru?"сек.":"s"}</p><div className="alias-actions">{state.players.filter((id) => id !== me).map((id) => <button className="demo-action demo-action--white" disabled={Boolean(state.votes[me])} key={id} onClick={() => send("vote", { target:id })} type="button">{playerName(id)} · {votes[id] ?? 0}</button>)}</div>{stageRole && <button className="demo-action demo-action--lime" onClick={() => send("resolve")} type="button">{ru?"Подвести итог":"Resolve vote"}</button>}</>}
    {(state.phase === "result" || state.phase === "finished") && <><h3>{ru?"В бункере":"In the bunker"}: {state.survivors.length}</h3><p>{state.survivors.map((id) => playerName(id)).join(" · ")}</p>{stageRole && state.phase === "result" && <button className="demo-action demo-action--lime" onClick={() => send("finish")} type="button">{ru?"Завершить":"Finish"}</button>}</>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </section>;
}
