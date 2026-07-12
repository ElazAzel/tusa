"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const WORDS_EN = [
  "Cooking", "Swimming", "Dinosaur", "Airport", "Ninja", "Eiffel Tower", "Fireworks",
  "Crown", "Ladder", "Volcano", "Penguin", "Guitar", "Moonwalk", "Scissors",
  "Lighthouse", "Snowflake", "Pirate", "Helicopter", "Tornado", "Pillow",
  "Umbrella", "Clock", "Jellyfish", "Basketball", "Robot",
];

const WORDS_RU = [
  "Готовка", "Плавание", "Динозавр", "Аэропорт", "Ниндзя", "Эйфелева башня", "Фейерверки",
  "Корона", "Лестница", "Вулкан", "Пингвин", "Гитара", "Лунная походка", "Ножницы",
  "Маяк", "Снежинка", "Пират", "Вертолёт", "Торнадо", "Подушка",
  "Зонтик", "Часы", "Медуза", "Баскетбол", "Робот",
];

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

type GameState = {
  round: number;
  phase: "play" | "result";
  words: string[];
  currentIndex: number;
  score: number;
  activePlayer: string;
  timer: number;
};

function CharadesStage({ sessionId, partyId, onSave }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const words = useMemo(() => shuffle(locale === "ru" ? WORDS_RU : WORDS_EN), [locale]);

  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({
      round: 0, phase: "play" as const, words,
      currentIndex: 0, score: 0, activePlayer: "", timer: 60,
    }),
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "correct" && state.phase === "play") {
        setState((prev) => ({ ...prev, score: prev.score + 1, currentIndex: prev.currentIndex + 1 }));
      }
      if (a.actionType === "skip" && state.phase === "play") {
        setState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      }
      if (a.actionType === "setActive" && state.phase === "play") {
        setState((prev) => ({ ...prev, activePlayer: a.userId }));
      }
    }
    clearActions();
  }, [playerActions, state.phase, setState, clearActions]);

  useEffect(() => {
    if (state.phase !== "play" || state.timer <= 0 || !state.activePlayer) return;
    const id = setTimeout(() => setState((p) => ({ ...p, timer: p.timer - 1 })), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timer, state.activePlayer, setState]);

  useEffect(() => {
    if (state.phase === "play" && state.timer === 0) {
      setState((p) => ({ ...p, phase: "result" }));
    }
  }, [state.timer, state.phase, setState]);

  const currentWord = state.words[state.currentIndex % state.words.length] || "—";
  const maxWords = 10;

  const finish = useCallback(() => {
    complete();
    onSave(state.score);
  }, [complete, onSave, state.score]);

  const reset = useCallback(() => {
    setState({
      round: state.round + 1, phase: "play",
      words: shuffle(locale === "ru" ? WORDS_RU : WORDS_EN),
      currentIndex: 0, score: 0, activePlayer: "", timer: 60,
    });
  }, [state.round, locale, setState]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("round")} {state.round + 1}</span>
      <div style={{ fontSize: 48, fontWeight: 700, color: state.timer <= 10 ? "#f87171" : "#a3e635", margin: "8px 0" }}>
        {state.timer}s
      </div>
      {state.phase === "play" && (
        <div>
          <p style={{ color: "#a3a3a3", marginBottom: 4 }}>{t("currentWord")}</p>
          <div style={{ fontSize: 28, fontWeight: 700, background: "#262626", borderRadius: 12, padding: 16, textAlign: "center" }}>
            {currentWord}
          </div>
          <p style={{ color: "#a3a3a3", marginTop: 8 }}>
            {t("score")}: {state.score} | {t("word")} {state.currentIndex + 1}/{maxWords}
          </p>
          {!state.activePlayer && (
            <button className="demo-action demo-action--lime" onClick={() => setState((p) => ({ ...p, activePlayer: "host" }))} type="button" style={{ marginTop: 12 }}>
              {t("startRound")}
            </button>
          )}
        </div>
      )}
      {state.phase === "result" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: "#a3e635" }}>{state.score} {t("pts")}</p>
          <button className="demo-action demo-action--lime" onClick={reset} type="button" style={{ marginTop: 8 }}>{t("playAgain")}</button>
          <button className="demo-action demo-action--white" onClick={finish} type="button" style={{ marginTop: 8 }}>{t("finish")}</button>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function CharadesController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    round: 0, phase: "play", words: [], currentIndex: 0,
    score: 0, activePlayer: "", timer: 60,
  });
  const [isActor, setIsActor] = useState(false);

  useEffect(() => { setIsActor(false); }, [state.round]);

  const setActive = useCallback(() => { setIsActor(true); sendAction("setActive"); }, [sendAction]);
  const correct = useCallback(() => sendAction("correct"), [sendAction]);
  const skip = useCallback(() => sendAction("skip"), [sendAction]);

  const currentWord = state.words[state.currentIndex % state.words.length] || "…";

  if (!isActor && state.phase === "play") {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{t("teamView")}</h3>
        <p style={{ color: "#a3a3a3", marginBottom: 8 }}>{t("teamDesc")}</p>
        <div style={{ fontSize: 28, fontWeight: 700, background: "#262626", borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 12 }}>
          {currentWord}
        </div>
        <button className="demo-action demo-action--lime" onClick={setActive} type="button">{t("startClueing")}</button>
      </div>
    );
  }

  if (state.phase === "play") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("activePlayer")}</span>
        <h3>{currentWord}</h3>
        <p style={{ color: "#a3a3a3", marginBottom: 12 }}>{t("sayClues")}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="demo-action demo-action--lime" onClick={correct} type="button" style={{ flex: 1, fontSize: 18, padding: "14px 0" }}>
            ✓ {t("correct")}
          </button>
          <button className="demo-action demo-action--white" onClick={skip} type="button" style={{ flex: 1, fontSize: 18, padding: "14px 0" }}>
            ⏭ {t("skipped")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <h3>{state.score} {t("pts")}</h3>
    </div>
  );
}

const EN: Record<string, string> = {
  round: "Round", currentWord: "Team sees this word:", score: "Score", word: "Word",
  correct: "Correct!", skipped: "Skipped", pts: "pts", startRound: "Start Round",
  playAgain: "Play Again", finish: "Finish",
  teamView: "Team View", teamDesc: "You see the word — say clues out loud!",
  startClueing: "Start Clueing", activePlayer: "Give Clues!", sayClues: "Say clues out loud, don't show the phone!",
};

const RU: Record<string, string> = {
  round: "Раунд", currentWord: "Команда видит слово:", score: "Счёт", word: "Слово",
  correct: "Верно!", skipped: "Пропущено", pts: "очк", startRound: "Начать раунд",
  playAgain: "Ещё раз", finish: "Завершить",
  teamView: "Взгляд команды", teamDesc: "Ты видишь слово — говори подсказки вслух!",
  startClueing: "Начать подсказки", activePlayer: "Давай подсказки!", sayClues: "Говори подсказки вслух, не показывай телефон!",
};

export default function Charades({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  if (role === "controller" && sessionId) return <CharadesController sessionId={sessionId} />;
  return <CharadesStage sessionId={sessionId} partyId={partyId} onSave={onSave} />;
}
