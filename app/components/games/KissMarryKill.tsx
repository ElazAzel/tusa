"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const SETS_EN: [string, string, string][] = [
  ["Tom Hanks", "Zendaya", "Keanu Reeves"],
  ["Beyonce", "Ryan Gosling", "Dwayne Johnson"],
  ["Taylor Swift", "Chris Hemsworth", "Emma Stone"],
  ["Leonardo DiCaprio", "Ariana Grande", "Idris Elba"],
  ["Timothée Chalamet", "Rihanna", "Pedro Pascal"],
  ["Margot Robbie", "Brad Pitt", "Sandra Bullock"],
  ["Harry Styles", "Florence Pugh", "Oscar Isaac"],
  ["Billie Eilish", "Jacob Elordi", "Anya Taylor-Joy"],
];

const SETS_RU: [string, string, string][] = [
  ["Том Хэнкс", "Зендея", "Кеану Ривз"],
  ["Бейонсе", "Райан Гослинг", "Дуэйн Джонсон"],
  ["Тейлор Свифт", "Крис Хемсворт", "Эма Стоун"],
  ["Леонардо ДиКаприо", "Ариана Гранде", "Идрис Эльба"],
  ["Тимоте Шаламе", "Рианна", "Педро Паскаль"],
  ["Марго Робби", "Брэд Питт", "Сандра Буллок"],
  ["Гарри Стайлз", "Флоренс Пью", "Оскар Айзек"],
  ["Билли Айлиш", "Джейкоб Элорди", "Анья Тейлор-Джой"],
];

type GameState = { round: number; phase: "vote" | "reveal"; votes: Record<string, 0 | 1 | 2>; sets: Array<[string, string, string]> };

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

const LABELS = ["💋 Kiss", "💍 Marry", "💀 Kill"];
const LABELS_RU = ["💋 Поцеловать", "💍 Пожениться", "💀 Убить"];

export default function KissMarryKill({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const labels = locale === "ru" ? LABELS_RU : LABELS;
  const sets = useMemo(() => shuffle(locale === "ru" ? SETS_RU : SETS_EN), [locale]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ round: 0, phase: "vote", votes: {}, sets }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { round: 0, phase: "vote", votes: {}, sets });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;
  const complete = isHost ? stageHook.complete : undefined;

  const [choice, setChoice] = useState<0 | 1 | 2 | null>(null);
  useEffect(() => { setChoice(null); }, [state.round]);

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "vote") {
        const c = (a.payload as { choice: 0 | 1 | 2 }).choice;
        setState?.((prev) => ({ ...prev, votes: { ...prev.votes, [a.userId]: c } }));
      }
    }
    clearActions?.();
  }, [playerActions, isHost, setState, clearActions]);

  const current = sets[state.round % sets.length];
  const tallies: [number, number, number] = [0, 0, 0];
  for (const v of Object.values(state.votes)) tallies[v]++;

  const vote = useCallback((c: 0 | 1 | 2) => {
    if (choice !== null) return;
    setChoice(c);
    sendAction("vote", { choice: c });
  }, [choice, sendAction]);

  const reveal = useCallback(() => { if (!isHost) return; setState?.((p) => ({ ...p, phase: "reveal" })); }, [isHost, setState]);

  const nextRound = useCallback(() => {
    if (!isHost) return;
    if (state.round >= sets.length - 1) { complete?.(); onSave(sets.length); return; }
    setState?.((p) => ({ ...p, round: p.round + 1, phase: "vote", votes: {} }));
  }, [state.round, sets.length, isHost, setState, complete, onSave]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("round")} {state.round + 1}/{sets.length}</span>
    <h3>{t("kmkTitle")}</h3>
    <div className="kmk-names">
      {current.map((name, i) => (
        <div key={i} className="kmk-person">
          <span className="kmk-name">{name}</span>
          <span className="kmk-votes">{tallies[i]} {t("votes")}</span>
          {state.phase === "reveal" && <span className="kmk-winner">{tallies.indexOf(Math.max(...tallies)) === i ? labels[i] : null}</span>}
        </div>
      ))}
    </div>
    <div className="quiz-options">
      {labels.map((label, i) => (
        <button key={i} className={choice === i ? "selected" : ""} disabled={choice !== null} onClick={() => vote(i as 0 | 1 | 2)} type="button">{label}</button>
      ))}
    </div>
    {choice !== null && <p className="controller-answered">{t("youChose")}: {labels[choice]}</p>}
    {isHost && <div className="game-primary-actions">
      {state.phase === "vote" && Object.keys(state.votes).length > 0 && <button className="demo-action demo-action--lime" onClick={reveal} type="button">{t("reveal")}</button>}
      {state.phase === "reveal" && <button className="demo-action demo-action--lime" onClick={nextRound} type="button">{state.round >= sets.length - 1 ? t("finish") : t("nextRound")}</button>}
    </div>}
  </div>;
}

const EN: Record<string, string> = { round: "Round", kmkTitle: "Kiss, Marry, Kill", votes: "votes", reveal: "Reveal", finish: "Finish", nextRound: "Next Round", youChose: "You chose" };
const RU: Record<string, string> = { round: "Раунд", kmkTitle: "Поцеловать, Пожениться, Убить", votes: "голосов", reveal: "Показать", finish: "Завершить", nextRound: "Следующий раунд", youChose: "Вы выбрали" };
