"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const WORDS_EN = ["Pizza", "Galaxy", "Guitar", "Volcano", "Penguin", "Lighthouse", "Sushi", "Robot", "Tornado", "Diamond"];
const WORDS_RU = ["Пицца", "Галактика", "Гитара", "Вулкан", "Пингвин", "Маяк", "Суши", "Робот", "Торнадо", "Бриллиант"];
const DEFAULT_PLAYERS = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6"];

type GameState = { round: number; phase: "clue" | "vote" | "reveal"; word: string; impostorId: string | null; clues: Array<{ userId: string; clue: string }>; votes: Record<string, string>; turnIndex: number; players: string[] };

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function ImpostorStage({ sessionId, partyId, onSave, words }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void; words: string[] }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({ round: 0, phase: "clue", word: words[0], impostorId: null, clues: [], votes: {}, turnIndex: 0, players: DEFAULT_PLAYERS })
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "join") {
        const name = (a.payload as { name: string }).name || a.userId.slice(0, 8);
        setState((prev) => ({ ...prev, players: prev.players.includes(name) ? prev.players : [...prev.players, name] }));
      } else if (a.actionType === "clue" && state.phase === "clue") {
        const clue = (a.payload as { clue: string }).clue?.trim();
        if (clue && !state.clues.find((c) => c.userId === a.userId)) {
          setState((prev) => ({ ...prev, clues: [...prev.clues, { userId: a.userId, clue }] }));
        }
      } else if (a.actionType === "vote" && state.phase === "vote") {
        const target = (a.payload as { target: string }).target;
        setState((prev) => ({ ...prev, votes: { ...prev.votes, [a.userId]: target } }));
      } else if (a.actionType === "guess" && state.phase === "vote") {
        const word = (a.payload as { word: string }).word?.trim().toLowerCase();
        if (word === state.word.toLowerCase()) {
          setState((prev) => ({ ...prev, phase: "reveal", impostorId: a.userId }));
          onSave(0);
          break;
        }
      }
    }
    clearActions();
  }, [playerActions, state.phase, state.clues, state.word, state.players, setState, clearActions, onSave]);

  const startGame = useCallback(() => {
    const word = words[Math.floor(Math.random() * words.length)];
    const players = state.players.length >= 3 ? state.players : DEFAULT_PLAYERS;
    const impostor = players[Math.floor(Math.random() * players.length)];
    setState((prev) => ({ ...prev, phase: "clue", word, impostorId: impostor, clues: [], votes: {}, turnIndex: 0, players }));
  }, [words, state.players, setState]);

  const allClued = state.clues.length >= state.players.length;
  const allVoted = Object.keys(state.votes).length >= state.players.length;

  useEffect(() => {
    if (state.phase === "clue" && allClued) setState((p) => ({ ...p, phase: "vote" }));
  }, [state.phase, allClued, setState]);

  useEffect(() => {
    if (state.phase === "vote" && allVoted) {
      const tally: Record<string, number> = {};
      for (const t of Object.values(state.votes)) tally[t] = (tally[t] || 0) + 1;
      const top = Object.entries(tally).sort(([, a], [, b]) => b - a)[0]?.[0];
      setState((p) => ({ ...p, phase: "reveal", impostorId: p.impostorId === top ? p.impostorId : null }));
      onSave(top === state.impostorId ? 5 : 0);
    }
  }, [state.phase, allVoted, state.votes, state.impostorId, setState, onSave]);

  if (state.phase === "reveal") {
    const caught = state.votes[state.impostorId!] === state.impostorId || state.clues.length === 0;
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("impostorReveal")}</span>
        <h3>{state.impostorId ? `${t("impostorWas")}: ${state.impostorId.slice(0, 8)}` : t("impostorNone")}</h3>
        <p>{t("word")}: <strong style={{ color: "#a3e635" }}>{state.word}</strong></p>
        <div className="game-primary-actions"><button className="demo-action demo-action--lime" onClick={() => { startGame(); }} type="button">{t("newRound")}</button></div>
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("impostorTitle")}</span>
      <h3>{state.phase === "clue" ? t("giveClues") : t("voteOut")}</h3>
      {state.phase === "vote" && <p>{Object.keys(state.votes).length}/{state.players.length} {t("voted")}</p>}
      <div className="game-primary-actions">
        {!state.impostorId && <button className="demo-action demo-action--lime" onClick={startGame} type="button">{t("start")}</button>}
      </div>
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function ImpostorController({ sessionId, words }: { sessionId: string; words: string[] }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, { round: 0, phase: "clue", word: "", impostorId: null, clues: [], votes: {}, turnIndex: 0, players: [] });
  const [clue, setClue] = useState("");
  const [sent, setSent] = useState(false);
  const [votedTarget, setVotedTarget] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [guessed, setGuessed] = useState(false);

  useEffect(() => { setSent(false); setClue(""); setVotedTarget(null); setGuessed(false); setGuess(""); }, [state.phase, state.round]);

  const sendClue = useCallback(() => {
    if (!clue.trim() || sent) return;
    setSent(true);
    sendAction("clue", { clue: clue.trim() });
  }, [clue, sent, sendAction]);

  const vote = useCallback((target: string) => {
    if (votedTarget) return;
    setVotedTarget(target);
    sendAction("vote", { target });
  }, [votedTarget, sendAction]);

  const spyGuess = useCallback(() => {
    if (!guess.trim() || guessed) return;
    setGuessed(true);
    sendAction("guess", { word: guess.trim() });
  }, [guess, guessed, sendAction]);

  if (state.phase === "clue") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("giveClues")}</span>
        <h3>{t("oneWordClue")}</h3>
        <div className="bs-input-group">
          <input className="bs-input" maxLength={20} onChange={(e) => setClue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendClue()} placeholder={t("cluePlaceholder")} value={clue} />
          <button className="demo-action demo-action--lime" disabled={sent || !clue.trim()} onClick={sendClue} type="button">{sent ? t("sent") : t("send")}</button>
        </div>
      </div>
    );
  }

  if (state.phase === "vote") {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("voteOut")}</span>
        <h3>{t("whoImpostor")}</h3>
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

const EN: Record<string, string> = { impostorTitle: "Impostor", giveClues: "Give a one-word clue!", oneWordClue: "One word only", cluePlaceholder: "Your clue…", send: "Send", sent: "Sent!", voteOut: "Vote out the impostor!", whoImpostor: "Who is the impostor?", voted: "voted", youVoted: "You voted", impostorReveal: "Reveal", impostorWas: "The impostor was", impostorNone: "No impostor caught", word: "The word", newRound: "New Round", start: "Start Game", spyGuessPlaceholder: "Guess the word…", spyGuess: "Guess Word", waiting: "Waiting for host…", answer: "Answer" };
const RU: Record<string, string> = { impostorTitle: "Импостор", giveClues: "Дай подсказку в одно слово!", oneWordClue: "Только одно слово", cluePlaceholder: "Твоя подсказка…", send: "Отправить", sent: "Отправлено!", voteOut: "Голосуй за импостора!", whoImpostor: "Кто импостор?", voted: "проголосовало", youVoted: "Ты проголосовал", impostorReveal: "Раскрытие", impostorWas: "Импостором был", impostorNone: "Импостора не поймали", word: "Слово", newRound: "Новый раунд", start: "Начать", spyGuessPlaceholder: "Угадай слово…", spyGuess: "Угадать", waiting: "Жди хоста…", answer: "Ответ" };

export default function Impostor({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const words = useMemo(() => shuffle(locale === "ru" ? [...WORDS_RU] : [...WORDS_EN]), [locale]);

  if (role === "controller" && sessionId) return <ImpostorController sessionId={sessionId} words={words} />;
  return <ImpostorStage sessionId={sessionId} partyId={partyId} onSave={onSave} words={words} />;
}
