"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const QUESTIONS_EN = [
  { q: "Capital of Kazakhstan?", opts: ["Almaty", "Astana", "Shymkent", "Karaganda"], correct: 1 },
  { q: "How many minutes in 1.5 hours?", opts: ["75", "80", "90", "100"], correct: 2 },
  { q: "Blue + Yellow = ?", opts: ["Purple", "Orange", "Green", "Pink"], correct: 2 },
  { q: "First iPhone year?", opts: ["2005", "2007", "2009", "2011"], correct: 1 },
  { q: "Red Planet?", opts: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
  { q: "Continents on Earth?", opts: ["5", "6", "7", "8"], correct: 2 },
  { q: "Largest ocean?", opts: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
  { q: "Chemical symbol for gold?", opts: ["Go", "Gd", "Au", "Ag"], correct: 2 },
  { q: "Fastest land animal?", opts: ["Lion", "Cheetah", "Horse", "Gazelle"], correct: 1 },
  { q: "How many keys on a piano?", opts: ["76", "88", "92", "108"], correct: 1 },
];

const QUESTIONS_RU = [
  { q: "Столица Казахстана?", opts: ["Алматы", "Астана", "Шымкент", "Караганда"], correct: 1 },
  { q: "Сколько минут в 1.5 часах?", opts: ["75", "80", "90", "100"], correct: 2 },
  { q: "Синий + жёлтый = ?", opts: ["Фиолетовый", "Оранжевый", "Зелёный", "Розовый"], correct: 2 },
  { q: "Год первого iPhone?", opts: ["2005", "2007", "2009", "2011"], correct: 1 },
  { q: "Какую планету называют Красной?", opts: ["Венера", "Марс", "Юпитер", "Сатурн"], correct: 1 },
  { q: "Сколько материков на Земле?", opts: ["5", "6", "7", "8"], correct: 2 },
  { q: "Самый большой океан?", opts: ["Атлантический", "Индийский", "Северный Ледовитый", "Тихий"], correct: 3 },
  { q: "Химический символ золота?", opts: ["Go", "Gd", "Au", "Ag"], correct: 2 },
  { q: "Самое быстрое наземное животное?", opts: ["Лев", "Гепард", "Лошадь", "Газель"], correct: 1 },
  { q: "Сколько клавиш у фортепиано?", opts: ["76", "88", "92", "108"], correct: 1 },
];

type GameState = { round: number; phase: "question" | "results"; question: string; options: string[]; correct: number; timer: number; scores: Record<string, number>; locked: Record<string, boolean> };

function BrainBurstStage({ sessionId, partyId, onSave, questions }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void; questions: { q: string; opts: string[]; correct: number }[] }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({ round: 0, phase: "question", question: questions[0].q, options: questions[0].opts, correct: questions[0].correct, timer: 10, scores: {}, locked: {} })
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "answer" && state.phase === "question" && !state.locked[a.userId]) {
        const idx = (a.payload as { index: number }).index;
        setState((prev) => {
          const newScores = { ...prev.scores };
          if (idx === prev.correct) newScores[a.userId] = (newScores[a.userId] || 0) + (prev.timer > 5 ? 2 : 1);
          return { ...prev, locked: { ...prev.locked, [a.userId]: true }, scores: newScores };
        });
      }
    }
    clearActions();
  }, [playerActions, state.phase, state.locked, state.timer, setState, clearActions]);

  useEffect(() => {
    if (state.phase !== "question" || state.timer <= 0) return;
    const id = setTimeout(() => setState((p) => ({ ...p, timer: p.timer - 1 })), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timer, setState]);

  useEffect(() => {
    if (state.phase === "question" && state.timer === 0) setState((p) => ({ ...p, phase: "results" }));
  }, [state.timer, state.phase, setState]);

  const next = useCallback(() => {
    const nextRound = state.round + 1;
    if (nextRound >= questions.length) {
      complete();
      const topScore = Object.values(state.scores).reduce((a, b) => Math.max(a, b), 0);
      onSave(topScore);
      return;
    }
    const q = questions[nextRound];
    setState((p) => ({ ...p, round: nextRound, phase: "question", question: q.q, options: q.opts, correct: q.correct, timer: 10, locked: {} }));
  }, [state.round, state.scores, questions, setState, complete, onSave]);

  const sorted = useMemo(() => Object.entries(state.scores).sort(([, a], [, b]) => b - a), [state.scores]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}/{questions.length}</span>
      <h3>{state.question}</h3>
      {state.phase === "question" && <p style={{ fontSize: 48, fontWeight: 700, color: state.timer <= 3 ? "var(--red)" : "var(--lime)" }}>{state.timer}s</p>}
      {state.phase === "results" && (
        <div>
          <p style={{ color: "var(--lime)", fontWeight: 700 }}>{t("correct")}: {state.options[state.correct]}</p>
          {sorted.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {sorted.map(([uid, score], i) => <p key={uid}>{i + 1}. {uid.slice(0, 8)} — {score} {t("pts")}</p>)}
            </div>
          )}
          <div className="game-primary-actions">
            <button className="demo-action demo-action--lime" onClick={next} type="button">{state.round >= questions.length - 1 ? t("finish") : t("next")}</button>
          </div>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function BrainBurstController({ sessionId, questions }: { sessionId: string; questions: { q: string; opts: string[]; correct: number }[] }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, { round: 0, phase: "question", question: "", options: [], correct: 0, timer: 10, scores: {}, locked: {} });
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => { setChosen(null); }, [state.round]);

  const answer = useCallback((idx: number) => {
    if (chosen !== null) return;
    setChosen(idx);
    sendAction("answer", { index: idx });
  }, [chosen, sendAction]);

  const q = questions[state.round % questions.length];

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}/{questions.length}</span>
      <h3>{state.question || q.q}</h3>
      <p style={{ fontSize: 32, fontWeight: 700, color: state.timer <= 3 ? "var(--red)" : "var(--lime)" }}>{state.timer}s</p>
      <div className="quiz-options">
        {(state.options.length ? state.options : q.opts).map((opt, i) => (
          <button key={i} className={chosen === i ? "selected" : ""} disabled={chosen !== null} onClick={() => answer(i)} type="button">{opt}</button>
        ))}
      </div>
      {chosen !== null && <p className="controller-answered">{t("answered")}</p>}
    </div>
  );
}

const EN: Record<string, string> = { round: "Round", correct: "Correct answer", pts: "pts", finish: "Finish", next: "Next", answered: "Answered! Wait for results…" };
const RU: Record<string, string> = { round: "Раунд", correct: "Правильный ответ", pts: "очк", finish: "Завершить", next: "Далее", answered: "Отвечено! Жди результатов…" };

export default function BrainBurst({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const questions = useMemo(() => (locale === "ru" ? [...QUESTIONS_RU] : [...QUESTIONS_EN]), [locale]);

  if (role === "controller" && sessionId) return <BrainBurstController sessionId={sessionId} questions={questions} />;
  return <BrainBurstStage sessionId={sessionId} partyId={partyId} onSave={onSave} questions={questions} />;
}
