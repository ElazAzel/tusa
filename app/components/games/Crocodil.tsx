"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const WORDS_EN = ["Cooking dinner", "Running a marathon", "Driving a car", "Fishing", "Playing guitar", "Swimming", "Climbing a tree", "Dancing ballet", "Building a snowman", "Painting a picture", "Chasing butterflies", "Camping", "Walking a dog", "Riding a bicycle", "Making pottery", "Skiing", "Yoga pose", "Playing basketball", "Reading a book", "Fighting a dragon", "Ironing clothes", "Vacuuming", "Juggling", "Skydiving", "Surfing"];
const WORDS_RU = ["Готовлю ужин", "Бегу марафон", "Веду машину", "Ловлю рыбу", "Играю на гитаре", "Плаваю", "Лезу на дерево", "Танцую балет", "Леплю снеговика", "Рисую картину", "Ловлю бабочек", "Кемпинг", "Выгуливаю собаку", "Езжу на велосипеде", "Делаю гончарное дело", "Катаюсь на лыжах", "Поза йоги", "Играю в баскетбол", "Читаю книгу", "Сражусь с драконом", "Глажу одежду", "Пылесосю", "Жонглирую", "Прыгаю с парашютом", "Сёрфинг"];

type GameState = { round: number; phase: "play" | "result"; words: string[]; currentIndex: number; scores: { teamA: number; teamB: number }; activeTeam: "A" | "B"; activePlayer: string; timer: number; streak: number };

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r;
}

export default function Crocodil({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const words = useMemo(() => shuffle(locale === "ru" ? WORDS_RU : WORDS_EN), [locale]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ round: 0, phase: "play", words, currentIndex: 0, scores: { teamA: 0, teamB: 0 }, activeTeam: "A", activePlayer: "", timer: 60, streak: 0 }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { round: 0, phase: "play", words, currentIndex: 0, scores: { teamA: 0, teamB: 0 }, activeTeam: "A", activePlayer: "", timer: 60, streak: 0 });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;

  const [isActive, setIsActive] = useState(false);
  useEffect(() => { setIsActive(false); }, [state.round]);
  const complete = isHost ? stageHook.complete : undefined;

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "correct" && state.phase === "play") {
        setState?.((prev) => {
          const streakBonus = prev.streak >= 2 ? 1 : 0;
          const teamKey = prev.activeTeam === "A" ? "teamA" : "teamB";
          return { ...prev, scores: { ...prev.scores, [teamKey]: prev.scores[teamKey] + 1 + streakBonus }, currentIndex: prev.currentIndex + 1, streak: prev.streak + 1 };
        });
      }
      if (a.actionType === "pass" && state.phase === "play") {
        setState?.((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1, activeTeam: prev.activeTeam === "A" ? "B" : "A", streak: 0 }));
      }
      if (a.actionType === "setActive" && state.phase === "play") {
        setState?.((prev) => ({ ...prev, activePlayer: a.userId }));
      }
    }
    clearActions?.();
  }, [playerActions, state.phase, isHost, setState, clearActions]);

  useEffect(() => {
    if (!isHost || state.phase !== "play" || state.timer <= 0 || !state.activePlayer) return;
    const id = setTimeout(() => setState?.((p) => ({ ...p, timer: p.timer - 1 })), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timer, state.activePlayer, isHost, setState]);

  useEffect(() => {
    if (!isHost) return;
    if (state.phase === "play" && state.timer === 0) setState?.((p) => ({ ...p, phase: "result" }));
  }, [state.timer, state.phase, isHost, setState]);

  const currentWord = state.words[state.currentIndex % state.words.length] || "—";
  const winner = state.scores.teamA > state.scores.teamB ? "A" : state.scores.teamB > state.scores.teamA ? "B" : null;

  const correct = useCallback(() => sendAction("correct"), [sendAction]);
  const pass = useCallback(() => sendAction("pass"), [sendAction]);
  const setActive = useCallback(() => { setIsActive(true); sendAction("setActive"); }, [sendAction]);

  const finish = useCallback(() => { if (!isHost) return; complete?.(); onSave(Math.max(state.scores.teamA, state.scores.teamB)); }, [isHost, complete, onSave, state.scores]);
  const reset = useCallback(() => { if (!isHost) return; setState?.({ round: state.round + 1, phase: "play", words: shuffle(locale === "ru" ? WORDS_RU : WORDS_EN), currentIndex: 0, scores: { teamA: 0, teamB: 0 }, activeTeam: "A", activePlayer: "", timer: 60, streak: 0 }); }, [state.round, locale, isHost, setState]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("round")} {state.round + 1}</span>
    <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 12 }}>
      <div style={{ textAlign: "center" }}><p style={{ color: "var(--lime)", fontWeight: 700, fontSize: 24 }}>{state.scores.teamA}</p><p style={{ color: "var(--gray)" }}>{t("teamA")}</p></div>
      <div style={{ textAlign: "center" }}><p style={{ color: "var(--red)", fontWeight: 700, fontSize: 24 }}>{state.scores.teamB}</p><p style={{ color: "var(--gray)" }}>{t("teamB")}</p></div>
    </div>
    <div style={{ fontSize: 48, fontWeight: 700, color: state.timer <= 10 ? "var(--red)" : "var(--lime)", margin: "8px 0" }}>{state.timer}s</div>
    {state.phase === "play" && <div>
      <p style={{ color: "var(--gray)", marginBottom: 4 }}>{t("mimeFor")} {state.activeTeam === "A" ? t("teamA") : t("teamB")}</p>
      <div style={{ fontSize: 28, fontWeight: 700, background: "var(--dark)", borderRadius: 12, padding: 16, textAlign: "center" }}>{currentWord}</div>
      {state.streak >= 2 && <p style={{ color: "#fbbf24", fontWeight: 700, marginTop: 8 }}>🔥 {t("streak")} {state.streak}</p>}
      {state.activePlayer && <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button className="demo-action demo-action--lime" onClick={correct} type="button" style={{ flex: 1, fontSize: 18, padding: "14px 0" }}>✓ {t("gotIt")}</button>
        <button className="demo-action demo-action--white" onClick={pass} type="button" style={{ flex: 1, fontSize: 18, padding: "14px 0" }}>⏭ {t("pass")}</button>
      </div>}
      {!state.activePlayer && !isActive && <button className="demo-action demo-action--lime" onClick={setActive} type="button" style={{ marginTop: 12 }}>{t("startMiming")}</button>}
      {isHost && !state.activePlayer && <button className="demo-action demo-action--lime" onClick={() => setState?.((p) => ({ ...p, activePlayer: "host" }))} type="button" style={{ marginTop: 12 }}>{t("startRound")}</button>}
    </div>}
    {state.phase === "result" && <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 24, fontWeight: 700, color: "var(--lime)" }}>{t("teamA")}: {state.scores.teamA} {t("pts")}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: "var(--red)" }}>{t("teamB")}: {state.scores.teamB} {t("pts")}</p>
      {winner && <p style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24", marginTop: 8 }}>{t("teamWins")} {winner === "A" ? t("teamA") : t("teamB")}</p>}
      {isHost && <><button className="demo-action demo-action--lime" onClick={reset} type="button" style={{ marginTop: 8 }}>{t("playAgain")}</button><button className="demo-action demo-action--white" onClick={finish} type="button" style={{ marginTop: 8 }}>{t("finish")}</button></>}
    </div>}
  </div>;
}

const EN: Record<string, string> = { round: "Round", teamA: "Team A", teamB: "Team B", mimeFor: "Miming for", streak: "streak!", startRound: "Start Round", pts: "pts", teamWins: "Team wins!", playAgain: "Play Again", finish: "Finish", startMiming: "Start Miming", gotIt: "Got it!", pass: "Pass" };
const RU: Record<string, string> = { round: "Раунд", teamA: "Команда А", teamB: "Команда Б", mimeFor: "Мимика для", streak: "серия!", startRound: "Начать раунд", pts: "очк", teamWins: "Победила команда!", playAgain: "Ещё раз", finish: "Завершить", startMiming: "Начать мимику", gotIt: "Угадал!", pass: "Пас" };
