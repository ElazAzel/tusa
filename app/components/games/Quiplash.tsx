"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const PROMPTS_EN = [
  "The worst thing to say on a first date",
  "A bad superpower",
  "What aliens think about Earth",
  "An unconvincing excuse for being late",
  "A terrible name for a baby",
  "What you'd find in a haunted fridge",
  "The worst thing to yell in a library",
  "A bad thing to bring to a funeral",
  "What a cat would say if it could talk",
  "The worst caption for a selfie",
];

const PROMPTS_RU = [
  "Худшее, что можно сказать на первом свидании",
  "Плохая суперспособность",
  "Что думают инопланетяне о Земле",
  "Неубедительное оправдание опоздания",
  "Ужасное имя для ребёнка",
  "Что найдешь в привиданском холодильнике",
  "Худшее, что можно крикнуть в библиотеке",
  "Плохой подарок на похороны",
  "Что сказал бы кот, если бы мог говорить",
  "Худшая подпись к селфи",
];

type Submission = { userId: string; answer: string };
type GameState = { round: number; phase: "answer" | "vote" | "reveal"; prompt: string; submissions: Submission[]; votes: Record<string, string>; scores: Record<string, number> };

export default function Quiplash({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const prompts = useMemo(() => locale === "ru" ? PROMPTS_RU : PROMPTS_EN, [locale]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ round: 0, phase: "answer", prompt: prompts[0], submissions: [], votes: {}, scores: {} }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { round: 0, phase: "answer", prompt: prompts[0], submissions: [], votes: {}, scores: {} });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;
  const complete = isHost ? stageHook.complete : undefined;

  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [votedFor, setVotedFor] = useState<string | null>(null);

  useEffect(() => { setAnswer(""); setSubmitted(false); setVotedFor(null); }, [state.round, state.phase]);

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "answer" && state.phase === "answer") {
        const { text } = a.payload as { text: string };
        setState?.((prev) => ({ ...prev, submissions: [...prev.submissions.filter((s) => s.userId !== a.userId), { userId: a.userId, answer: text }] }));
      }
      if (a.actionType === "vote" && state.phase === "vote") {
        const { target } = a.payload as { target: string };
        setState?.((prev) => ({ ...prev, votes: { ...prev.votes, [a.userId]: target } }));
      }
    }
    clearActions?.();
  }, [playerActions, state.phase, isHost, setState, clearActions]);

  const allVoted = useMemo(() => {
    const voterCount = Object.keys(state.votes).length;
    return voterCount >= 2 && voterCount >= state.submissions.length - 1;
  }, [state.votes, state.submissions]);

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

  const reveal = useCallback(() => {
    if (!isHost) return;
    const tally: Record<string, number> = {};
    for (const target of Object.values(state.votes)) tally[target] = (tally[target] || 0) + 1;
    const newScores = { ...state.scores };
    for (const [uid, count] of Object.entries(tally)) newScores[uid] = (newScores[uid] || 0) + count;
    setState?.((prev) => ({ ...prev, phase: "reveal", scores: newScores }));
  }, [state.votes, state.scores, isHost, setState]);

  const next = useCallback(() => {
    if (!isHost) return;
    const nextRound = state.round + 1;
    if (nextRound >= Math.min(prompts.length, 6)) { complete?.(); const top = Object.values(state.scores).reduce((a, b) => Math.max(a, b), 0); onSave(top); return; }
    setState?.({ round: nextRound, phase: "answer", prompt: prompts[nextRound], submissions: [], votes: {}, scores: state.scores });
  }, [state.round, state.scores, prompts, isHost, setState, complete, onSave]);

  const winners = useMemo(() => {
    if (state.phase !== "reveal") return [];
    const tally: Record<string, number> = {};
    for (const target of Object.values(state.votes)) tally[target] = (tally[target] || 0) + 1;
    const max = Math.max(...Object.values(tally), 0);
    return Object.entries(tally).filter(([, c]) => c === max).map(([uid]) => uid);
  }, [state.phase, state.votes]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("round")} {state.round + 1}/{Math.min(prompts.length, 6)}</span>
    <h3>{state.prompt}</h3>
    {state.phase === "answer" && <div>
      <input className="bs-input" maxLength={80} value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitAnswer()} placeholder={t("answerPlaceholder")} style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 8 }} />
      <button className="demo-action demo-action--lime" disabled={submitted || !answer.trim()} onClick={submitAnswer} type="button" style={{ marginTop: 8 }}>{submitted ? t("submitted") : t("submit")}</button>
      <p style={{ color: "var(--gray)", marginTop: 8 }}>{t("waitingAnswers")} ({state.submissions.length})</p>
    </div>}
    {state.phase === "vote" && <div>
      <p style={{ color: "var(--gray)", marginBottom: 8 }}>{t("votePrompt")}</p>
      {state.submissions.map((s) => (
        <button key={s.userId} type="button" disabled={votedFor !== null} onClick={() => vote(s.userId)} style={{ display: "block", width: "100%", textAlign: "left", background: votedFor === s.userId ? "var(--lime)" : "var(--dark)", color: votedFor === s.userId ? "var(--black)" : "var(--white)", borderRadius: 8, padding: "10px 14px", marginBottom: 6, border: "none", fontWeight: 600, fontSize: 14, cursor: votedFor ? "default" : "pointer", wordBreak: "break-word", overflowWrap: "anywhere" }}>&quot;{s.answer}&quot;</button>
      ))}
      {isHost && allVoted && <button className="demo-action demo-action--lime" onClick={reveal} type="button" style={{ marginTop: 8 }}>{t("reveal")}</button>}
    </div>}
    {state.phase === "reveal" && <div>
      {state.submissions.map((s) => { const votes = Object.values(state.votes).filter((v) => v === s.userId).length; return <div key={s.userId} style={{ background: "var(--dark)", borderRadius: 8, padding: "10px 14px", marginBottom: 6, borderLeft: winners.includes(s.userId) ? "3px solid var(--lime)" : "none" }}>&quot;{s.answer}&quot; — {votes} {t("votes")}</div>; })}
      {isHost && <button className="demo-action demo-action--lime" onClick={next} type="button" style={{ marginTop: 8 }}>{state.round >= Math.min(prompts.length, 6) - 1 ? t("finish") : t("next")}</button>}
    </div>}
  </div>;
}

const EN: Record<string, string> = { round: "Round", waitingAnswers: "Waiting for answers…", votePrompt: "Vote for the best!", reveal: "Reveal", votes: "votes", finish: "Finish", next: "Next", answerPlaceholder: "Type your answer…", submit: "Submit", submitted: "Sent!" };
const RU: Record<string, string> = { round: "Раунд", waitingAnswers: "Ждём ответы…", votePrompt: "Голосуй за лучший!", reveal: "Показать", votes: "голосов", finish: "Завершить", next: "Далее", answerPlaceholder: "Введи ответ…", submit: "Отправить", submitted: "Отправлено!" };
