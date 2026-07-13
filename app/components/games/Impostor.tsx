"use client";

import { useEffect, useRef, useState } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";

type GameState = {
  engine: "server-v1";
  viewerId?: string;
  phase: "clue" | "vote" | "reveal" | "finished";
  round: number;
  word: string;
  impostorId: string | null;
  clues: Record<string, string>;
  votes: Record<string, string>;
  guess?: string;
  accusedId?: string;
  outcome?: "crew" | "impostor" | "";
  scores: Record<string, number>;
  players: string[];
};

const emptyState = (): GameState => ({
  engine: "server-v1",
  phase: "clue",
  round: 0,
  word: "",
  impostorId: null,
  clues: {},
  votes: {},
  guess: "",
  accusedId: "",
  outcome: "",
  scores: {},
  players: [],
});

export default function Impostor({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, emptyState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, emptyState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [clue, setClue] = useState("");
  const [voteTarget, setVoteTarget] = useState("");
  const [guess, setGuess] = useState("");
  const completed = useRef(false);
  const copy = locale === "ru"
    ? { title: "Impostor", round: "Раунд", word: "Слово", impostor: "Ты импостор", crew: "Твоё слово", clue: "Подсказка", cluePlace: "Одно слово", send: "Отправить", sent: "Отправлено", openVote: "Перейти к голосованию", vote: "Голосование", voted: "голосов", guess: "Угадать слово", guessPlace: "Например, пицца", reveal: "Открыть результат", next: "Следующий раунд", finish: "Завершить", accused: "Под подозрением", impostorWas: "Импостор", crewWin: "Команда нашла импостора", impostorWin: "Импостор выкрутился" }
    : { title: "Impostor", round: "Round", word: "Word", impostor: "You are the impostor", crew: "Your word", clue: "Clue", cluePlace: "One word", send: "Send", sent: "Sent", openVote: "Open voting", vote: "Voting", voted: "votes", guess: "Guess word", guessPlace: "For example, pizza", reveal: "Reveal result", next: "Next round", finish: "Finish", accused: "Accused", impostorWas: "Impostor", crewWin: "Crew found the impostor", impostorWin: "Impostor got away" };

  useEffect(() => { setClue(""); setVoteTarget(""); setGuess(""); }, [state.phase, state.round]);
  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(Math.max(0, ...Object.values(state.scores)));
  }, [isHost, onSave, stage, state.phase, state.scores]);

  const me = state.viewerId ?? "";
  const isImpostor = state.impostorId === me;
  const players = state.players.length ? state.players : [me].filter(Boolean);
  const hasClue = Boolean(state.clues[me]);
  const voted = Boolean(state.votes[me]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{copy.round} {state.round + 1}/5</span>
    <h3>{copy.title}</h3>
    {state.phase !== "reveal" && <div className="charades-secret">
      <span>{isImpostor ? copy.impostor : copy.crew}</span>
      <strong>{isImpostor ? "???" : state.word || "..."}</strong>
    </div>}
    {state.phase === "clue" && <div>
      <div className="bs-input-group"><input className="bs-input" maxLength={80} onChange={(event) => setClue(event.target.value)} placeholder={copy.cluePlace} value={clue} /><button className="demo-action demo-action--lime" disabled={hasClue || !clue.trim()} onClick={() => sendAction("clue", { clue: clue.trim() })} type="button">{hasClue ? copy.sent : copy.send}</button></div>
      <div className="charades-score"><span>{Object.keys(state.clues).length}/{players.length}</span></div>
      {isImpostor && <div className="game-primary-actions"><input className="bs-input" maxLength={80} onChange={(event) => setGuess(event.target.value)} placeholder={copy.guessPlace} value={guess} /><button className="demo-action demo-action--white" disabled={!guess.trim()} onClick={() => sendAction("guess", { word: guess.trim() })} type="button">{copy.guess}</button></div>}
      {isHost && <button className="demo-action demo-action--lime" disabled={Object.keys(state.clues).length < Math.min(2, players.length)} onClick={() => sendAction("openVote")} type="button">{copy.openVote}</button>}
    </div>}
    {state.phase === "vote" && <div>
      <p>{Object.keys(state.votes).length}/{players.length} {copy.voted}</p>
      <div className="quiz-options">{players.map((player) => <button className={voteTarget === player ? "selected" : ""} disabled={voted || voteTarget === player} key={player} onClick={() => { setVoteTarget(player); sendAction("vote", { target: player }); }} type="button">{player.slice(-8)}</button>)}</div>
      {isImpostor && <div className="game-primary-actions"><input className="bs-input" maxLength={80} onChange={(event) => setGuess(event.target.value)} placeholder={copy.guessPlace} value={guess} /><button className="demo-action demo-action--white" disabled={!guess.trim()} onClick={() => sendAction("guess", { word: guess.trim() })} type="button">{copy.guess}</button></div>}
      {isHost && <button className="demo-action demo-action--lime" disabled={!Object.keys(state.votes).length} onClick={() => sendAction("reveal")} type="button">{copy.reveal}</button>}
    </div>}
    {state.phase === "reveal" && <div className="trivia-result">
      <p>{copy.word}: <b>{state.word}</b></p>
      <p>{copy.impostorWas}: <b>{state.impostorId?.slice(-8)}</b></p>
      {state.accusedId && <p>{copy.accused}: <b>{state.accusedId.slice(-8)}</b></p>}
      <h4>{state.outcome === "crew" ? copy.crewWin : copy.impostorWin}</h4>
      {isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}
    </div>}
  </div>;
}
