"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const LOCATIONS_EN = ["Beach", "Hospital", "Space Station", "Casino", "School", "Prison", "Restaurant", "Airport", "Museum", "Train Station"];
const LOCATIONS_RU = ["Пляж", "Больница", "Космическая станция", "Казино", "Школа", "Тюрьма", "Ресторан", "Аэропорт", "Музей", "Вокзал"];
const DEFAULT_PLAYERS = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6"];

type GameState = { round: number; phase: "qa" | "vote" | "reveal"; location: string; spyId: string | null; turnIndex: number; votes: Record<string, string>; players: string[] };

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function SpyfallStage({ sessionId, partyId, onSave, locations }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void; locations: string[] }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({ round: 0, phase: "qa", location: locations[0], spyId: null, turnIndex: 0, votes: {}, players: DEFAULT_PLAYERS })
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "join") {
        const name = (a.payload as { name: string }).name || a.userId.slice(0, 8);
        setState((prev) => ({ ...prev, players: prev.players.includes(name) ? prev.players : [...prev.players, name] }));
      } else if (a.actionType === "vote" && state.phase === "vote") {
        const target = (a.payload as { target: string }).target;
        setState((prev) => ({ ...prev, votes: { ...prev.votes, [a.userId]: target } }));
      } else if (a.actionType === "spyGuess" && state.phase === "vote") {
        const loc = (a.payload as { location: string }).location?.trim().toLowerCase();
        if (loc === state.location.toLowerCase()) {
          setState((prev) => ({ ...prev, phase: "reveal", spyId: a.userId }));
          onSave(5);
          return;
        }
      }
    }
    clearActions();
  }, [playerActions, state.phase, state.location, state.players, setState, clearActions, onSave]);

  const startGame = useCallback(() => {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const players = state.players.length >= 3 ? state.players : DEFAULT_PLAYERS;
    const spy = players[Math.floor(Math.random() * players.length)];
    setState((prev) => ({ ...prev, phase: "qa", location: loc, spyId: spy, turnIndex: 0, votes: {}, players }));
  }, [locations, state.players, setState]);

  const goToVote = useCallback(() => setState((p) => ({ ...p, phase: "vote", votes: {} })), [setState]);

  const allVoted = Object.keys(state.votes).length >= state.players.length;

  useEffect(() => {
    if (state.phase === "vote" && allVoted) {
      const tally: Record<string, number> = {};
      for (const v of Object.values(state.votes)) tally[v] = (tally[v] || 0) + 1;
      const top = Object.entries(tally).sort(([, a], [, b]) => b - a)[0]?.[0];
      setState((p) => ({ ...p, phase: "reveal", spyId: p.spyId === top ? p.spyId : null }));
      onSave(top === state.spyId ? 5 : 0);
    }
  }, [state.phase, allVoted, state.votes, state.spyId, setState, onSave]);

  if (state.phase === "reveal") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("spyReveal")}</span>
        <h3>{state.spyId ? `${t("spyWas")}: ${state.spyId.slice(0, 8)}` : t("spyNone")}</h3>
        <p>{t("location")}: <strong style={{ color: "#a3e635" }}>{state.location}</strong></p>
        <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={startGame} type="button">{t("newRound")}</button></div>
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("spyfallTitle")}</span>
      <h3>{state.phase === "qa" ? t("askQuestions") : t("voteOutSpy")}</h3>
      {state.phase === "qa" && <p>{t("turn")}: {state.players[state.turnIndex % state.players.length]}</p>}
      {state.phase === "vote" && <p>{Object.keys(state.votes).length}/{state.players.length} {t("voted")}</p>}
      <div className="game-primary-actions">
        {!state.spyId && (
          <>
            {!state.phase && <button className="demo-action demo-action--lime" onClick={startGame} type="button">{t("start")}</button>}
            {state.phase === "qa" && <button className="demo-action demo-action--lime" onClick={goToVote} type="button">{t("goToVote")}</button>}
          </>
        )}
      </div>
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function SpyfallController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, { round: 0, phase: "qa", location: "", spyId: null, turnIndex: 0, votes: {}, players: [] });
  const [votedTarget, setVotedTarget] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [guessed, setGuessed] = useState(false);

  useEffect(() => { setVotedTarget(null); setGuessed(false); setGuess(""); }, [state.phase, state.round]);

  const vote = useCallback((target: string) => {
    if (votedTarget) return;
    setVotedTarget(target);
    sendAction("vote", { target });
  }, [votedTarget, sendAction]);

  const spyGuess = useCallback(() => {
    if (!guess.trim() || guessed) return;
    setGuessed(true);
    sendAction("spyGuess", { location: guess.trim() });
  }, [guess, guessed, sendAction]);

  if (state.phase === "qa") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("askQuestions")}</span>
        <h3>{t("takeTurn")}</h3>
        <p>{t("turn")}: {state.players[state.turnIndex % state.players.length] || "…"}</p>
      </div>
    );
  }

  if (state.phase === "vote") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("voteOutSpy")}</span>
        <h3>{t("whoSpy")}</h3>
        <div className="quiz-options">
          {state.players.filter((p) => p !== "Player 1").slice(0, 5).map((p) => (
            <button key={p} className={votedTarget === p ? "selected" : ""} disabled={votedTarget !== null} onClick={() => vote(p)} type="button">{p}</button>
          ))}
        </div>
        {votedTarget && <p className="controller-answered">{t("youVoted")}: {votedTarget}</p>}
        <div style={{ marginTop: 16 }}>
          <input className="bs-input" maxLength={20} onChange={(e) => setGuess(e.target.value)} placeholder={t("spyGuessPlaceholder")} value={guess} />
          <button className="demo-action demo-action--white" disabled={guessed || !guess.trim()} onClick={spyGuess} type="button" style={{ marginTop: 8 }}>{t("spyGuess")}</button>
        </div>
      </div>
    );
  }

  return <div className="party-game-board game-board-enter"><h3>{t("waiting")}</h3></div>;
}

const EN: Record<string, string> = { spyfallTitle: "Spyfall", askQuestions: "Ask questions in turn", takeTurn: "Wait for your turn", turn: "Current turn", goToVote: "Go to Vote", voteOutSpy: "Find the spy!", whoSpy: "Who is the spy?", voted: "voted", youVoted: "You voted", spyReveal: "Reveal", spyWas: "The spy was", spyNone: "Spy escaped!", location: "Location", newRound: "New Round", start: "Start Game", spyGuessPlaceholder: "Guess the location…", spyGuess: "Guess Location", waiting: "Waiting for host…" };
const RU: Record<string, string> = { spyfallTitle: "Шпион", askQuestions: "Задавай вопросы по очереди", takeTurn: "Жди свой ход", turn: "Сейчас ход", goToVote: "Перейти к голосованию", voteOutSpy: "Найди шпиона!", whoSpy: "Кто шпион?", voted: "проголосовало", youVoted: "Ты проголосовал", spyReveal: "Раскрытие", spyWas: "Шпионом был", spyNone: "Шпион ушёл!", location: "Локация", newRound: "Новый раунд", start: "Начать", spyGuessPlaceholder: "Угадай локацию…", spyGuess: "Угадать", waiting: "Жди хоста…" };

export default function Spyfall({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const locations = useMemo(() => shuffle(locale === "ru" ? [...LOCATIONS_RU] : [...LOCATIONS_EN]), [locale]);

  if (role === "controller" && sessionId) return <SpyfallController sessionId={sessionId} />;
  return <SpyfallStage sessionId={sessionId} partyId={partyId} onSave={onSave} locations={locations} />;
}
