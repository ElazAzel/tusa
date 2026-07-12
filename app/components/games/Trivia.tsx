"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const QUESTIONS_EN = [
  { q: "What planet is closest to the Sun?", opts: ["Venus", "Mercury", "Mars", "Earth"], correct: 1 },
  { q: "How many bones in the human body?", opts: ["106", "206", "306", "406"], correct: 1 },
  { q: "Who painted the Mona Lisa?", opts: ["Michelangelo", "Da Vinci", "Raphael", "Donatello"], correct: 1 },
  { q: "Which element has symbol Fe?", opts: ["Silver", "Iron", "Copper", "Tin"], correct: 1 },
  { q: "What year did WWII end?", opts: ["1943", "1944", "1945", "1946"], correct: 2 },
  { q: "Largest desert on Earth?", opts: ["Sahara", "Gobi", "Antarctic", "Arabian"], correct: 2 },
  { q: "Which country invented paper?", opts: ["India", "Egypt", "China", "Greece"], correct: 2 },
  { q: "Longest river in the world?", opts: ["Amazon", "Nile", "Yangtze", "Mississippi"], correct: 1 },
  { q: "How many hearts does an octopus have?", opts: ["1", "2", "3", "4"], correct: 2 },
  { q: "Which animal can sleep for 3 years?", opts: ["Bear", "Snail", "Turtle", "Frog"], correct: 1 },
  { q: "Rarest blood type?", opts: ["A", "B", "AB", "O"], correct: 2 },
  { q: "How many stars on the US flag?", opts: ["48", "49", "50", "52"], correct: 2 },
];

const QUESTIONS_RU = [
  { q: "Какая планета ближе всего к Солнцу?", opts: ["Венера", "Меркурий", "Марс", "Земля"], correct: 1 },
  { q: "Сколько костей в теле человека?", opts: ["106", "206", "306", "406"], correct: 1 },
  { q: "Кто написал Мону Лизу?", opts: ["Микеланджело", "Да Винчи", "Рафаэль", "Донателло"], correct: 1 },
  { q: "У какого элемента символ Fe?", opts: ["Серебро", "Железо", "Медь", "Олово"], correct: 1 },
  { q: "В каком году закончилась Вторая мировая?", opts: ["1943", "1944", "1945", "1946"], correct: 2 },
  { q: "Самая большая пустыня на Земле?", opts: ["Сахара", "Гоби", "Антарктическая", "Аравийская"], correct: 2 },
  { q: "Какая страна изобрела бумагу?", opts: ["Индия", "Египет", "Китай", "Греция"], correct: 2 },
  { q: "Самая длинная река в мире?", opts: ["Амазонка", "Нил", "Янцзы", "Миссисипи"], correct: 1 },
  { q: "Сколько сердец у осьминога?", opts: ["1", "2", "3", "4"], correct: 2 },
  { q: "Какое животное может спать 3 года?", opts: ["Медведь", "Улитка", "Черепаха", "Лягушка"], correct: 1 },
  { q: "Самая редкая группа крови?", opts: ["A", "B", "AB", "O"], correct: 2 },
  { q: "Сколько звёзд на флаге США?", opts: ["48", "49", "50", "52"], correct: 2 },
];

type GameState = { round: number; phase: "question" | "result"; question: string; options: string[]; correct: number; timer: number; scores: Record<string, number> };

function TriviaStage({ sessionId, partyId, onSave, questions }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void; questions: { q: string; opts: string[]; correct: number }[] }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({ round: 0, phase: "question", question: questions[0].q, options: questions[0].opts, correct: questions[0].correct, timer: 15, scores: {} })
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "answer" && state.phase === "question") {
        const idx = (a.payload as { index: number }).index;
        if (idx === state.correct) {
          setState((prev) => ({ ...prev, scores: { ...prev.scores, [a.userId]: (prev.scores[a.userId] || 0) + (prev.timer > 8 ? 2 : 1) } }));
        }
      }
    }
    clearActions();
  }, [playerActions, state.phase, state.correct, state.timer, setState, clearActions]);

  useEffect(() => {
    if (state.phase !== "question" || state.timer <= 0) return;
    const id = setTimeout(() => setState((p) => ({ ...p, timer: p.timer - 1 })), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timer, setState]);

  useEffect(() => {
    if (state.phase === "question" && state.timer === 0) setState((p) => ({ ...p, phase: "result" }));
  }, [state.timer, state.phase, setState]);

  const next = useCallback(() => {
    const nextRound = state.round + 1;
    if (nextRound >= questions.length) {
      complete();
      const top = Object.values(state.scores).reduce((a, b) => Math.max(a, b), 0);
      onSave(top);
      return;
    }
    const q = questions[nextRound];
    setState((p) => ({ ...p, round: nextRound, phase: "question", question: q.q, options: q.opts, correct: q.correct, timer: 15 }));
  }, [state.round, state.scores, questions, setState, complete, onSave]);

  const sorted = useMemo(() => Object.entries(state.scores).sort(([, a], [, b]) => b - a), [state.scores]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}/{questions.length}</span>
      <h3>{state.question}</h3>
      {state.phase === "question" && <p style={{ fontSize: 48, fontWeight: 700, color: state.timer <= 5 ? "#f87171" : "#a3e635" }}>{state.timer}s</p>}
      {state.phase === "result" && (
        <div>
          <p style={{ color: "#a3e635", fontWeight: 700 }}>{t("correct")}: {state.options[state.correct]}</p>
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

function TriviaController({ sessionId, questions }: { sessionId: string; questions: { q: string; opts: string[]; correct: number }[] }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, { round: 0, phase: "question", question: "", options: [], correct: 0, timer: 15, scores: {} });
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
      <p style={{ fontSize: 32, fontWeight: 700, color: state.timer <= 5 ? "#f87171" : "#a3e635" }}>{state.timer}s</p>
      <div className="quiz-options">
        {(state.options.length ? state.options : q.opts).map((opt, i) => (
          <button key={i} className={chosen === i ? "selected" : ""} disabled={chosen !== null} onClick={() => answer(i)} type="button">{opt}</button>
        ))}
      </div>
      {chosen !== null && <p className="controller-answered">{t("answered")}</p>}
    </div>
  );
}

const EN: Record<string, string> = { round: "Round", correct: "Correct answer", pts: "pts", finish: "Finish", next: "Next", answered: "Answered! Wait…" };
const RU: Record<string, string> = { round: "Раунд", correct: "Правильный ответ", pts: "очк", finish: "Завершить", next: "Далее", answered: "Отвечено! Жди…" };

export default function Trivia({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const questions = useMemo(() => (locale === "ru" ? [...QUESTIONS_RU] : [...QUESTIONS_EN]), [locale]);

  if (role === "controller" && sessionId) return <TriviaController sessionId={sessionId} questions={questions} />;
  return <TriviaStage sessionId={sessionId} partyId={partyId} onSave={onSave} questions={questions} />;
}
