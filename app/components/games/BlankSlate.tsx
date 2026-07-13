"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; phase: "write" | "reveal" | "finished"; round: number; prompt: string; submissions: Record<string, string>; roundMatches: number; totalMatches: number; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", phase: "write", round: 0, prompt: "", submissions: {}, roundMatches: 0, totalMatches: 0, players: [] });

export default function BlankSlate({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Одно слово", round: "Раунд", hint: "Напиши первую ассоциацию. Совпадения принесут очки группе.", placeholder: "Твоё слово…", submit: "Отправить", accepted: "Ответ сохранён", reveal: "Открыть ответы", matches: "Совпавших ответов", none: "В этом раунде совпадений нет", next: "Следующий раунд", finish: "Завершить" } : { title: "Same Word", round: "Round", hint: "Write your first association. Matching answers score for the group.", placeholder: "Your word…", submit: "Submit", accepted: "Answer saved", reveal: "Reveal answers", matches: "Matching answers", none: "No matches this round", next: "Next round", finish: "Finish" };

  useEffect(() => { setAnswer(""); setSubmitted(false); }, [state.round]);
  useEffect(() => {
    if (!isHost || state.phase !== "finished" || completed.current) return;
    completed.current = true;
    stage.complete();
    onSave(0);
  }, [isHost, onSave, stage, state.phase]);
  const entries = useMemo(() => Object.entries(state.submissions), [state.submissions]);
  const groups = useMemo(() => entries.reduce<Record<string, number>>((all, [, value]) => { if (value) { const key = value.toLocaleLowerCase(locale); all[key] = (all[key] ?? 0) + 1; } return all; }, {}), [entries, locale]);
  function submit() {
    const value = answer.trim();
    if (!value || submitted || state.phase !== "write") return;
    setSubmitted(true);
    sendAction("submit", { answer: value });
  }

  return <div className="party-game-board game-board-enter same-word-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/6</span><span className="multiplayer-badge">LIVE · {entries.length}/{Math.max(entries.length, state.players.length)}</span></div>
    <h3>{copy.title}</h3><p className="tt-prompt">{copy.hint}</p><div className="bs-word">{state.prompt}</div>
    {state.phase === "write" && <div className="bs-input-group"><label><span className="sr-only">{copy.placeholder}</span><input autoComplete="off" className="bs-input" disabled={submitted} maxLength={40} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder={copy.placeholder} value={answer} /></label><button className="demo-action demo-action--lime" disabled={submitted || !answer.trim()} onClick={submit} type="button">{submitted ? copy.accepted : copy.submit}</button></div>}
    <div className="bs-subs">{entries.map(([userId, value]) => <div className={`bs-sub ${state.phase === "reveal" && groups[value.toLocaleLowerCase(locale)] > 1 ? "bs-match" : ""}`} key={userId}>{state.phase === "reveal" ? value : "•••"}</div>)}</div>
    {state.phase === "reveal" && <div className="trivia-result"><p>{state.roundMatches > 0 ? `${copy.matches}: ${state.roundMatches}` : copy.none}</p>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 5 ? copy.finish : copy.next}</button>}</div>}
    {isHost && state.phase === "write" && entries.length > 0 && <button className="demo-action demo-action--lime" onClick={() => sendAction("reveal")} type="button">{copy.reveal}</button>}
  </div>;
}
