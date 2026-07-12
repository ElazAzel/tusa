"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const LETTERS_EN = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "R", "S", "T", "W"];
const LETTERS_RU = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "Ф", "Х"];

type GameState = {
  round: number;
  phase: "play" | "result";
  letter: string;
  timer: number;
  submitted: Record<string, boolean>;
  eliminated: string[];
};

function BombPartyStage({
  sessionId,
  partyId,
  onSave,
  letters,
}: {
  sessionId?: string | null;
  partyId: string;
  onSave: (score: number) => void;
  letters: string[];
}) {
  const { locale } = useLocale();
  const t = (key: string) => (locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key));
  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({
      round: 0,
      phase: "play",
      letter: letters[0],
      timer: 20,
      submitted: {},
      eliminated: [],
    })
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.phase !== "play" || state.timer <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timer <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          const allPlayers = new Set([...Object.keys(prev.submitted), ...prev.eliminated]);
          const notSubmitted = [...allPlayers].filter((id) => !prev.submitted[id]);
          return {
            ...prev,
            timer: 0,
            phase: "result",
            eliminated: [...new Set([...prev.eliminated, ...notSubmitted])],
          };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase, state.timer, setState]);

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "submit") {
        setState((prev) => ({
          ...prev,
          submitted: { ...prev.submitted, [a.userId]: true },
        }));
      }
    }
    clearActions();
  }, [playerActions, setState, clearActions]);

  const nextRound = useCallback(() => {
    const nextIdx = state.round + 1;
    const aliveCount = 10 - state.eliminated.length;
    if (aliveCount <= 1 || nextIdx >= 10) {
      complete();
      onSave(aliveCount);
      return;
    }
    const nextLetter = letters[nextIdx % letters.length];
    setState((p) => ({
      ...p,
      round: nextIdx,
      phase: "play",
      letter: nextLetter,
      timer: 20,
      submitted: {},
    }));
  }, [state.round, state.eliminated.length, letters, setState, complete, onSave]);

  const remaining = 10 - state.eliminated.length;

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}/10</span>
      <h3>{t("bpTitle")}</h3>
      <div className="bp-letter">{state.letter}</div>
      <div className={`bp-timer ${state.timer <= 5 ? "bp-danger" : ""}`}>{state.timer}s</div>
      <div className="bp-info">
        <span>{remaining} {t("alive")}</span>
        <span>{Object.keys(state.submitted).length} {t("submitted")}</span>
      </div>
      {state.phase === "result" && (
        <div className="bp-result">
          {state.eliminated.length > 0 && (
            <p>{t("eliminated")}: {state.eliminated.length}</p>
          )}
          <button className="demo-action demo-action--lime" onClick={nextRound} type="button">
            {remaining <= 1 || state.round >= 9 ? t("finish") : t("nextRound")}
          </button>
        </div>
      )}
    </div>
  );
}

function BombPartyController({
  sessionId,
  letters,
}: {
  sessionId: string;
  letters: string[];
}) {
  const { locale } = useLocale();
  const t = (key: string) => (locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key));
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    round: 0,
    phase: "play",
    letter: letters[0],
    timer: 20,
    submitted: {},
    eliminated: [],
  });
  const [word, setWord] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);

  useEffect(() => {
    if (state.round > 0 && !submitted && !isEliminated) {
      setIsEliminated(true);
    }
    setWord("");
    setSubmitted(false);
  }, [state.round]);

  const submit = useCallback(() => {
    if (!word.trim() || submitted || isEliminated) return;
    setSubmitted(true);
    sendAction("submit", { word: word.trim() });
  }, [word, submitted, isEliminated, sendAction]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); },
    [submit]
  );

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}/10</span>
      <h3>{t("bpTitle")}</h3>
      <div className="bp-letter">{state.letter}</div>
      <div className={`bp-timer ${state.timer <= 5 ? "bp-danger" : ""}`}>{state.timer}s</div>
      {isEliminated ? (
        <p className="controller-answered">{t("youEliminated")}</p>
      ) : (
        <div className="bs-input-group">
          <input
            className="bs-input"
            maxLength={30}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t("bpPlaceholder")}
            value={word}
          />
          <button className="demo-action demo-action--lime" disabled={submitted || !word.trim()} onClick={submit} type="button">
            {submitted ? t("submitted") : t("submit")}
          </button>
        </div>
      )}
    </div>
  );
}

const EN: Record<string, string> = {
  round: "Round",
  bpTitle: "Bomb Party",
  alive: "alive",
  submitted: "Sent!",
  eliminated: "Eliminated",
  finish: "Finish",
  nextRound: "Next Round",
  submit: "Submit",
  youEliminated: "You are eliminated!",
  bpPlaceholder: "Type a word starting with...",
};

const RU: Record<string, string> = {
  round: "Раунд",
  bpTitle: "Бомба",
  alive: "осталось",
  submitted: "Отправлено!",
  eliminated: "Выбыли",
  finish: "Завершить",
  nextRound: "Следующий раунд",
  submit: "Отправить",
  youEliminated: "Вы выбыли!",
  bpPlaceholder: "Введите слово на...",
};

export default function BombParty({
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
  const letters = useMemo(() => shuffle(locale === "ru" ? LETTERS_RU : LETTERS_EN), [locale]);

  if (role === "controller" && sessionId) {
    return <BombPartyController sessionId={sessionId} letters={letters} />;
  }
  return <BombPartyStage sessionId={sessionId} partyId={partyId} onSave={onSave} letters={letters} />;
}

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
