"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { useStageGame } from "@/app/components/useStageGame";

type MusicState = {
  engine: string;
  game: "guessSong" | "musicQuiz";
  phase: "clue" | "guess" | "reveal" | "finished";
  round: number;
  artist: string;
  year: string;
  fact: string;
  revealedTitle: string;
  deadline: number;
  scores: Record<string, number>;
  guesses: Record<string, string>;
  winner: string;
  players: string[];
};

const emptyState = (): MusicState => ({ engine: "server-v1", game: "guessSong", phase: "clue", round: 0, artist: "", year: "", fact: "", revealedTitle: "", deadline: 0, scores: {}, guesses: {}, winner: "", players: [] });

export default function GuessSong({ sessionId, onSave, role, mode = "guessSong" }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller"; mode?: "guessSong" | "musicQuiz" }) {
  const { locale } = useLocale();
  const isStage = role === "stage";
  const stage = useStageGame<MusicState>(isStage ? sessionId ?? null : null, emptyState);
  const controller = useControllerGame<MusicState>(!isStage ? sessionId ?? null : null, emptyState());
  const state = isStage ? stage.state : controller.state;
  const sendAction = isStage ? stage.sendAction : controller.sendAction;
  const [guess, setGuess] = useState("");
  const [sent, setSent] = useState(false);
  const [now, setNow] = useState(0);
  const transition = useRef("");
  const completed = useRef(false);
  const copy = locale === "ru"
    ? { round: "Раунд", clue: "Подсказка уже на экране", answer: "Название песни", send: "Отправить ответ", waiting: "Ждём следующий этап", reveal: "Ответ", winner: "Первым угадал", nobody: "Никто не угадал", next: "Дальше", finish: "Завершить", points: "очк.", title: mode === "musicQuiz" ? "Музыкальный квиз" : "Угадай песню" }
    : { round: "Round", clue: "The clue is on screen", answer: "Song title", send: "Send answer", waiting: "Waiting for the next stage", reveal: "Answer", winner: "First correct", nobody: "Nobody guessed it", next: "Next", finish: "Finish", points: "pts", title: mode === "musicQuiz" ? "Music Quiz" : "Guess the Song" };

  useEffect(() => { setGuess(""); setSent(false); transition.current = ""; }, [state.round, state.phase]);
  useEffect(() => {
    if (state.phase !== "clue" && state.phase !== "guess") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [state.phase, state.round]);

  const seconds = now > 0 ? Math.max(0, Math.ceil((state.deadline - now) / 1000)) : state.phase === "clue" ? 6 : 12;
  useEffect(() => {
    if (!isStage || !state.deadline || seconds > 0) return;
    const key = `${state.round}:${state.phase}`;
    if (transition.current === key) return;
    transition.current = key;
    sendAction(state.phase === "clue" ? "openGuess" : "reveal");
  }, [isStage, seconds, sendAction, state.deadline, state.phase, state.round]);

  const allAnswered = state.players.length > 0 && state.players.every((id) => Boolean(state.guesses[id]));
  useEffect(() => {
    if (!isStage || state.phase !== "guess" || !allAnswered) return;
    const key = `${state.round}:answers`;
    if (transition.current === key) return;
    transition.current = key;
    sendAction("reveal");
  }, [allAnswered, isStage, sendAction, state.phase, state.round]);

  const sorted = useMemo(() => Object.entries(state.scores).sort(([, left], [, right]) => right - left), [state.scores]);
  useEffect(() => {
    if (!isStage || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(sorted[0]?.[1] ?? 0);
  }, [isStage, onSave, sorted, stage, state.phase]);

  const submit = useCallback(() => {
    if (sent || !guess.trim() || state.phase !== "guess" || seconds <= 0) return;
    setSent(true);
    sendAction("guess", { title: guess.trim() });
  }, [guess, seconds, sendAction, sent, state.phase]);

  return <section className="party-game-board game-board-enter trivia-board" aria-label={copy.title}>
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/5</span><strong className={seconds <= 5 ? "is-ending" : ""}>{seconds}s</strong></div>
    <h3>{copy.title}</h3>
    {(state.phase === "clue" || state.phase === "guess") && <div className="trivia-result"><p>{copy.clue}</p><p><b>{state.artist}</b> · {state.year}</p>{state.phase === "guess" && <p>{state.fact}</p>}</div>}
    {state.phase === "guess" && <div className="game-text-entry"><label htmlFor={`${mode}-answer`}>{copy.answer}</label><input id={`${mode}-answer`} value={guess} onChange={(event) => setGuess(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} disabled={sent || seconds <= 0} maxLength={120} /><button className="demo-action demo-action--lime" onClick={submit} disabled={sent || !guess.trim() || seconds <= 0} type="button">{sent ? copy.waiting : copy.send}</button></div>}
    {state.phase === "reveal" && <div className="trivia-result"><p><b>{copy.reveal}:</b> {state.revealedTitle}</p><p>{state.winner ? `${copy.winner}: ${state.winner.slice(-8)}` : copy.nobody}</p>{sorted.map(([userId, score], index) => <p key={userId}><span>#{index + 1} {userId.slice(-8)}</span> <strong>{score} {copy.points}</strong></p>)}{isStage && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 4 ? copy.finish : copy.next}</button>}</div>}
    {state.phase === "finished" && <div className="trivia-result"><p>{sorted[0] ? `${copy.winner}: ${sorted[0][0].slice(-8)}` : copy.nobody}</p></div>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </section>;
}
