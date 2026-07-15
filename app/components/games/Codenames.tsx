"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const WORDS_EN = ["APPLE", "BEACH", "CANDLE", "DRAGON", "EAGLE", "FROST", "GARDEN", "HORIZON", "ISLAND", "JUNGLE", "KITCHEN", "LANTERN", "MIRROR", "NEBULA", "OCEAN", "PALM", "QUARTZ", "RIVER", "SHADOW", "TOWER", "UNITY", "VALLEY", "WINTER", "XENON"];
const WORDS_RU = ["ЯБЛОКО", "ПЛЯЖ", "СВЕЧА", "ДРАКОН", "ОРЕЛ", "МОРОЗ", "САД", "ГОРИЗОНТ", "ОСТРОВ", "ДЖУНГЛИ", "КУХНЯ", "ФОНАРЬ", "ЗЕРКАЛО", "НЕБУЛА", "ОКЕАН", "ПАЛЬМА", "КВАРЦ", "РЕКА", "ТЕНЬ", "БАШНЯ", "ЕДИНСТВО", "ДОЛИНА", "ЗИМА", "КСЕНОН"];

type BoardColor = "a" | "b" | "neutral" | "assassin";
type GameState = { board: string[]; colors: BoardColor[]; activeTeam: "a" | "b"; clue: string; clueNumber: number; revealed: boolean[]; spymasterA: string | null; spymasterB: string | null; scores: { a: number; b: number }; phase: "assign" | "clue" | "guess" | "reveal" };

function shuffle<T>(arr: T[]): T[] { const r = [...arr]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

function buildBoard(words: string[]): { board: string[]; colors: BoardColor[] } {
  const board = shuffle(words).slice(0, 16);
  const colorPool: BoardColor[] = ["a","a","a","a","a","a","a","a","b","b","b","b","b","b","b","neutral","neutral","neutral","neutral","neutral","neutral","assassin"];
  return { board, colors: shuffle(colorPool) };
}

export default function Codenames({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const words = useMemo(() => locale === "ru" ? WORDS_RU : WORDS_EN, [locale]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => { const { board, colors } = buildBoard(words); return { board, colors, activeTeam: "a", clue: "", clueNumber: 0, revealed: Array(16).fill(false), spymasterA: null, spymasterB: null, scores: { a: 0, b: 0 }, phase: "assign" }; });
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { board: [], colors: [], activeTeam: "a", clue: "", clueNumber: 0, revealed: [], spymasterA: null, spymasterB: null, scores: { a: 0, b: 0 }, phase: "assign" });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;
  const stage = stageHook;

  const [team, setTeam] = useState<"a" | "b" | null>(null);
  const [isSpymaster, setIsSpymaster] = useState(false);
  const [clueWord, setClueWord] = useState("");
  const [clueNum, setClueNum] = useState(1);

  useEffect(() => { setTeam(null); setIsSpymaster(false); setClueWord(""); setClueNum(1); }, [state.phase]);

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "setSpymaster") { const { tm } = a.payload as { tm: "a" | "b" }; setState?.((prev) => { const next = { ...prev, [tm === "a" ? "spymasterA" : "spymasterB"]: a.userId }; return { ...next, phase: next.spymasterA && next.spymasterB ? "clue" : next.phase }; }); }
      if (a.actionType === "giveClue") { const { wd, nm } = a.payload as { wd: string; nm: number }; setState?.((prev) => a.userId === prev[`spymaster${prev.activeTeam.toUpperCase()}` as "spymasterA" | "spymasterB"] && prev.phase === "clue" ? { ...prev, clue: wd, clueNumber: nm, phase: "guess" } : prev); }
      if (a.actionType === "pickWord") {
        const { idx } = a.payload as { idx: number };
        setState?.((prev) => {
          if (prev.phase !== "guess" || prev.revealed[idx] || !prev.colors[idx]) return prev; const color = prev.colors[idx]; const nr = [...prev.revealed]; nr[idx] = true;
          if (color === "assassin") { const w = prev.activeTeam === "a" ? "b" : "a"; return { ...prev, revealed: nr, phase: "reveal", scores: { ...prev.scores, [w]: prev.scores[w] + 1 } }; }
          if (color === prev.activeTeam) return { ...prev, revealed: nr, scores: { ...prev.scores, [color]: prev.scores[color] + 1 } };
          const nxt = prev.activeTeam === "a" ? "b" : "a"; return { ...prev, revealed: nr, activeTeam: nxt, clue: "", clueNumber: 0, phase: "clue" };
        });
      }
    }
    clearActions?.();
  }, [playerActions, isHost, setState, clearActions]);

  const teamACount = useMemo(() => state.colors.filter((c, i) => c === "a" && !state.revealed[i]).length, [state.colors, state.revealed]);
  const teamBCount = useMemo(() => state.colors.filter((c, i) => c === "b" && !state.revealed[i]).length, [state.colors, state.revealed]);
  const gameOver = state.phase === "reveal" || teamACount === 0 || teamBCount === 0;

  const pickTeam = useCallback((t: "a" | "b") => { setTeam(t); sendAction("setSpymaster", { tm: t }); setIsSpymaster(true); }, [sendAction]);
  const giveClue = useCallback(() => { if (!clueWord.trim()) return; sendAction("giveClue", { wd: clueWord.trim(), nm: clueNum }); setClueWord(""); }, [clueWord, clueNum, sendAction]);
  const pickWord = useCallback((idx: number) => { sendAction("pickWord", { idx }); }, [sendAction]);
  const finish = useCallback(() => { stage.complete(); onSave(Math.max(state.scores.a, state.scores.b)); }, [onSave, state.scores, stage]);

  const colorMap: Record<BoardColor, string> = { a: "#ef4444", b: "#3b82f6", neutral: "#a3a3a3", assassin: "#171717" };
  const showColors = isHost || isSpymaster;

  if (!isHost && state.phase === "assign" && !isSpymaster) {
    return <div className="party-game-board game-board-enter"><h3>{t("pickTeam")}</h3><div style={{ display: "flex", gap: 12, marginTop: 12 }}><button className="demo-action demo-action--lime" onClick={() => pickTeam("a")} type="button">{t("teamA")}</button><button className="demo-action demo-action--lime" onClick={() => pickTeam("b")} type="button">{t("teamB")}</button></div></div>;
  }

  if (!isHost && isSpymaster && state.phase === "clue" && team === state.activeTeam) {
    return <div className="party-game-board game-board-enter"><h3>{t("giveClue")}</h3><div style={{ display: "flex", gap: 8, marginTop: 8 }}><input value={clueWord} onChange={(e) => setClueWord(e.target.value)} placeholder={t("clueWord")} style={{ flex: 1, padding: 8, borderRadius: 6 }} /><input type="number" min={1} max={8} value={clueNum} onChange={(e) => setClueNum(Number(e.target.value))} style={{ width: 50, padding: 8, borderRadius: 6 }} /></div><button className="demo-action demo-action--lime" onClick={giveClue} disabled={!clueWord.trim()} type="button" style={{ marginTop: 8 }}>{t("sendClue")}</button></div>;
  }

  const canGuess = !isHost && !isSpymaster && state.phase === "guess" && team === state.activeTeam;

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("team")}: {state.activeTeam.toUpperCase()}</span>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ color: "#ef4444" }}>{t("teamA")}: {state.scores.a} ({teamACount} {t("left")})</span>
      <span style={{ color: "#3b82f6" }}>{t("teamB")}: {state.scores.b} ({teamBCount} {t("left")})</span>
    </div>
    {state.clue && <p style={{ fontSize: 24, fontWeight: 700 }}>&quot;{state.clue}&quot; — {state.clueNumber}</p>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
      {state.board.map((word, i) => (<button key={i} type="button" disabled={state.revealed[i] || (isHost && state.phase === "clue") || state.phase === "assign"} onClick={() => { if (canGuess) pickWord(i); }} style={{ padding: "10px 4px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14, background: state.revealed[i] ? colorMap[state.colors[i]] : state.phase === "reveal" ? colorMap[state.colors[i]] : showColors && isSpymaster ? colorMap[state.colors[i]] : "var(--dark)", color: "var(--white)", opacity: state.revealed[i] ? 1 : 0.85, cursor: canGuess && !state.revealed[i] ? "pointer" : "default", wordBreak: "break-word" }}>{word}</button>))}
    </div>
    {gameOver && <div style={{ marginTop: 12, textAlign: "center" }}><p style={{ fontSize: 20, fontWeight: 700, color: "var(--lime)" }}>{teamACount === 0 ? t("teamAWins") : teamBCount === 0 ? t("teamBWins") : state.activeTeam === "a" ? t("teamBWins") : t("teamAWins")}</p><button className="demo-action demo-action--lime" onClick={finish} type="button">{t("finish")}</button></div>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}

const EN: Record<string, string> = { team: "Team", teamA: "Red", teamB: "Blue", left: "left", teamAWins: "Red wins!", teamBWins: "Blue wins!", pickTeam: "Pick your team", giveClue: "Give a clue", clueWord: "Word", sendClue: "Send clue", guess: "Pick a word", finish: "Finish" };
const RU: Record<string, string> = { team: "Команда", teamA: "Красные", teamB: "Синие", left: "осталось", teamAWins: "Красные победили!", teamBWins: "Синие победили!", pickTeam: "Выбери команду", giveClue: "Дай подсказку", clueWord: "Слово", sendClue: "Отправить", guess: "Выбери слово", finish: "Завершить" };
