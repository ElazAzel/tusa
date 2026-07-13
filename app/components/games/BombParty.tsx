"use client";

import { useEffect, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; phase: "play" | "result" | "finished"; round: number; letter: string; deadline: number; submissions: Record<string, string>; eliminated: string[]; players: string[]; winner?: string | null };
const initialState = (): GameState => ({ engine: "server-v1", phase: "play", round: 0, letter: "", deadline: 0, submissions: {}, eliminated: [], players: [] });

export default function BombParty({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [word, setWord] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [now, setNow] = useState(0);
  const finalized = useRef(-1);
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Словесная бомба", round: "Раунд", hint: "Назови уникальное слово на указанную букву до взрыва", placeholder: "Слово на", submit: "Обезвредить", accepted: "Слово принято", alive: "в игре", answered: "ответили", eliminated: "выбыли", next: "Следующий раунд", finish: "Завершить", spectator: "Ты выбыл, но можешь следить за раундом" } : { title: "Word Bomb", round: "Round", hint: "Enter a unique word starting with the letter before the bomb goes off", placeholder: "Word starting with", submit: "Defuse", accepted: "Word accepted", alive: "alive", answered: "answered", eliminated: "eliminated", next: "Next round", finish: "Finish", spectator: "You're out, but you can watch the round" };

  useEffect(() => { setWord(""); setSubmitted(false); finalized.current = -1; }, [state.round]);
  useEffect(() => { if (state.phase !== "play") return; const timer = window.setInterval(() => setNow(Date.now()), 200); return () => window.clearInterval(timer); }, [state.phase, state.round]);
  const seconds = now ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : 20;
  const alive = state.players.filter((id) => !state.eliminated.includes(id));
  const everyoneAnswered = alive.length > 0 && alive.every((id) => Object.hasOwn(state.submissions, id));
  useEffect(() => {
    if (!isHost || state.phase !== "play" || (seconds > 0 && !everyoneAnswered) || finalized.current === state.round) return;
    finalized.current = state.round;
    sendAction("finalize");
  }, [everyoneAnswered, isHost, seconds, sendAction, state.phase, state.round]);
  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(0);
  }, [isHost, onSave, stage, state.phase]);

  function submit() {
    const value = word.trim();
    if (!value || submitted || state.phase !== "play") return;
    setSubmitted(true);
    sendAction("submit", { word: value });
  }

  return <div className="party-game-board game-board-enter word-bomb-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/10</span><strong className={seconds <= 5 ? "is-ending" : ""}>{seconds}s</strong></div>
    <h3>{copy.title}</h3><p className="tt-prompt">{copy.hint}</p><div className="bp-letter">{state.letter}</div>
    <div className="bp-info"><span>{alive.length} {copy.alive}</span><span>{Object.keys(state.submissions).length} {copy.answered}</span></div>
    {state.phase === "play" && <div className="bs-input-group"><input autoComplete="off" className="bs-input" disabled={submitted} maxLength={40} onChange={(event) => setWord(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder={`${copy.placeholder} ${state.letter}…`} value={word} /><button className="demo-action demo-action--lime" disabled={submitted || !word.trim()} onClick={submit} type="button">{submitted ? copy.accepted : copy.submit}</button></div>}
    {state.phase === "result" && <div className="trivia-result"><p>{copy.eliminated}: {state.eliminated.length}</p>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{alive.length <= 1 || state.round >= 9 ? copy.finish : copy.next}</button>}</div>}
  </div>;
}
