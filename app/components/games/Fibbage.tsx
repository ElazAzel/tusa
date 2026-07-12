"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const QUESTIONS_EN: { q: string; truth: string }[] = [
  { q: "How many time zones does Russia have?", truth: "11" },
  { q: "What is the national animal of Scotland?", truth: "Unicorn" },
  { q: "How many bones are in a giraffe's neck?", truth: "7" },
  { q: "What country has the most islands?", truth: "Sweden" },
  { q: "What color is an ostrich's eye?", truth: "Orange" },
  { q: "How many hearts does an octopus have?", truth: "3" },
  { q: "What is the driest continent?", truth: "Antarctica" },
  { q: "How long is a elephant's pregnancy?", truth: "22 months" },
  { q: "What is the smallest country in the world?", truth: "Vatican City" },
  { q: "What year was the first iPhone released?", truth: "2007" },
];

const QUESTIONS_RU: { q: string; truth: string }[] = [
  { q: "Сколько часовых поясов в России?", truth: "11" },
  { q: "Какое национальное животное Шотландии?", truth: "Единорог" },
  { q: "Сколько костей в шее жирафа?", truth: "7" },
  { q: "В какой стране больше всего островов?", truth: "Швеция" },
  { q: "Какого цвета глаз у страуса?", truth: "Оранжевый" },
  { q: "Сколько сердец у осьминога?", truth: "3" },
  { q: "Какой континент самый засушливый?", truth: "Антарктида" },
  { q: "Сколько длится беременность слона?", truth: "22 месяца" },
  { q: "Какая самая маленькая страна в мире?", truth: "Ватикан" },
  { q: "В каком году вышел первый iPhone?", truth: "2007" },
];

type Submission = { userId: string; answer: string };
type GameState = {
  round: number; phase: "answer" | "vote" | "reveal";
  question: string; truth: string;
  submissions: Submission[]; votes: Record<string, string>;
  scores: Record<string, number>;
};

function FibbageStage({ sessionId, partyId, onSave }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const questions = useMemo(() => locale === "ru" ? QUESTIONS_RU : QUESTIONS_EN, [locale]);

  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({
      round: 0, phase: "answer", question: questions[0].q, truth: questions[0].truth,
      submissions: [], votes: {}, scores: {},
    }),
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "answer" && state.phase === "answer") {
        const { text } = a.payload as { text: string };
        setState((prev) => ({
          ...prev,
          submissions: [...prev.submissions.filter((s) => s.userId !== a.userId), { userId: a.userId, answer: text }],
        }));
      }
      if (a.actionType === "vote" && state.phase === "vote") {
        const { target } = a.payload as { target: string };
        setState((prev) => ({
          ...prev,
          votes: { ...prev.votes, [a.userId]: target },
        }));
      }
    }
    clearActions();
  }, [playerActions, state.phase, setState, clearActions]);

  const allVoted = useMemo(() => {
    const voterCount = Object.keys(state.votes).length;
    return voterCount >= 2 && voterCount >= state.submissions.length - 1;
  }, [state.votes, state.submissions]);

  const reveal = useCallback(() => {
    const newScores = { ...state.scores };
    for (const voter of Object.keys(state.votes)) {
      const picked = state.votes[voter];
      if (picked !== "truth") {
        newScores[picked] = (newScores[picked] || 0) + 1;
      }
    }
    setState((prev) => ({ ...prev, phase: "reveal", scores: newScores }));
  }, [state.votes, state.scores, setState]);

  const next = useCallback(() => {
    const nextRound = state.round + 1;
    if (nextRound >= Math.min(questions.length, 6)) {
      complete();
      const top = Object.values(state.scores).reduce((a, b) => Math.max(a, b), 0);
      onSave(top);
      return;
    }
    setState({
      round: nextRound, phase: "answer", question: questions[nextRound].q,
      truth: questions[nextRound].truth, submissions: [], votes: {}, scores: state.scores,
    });
  }, [state.round, state.scores, questions, setState, complete, onSave]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}/{Math.min(questions.length, 6)}</span>
      <h3>{state.question}</h3>
      {state.phase === "answer" && (
        <p style={{ color: "#a3a3a3" }}>{t("waitingAnswers")} ({state.submissions.length})</p>
      )}
      {state.phase === "vote" && (
        <div>
          <p style={{ color: "#a3a3a3", marginBottom: 8 }}>{t("votePrompt")}</p>
          {state.submissions.map((s) => (
            <button key={s.userId} type="button" disabled style={{ display: "block", width: "100%", textAlign: "left", background: "#262626", color: "#fff", borderRadius: 8, padding: "10px 14px", marginBottom: 6, border: "none", fontWeight: 600 }}>
              {s.answer}
            </button>
          ))}
          <button type="button" disabled style={{ display: "block", width: "100%", textAlign: "center", background: "#a3e635", color: "#000", borderRadius: 8, padding: "10px 14px", marginBottom: 6, border: "none", fontWeight: 700 }}>
            {state.truth}
          </button>
          {allVoted && <button className="demo-action demo-action--lime" onClick={reveal} type="button" style={{ marginTop: 8 }}>{t("reveal")}</button>}
        </div>
      )}
      {state.phase === "reveal" && (
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#a3e635", marginBottom: 8 }}>{t("truth")}: {state.truth}</p>
          {state.submissions.map((s) => {
            const votes = Object.values(state.votes).filter((v) => v === s.userId).length;
            return (
              <div key={s.userId} style={{ background: "#262626", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                {s.answer} — {votes} {t("tricked")}
              </div>
            );
          })}
          <button className="demo-action demo-action--lime" onClick={next} type="button" style={{ marginTop: 8 }}>
            {state.round >= Math.min(questions.length, 6) - 1 ? t("finish") : t("next")}
          </button>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function FibbageController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    round: 0, phase: "answer", question: "", truth: "", submissions: [], votes: {}, scores: {},
  });
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [votedFor, setVotedFor] = useState<string | null>(null);

  useEffect(() => { setAnswer(""); setSubmitted(false); setVotedFor(null); }, [state.round, state.phase]);

  const submitAnswer = useCallback(() => {
    if (!answer.trim() || submitted) return;
    setSubmitted(true);
    sendAction("answer", { text: answer.trim() });
  }, [answer, submitted, sendAction]);

  const vote = useCallback((target: string) => {
    if (votedFor) return;
    setVotedFor(target);
    sendAction("vote", { target });
  }, [votedFor, sendAction]);

  if (state.phase === "answer") {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{state.question}</h3>
        <input
          className="bs-input" maxLength={80} value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
          placeholder={t("liePlaceholder")}
          style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 8 }}
        />
        <button className="demo-action demo-action--lime" disabled={submitted || !answer.trim()} onClick={submitAnswer} type="button" style={{ marginTop: 8 }}>
          {submitted ? t("submitted") : t("submit")}
        </button>
      </div>
    );
  }

  if (state.phase === "vote") {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{state.question}</h3>
        <p style={{ color: "#a3a3a3", marginBottom: 8 }}>{t("votePrompt")}</p>
        {state.submissions.map((s) => (
          <button
            key={s.userId} type="button" disabled={votedFor !== null}
            onClick={() => vote(s.userId)}
            style={{
              display: "block", width: "100%", textAlign: "left", background: votedFor === s.userId ? "#a3e635" : "#262626",
              color: votedFor === s.userId ? "#000" : "#fff", borderRadius: 8, padding: "10px 14px", marginBottom: 6,
              border: "none", fontWeight: 600, fontSize: 14, cursor: votedFor ? "default" : "pointer",
            }}
          >
            {s.answer}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <h3>{state.question}</h3>
      <p style={{ color: "#a3e635", fontWeight: 700 }}>{t("truth")}: {state.truth}</p>
    </div>
  );
}

const EN: Record<string, string> = {
  round: "Round", waitingAnswers: "Write your lie…", votePrompt: "Pick the real answer!",
  reveal: "Reveal", truth: "Truth", tricked: "tricked", finish: "Finish", next: "Next",
  liePlaceholder: "Type a convincing lie…", submit: "Submit", submitted: "Sent!",
  vote: "Vote",
};

const RU: Record<string, string> = {
  round: "Раунд", waitingAnswers: "Напиши свою ложь…", votePrompt: "Угадай правильный ответ!",
  reveal: "Показать", truth: "Правда", tricked: "обвели вокруг пальца", finish: "Завершить", next: "Далее",
  liePlaceholder: "Напиши правдоподобную ложь…", submit: "Отправить", submitted: "Отправлено!",
  vote: "Голосовать",
};

export default function Fibbage({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  if (role === "controller" && sessionId) return <FibbageController sessionId={sessionId} />;
  return <FibbageStage sessionId={sessionId} partyId={partyId} onSave={onSave} />;
}
