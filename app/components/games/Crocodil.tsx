"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const WORDS_EN = [
  "Cooking dinner", "Running a marathon", "Driving a car", "Fishing",
  "Playing guitar", "Swimming", "Climbing a tree", "Dancing ballet",
  "Building a snowman", "Painting a picture", "Chasing butterflies", "Camping",
  "Walking a dog", "Riding a bicycle", "Making pottery", "Skiing",
  "Yoga pose", "Playing basketball", "Reading a book", "Fighting a dragon",
  "Ironing clothes", "Vacuuming", "Juggling", "Skydiving", "Surfing",
];

const WORDS_RU = [
  "Готовлю ужин", "Бегу марафон", "Веду машину", "Ловлю рыбу",
  "Играю на гитаре", "Плаваю", "Лезу на дерево", "Танцую балет",
  "Леплю снеговика", "Рисую картину", "Ловлю бабочек", "Кемпинг",
  "Выгуливаю собаку", "Езжу на велосипеде", "Делаю гончарное дело", "Катаюсь на лыжах",
  "Поза йоги", "Играю в баскетбол", "Читаю книгу", "Сражусь с драконом",
  "Глажу одежду", "Пылесосю", "Жонглирую", "Прыгаю с парашютом", "Сёрфинг",
];

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

type GameState = {
  round: number;
  phase: "play" | "result";
  words: string[];
  currentIndex: number;
  scores: { teamA: number; teamB: number };
  activeTeam: "A" | "B";
  activePlayer: string;
  timer: number;
  streak: number;
};

function CrocodilStage({ sessionId, partyId, onSave }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const words = useMemo(() => shuffle(locale === "ru" ? WORDS_RU : WORDS_EN), [locale]);

  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({
      round: 0, phase: "play" as const, words,
      currentIndex: 0, scores: { teamA: 0, teamB: 0 },
      activeTeam: "A" as const, activePlayer: "", timer: 60, streak: 0,
    }),
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "correct" && state.phase === "play") {
        const isTeamA = state.activeTeam === "A";
        const streakBonus = state.streak >= 2 ? 1 : 0;
        setState((prev) => ({
          ...prev,
          scores: {
            ...prev.scores,
            [isTeamA ? "teamA" : "teamB"]: prev.scores[isTeamA ? "teamA" : "teamB"] + 1 + streakBonus,
          },
          currentIndex: prev.currentIndex + 1,
          streak: prev.streak + 1,
        }));
      }
      if (a.actionType === "pass" && state.phase === "play") {
        setState((prev) => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          activeTeam: prev.activeTeam === "A" ? "B" : "A",
          streak: 0,
        }));
      }
      if (a.actionType === "setActive" && state.phase === "play") {
        setState((prev) => ({ ...prev, activePlayer: a.userId }));
      }
    }
    clearActions();
  }, [playerActions, state.phase, state.activeTeam, state.streak, setState, clearActions]);

  useEffect(() => {
    if (state.phase !== "play" || state.timer <= 0 || !state.activePlayer) return;
    const id = setTimeout(() => setState((p) => ({ ...p, timer: p.timer - 1 })), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timer, state.activePlayer, setState]);

  useEffect(() => {
    if (state.phase === "play" && state.timer === 0) {
      setState((p) => ({ ...p, phase: "result" }));
    }
  }, [state.timer, state.phase, setState]);

  const currentWord = state.words[state.currentIndex % state.words.length] || "—";
  const winner = state.scores.teamA > state.scores.teamB ? "A" : state.scores.teamB > state.scores.teamA ? "B" : null;

  const finish = useCallback(() => {
    complete();
    onSave(Math.max(state.scores.teamA, state.scores.teamB));
  }, [complete, onSave, state.scores]);

  const reset = useCallback(() => {
    setState({
      round: state.round + 1, phase: "play",
      words: shuffle(locale === "ru" ? WORDS_RU : WORDS_EN),
      currentIndex: 0, scores: { teamA: 0, teamB: 0 },
      activeTeam: "A", activePlayer: "", timer: 60, streak: 0,
    });
  }, [state.round, locale, setState]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}</span>
      <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 12 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--lime)", fontWeight: 700, fontSize: 24 }}>{state.scores.teamA}</p>
          <p style={{ color: "var(--gray)" }}>{t("teamA")}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--red)", fontWeight: 700, fontSize: 24 }}>{state.scores.teamB}</p>
          <p style={{ color: "var(--gray)" }}>{t("teamB")}</p>
        </div>
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, color: state.timer <= 10 ? "var(--red)" : "var(--lime)", margin: "8px 0" }}>
        {state.timer}s
      </div>
      {state.phase === "play" && (
        <div>
          <p style={{ color: "var(--gray)", marginBottom: 4 }}>{t("mimeFor")} {state.activeTeam === "A" ? t("teamA") : t("teamB")}</p>
          <div style={{ fontSize: 28, fontWeight: 700, background: "var(--dark)", borderRadius: 12, padding: 16, textAlign: "center" }}>
            {currentWord}
          </div>
          {state.streak >= 2 && (
            <p style={{ color: "#fbbf24", fontWeight: 700, marginTop: 8 }}>🔥 {t("streak")} {state.streak}</p>
          )}
          {!state.activePlayer && (
            <button className="demo-action demo-action--lime" onClick={() => setState((p) => ({ ...p, activePlayer: "host" }))} type="button" style={{ marginTop: 12 }}>
              {t("startRound")}
            </button>
          )}
        </div>
      )}
      {state.phase === "result" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--lime)" }}>{t("teamA")}: {state.scores.teamA} {t("pts")}</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: "var(--red)" }}>{t("teamB")}: {state.scores.teamB} {t("pts")}</p>
          {winner && <p style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24", marginTop: 8 }}>{t("teamWins")} {winner === "A" ? t("teamA") : t("teamB")}</p>}
          <button className="demo-action demo-action--lime" onClick={reset} type="button" style={{ marginTop: 8 }}>{t("playAgain")}</button>
          <button className="demo-action demo-action--white" onClick={finish} type="button" style={{ marginTop: 8 }}>{t("finish")}</button>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function CrocodilController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    round: 0, phase: "play", words: [], currentIndex: 0,
    scores: { teamA: 0, teamB: 0 }, activeTeam: "A", activePlayer: "", timer: 60, streak: 0,
  });
  const [isMime, setIsMime] = useState(false);

  useEffect(() => { setIsMime(false); }, [state.round]);

  const setActive = useCallback(() => { setIsMime(true); sendAction("setActive"); }, [sendAction]);
  const correct = useCallback(() => sendAction("correct"), [sendAction]);
  const pass = useCallback(() => sendAction("pass"), [sendAction]);

  const currentWord = state.words[state.currentIndex % state.words.length] || "…";

  if (!isMime && state.phase === "play") {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{t("teamView")}</h3>
        <p style={{ color: "var(--gray)", marginBottom: 8 }}>{t("teamDesc")}</p>
        <div style={{ fontSize: 28, fontWeight: 700, background: "var(--dark)", borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 12 }}>
          {currentWord}
        </div>
        <button className="demo-action demo-action--lime" onClick={setActive} type="button">{t("startMiming")}</button>
      </div>
    );
  }

  if (state.phase === "play") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("mimeIt")}</span>
        <h3>{currentWord}</h3>
        <p style={{ color: "var(--gray)", marginBottom: 12 }}>{t("mimeDesc")}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="demo-action demo-action--lime" onClick={correct} type="button" style={{ flex: 1, fontSize: 18, padding: "14px 0" }}>
            ✓ {t("gotIt")}
          </button>
          <button className="demo-action demo-action--white" onClick={pass} type="button" style={{ flex: 1, fontSize: 18, padding: "14px 0" }}>
            ⏭ {t("pass")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <p style={{ fontSize: 18 }}>{t("teamA")}: {state.scores.teamA} {t("pts")}</p>
      <p style={{ fontSize: 18 }}>{t("teamB")}: {state.scores.teamB} {t("pts")}</p>
    </div>
  );
}

const EN: Record<string, string> = {
  round: "Round", teamA: "Team A", teamB: "Team B", mimeFor: "Miming for",
  streak: "streak!", startRound: "Start Round", pts: "pts",
  teamWins: "Team wins!", playAgain: "Play Again", finish: "Finish",
  teamView: "Team View", teamDesc: "Guess the mime out loud!",
  startMiming: "Start Miming", mimeIt: "Mime it!", mimeDesc: "Act out the word, don't speak!",
  gotIt: "Got it!", pass: "Pass",
};

const RU: Record<string, string> = {
  round: "Раунд", teamA: "Команда А", teamB: "Команда Б", mimeFor: "Мимика для",
  streak: "серия!", startRound: "Начать раунд", pts: "очк",
  teamWins: "Победила команда!", playAgain: "Ещё раз", finish: "Завершить",
  teamView: "Взгляд команды", teamDesc: "Угадай мимику вслух!",
  startMiming: "Начать мимику", mimeIt: "Покажи!", mimeDesc: "Покажи слово, не говори!",
  gotIt: "Угадал!", pass: "Пас",
};

export default function Crocodil({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  if (role === "controller" && sessionId) return <CrocodilController sessionId={sessionId} />;
  return <CrocodilStage sessionId={sessionId} partyId={partyId} onSave={onSave} />;
}
