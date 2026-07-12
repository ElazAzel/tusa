"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const WORDS_EN = [
  "APPLE", "BEACH", "CANDLE", "DRAGON", "EAGLE", "FROST", "GARDEN", "HORIZON",
  "ISLAND", "JUNGLE", "KITCHEN", "LANTERN", "MIRROR", "NEBULA", "OCEAN", "PALM",
  "QUARTZ", "RIVER", "SHADOW", "TOWER", "UNITY", "VALLEY", "WINTER", "XENON",
];

const WORDS_RU = [
  "ЯБЛОКО", "ПЛЯЖ", "СВЕЧА", "ДРАКОН", "ОРЕЛ", "МОРОЗ", "САД", "ГОРИЗОНТ",
  "ОСТРОВ", "ДЖУНГЛИ", "КУХНЯ", "ФОНАРЬ", "ЗЕРКАЛО", "НЕБУЛА", "ОКЕАН", "ПАЛЬМА",
  "КВАРЦ", "РЕКА", "ТЕНЬ", "БАШНЯ", "ЕДИНСТВО", "ДОЛИНА", "ЗИМА", "КСЕНОН",
];

type BoardColor = "a" | "b" | "neutral" | "assassin";
type GameState = {
  board: string[];
  colors: BoardColor[];
  activeTeam: "a" | "b";
  clue: string;
  clueNumber: number;
  revealed: boolean[];
  spymasterA: string | null;
  spymasterB: string | null;
  scores: { a: number; b: number };
  phase: "assign" | "clue" | "guess" | "reveal";
};

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function buildBoard(words: string[]): { board: string[]; colors: BoardColor[] } {
  const board = shuffle(words).slice(0, 16);
  const colorPool: BoardColor[] = [
    "a", "a", "a", "a", "a", "a", "a", "a",
    "b", "b", "b", "b", "b", "b", "b",
    "neutral", "neutral", "neutral", "neutral", "neutral", "neutral",
    "assassin",
  ];
  return { board, colors: shuffle(colorPool) };
}

function CodenamesStage({ sessionId, partyId, onSave }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const words = useMemo(() => locale === "ru" ? WORDS_RU : WORDS_EN, [locale]);

  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => {
      const { board, colors } = buildBoard(words);
      return {
        board, colors, activeTeam: "a" as const, clue: "", clueNumber: 0,
        revealed: Array(16).fill(false), spymasterA: null, spymasterB: null,
        scores: { a: 0, b: 0 }, phase: "assign" as const,
      };
    },
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "setSpymaster") {
        const { team } = a.payload as { team: "a" | "b" };
        setState((prev) => ({
          ...prev,
          [team === "a" ? "spymasterA" : "spymasterB"]: a.userId,
          phase: prev.spymasterA && prev.spymasterB ? "clue" : prev.phase,
        }));
      }
      if (a.actionType === "giveClue" && a.userId === state[`spymaster${state.activeTeam.toUpperCase()}` as "spymasterA" | "spymasterB"]) {
        const { word, number } = a.payload as { word: string; number: number };
        setState((prev) => ({ ...prev, clue: word, clueNumber: number, phase: "guess" }));
      }
      if (a.actionType === "pickWord" && state.phase === "guess") {
        const { index } = a.payload as { index: number };
        const color = state.colors[index];
        setState((prev) => {
          if (prev.revealed[index]) return prev;
          const newRevealed = [...prev.revealed];
          newRevealed[index] = true;
          if (color === "assassin") {
            const winner = prev.activeTeam === "a" ? "b" : "a";
            return { ...prev, revealed: newRevealed, phase: "reveal", scores: { ...prev.scores, [winner]: prev.scores[winner] + 1 } };
          }
          if (color === prev.activeTeam) {
            return { ...prev, revealed: newRevealed, scores: { ...prev.scores, [color]: prev.scores[color] + 1 } };
          }
          const next = prev.activeTeam === "a" ? "b" : "a";
          return { ...prev, revealed: newRevealed, activeTeam: next, clue: "", clueNumber: 0, phase: "clue" };
        });
      }
    }
    clearActions();
  }, [playerActions, state, setState, clearActions]);

  const teamACount = useMemo(() => state.colors.filter((c, i) => c === "a" && !state.revealed[i]).length, [state.colors, state.revealed]);
  const teamBCount = useMemo(() => state.colors.filter((c, i) => c === "b" && !state.revealed[i]).length, [state.colors, state.revealed]);
  const gameOver = state.phase === "reveal" || teamACount === 0 || teamBCount === 0;

  const finish = useCallback(() => {
    complete();
    onSave(Math.max(state.scores.a, state.scores.b));
  }, [complete, onSave, state.scores]);

  const colorMap: Record<BoardColor, string> = { a: "#ef4444", b: "#3b82f6", neutral: "#a3a3a3", assassin: "#171717" };

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("team")}: {state.activeTeam.toUpperCase()}</span>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#ef4444" }}>{t("teamA")}: {state.scores.a} ({teamACount} left)</span>
        <span style={{ color: "#3b82f6" }}>{t("teamB")}: {state.scores.b} ({teamBCount} left)</span>
      </div>
      {state.clue && <p style={{ fontSize: 24, fontWeight: 700 }}>&quot;{state.clue}&quot; — {state.clueNumber}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {state.board.map((word, i) => (
          <button
            key={i}
            type="button"
            disabled={state.revealed[i] || state.phase === "clue" || state.phase === "assign"}
            onClick={() => setState((prev) => prev)}
            style={{
              padding: "10px 4px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14,
              background: state.revealed[i] ? colorMap[state.colors[i]] : state.phase === "reveal" ? colorMap[state.colors[i]] : "var(--dark)",
              color: "var(--white)", opacity: state.revealed[i] ? 1 : 0.85, cursor: state.revealed[i] ? "default" : "pointer",
              wordBreak: "break-word",
            }}
          >
            {word}
          </button>
        ))}
      </div>
      {gameOver && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--lime)" }}>
            {teamACount === 0 ? t("teamAWins") : teamBCount === 0 ? t("teamBWins") : state.activeTeam === "a" ? t("teamBWins") : t("teamAWins")}
          </p>
          <button className="demo-action demo-action--lime" onClick={finish} type="button">{t("finish")}</button>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function CodenamesController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    board: [], colors: [], activeTeam: "a", clue: "", clueNumber: 0,
    revealed: [], spymasterA: null, spymasterB: null, scores: { a: 0, b: 0 }, phase: "assign",
  });
  const [team, setTeam] = useState<"a" | "b" | null>(null);
  const [clueWord, setClueWord] = useState("");
  const [clueNum, setClueNum] = useState(1);
  const [isSpymaster, setIsSpymaster] = useState(false);

  useEffect(() => { setTeam(null); setClueWord(""); setClueNum(1); }, [state.phase]);

  const pickTeam = useCallback((t: "a" | "b") => {
    setTeam(t);
    sendAction("setSpymaster", { team: t });
    setIsSpymaster(true);
  }, [sendAction]);

  const giveClue = useCallback(() => {
    if (!clueWord.trim()) return;
    sendAction("giveClue", { word: clueWord.trim(), number: clueNum });
    setClueWord("");
  }, [clueWord, clueNum, sendAction]);

  const myTeam = isSpymaster ? team : null;
  const isMyTurn = state.phase === "clue" && myTeam === state.activeTeam;
  const canGuess = state.phase === "guess" && myTeam && myTeam === state.activeTeam && !isSpymaster;

  if (state.phase === "assign" && !isSpymaster) {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{t("pickTeam")}</h3>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button className="demo-action demo-action--lime" onClick={() => pickTeam("a")} type="button">{t("teamA")}</button>
          <button className="demo-action demo-action--lime" onClick={() => pickTeam("b")} type="button">{t("teamB")}</button>
        </div>
      </div>
    );
  }

  if (isSpymaster && isMyTurn) {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{t("giveClue")}</h3>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={clueWord} onChange={(e) => setClueWord(e.target.value)} placeholder={t("clueWord")} style={{ flex: 1, padding: 8, borderRadius: 6 }} />
          <input type="number" min={1} max={8} value={clueNum} onChange={(e) => setClueNum(Number(e.target.value))} style={{ width: 50, padding: 8, borderRadius: 6 }} />
        </div>
        <button className="demo-action demo-action--lime" onClick={giveClue} disabled={!clueWord.trim()} type="button" style={{ marginTop: 8 }}>{t("sendClue")}</button>
      </div>
    );
  }

  if (canGuess) {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("guess")}</span>
        <h3>&quot;{state.clue}&quot; — {state.clueNumber}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 8 }}>
          {state.board.map((word, i) => (
            <button
              key={i}
              type="button"
              disabled={state.revealed[i]}
              onClick={() => sendAction("pickWord", { index: i })}
              style={{
                padding: "10px 4px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14,
                background: state.revealed[i] ? "#525252" : "var(--dark)", color: "var(--white)",
                cursor: state.revealed[i] ? "default" : "pointer", wordBreak: "break-word",
              }}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{state.activeTeam.toUpperCase()}</span>
      <h3>{isSpymaster ? t("waitingGuessers") : t("waitingClue")}</h3>
    </div>
  );
}

const EN: Record<string, string> = {
  team: "Team", teamA: "Red", teamB: "Blue",
  teamAWins: "Red wins!", teamBWins: "Blue wins!",
  pickTeam: "Pick your team", giveClue: "Give a clue",
  clueWord: "Word", sendClue: "Send clue", guess: "Pick a word",
  waitingGuessers: "Waiting for guessers…", waitingClue: "Waiting for spymaster…", finish: "Finish",
};

const RU: Record<string, string> = {
  team: "Команда", teamA: "Красные", teamB: "Синие",
  teamAWins: "Красные победили!", teamBWins: "Синие победили!",
  pickTeam: "Выбери команду", giveClue: "Дай подсказку",
  clueWord: "Слово", sendClue: "Отправить", guess: "Выбери слово",
  waitingGuessers: "Ждём угадывающих…", waitingClue: "Ждём шпиона…", finish: "Завершить",
};

export default function Codenames({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  if (role === "controller" && sessionId) return <CodenamesController sessionId={sessionId} />;
  return <CodenamesStage sessionId={sessionId} partyId={partyId} onSave={onSave} />;
}
