"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const PAIRS_EN: [string, string][] = [
  ["Hot", "Cold"], ["Sweet", "Sour"], ["Fast", "Slow"], ["Rich", "Poor"],
  ["Easy", "Hard"], ["Happy", "Sad"], ["Old", "New"], ["Light", "Dark"],
  ["Boring", "Exciting"], ["Brave", "Scared"],
];

const PAIRS_RU: [string, string][] = [
  ["Горячо", "Холодно"], ["Сладкое", "Кислое"], ["Быстро", "Медленно"], ["Богатый", "Бедный"],
  ["Лёгкое", "Тяжёлое"], ["Счастливый", "Грустный"], ["Старое", "Новое"], ["Светлое", "Тёмное"],
  ["Скучное", "Захватывающее"], ["Храбрый", "Испуганный"],
];

type GameState = {
  left: string; right: string; target: number;
  clue: number; phase: "clue" | "guess" | "reveal";
  guess: number | null; scores: Record<string, number>;
  lastGuesser: string;
};

function WavelengthStage({ sessionId, partyId, onSave }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const pairs = useMemo(() => locale === "ru" ? PAIRS_RU : PAIRS_EN, [locale]);

  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => {
      const p = pairs[Math.floor(Math.random() * pairs.length)];
      return { left: p[0], right: p[1], target: Math.floor(Math.random() * 9) + 1, clue: 5, phase: "clue", guess: null, scores: {}, lastGuesser: "" };
    },
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "clue" && state.phase === "clue") {
        const { value } = a.payload as { value: number };
        setState((prev) => ({ ...prev, clue: Math.max(1, Math.min(10, value)), phase: "guess" }));
      }
      if (a.actionType === "guess" && state.phase === "guess") {
        const { value } = a.payload as { value: number };
        setState((prev) => ({ ...prev, guess: Math.max(1, Math.min(10, value)), phase: "reveal", lastGuesser: a.userId }));
      }
    }
    clearActions();
  }, [playerActions, state.phase, setState, clearActions]);

  const dist = state.guess !== null ? Math.abs(state.guess - state.target) : 0;
  const pts = dist === 0 ? 3 : dist <= 1 ? 2 : dist <= 2 ? 1 : 0;

  const next = useCallback(() => {
    const p = pairs[Math.floor(Math.random() * pairs.length)];
    const newScores = { ...state.scores };
    if (pts > 0 && state.lastGuesser) {
      newScores[state.lastGuesser] = (newScores[state.lastGuesser] || 0) + pts;
    }
    setState({
      left: p[0], right: p[1], target: Math.floor(Math.random() * 9) + 1,
      clue: 5, phase: "clue", guess: null, scores: newScores, lastGuesser: "",
    });
  }, [pairs, pts, state.scores, state.lastGuesser, setState]);

  const finish = useCallback(() => { complete(); onSave(Math.max(...Object.values(state.scores), 0)); }, [complete, onSave, state.scores]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("wavelength")}</span>
      <h3>{state.left} ↔ {state.right}</h3>
      <div style={{ position: "relative", margin: "16px 0", height: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--gray)" }}>
          <span>{state.left}</span><span>{state.right}</span>
        </div>
        <div style={{ position: "relative", height: 8, background: "#333", borderRadius: 4, marginTop: 8 }}>
          <div style={{ position: "absolute", left: `${((state.clue - 1) / 9) * 100}%`, top: -6, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "10px solid var(--lime)" }} />
          {state.phase === "reveal" && state.guess !== null && (
            <div style={{ position: "absolute", left: `${((state.guess - 1) / 9) * 100}%`, top: -6, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "10px solid var(--red)" }} />
          )}
        </div>
      </div>
      <p style={{ fontSize: 14, color: "var(--gray)" }}>{t("clueLabel")}: {state.clue}</p>
      {state.phase === "reveal" && (
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: pts >= 2 ? "var(--lime)" : pts === 1 ? "#facc15" : "var(--red)" }}>
            {dist === 0 ? "🎯 " : ""}{pts} {t("pts")}
          </p>
          <p style={{ color: "var(--gray)" }}>{t("target")}: {state.target}</p>
          <button className="demo-action demo-action--lime" onClick={next} type="button" style={{ marginTop: 8 }}>{t("next")}</button>
          <button className="demo-action demo-action--white" onClick={finish} type="button" style={{ marginTop: 8 }}>{t("finish")}</button>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function WavelengthController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    left: "", right: "", target: 5, clue: 5, phase: "clue", guess: null, scores: {}, lastGuesser: "",
  });
  const [val, setVal] = useState(5);

  useEffect(() => { setVal(5); }, [state.phase]);

  if (state.phase === "clue") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("spymaster")}</span>
        <h3>{state.left} ↔ {state.right}</h3>
        <p style={{ color: "var(--gray)", marginBottom: 8 }}>{t("targetHidden")}: {state.target}</p>
        <input type="range" min={1} max={10} value={val} onChange={(e) => setVal(Number(e.target.value))} style={{ width: "100%" }} />
        <p style={{ textAlign: "center", fontSize: 32, fontWeight: 700 }}>{val}</p>
        <button className="demo-action demo-action--lime" onClick={() => sendAction("clue", { value: val })} type="button">{t("sendClue")}</button>
      </div>
    );
  }

  if (state.phase === "guess") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("team")}</span>
        <h3>{state.left} ↔ {state.right}</h3>
        <p style={{ color: "var(--gray)", marginBottom: 8 }}>{t("clueLabel")}: {state.clue}</p>
        <input type="range" min={1} max={10} value={val} onChange={(e) => setVal(Number(e.target.value))} style={{ width: "100%" }} />
        <p style={{ textAlign: "center", fontSize: 32, fontWeight: 700 }}>{val}</p>
        <button className="demo-action demo-action--lime" onClick={() => sendAction("guess", { value: val })} type="button">{t("lockGuess")}</button>
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <h3>{state.left} ↔ {state.right}</h3>
      <p style={{ color: "var(--gray)" }}>{t("revealed")}</p>
    </div>
  );
}

const EN: Record<string, string> = {
  wavelength: "Wavelength", spymaster: "Spymaster", team: "Team",
  targetHidden: "Target (hidden)", clueLabel: "Clue position", sendClue: "Send clue",
  lockGuess: "Lock guess", revealed: "Revealing…", pts: "pts", target: "Target", next: "Next", finish: "Finish",
};

const RU: Record<string, string> = {
  wavelength: "Волновая Длина", spymaster: "Шпион", team: "Команда",
  targetHidden: "Цель (скрыта)", clueLabel: "Позиция подсказки", sendClue: "Отправить",
  lockGuess: "Зафиксировать", revealed: "Показ…", pts: "очк", target: "Цель", next: "Далее", finish: "Завершить",
};

export default function Wavelength({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  if (role === "controller" && sessionId) return <WavelengthController sessionId={sessionId} />;
  return <WavelengthStage sessionId={sessionId} partyId={partyId} onSave={onSave} />;
}
