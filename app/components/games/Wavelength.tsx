"use client";

import { useEffect, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

type GameState = { engine: "server-v1"; phase: "clue" | "guess" | "reveal" | "finished"; round: number; pair: [string, string]; target: number; clue: string; guesses: Record<string, number>; average?: number | null; roundScore: number; teamScore: number; players: string[] };
const initialState = (): GameState => ({ engine: "server-v1", phase: "clue", round: 0, pair: ["", ""], target: -1, clue: "", guesses: {}, roundScore: 0, teamScore: 0, players: [] });

export default function Wavelength({ sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const isHost = role === "stage";
  const stage = useStageGame<GameState>(isHost ? sessionId ?? null : null, initialState);
  const controller = useControllerGame<GameState>(!isHost ? sessionId ?? null : null, initialState());
  const state = isHost ? stage.state : controller.state;
  const sendAction = isHost ? stage.sendAction : controller.sendAction;
  const [clue, setClue] = useState("");
  const [guess, setGuess] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const completed = useRef(false);
  const copy = locale === "ru" ? { title: "Спектр", round: "Раунд", target: "Секретная цель", clueHint: "Дай ассоциацию, которая приведёт команду к этой точке", cluePlaceholder: "Твоя ассоциация…", send: "Отправить подсказку", guessHint: "Где на шкале находится подсказка?", lock: "Зафиксировать", accepted: "Оценка принята", reveal: "Раскрыть цель", average: "Средняя оценка", points: "очков за раунд", total: "Всего", next: "Следующий раунд", finish: "Завершить", waiting: "Ведущий готовит подсказку" } : { title: "Spectrum", round: "Round", target: "Secret target", clueHint: "Give an association that leads the team to this point", cluePlaceholder: "Your association…", send: "Send clue", guessHint: "Where does the clue sit on the scale?", lock: "Lock guess", accepted: "Guess locked", reveal: "Reveal target", average: "Team average", points: "round points", total: "Total", next: "Next round", finish: "Finish", waiting: "The clue giver is preparing a clue" };

  useEffect(() => { setClue(""); setGuess(5); setSubmitted(false); }, [state.round]);
  useEffect(() => { if (!isHost || state.phase !== "finished" || completed.current) return; completed.current = true; stage.complete(); onSave(0); }, [isHost, onSave, stage, state.phase]);
  const guesses = Object.keys(state.guesses).length;
  const left = state.pair?.[0] ?? "";
  const right = state.pair?.[1] ?? "";
  const marker = (value: number) => `${((value - 1) / 9) * 100}%`;

  return <div className="party-game-board game-board-enter spectrum-board">
    <div className="trivia-head"><span className="game-step">{copy.round} {state.round + 1}/6</span><span className="multiplayer-badge">LIVE · {guesses}</span></div>
    <h3>{copy.title}</h3><div className="spectrum-labels"><b>{left}</b><b>{right}</b></div>
    <div className="spectrum-track">{isHost && state.phase === "clue" && state.target > 0 && <span className="spectrum-target" style={{ left: marker(state.target) }} />}{state.phase === "reveal" && <><span className="spectrum-target" style={{ left: marker(state.target) }} /><span className="spectrum-guess" style={{ left: marker(state.average ?? 5) }} /></>}</div>
    {isHost && state.phase === "clue" && <div className="spectrum-form"><p><b>{copy.target}: {state.target}</b><br />{copy.clueHint}</p><input className="bs-input" aria-label={copy.cluePlaceholder} maxLength={100} onChange={(event) => setClue(event.target.value)} placeholder={copy.cluePlaceholder} value={clue} /><button className="demo-action demo-action--lime" disabled={!clue.trim()} onClick={() => sendAction("clue", { text: clue.trim() })} type="button">{copy.send}</button></div>}
    {!isHost && state.phase === "clue" && <p className="controller-answered">{copy.waiting}</p>}
    {state.phase === "guess" && <div className="spectrum-form"><p><b>“{state.clue}”</b><br />{copy.guessHint}</p>{!isHost && <><input aria-label={copy.guessHint} max={10} min={1} onChange={(event) => setGuess(Number(event.target.value))} type="range" value={guess} /><strong className="spectrum-value">{guess}</strong><button className="demo-action demo-action--lime" disabled={submitted} onClick={() => { setSubmitted(true); sendAction("guess", { value: guess }); }} type="button">{submitted ? copy.accepted : copy.lock}</button></>}{isHost && guesses > 0 && <button className="demo-action demo-action--lime" onClick={() => sendAction("reveal")} type="button">{copy.reveal}</button>}</div>}
    {state.phase === "reveal" && <div className="trivia-result"><p>{copy.average}: <b>{state.average?.toFixed(1)}</b> · {state.roundScore} {copy.points}</p><p>{copy.total}: <b>{state.teamScore}</b></p>{isHost && <button className="demo-action demo-action--lime" onClick={() => sendAction("next")} type="button">{state.round >= 5 ? copy.finish : copy.next}</button>}</div>}
  </div>;
}
