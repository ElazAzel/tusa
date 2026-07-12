"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const WORDS_EN = [
  "Pizza", "Rain", "Homework", "Gym", "Wifi",
  "Monday", "Mirror", "Coffee", "Birthday", "Airport",
  "Boss", "Umbrella", "Password", "Traffic", "Alarm",
  "Pizza", "Rain", "Homework", "Gym", "Wifi",
];

const WORDS_RU = [
  "Пицца", "Домашка", "Дождь", "Спортзал", "Вайфай",
  "Понедельник", "Зеркало", "Кофе", "День рождения", "Аэропорт",
  "Начальник", "Зонтик", "Пароль", "Пробки", "Будильник",
  "Пицца", "Домашка", "Дождь", "Спортзал", "Вайфай",
];

type GameState = {
  round: number;
  phase: "write" | "reveal";
  word: string;
  submissions: Record<string, string>;
  words: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function BlankSlateStage({
  sessionId,
  partyId,
  onSave,
  words,
}: {
  sessionId?: string | null;
  partyId: string;
  onSave: (score: number) => void;
  words: string[];
}) {
  const { locale } = useLocale();
  const t = (key: string) => (locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key));
  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({ round: 0, phase: "write", word: words[0], submissions: {}, words })
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "submit") {
        const answer = (a.payload as { answer: string }).answer.trim();
        setState((prev) => ({
          ...prev,
          submissions: { ...prev.submissions, [a.userId]: answer },
        }));
      }
    }
    clearActions();
  }, [playerActions, setState, clearActions]);

  const revealed = state.phase === "reveal";
  const subs = Object.values(state.submissions);
  const groups: Record<string, number> = {};
  for (const s of subs) {
    const norm = s.toLowerCase().trim();
    groups[norm] = (groups[norm] || 0) + 1;
  }
  const matches = Object.entries(groups).filter(([, c]) => c > 1);

  const reveal = useCallback(() => setState((p) => ({ ...p, phase: "reveal" })), [setState]);

  const nextRound = useCallback(() => {
    const nextIdx = state.round + 1;
    if (nextIdx >= Math.min(words.length, 6)) {
      complete();
      onSave(subs.length);
      return;
    }
    const nextWord = words[nextIdx % words.length];
    setState((p) => ({ ...p, round: nextIdx, phase: "write", word: nextWord, submissions: {} }));
  }, [state.round, words, setState, complete, onSave, subs.length]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}/6</span>
      <h3>{t("bsTitle")}</h3>
      <div className="bs-word">{state.word}</div>
      <div className="bs-subs">
        {Object.entries(state.submissions).map(([uid, ans]) => (
          <div key={uid} className={`bs-sub ${revealed && matches.some(([w]) => w === ans.toLowerCase().trim()) ? "bs-match" : ""}`}>
            {revealed ? ans : "•••"}
          </div>
        ))}
      </div>
      {subs.length > 0 && state.phase === "write" && (
        <button className="demo-action demo-action--lime" onClick={reveal} type="button">{t("reveal")}</button>
      )}
      {state.phase === "reveal" && (
        <div>
          {matches.length > 0 ? (
            <p className="bs-result">{t("matches")}: {matches.map(([w, c]) => `"${w}" ×${c}`).join(", ")}</p>
          ) : (
            <p className="bs-result">{t("noMatches")}</p>
          )}
          <button className="demo-action demo-action--lime" onClick={nextRound} type="button">
            {state.round >= Math.min(words.length, 6) - 1 ? t("finish") : t("nextRound")}
          </button>
        </div>
      )}
    </div>
  );
}

function BlankSlateController({
  sessionId,
  words,
}: {
  sessionId: string;
  words: string[];
}) {
  const { locale } = useLocale();
  const t = (key: string) => (locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key));
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    round: 0, phase: "write", word: words[0], submissions: {}, words,
  });
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { setAnswer(""); setSubmitted(false); }, [state.round]);

  const submit = useCallback(() => {
    if (!answer.trim() || submitted) return;
    setSubmitted(true);
    sendAction("submit", { answer: answer.trim() });
  }, [answer, submitted, sendAction]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); },
    [submit]
  );

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}/6</span>
      <h3>{t("bsTitle")}</h3>
      <div className="bs-word">{state.word}</div>
      <div className="bs-input-group">
        <input
          className="bs-input"
          maxLength={30}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t("bsPlaceholder")}
          value={answer}
        />
        <button className="demo-action demo-action--lime" disabled={submitted || !answer.trim()} onClick={submit} type="button">
          {submitted ? t("submitted") : t("submit")}
        </button>
      </div>
    </div>
  );
}

const EN: Record<string, string> = {
  round: "Round",
  bsTitle: "Blank Slate",
  bsPlaceholder: "Type your word...",
  submit: "Submit",
  submitted: "Sent!",
  reveal: "Reveal Answers",
  matches: "Matches",
  noMatches: "No matches this round",
  finish: "Finish",
  nextRound: "Next Round",
};

const RU: Record<string, string> = {
  round: "Раунд",
  bsTitle: "Пустая Слева",
  bsPlaceholder: "Введите слово...",
  submit: "Отправить",
  submitted: "Отправлено!",
  reveal: "Показать ответы",
  matches: "Совпадения",
  noMatches: "Нет совпадений в этом раунде",
  finish: "Завершить",
  nextRound: "Следующий раунд",
};

export default function BlankSlate({
  partyId,
  sessionId,
  onSave,
  role,
}: {
  partyId: string;
  sessionId?: string | null;
  onSave: (score: number) => void;
  role?: "stage" | "controller";
}) {
  const { locale } = useLocale();
  const words = useMemo(() => shuffle(locale === "ru" ? WORDS_RU : WORDS_EN), [locale]);

  if (role === "controller" && sessionId) {
    return <BlankSlateController sessionId={sessionId} words={words} />;
  }
  return <BlankSlateStage sessionId={sessionId} partyId={partyId} onSave={onSave} words={words} />;
}
