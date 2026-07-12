"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

type Role = "mafia" | "doctor" | "seer" | "villager";
type GameState = {
  phase: "deal" | "night" | "day" | "vote" | "reveal";
  players: string[];
  roles: Record<string, Role>;
  alive: string[];
  nightActions: { kill?: string; save?: string; investigate?: string };
  votes: Record<string, string>;
  round: number;
  timer: number;
  revealTarget: string;
  eliminated: string;
};

function WerewolfStage({ sessionId, partyId, onSave }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);

  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({
      phase: "deal" as const, players: [], roles: {}, alive: [],
      nightActions: {}, votes: {}, round: 0, timer: 0, revealTarget: "", eliminated: "",
    }),
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "join" && state.phase === "deal") {
        setState((prev) => ({
          ...prev,
          players: prev.players.includes(a.userId) ? prev.players : [...prev.players, a.userId],
        }));
      }
      if (a.actionType === "nightAction" && state.phase === "night") {
        const { type, target } = a.payload as { type: Role; target: string };
        setState((prev) => ({ ...prev, nightActions: { ...prev.nightActions, [type]: target } }));
      }
      if (a.actionType === "vote" && state.phase === "vote") {
        setState((prev) => ({ ...prev, votes: { ...prev.votes, [a.userId]: (a.payload as { target: string }).target } }));
      }
    }
    clearActions();
  }, [playerActions, state.phase, setState, clearActions]);

  useEffect(() => {
    if (state.phase === "night" && state.nightActions.kill && state.nightActions.save !== undefined) {
      const saved = state.nightActions.save === state.nightActions.kill;
      const dead = saved ? "" : state.nightActions.kill;
      const alive = dead ? state.alive.filter((p) => p !== dead) : state.alive;
      setState((prev) => ({
        ...prev, phase: "day", alive, eliminated: dead,
        nightActions: {}, timer: 30,
      }));
    }
  }, [state.nightActions, state.alive, setState]);

  useEffect(() => {
    if (state.phase !== "day" && state.phase !== "vote" || state.timer <= 0) return;
    const id = setTimeout(() => setState((p) => ({ ...p, timer: p.timer - 1 })), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timer, setState]);

  useEffect(() => {
    if (state.phase === "day" && state.timer === 0) {
      setState((p) => ({ ...p, phase: "vote", timer: 0, votes: {} }));
    }
  }, [state.timer, state.phase, setState]);

  useEffect(() => {
    if (state.phase === "vote") {
      const totalVotes = Object.keys(state.votes).length;
      const aliveCount = state.alive.length;
      if (totalVotes >= aliveCount) {
        const tally: Record<string, number> = {};
        for (const t of Object.values(state.votes)) {
          tally[t] = (tally[t] || 0) + 1;
        }
        const sorted = Object.entries(tally).sort(([, a], [, b]) => b - a);
        const eliminated = sorted[0]?.[0] || "";
        const alive = eliminated ? state.alive.filter((p) => p !== eliminated) : state.alive;
        const mafiaAlive = alive.filter((p) => state.roles[p] === "mafia");
        const villagersAlive = alive.filter((p) => state.roles[p] !== "mafia");
        const gameOver = mafiaAlive.length === 0 || mafiaAlive.length >= villagersAlive.length;
        setState((prev) => ({
          ...prev, phase: gameOver ? "reveal" : "night",
          alive, eliminated, votes: {}, round: prev.round + 1, nightActions: {},
        }));
        if (gameOver) complete();
      }
    }
  }, [state.phase, state.votes, state.alive, state.roles, setState, complete]);

  const assignRoles = useCallback(() => {
    const n = state.players.length;
    if (n < 5) return;
    const rolesArr: Role[] = ["mafia", "doctor", "seer", ...Array(n - 3).fill("villager")];
    const shuffledRoles = shuffle(rolesArr);
    const roles: Record<string, Role> = {};
    state.players.forEach((p, i) => { roles[p] = shuffledRoles[i]; });
    setState((prev) => ({
      ...prev, phase: "night", roles, alive: [...prev.players],
      nightActions: {}, votes: {}, round: 0, eliminated: "",
    }));
  }, [state.players, setState]);

  const getVoteTally = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const t of Object.values(state.votes)) {
      tally[t] = (tally[t] || 0) + 1;
    }
    return tally;
  }, [state.votes]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("phase")}: {t(state.phase)}</span>
      {state.phase === "deal" && (
        <div>
          <p style={{ color: "#a3a3a3" }}>{t("playersJoined")}: {state.players.length}</p>
          <p style={{ color: "#a3a3a3", marginBottom: 12 }}>{t("needPlayers")}</p>
          <button className="demo-action demo-action--lime" disabled={state.players.length < 5} onClick={assignRoles} type="button">
            {t("dealRoles")}
          </button>
        </div>
      )}
      {state.phase === "night" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "16px 0" }}>🌙</p>
          <p style={{ color: "#a3a3a3" }}>{t("nightDesc")}</p>
        </div>
      )}
      {state.phase === "day" && (
        <div>
          {state.eliminated && <p style={{ color: "#f87171" }}>{t("eliminated")}: {state.eliminated.slice(0, 8)}</p>}
          <p style={{ fontSize: 36, fontWeight: 700, color: state.timer <= 10 ? "#f87171" : "#a3e635" }}>{state.timer}s</p>
          <p style={{ color: "#a3a3a3" }}>{state.alive.length} {t("alive")}</p>
          <p style={{ color: "#a3a3a3" }}>{t("discuss")}</p>
        </div>
      )}
      {state.phase === "vote" && (
        <div>
          <p style={{ color: "#a3a3a3", marginBottom: 8 }}>{t("voting")}</p>
          {state.alive.map((p) => (
            <p key={p} style={{ color: "#a3a3a3" }}>{p.slice(0, 8)}: {getVoteTally[p] || 0} {t("votes")}</p>
          ))}
        </div>
      )}
      {state.phase === "reveal" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#a3e635" }}>{t("gameOver")}</p>
          {state.players.map((p) => (
            <p key={p} style={{ color: state.roles[p] === "mafia" ? "#f87171" : "#a3a3a3" }}>
              {p.slice(0, 8)}: {t(state.roles[p])}
            </p>
          ))}
          <button className="demo-action demo-action--lime" onClick={() => onSave(state.alive.length)} type="button" style={{ marginTop: 12 }}>
            {t("finish")}
          </button>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function WerewolfController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    phase: "deal", players: [], roles: {}, alive: [],
    nightActions: {}, votes: {}, round: 0, timer: 0, revealTarget: "", eliminated: "",
  });
  const [role, setRole] = useState<Role | null>(null);
  const [hasActed, setHasActed] = useState(false);

  useEffect(() => {
    if (state.phase === "night" && state.roles) {
      const myRole = state.roles[Object.keys(state.roles).find((k) => k.startsWith("u_")) || ""];
      setRole(myRole || null);
      setHasActed(false);
    }
  }, [state.phase, state.roles]);

  const join = useCallback(() => sendAction("join"), [sendAction]);
  const nightAction = useCallback((type: Role, target: string) => {
    setHasActed(true);
    sendAction("nightAction", { type, target });
  }, [sendAction]);
  const vote = useCallback((target: string) => {
    setHasActed(true);
    sendAction("vote", { target });
  }, [sendAction]);

  if (state.phase === "deal") {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{t("joining")}</h3>
        <button className="demo-action demo-action--lime" onClick={join} type="button">{t("joinGame")}</button>
      </div>
    );
  }

  if (state.phase === "night" && role && !hasActed) {
    if (role === "mafia") {
      return (
        <div className="party-game-board game-board-enter">
          <span className="game-step">{t("mafia")}</span>
          <p style={{ color: "#a3a3a3" }}>{t("pickTarget")}</p>
          {state.alive.map((p) => (
            <button key={p} className="demo-action demo-action--white" onClick={() => nightAction("mafia", p)} type="button" style={{ marginBottom: 6, width: "100%" }}>
              {p.slice(0, 12)}
            </button>
          ))}
        </div>
      );
    }
    if (role === "doctor") {
      return (
        <div className="party-game-board game-board-enter">
          <span className="game-step">{t("doctor")}</span>
          <p style={{ color: "#a3a3a3" }}>{t("saveTarget")}</p>
          {state.alive.map((p) => (
            <button key={p} className="demo-action demo-action--white" onClick={() => nightAction("doctor", p)} type="button" style={{ marginBottom: 6, width: "100%" }}>
              {p.slice(0, 12)}
            </button>
          ))}
        </div>
      );
    }
    if (role === "seer") {
      return (
        <div className="party-game-board game-board-enter">
          <span className="game-step">{t("seer")}</span>
          <p style={{ color: "#a3a3a3" }}>{t("investigate")}</p>
          {state.alive.map((p) => (
            <button key={p} className="demo-action demo-action--white" onClick={() => nightAction("seer", p)} type="button" style={{ marginBottom: 6, width: "100%" }}>
              {p.slice(0, 12)}
            </button>
          ))}
        </div>
      );
    }
  }

  if (state.phase === "day" || state.phase === "vote") {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{t("daytime")}</h3>
        {state.phase === "vote" && !hasActed && (
          <div>
            <p style={{ color: "#a3a3a3", marginBottom: 8 }}>{t("voteToEliminate")}</p>
            {state.alive.map((p) => (
              <button key={p} className="demo-action demo-action--white" onClick={() => vote(p)} type="button" style={{ marginBottom: 6, width: "100%" }}>
                {p.slice(0, 12)}
              </button>
            ))}
          </div>
        )}
        {hasActed && <p style={{ color: "#a3e635" }}>{t("voted")}</p>}
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <h3>{t("waiting")}</h3>
    </div>
  );
}

const EN: Record<string, string> = {
  phase: "Phase", deal: "Deal", night: "Night", day: "Discussion", vote: "Vote", reveal: "Reveal",
  playersJoined: "Players joined", needPlayers: "Need 5+ players to start",
  dealRoles: "Deal Roles", nightDesc: "Close your eyes. Roles are acting...",
  eliminated: "Eliminated", alive: "alive", discuss: "Discuss and vote!",
  voting: "Voting...", votes: "votes", gameOver: "Game Over!",
  joining: "Join the game", joinGame: "Join", mafia: "Mafia",
  pickTarget: "Pick a target to eliminate", doctor: "Doctor",
  saveTarget: "Pick someone to save", seer: "Seer",
  investigate: "Pick someone to investigate", daytime: "Discussion time!",
  voteToEliminate: "Vote to eliminate", voted: "Voted! Waiting...",
  waiting: "Waiting...", finish: "Finish",
};

const RU: Record<string, string> = {
  phase: "Фаза", deal: "Раздача", night: "Ночь", day: "Обсуждение", vote: "Голосование", reveal: "Итог",
  playersJoined: "Игроков присоединилось", needPlayers: "Нужно 5+ игроков",
  dealRoles: "Раздать роли", nightDesc: "Закройте глаза. Роли действуют...",
  eliminated: "Устранён", alive: "живы", discuss: "Обсуждайте и голосуйте!",
  voting: "Голосование...", votes: "голосов", gameOver: "Игра окончена!",
  joining: "Присоединиться", joinGame: "Войти", mafia: "Мафия",
  pickTarget: "Выбери цель для устранения", doctor: "Доктор",
  saveTarget: "Кого спасти", seer: "Шериф",
  investigate: "Кого проверить", daytime: "Время обсуждения!",
  voteToEliminate: "Голосуй за устранение", voted: "Проголосовал! Жди...",
  waiting: "Ожидание...", finish: "Завершить",
};

export default function Werewolf({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  if (role === "controller" && sessionId) return <WerewolfController sessionId={sessionId} />;
  return <WerewolfStage sessionId={sessionId} partyId={partyId} onSave={onSave} />;
}
