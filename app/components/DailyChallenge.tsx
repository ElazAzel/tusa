"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

type PublicQuestion = { id: string; prompt: { ru: string; en: string }; options: { ru: string[]; en: string[] } };
type Challenge = { id: string; game: string; questions: PublicQuestion[] };

export default function DailyChallenge({ partyId: _partyId }: { partyId: string }) {
  const { locale, t } = useLocale();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ userId: string; displayName: string; score: number }>>([]);
  const [answers, setAnswers] = useState<Array<{ questionId: string; answer: number }>>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/daily?game=trivia").then((response) => response.json()).then((data) => {
      setChallenge(data.challenge ?? null);
      if (data.challenge?.id) fetch(`/api/daily?leaderboard=${data.challenge.id}`).then((response) => response.json()).then((rows) => setLeaderboard(Array.isArray(rows) ? rows : [])).catch(() => undefined);
    }).catch(() => setError(locale === "ru" ? "Не удалось загрузить испытание." : "Could not load the challenge.")).finally(() => setLoading(false));
  }, [locale]);

  async function choose(answer: number) {
    if (!challenge || submitting) return;
    const nextAnswers = [...answers, { questionId: challenge.questions[index].id, answer }];
    setAnswers(nextAnswers);
    if (index < challenge.questions.length - 1) { setIndex((value) => value + 1); return; }
    setSubmitting(true); setError("");
    const response = await fetch("/api/daily", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: challenge.id, answers: nextAnswers }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setResult(Number(data.score?.score ?? 0)); if (data.leaderboard) setLeaderboard(data.leaderboard); }
    else setError(data.error || (locale === "ru" ? "Ответы не сохранились." : "Answers were not saved."));
    setSubmitting(false);
  }

  if (loading) return <div className="party-game-board daily-quiz" aria-busy="true"><span className="game-step">{t("dailyTitle")}</span><div className="daily-quiz-skeleton" /></div>;
  if (!challenge || !challenge.questions.length) return <div className="party-game-board daily-quiz"><span className="game-step">{t("dailyTitle")}</span><p>{error || (locale === "ru" ? "Сегодня испытание недоступно." : "Today's challenge is unavailable.")}</p></div>;

  const question = challenge.questions[index];
  return <div className="party-game-board game-board-enter daily-quiz">
    <div className="daily-quiz-head"><span className="game-step">{t("dailyTitle")}</span><strong>{result === null ? `${index + 1}/${challenge.questions.length}` : `${result} XP`}</strong></div>
    {result === null ? <>
      <div className="daily-quiz-progress"><span style={{ width: `${((index + 1) / challenge.questions.length) * 100}%` }} /></div>
      <h3>{question.prompt[locale]}</h3>
      <div className="daily-quiz-options">{question.options[locale].map((option, optionIndex) => <button key={option} onClick={() => choose(optionIndex)} disabled={submitting} type="button"><b>{String.fromCharCode(65 + optionIndex)}</b><span>{option}</span></button>)}</div>
    </> : <div className="daily-quiz-result"><span className="material-symbols-rounded" aria-hidden="true">emoji_events</span><h3>{locale === "ru" ? "Результат сохранён" : "Result saved"}</h3><strong>{result} / {challenge.questions.length * 100}</strong></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {leaderboard.length > 0 && <div className="daily-leaderboard"><h4>{t("dailyLeaderboard")}</h4>{leaderboard.map((entry, rank) => <div key={entry.userId}><span>#{rank + 1} {entry.displayName || entry.userId.slice(0, 8)}</span><strong>{entry.score}</strong></div>)}</div>}
  </div>;
}
