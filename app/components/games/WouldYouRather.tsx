"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const PROMPTS_EN = [
  { a: "Be able to fly", b: "Be able to be invisible" },
  { a: "Live without music", b: "Live without movies" },
  { a: "Always be 10 minutes late", b: "Always be 20 minutes early" },
  { a: "Have a rewind button in life", b: "Have a pause button in life" },
  { a: "Know how you die", b: "Know when you die" },
  { a: "Be famous", b: "Be rich" },
  { a: "Travel the world for free", b: "Eat anything you want for free" },
  { a: "Never use social media again", b: "Never watch a movie again" },
  { a: "Have unlimited money", b: "Have unlimited time" },
  { a: "Be a kid forever", b: "Be an adult forever" },
  { a: "Always tell the truth", b: "Always get away with lying" },
  { a: "Give up AC forever", b: "Give up heating forever" },
];

const PROMPTS_RU = [
  { a: "Уметь летать", b: "Уметь быть невидимым" },
  { a: "Жить без музыки", b: "Жить без фильмов" },
  { a: "Всегда опаздывать на 10 минут", b: "Всегда приходить на 20 минут раньше" },
  { a: "Иметь кнопку «назад» в жизни", b: "Иметь кнопку «пауза» в жизни" },
  { a: "Знать, как ты умрёшь", b: "Знать, когда ты умрёшь" },
  { a: "Быть знаменитым", b: "Быть богатым" },
  { a: "Бесплатно путешествовать по миру", b: "Бесплатно есть что хочешь" },
  { a: "Больше никогда не пользоваться соцсетями", b: "Больше никогда не смотреть фильмы" },
  { a: "Иметь бесконечные деньги", b: "Иметь бесконечное время" },
  { a: "Быть навсегда ребёнком", b: "Быть навсегда взрослым" },
  { a: "Всегда говорить правду", b: "Всегда безнаказанно врать" },
  { a: "Отказаться от кондиционера навсегда", b: "Отказаться от отопления навсегда" },
];

type GameState = { round: number; phase: "vote" | "reveal"; votes: Record<string, "a" | "b">; prompts: Array<{ a: string; b: string }> };

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function WouldYouRather({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const prompts = useMemo(() => shuffle(locale === "ru" ? PROMPTS_RU : PROMPTS_EN), [locale]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ round: 0, phase: "vote", votes: {}, prompts }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { round: 0, phase: "vote", votes: {}, prompts });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;
  const complete = isHost ? stageHook.complete : undefined;

  const [voted, setVoted] = useState<"a" | "b" | null>(null);
  useEffect(() => { setVoted(null); }, [state.round]);

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const action of playerActions) {
      if (action.actionType === "vote") {
        const choice = (action.payload as { choice: "a" | "b" }).choice;
        setState?.((prev) => ({ ...prev, votes: { ...prev.votes, [action.userId]: choice } }));
      }
    }
    clearActions?.();
  }, [playerActions, isHost, setState, clearActions]);

  const prompt = prompts[state.round % prompts.length];
  const aCount = Object.values(state.votes).filter((v) => v === "a").length;
  const bCount = Object.values(state.votes).filter((v) => v === "b").length;
  const totalVoters = Object.keys(state.votes).length;

  const vote = useCallback((choice: "a" | "b") => {
    if (voted) return;
    setVoted(choice);
    sendAction("vote", { choice });
  }, [voted, sendAction]);

  const reveal = useCallback(() => { if (!isHost) return; setState?.((prev) => ({ ...prev, phase: "reveal" })); }, [isHost, setState]);

  const nextRound = useCallback(() => {
    if (!isHost) return;
    if (state.round >= prompts.length - 1) { complete?.(); onSave(Math.min(state.round + 1, prompts.length)); return; }
    setState?.((prev) => ({ ...prev, round: prev.round + 1, phase: "vote", votes: {} }));
  }, [state.round, prompts.length, isHost, setState, complete, onSave]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("round")} {state.round + 1}/{prompts.length}</span>
    <h3>{t("wyrTitle")}</h3>
    <div className="quiz-options">
      <button className={voted === "a" ? "selected" : ""} disabled={Boolean(voted)} onClick={() => vote("a")} type="button">{prompt.a}</button>
      <button className={voted === "b" ? "selected" : ""} disabled={Boolean(voted)} onClick={() => vote("b")} type="button">{prompt.b}</button>
    </div>
    {voted && <p className="controller-answered">{t("voted")}: {voted === "a" ? prompt.a : prompt.b}</p>}
    <div className="wyr-votes"><div>A: {aCount} {t("votes")}</div><div>B: {bCount} {t("votes")}</div><div>{t("waiting")}: {totalVoters}</div></div>
    {state.phase === "reveal" && <div className="wyr-result"><p>{t("winner")}: {aCount > bCount ? prompt.a : bCount > aCount ? prompt.b : t("tie")}</p></div>}
    {isHost && <div className="game-primary-actions">
      {state.phase === "vote" && totalVoters > 0 && <button className="demo-action demo-action--lime" onClick={reveal} type="button">{t("reveal")}</button>}
      {state.phase === "reveal" && <button className="demo-action demo-action--lime" onClick={nextRound} type="button">{state.round >= prompts.length - 1 ? t("finish") : t("nextRound")}</button>}
    </div>}
  </div>;
}

const EN: Record<string, string> = { round: "Round", wyrTitle: "Would You Rather?", wyrPrompt: "Pick one option", votes: "votes", waiting: "Voted", reveal: "Reveal", winner: "Winner", tie: "It's a tie", finish: "Finish", nextRound: "Next Round", voted: "You voted" };
const RU: Record<string, string> = { round: "Раунд", wyrTitle: "Ты бы предпочёл?", wyrPrompt: "Выбери один вариант", votes: "голосов", waiting: "Проголосовало", reveal: "Показать", winner: "Победитель", tie: "Ничья", finish: "Завершить", nextRound: "Следующий раунд", voted: "Вы проголосовали" };
