"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { useUser } from "@clerk/nextjs";

function shuffle<T>(arr: T[]): T[] { const r = [...arr]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

type Role = "mafia" | "doctor" | "seer" | "villager";
type GameState = { phase: "deal" | "night" | "day" | "vote" | "reveal"; players: string[]; roles: Record<string, Role>; alive: string[]; nightActions: { kill?: string; save?: string; investigate?: string }; seerResult: Record<string, Role>; votes: Record<string, string>; round: number; timer: number; eliminated: string };

export default function Werewolf({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const isHost = role === "stage";
  const { user } = useUser();
  const playerId = user?.id ?? "";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ phase: "deal", players: [], roles: {}, alive: [], nightActions: {}, seerResult: {}, votes: {}, round: 0, timer: 0, eliminated: "" }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { phase: "deal", players: [], roles: {}, alive: [], nightActions: {}, seerResult: {}, votes: {}, round: 0, timer: 0, eliminated: "" });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;

  const [myRole, setMyRole] = useState<Role | null>(null);
  const [hasActed, setHasActed] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (state.phase === "night" && state.roles && state.roles[playerId]) { setMyRole(state.roles[playerId]); setHasActed(false); }
  }, [state.phase, state.roles, playerId]);

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "join" && state.phase === "deal") { const pid = (a.payload as { playerId?: string })?.playerId || a.userId; setState?.((prev) => ({ ...prev, players: prev.players.includes(pid) ? prev.players : [...prev.players, pid] })); }
      if (a.actionType === "nightAction" && state.phase === "night") { const { tp, tg } = a.payload as { tp: Role; tg: string }; setState?.((prev) => ({ ...prev, nightActions: { ...prev.nightActions, [tp]: tg } })); }
      if (a.actionType === "vote" && state.phase === "vote") { setState?.((prev) => ({ ...prev, votes: { ...prev.votes, [a.userId]: (a.payload as { target: string }).target } })); }
    }
    clearActions?.();
  }, [playerActions, state.phase, isHost, setState, clearActions]);

  useEffect(() => {
    if (!isHost) return;
    if (state.phase === "night" && state.nightActions.kill && state.nightActions.save !== undefined) {
      const saved = state.nightActions.save === state.nightActions.kill;
      const dead = saved ? "" : state.nightActions.kill!;
      const alive = dead ? state.alive.filter((p) => p !== dead) : state.alive;
      const sR = { ...state.seerResult };
      if (state.nightActions.investigate && state.roles[state.nightActions.investigate]) sR[state.nightActions.investigate] = state.roles[state.nightActions.investigate];
      setState?.((p) => ({ ...p, phase: "day", alive, eliminated: dead, seerResult: sR, nightActions: {}, timer: 30 }));
    }
  }, [state.nightActions, state.alive, state.roles, state.seerResult, isHost, setState]);

  useEffect(() => {
    if (!isHost) return;
    if (state.phase !== "day" && state.phase !== "vote" || state.timer <= 0) return;
    const id = setTimeout(() => setState?.((p) => ({ ...p, timer: p.timer - 1 })), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timer, isHost, setState]);

  useEffect(() => {
    if (!isHost) return;
    if (state.phase !== "night") return;
    const id = setTimeout(() => { setState?.((prev) => { if (prev.phase !== "night") return prev; if (!prev.nightActions.kill) return { ...prev, nightActions: { ...prev.nightActions, kill: prev.alive[Math.floor(Math.random() * prev.alive.length)] || "" } }; if (prev.nightActions.save === undefined) return { ...prev, nightActions: { ...prev.nightActions, save: "" } }; return prev; }); }, 30000);
    return () => clearTimeout(id);
  }, [state.phase, state.nightActions, isHost, setState]);

  useEffect(() => { if (!isHost) return; if (state.phase === "day" && state.timer === 0) setState?.((p) => ({ ...p, phase: "vote", timer: 0, votes: {} })); }, [state.timer, state.phase, isHost, setState]);

  useEffect(() => {
    if (!isHost) return;
    if (state.phase === "vote") {
      const totalVotes = Object.keys(state.votes).length;
      const aliveCount = state.alive.length;
      if (totalVotes >= aliveCount) {
        const tally: Record<string, number> = {}; for (const t of Object.values(state.votes)) tally[t] = (tally[t] || 0) + 1;
        const sorted = Object.entries(tally).sort(([, a], [, b]) => b - a);
        const elim = sorted[0]?.[0] || "";
        const alive = elim ? state.alive.filter((p) => p !== elim) : state.alive;
        const mafiaAlive = alive.filter((p) => state.roles[p] === "mafia");
        const villAlive = alive.filter((p) => state.roles[p] !== "mafia");
        const gameOver = mafiaAlive.length === 0 || mafiaAlive.length >= villAlive.length;
        setState?.((prev) => ({ ...prev, phase: gameOver ? "reveal" : "night", alive, eliminated: elim, votes: {}, round: prev.round + 1, nightActions: {} }));
      }
    }
  }, [state.phase, state.votes, state.alive, state.roles, isHost, setState]);

  const assignRoles = useCallback(() => {
    if (!isHost) return;
    const n = state.players.length; if (n < 5) return;
    const rolesArr: Role[] = ["mafia", "doctor", "seer", ...Array(n - 3).fill("villager")];
    const shuffledRoles = shuffle(rolesArr);
    const roles: Record<string, Role> = {}; state.players.forEach((p, i) => { roles[p] = shuffledRoles[i]; });
    setState?.((prev) => ({ ...prev, phase: "night", roles, alive: [...prev.players], nightActions: {}, votes: {}, round: 0, eliminated: "" }));
  }, [state.players, isHost, setState]);

  const join = useCallback(() => { if (!playerId) return; setJoined(true); sendAction("join", { playerId }); }, [sendAction, playerId]);
  const nightAction = useCallback((tp: Role, tg: string) => { setHasActed(true); sendAction("nightAction", { tp, tg }); }, [sendAction]);
  const vote = useCallback((target: string) => { setHasActed(true); sendAction("vote", { target }); }, [sendAction]);

  const getVoteTally = useMemo(() => { const tally: Record<string, number> = {}; for (const t of Object.values(state.votes)) tally[t] = (tally[t] || 0) + 1; return tally; }, [state.votes]);
  const seerInvestigation = myRole === "seer" && state.seerResult ? Object.entries(state.seerResult) : [];

  if (state.phase === "deal" && !isHost && !joined) {
    return <div className="party-game-board game-board-enter"><h3>{t("joining")}</h3><button className="demo-action demo-action--lime" onClick={join} type="button">{t("joinGame")}</button></div>;
  }

  if (!isHost && state.phase === "night" && myRole && !hasActed) {
    if (myRole === "mafia") return <div className="party-game-board game-board-enter"><span className="game-step">{t("mafia")}</span><p style={{ color: "var(--gray)" }}>{t("pickTarget")}</p>{state.alive.map((p) => (<button key={p} className="demo-action demo-action--white" onClick={() => nightAction("mafia", p)} type="button" style={{ marginBottom: 6, width: "100%" }}>{p.slice(0, 12)}</button>))}</div>;
    if (myRole === "doctor") return <div className="party-game-board game-board-enter"><span className="game-step">{t("doctor")}</span><p style={{ color: "var(--gray)" }}>{t("saveTarget")}</p>{state.alive.map((p) => (<button key={p} className="demo-action demo-action--white" onClick={() => nightAction("doctor", p)} type="button" style={{ marginBottom: 6, width: "100%" }}>{p.slice(0, 12)}</button>))}</div>;
    if (myRole === "seer") return <div className="party-game-board game-board-enter"><span className="game-step">{t("seer")}</span><p style={{ color: "var(--gray)" }}>{t("investigate")}</p>{state.alive.map((p) => (<button key={p} className="demo-action demo-action--white" onClick={() => nightAction("seer", p)} type="button" style={{ marginBottom: 6, width: "100%" }}>{p.slice(0, 12)}</button>))}</div>;
  }

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("phase")}: {t(state.phase)}</span>
    {state.phase === "deal" && <div>{isHost && <><p style={{ color: "var(--gray)" }}>{t("playersJoined")}: {state.players.length}</p><p style={{ color: "var(--gray)", marginBottom: 12 }}>{t("needPlayers")}</p><button className="demo-action demo-action--lime" disabled={state.players.length < 5} onClick={assignRoles} type="button">{t("dealRoles")}</button></>}</div>}
    {state.phase === "night" && <div style={{ textAlign: "center" }}><p style={{ fontSize: 32, margin: "16px 0" }}>🌙</p><p style={{ color: "var(--gray)" }}>{t("nightDesc")}</p></div>}
    {state.phase === "day" && <div>{state.eliminated && <p style={{ color: "var(--red)" }}>{t("eliminated")}: {state.eliminated.slice(0, 8)}</p>}<p style={{ fontSize: 36, fontWeight: 700, color: state.timer <= 10 ? "var(--red)" : "var(--lime)" }}>{state.timer}s</p><p style={{ color: "var(--gray)" }}>{state.alive.length} {t("alive")} — {t("discuss")}</p>{myRole === "seer" && seerInvestigation.length > 0 && <div style={{ marginBottom: 8 }}>{seerInvestigation.map(([target, targetRole]) => (<p key={target} style={{ color: targetRole === "mafia" ? "var(--red)" : "var(--lime)", fontWeight: 700 }}>{target.slice(0, 8)}: {targetRole === "mafia" ? t("mafia") : t("villager")}</p>))}</div>}</div>}
    {state.phase === "vote" && <div><p style={{ color: "var(--gray)", marginBottom: 8 }}>{t("voting")}</p>{state.alive.map((p) => (<p key={p} style={{ color: "var(--gray)" }}>{p.slice(0, 8)}: {getVoteTally[p] || 0} {t("votes")}</p>))}{!isHost && !hasActed && <div style={{ marginTop: 8 }}>{state.alive.map((p) => (<button key={p} className="demo-action demo-action--white" onClick={() => vote(p)} type="button" style={{ marginBottom: 6, width: "100%" }}>{p.slice(0, 12)}</button>))}</div>}{!isHost && hasActed && <p style={{ color: "var(--lime)" }}>{t("voted")}</p>}</div>}
    {state.phase === "reveal" && <div style={{ textAlign: "center" }}><p style={{ fontSize: 24, fontWeight: 700, color: "var(--lime)" }}>{t("gameOver")}</p>{state.players.map((p) => (<p key={p} style={{ color: state.roles[p] === "mafia" ? "var(--red)" : "var(--gray)" }}>{p.slice(0, 8)}: {t(state.roles[p])}</p>))}<button className="demo-action demo-action--lime" onClick={() => onSave(state.alive.length)} type="button" style={{ marginTop: 12 }}>{t("finish")}</button></div>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}

const EN: Record<string, string> = { phase: "Phase", deal: "Deal", night: "Night", day: "Discussion", vote: "Vote", reveal: "Reveal", playersJoined: "Players joined", needPlayers: "Need 5+ players to start", dealRoles: "Deal Roles", nightDesc: "Close your eyes. Roles are acting...", eliminated: "Eliminated", alive: "alive", discuss: "Discuss and vote!", voting: "Voting...", votes: "votes", gameOver: "Game Over!", joining: "Join the game", joinGame: "Join", mafia: "Mafia", pickTarget: "Pick a target to eliminate", doctor: "Doctor", saveTarget: "Pick someone to save", seer: "Seer", investigate: "Pick someone to investigate", voted: "Voted! Waiting...", finish: "Finish", villager: "Villager" };
const RU: Record<string, string> = { phase: "Фаза", deal: "Раздача", night: "Ночь", day: "Обсуждение", vote: "Голосование", reveal: "Итог", playersJoined: "Игроков присоединилось", needPlayers: "Нужно 5+ игроков", dealRoles: "Раздать роли", nightDesc: "Закройте глаза. Роли действуют...", eliminated: "Устранён", alive: "живы", discuss: "Обсуждайте и голосуйте!", voting: "Голосование...", votes: "голосов", gameOver: "Игра окончена!", joining: "Присоединиться", joinGame: "Войти", mafia: "Мафия", pickTarget: "Выбери цель для устранения", doctor: "Доктор", saveTarget: "Кого спасти", seer: "Шериф", investigate: "Кого проверить", voted: "Проголосовал! Жди...", finish: "Завершить", villager: "Мирный житель" };
