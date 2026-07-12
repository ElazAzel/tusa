"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const STATEMENTS_EN = [
  { statements: ["I have never broken a bone", "I can wiggle my ears", "I have met a president"], lie: 2 },
  { statements: ["I speak 3 languages", "I once won a singing contest", "I am afraid of heights"], lie: 1 },
  { statements: ["I have run a marathon", "I have never been camping", "I have a twin sibling"], lie: 0 },
  { statements: ["I can solve a Rubik's cube in under a minute", "I have been on TV", "I have 5 siblings"], lie: 1 },
  { statements: ["I once ate a worm", "I have visited 10 countries", "I have a pet snake"], lie: 2 },
  { statements: ["I have never watched TV", "I can juggle 4 balls", "I have slept in a cave"], lie: 0 },
  { statements: ["I am left-handed", "I have read over 100 books this year", "I once hitchhiked across a country"], lie: 1 },
  { statements: ["I have broken a world record", "I hate chocolate", "I have swum with dolphins"], lie: 0 },
];

const STATEMENTS_RU = [
  { statements: ["Я никогда не ломал кости", "Я могу шевелить ушами", "Я встречал президента"], lie: 2 },
  { statements: ["Я говорю на 3 языках", "Я выиграл конкурс пения", "Я боюсь высоты"], lie: 1 },
  { statements: ["Я пробегал марафон", "Я никогда не ходил в поход", "У меня есть близнец"], lie: 0 },
  { statements: ["Я могу собрать кубик Рубика за минуту", "Я был по телевизору", "У меня 5 братьев и сестёр"], lie: 1 },
  { statements: ["Я однажды ел червяка", "Я посетил 10 стран", "У меня есть питон"], lie: 2 },
  { statements: ["Я никогда не смотрел телевизор", "Я могу жонглировать 4 мячами", "Я спал в пещере"], lie: 0 },
  { statements: ["Я левша", "Я прочитал более 100 книг в этом году", "Я автостопом пересёк страну"], lie: 1 },
  { statements: ["Я побил мировой рекорд", "Я ненавижу шоколад", "Я плавал с дельфинами"], lie: 0 },
];

type GameState = { round: number; phase: "vote" | "reveal"; votes: Record<string, number>; statements: Array<{ statements: string[]; lie: number }> };

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function TwoTruths({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const statements = useMemo(() => shuffle(locale === "ru" ? STATEMENTS_RU : STATEMENTS_EN), [locale]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ round: 0, phase: "vote", votes: {}, statements }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { round: 0, phase: "vote", votes: {}, statements });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;
  const complete = isHost ? stageHook.complete : undefined;

  const [chosen, setChosen] = useState<number | null>(null);
  useEffect(() => { setChosen(null); }, [state.round]);

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const action of playerActions) {
      if (action.actionType === "vote") {
        const idx = (action.payload as { index: number }).index;
        setState?.((prev) => ({ ...prev, votes: { ...prev.votes, [action.userId]: idx } }));
      }
    }
    clearActions?.();
  }, [playerActions, isHost, setState, clearActions]);

  const current = statements[state.round % statements.length];
  const tally = [0, 0, 0];
  for (const v of Object.values(state.votes)) tally[v]++;

  const vote = useCallback((index: number) => {
    if (chosen !== null) return;
    setChosen(index);
    sendAction("vote", { index });
  }, [chosen, sendAction]);

  const reveal = useCallback(() => { if (!isHost) return; setState?.((prev) => ({ ...prev, phase: "reveal" })); }, [isHost, setState]);

  const nextRound = useCallback(() => {
    if (!isHost) return;
    if (state.round >= statements.length - 1) { complete?.(); onSave(statements.length); return; }
    setState?.((prev) => ({ ...prev, round: prev.round + 1, phase: "vote", votes: {} }));
  }, [state.round, statements.length, isHost, setState, complete, onSave]);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("round")} {state.round + 1}/{statements.length}</span>
    <h3>{t("ttTitle")}</h3>
    {state.phase === "vote" && <p className="tt-prompt">{t("ttFindLie")}</p>}
    <div className="quiz-options">
      {current.statements.map((s, i) => (
        <button key={i} className={chosen === i ? "selected" : ""} disabled={chosen !== null} onClick={() => vote(i)} type="button">{s}</button>
      ))}
    </div>
    {chosen !== null && <p className="controller-answered">{t("youThink")}: {chosen + 1}</p>}
    <div className="tt-statements">
      {current.statements.map((s, i) => (
        <div key={i} className={`tt-stmt ${state.phase === "reveal" && i === current.lie ? "tt-lie" : ""}`}>
          <span className="tt-num">{i + 1}.</span> {s} — {tally[i]} {t("votes")}
        </div>
      ))}
    </div>
    {state.phase === "reveal" && <p className="tt-result">{t("theLie")}: {current.statements[current.lie]}</p>}
    {isHost && <div className="game-primary-actions">
      {state.phase === "vote" && Object.keys(state.votes).length > 0 && <button className="demo-action demo-action--lime" onClick={reveal} type="button">{t("reveal")}</button>}
      {state.phase === "reveal" && <button className="demo-action demo-action--lime" onClick={nextRound} type="button">{state.round >= statements.length - 1 ? t("finish") : t("nextRound")}</button>}
    </div>}
  </div>;
}

const EN: Record<string, string> = { round: "Round", ttTitle: "Two Truths and a Lie", ttFindLie: "Which one is the lie?", votes: "votes", reveal: "Reveal", theLie: "The lie is", finish: "Finish", nextRound: "Next Round", youThink: "You think it's" };
const RU: Record<string, string> = { round: "Раунд", ttTitle: "Две правды и ложь", ttFindLie: "Какое утверждение — ложь?", votes: "голосов", reveal: "Показать", theLie: "Ложь — это", finish: "Завершить", nextRound: "Следующий раунд", youThink: "Вы думаете, что это" };
