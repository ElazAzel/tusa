"use client";

import { useEffect, useRef, useState } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";

type GameState = {
  engine: "server-v1";
  viewerId?: string;
  phase: "qa" | "vote" | "reveal" | "finished";
  round: number;
  location: string;
  spyId: string | null;
  turnIndex: number;
  votes: Record<string, string>;
  spyGuess?: string;
  accusedId?: string;
  outcome?: "citizens" | "spy" | "";
  scores: Record<string, number>;
  players: string[];
};

const emptyState = (): GameState => ({
  engine: "server-v1",
  phase: "qa",
  round: 0,
  location: "",
  spyId: null,
  turnIndex: 0,
  votes: {},
  spyGuess: "",
  accusedId: "",
  outcome: "",
  scores: {},
  players: [],
});

export default function Spyfall({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, emptyState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, emptyState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [voteTarget, setVoteTarget] = useState("");
  const [guess, setGuess] = useState("");
  const completed = useRef(false);
  const copy = locale === "ru"
    ? { title: "Lost Location", round: "Раунд", location: "Локация", spy: "Ты шпион", citizen: "Ты на локации", qa: "Задавайте вопросы и ищите того, кто не знает место.", vote: "Голосование", voted: "голосов", choose: "Кого подозреваешь?", guess: "Угадать локацию", guessPlace: "Например, аэропорт", openVote: "Перейти к голосованию", reveal: "Открыть результат", next: "Следующий раунд", finish: "Завершить", accused: "Под подозрением", spyWas: "Шпион", citizensWin: "Горожане нашли шпиона", spyWin: "Шпион выкрутился" }
    : { title: "Lost Location", round: "Round", location: "Location", spy: "You are the spy", citizen: "You are at", qa: "Ask questions and find who does not know the place.", vote: "Voting", voted: "votes", choose: "Who looks suspicious?", guess: "Guess location", guessPlace: "For example, airport", openVote: "Open voting", reveal: "Reveal result", next: "Next round", finish: "Finish", accused: "Accused", spyWas: "Spy", citizensWin: "Citizens found the spy", spyWin: "Spy got away" };

  useEffect(() => { setVoteTarget(""); setGuess(""); }, [state.phase, state.round]);
  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(Math.max(0, ...Object.values(state.scores)));
  }, [isHost, onSave, stage, state.phase, state.scores]);

  const me = state.viewerId ?? "";
  const isSpy = state.spyId === me;
  const players = state.players.length ? state.players : [me].filter(Boolean);
  const voted = Boolean(state.votes[me]);

  return <div className="party-game-board game-board-enter">
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
    <span className="game-step">{copy.round} {state.round + 1}/5</span>
    <h3>{copy.title}</h3>
    {state.phase !== "reveal" && <div className="charades-secret">
      <span>{isSpy ? copy.spy : copy.citizen}</span>
      <strong>{isSpy ? "???" : state.location || "..."}</strong>
      <p>{copy.qa}</p>
    </div>}
    {state.phase === "qa" && <>{isSpy && <div className="game-primary-actions"><input className="bs-input" maxLength={120} onChange={(event) => setGuess(event.target.value)} placeholder={copy.guessPlace} value={guess} /><button className="demo-action demo-action--white" disabled={!guess.trim()} onClick={() => sendAction("spyGuess", { location: guess.trim() })} type="button">{copy.guess}</button></div>}{isHost && <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={() => sendAction("openVote")} type="button">{copy.openVote}</button></div>}</>}
    {state.phase === "vote" && <div>
      <p>{Object.keys(state.votes).length}/{players.length} {copy.voted}</p>
      <div className="quiz-options">{players.map((player) => <button className={voteTarget === player ? "selected" : ""} disabled={voted || voteTarget === player} key={player} onClick={() => { setVoteTarget(player); sendAction("vote", { target: player }); }} type="button">{player.slice(-8)}</button>)}</div>
      {isSpy && <div className="game-primary-actions"><input className="bs-input" maxLength={120} onChange={(event) => setGuess(event.target.value)} placeholder={copy.guessPlace} value={guess} /><button className="demo-action demo-action--white" disabled={!guess.trim()} onClick={() => sendAction("spyGuess", { location: guess.trim() })} type="button">{copy.guess}</button></div>}
      {isHost && <button className="demo-action demo-action--lime" disabled={!Object.keys(state.votes).length} onClick={() => sendAction("reveal")} type="button">{copy.reveal}</button>}
    </div>}
    {state.phase === "reveal" && <div className="trivia-result">
      <p>{copy.location}: <b>{state.location}</b></p>
      <p>{copy.spyWas}: <b>{state.spyId?.slice(-8)}</b></p>
      {state.accusedId && <p>{copy.accused}: <b>{state.accusedId.slice(-8)}</b></p>}
      <h4>{state.outcome === "citizens" ? copy.citizensWin : copy.spyWin}</h4>
      {isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}
    </div>}
  </div>;
}
