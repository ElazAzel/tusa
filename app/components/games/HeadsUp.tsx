"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const WORDS_EN = ["Elephant", "Pizza", "Karaoke", "Unicorn", "Ninja", "Sushi", "Volcano", "Penguin", "Batman", "Yoga", "Chandelier", "Tornado", "Giraffe", "Disco", "Lobster", "Robot", "Cactus", "Dinosaur", "Mermaid", "Yeti", "Zombie", "T-Rex", "Vampire", "Alien", "Ghost", "Pirate", "Snowman", "Caveman", "Gladiator"];
const WORDS_RU = ["Слон", "Пицца", "Караоке", "Единорог", "Ниндзя", "Суши", "Вулкан", "Пингвин", "Бэтмен", "Йога", "Люстра", "Торнадо", "Жираф", "Диско", "Лобстер", "Робот", "Кактус", "Динозавр", "Русалка", "Йети", "Зомби", "Ти-Рекс", "Вампир", "Инопланетянин", "Призрак", "Пират", "Снеговик", "Пещерный человек", "Гладиатор"];

type GameState = { round: number; phase: "play" | "result"; words: string[]; currentIndex: number; score: number; activePlayer: string; timer: number; direction: "correct" | "skip" | null };

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r;
}

export default function HeadsUp({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const words = useMemo(() => shuffle(locale === "ru" ? WORDS_RU : WORDS_EN), [locale]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ round: 0, phase: "play", words, currentIndex: 0, score: 0, activePlayer: "", timer: 60, direction: null }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { round: 0, phase: "play", words, currentIndex: 0, score: 0, activePlayer: "", timer: 60, direction: null });

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
      if (a.actionType === "correct" && state.phase === "play") setState?.((prev) => ({ ...prev, score: prev.score + 1, currentIndex: prev.currentIndex + 1, direction: "correct" }));
      if (a.actionType === "skip" && state.phase === "play") setState?.((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1, direction: "skip" }));
      if (a.actionType === "setActive" && state.phase === "play") setState?.((prev) => ({ ...prev, activePlayer: a.userId }));
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
  const totalWords = Math.min(state.words.length, 10);

  const correct = useCallback(() => sendAction("correct"), [sendAction]);
  const skip = useCallback(() => sendAction("skip"), [sendAction]);
  const setActivePlayer = useCallback(() => { setIsActive(true); sendAction("setActive"); }, [sendAction]);

  const finish = useCallback(() => { if (!isHost) return; complete?.(); onSave(state.score); }, [isHost, complete, onSave, state.score]);
  const reset = useCallback(() => { if (!isHost) return; setState?.({ round: state.round + 1, phase: "play", words: shuffle(locale === "ru" ? WORDS_RU : WORDS_EN), currentIndex: 0, score: 0, activePlayer: "", timer: 60, direction: null }); }, [state.round, locale, isHost, setState]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("round")} {state.round + 1}</span>
    <div style={{ fontSize: 48, fontWeight: 700, color: state.timer <= 10 ? "var(--red)" : "var(--lime)", margin: "8px 0" }}>{state.timer}s</div>
    {state.phase === "play" && <div>
      <p style={{ color: "var(--gray)", marginBottom: 4 }}>{t("currentWord")}</p>
      <div style={{ fontSize: 28, fontWeight: 700, background: "var(--dark)", borderRadius: 12, padding: 16, textAlign: "center" }}>{currentWord}</div>
      <p style={{ color: "var(--gray)", marginTop: 8 }}>{t("score")}: {state.score} | {t("word")} {state.currentIndex + 1}/{totalWords}</p>
      {state.direction && <p style={{ color: state.direction === "correct" ? "var(--lime)" : "var(--red)", fontWeight: 700, marginTop: 4 }}>{state.direction === "correct" ? `✓ ${t("correct")}` : `⏭ ${t("skipped")}`}</p>}
      {state.activePlayer && <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button className="demo-action demo-action--lime" onClick={correct} type="button" style={{ flex: 1, fontSize: 18, padding: "14px 0" }}>✓ {t("correct")}</button>
        <button className="demo-action demo-action--white" onClick={skip} type="button" style={{ flex: 1, fontSize: 18, padding: "14px 0" }}>⏭ {t("skip")}</button>
      </div>}
      {!state.activePlayer && !isActive && <button className="demo-action demo-action--lime" onClick={setActivePlayer} type="button" style={{ marginTop: 12 }}>{t("startClueing")}</button>}
      {isHost && !state.activePlayer && <button className="demo-action demo-action--lime" onClick={() => setState?.((p) => ({ ...p, activePlayer: "host" }))} type="button" style={{ marginTop: 12 }}>{t("startRound")}</button>}
    </div>}
    {state.phase === "result" && <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 32, fontWeight: 700, color: "var(--lime)" }}>{state.score} {t("pts")}</p>
      {isHost && <><button className="demo-action demo-action--lime" onClick={reset} type="button" style={{ marginTop: 8 }}>{t("playAgain")}</button><button className="demo-action demo-action--white" onClick={finish} type="button" style={{ marginTop: 8 }}>{t("finish")}</button></>}
    </div>}
  </div>;
}

const EN: Record<string, string> = { round: "Round", currentWord: "Team sees this word:", score: "Score", word: "Word", correct: "Correct!", skipped: "Skipped", pts: "pts", startRound: "Start Round", playAgain: "Play Again", finish: "Finish", startClueing: "Start Clueing" };
const RU: Record<string, string> = { round: "Раунд", currentWord: "Команда видит слово:", score: "Счёт", word: "Слово", correct: "Верно!", skipped: "Пропущено", pts: "очк", startRound: "Начать раунд", playAgain: "Ещё раз", finish: "Завершить", startClueing: "Начать подсказки" };
