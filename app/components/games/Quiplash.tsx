"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; phase: "answer" | "vote" | "reveal" | "finished"; round: number; prompt: string; submissions: Record<string, string>; votes: Record<string, string>; scores: Record<string, number>; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", phase: "answer", round: 0, prompt: "", submissions: {}, votes: {}, scores: {}, players: [] });

export default function Quiplash({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [voted, setVoted] = useState(false);
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Панчлайн", round: "Раунд", hint: "Придумай самый смешной ответ", placeholder: "Твой ответ…", submit: "Отправить", accepted: "Ответ сохранён", answers: "ответов", open: "Открыть голосование", vote: "Выбери лучший ответ", voted: "Голос принят", reveal: "Показать результаты", votes: "голосов", points: "очк.", next: "Следующий раунд", finish: "Завершить" } : { title: "Punchline", round: "Round", hint: "Write the funniest answer you can", placeholder: "Your answer…", submit: "Submit", accepted: "Answer saved", answers: "answers", open: "Open voting", vote: "Choose the best answer", voted: "Vote accepted", reveal: "Reveal results", votes: "votes", points: "pts", next: "Next round", finish: "Finish" };

  useEffect(() => { setAnswer(""); setSubmitted(false); setVoted(false); }, [state.round, state.phase]);
  useEffect(() => { if (!isHost || state.phase !== "finished" || completed.current) return; completed.current = true; stage.complete(); onSave(0); }, [isHost, onSave, stage, state.phase]);
  const entries = useMemo(() => Object.entries(state.submissions), [state.submissions]);
  const tally = useMemo(() => Object.values(state.votes).reduce<Record<string, number>>((all, id) => { all[id] = (all[id] ?? 0) + 1; return all; }, {}), [state.votes]);
  function submit() { const text = answer.trim(); if (!text || submitted) return; setSubmitted(true); sendAction("answer", { text }); }

  return <div className="party-game-board game-board-enter punchline-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/6</span><span className="multiplayer-badge">LIVE · {entries.length}/{Math.max(entries.length, state.players.length)}</span></div>
    <h3>{state.prompt}</h3>
    {state.phase === "answer" && <div className="spectrum-form"><p>{copy.hint}</p><input autoComplete="off" className="bs-input" disabled={submitted} aria-label={copy.placeholder} maxLength={160} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder={copy.placeholder} value={answer} /><button className="demo-action demo-action--lime" disabled={submitted || !answer.trim()} onClick={submit} type="button">{submitted ? copy.accepted : copy.submit}</button>{isHost && entries.length >= 2 && <button className="demo-action demo-action--white" onClick={() => sendAction("openVote")} type="button">{copy.open}</button>}</div>}
    {state.phase === "vote" && <div className="punchline-answers"><p>{copy.vote}</p>{entries.map(([id, text]) => <button disabled={voted} key={id} onClick={() => { setVoted(true); sendAction("vote", { target: id }); }} type="button">{text}</button>)}{voted && <p className="controller-answered">{copy.voted}</p>}{isHost && Object.keys(state.votes).length > 0 && <button className="demo-action demo-action--lime" onClick={() => sendAction("reveal")} type="button">{copy.reveal}</button>}</div>}
    {state.phase === "reveal" && <div className="punchline-answers">{entries.sort(([a], [b]) => (tally[b] ?? 0) - (tally[a] ?? 0)).map(([id, text]) => <article key={id}><p>“{text}”</p><strong>{tally[id] ?? 0} {copy.votes} · {state.scores[id] ?? 0} {copy.points}</strong></article>)}{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 5 ? copy.finish : copy.next}</button>}</div>}
  </div>;
}
