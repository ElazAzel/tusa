"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const SONGS_EN = [
  { title: "Bohemian Rhapsody", artist: "Queen", year: "1975", clue: "Is this the real life? Is this just fantasy?" },
  { title: "Hotel California", artist: "Eagles", year: "1977", clue: "Welcome to the Hotel California, such a lovely place" },
  { title: "Stairway to Heaven", artist: "Led Zeppelin", year: "1971", clue: "There's a lady who's sure all that glitters is gold" },
  { title: "Imagine", artist: "John Lennon", year: "1971", clue: "Imagine there's no heaven, it's easy if you try" },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", year: "1991", clue: "With the lights out, it's less dangerous" },
  { title: "Billie Jean", artist: "Michael Jackson", year: "1982", clue: "She was more like a beauty queen from a movie scene" },
  { title: "Like a Rolling Stone", artist: "Bob Dylan", year: "1965", clue: "Once upon a time you dressed so fine, you threw the bums a dime" },
  { title: "Hey Jude", artist: "The Beatles", year: "1968", clue: "Hey Jude, don't make it bad, take a sad song and make it better" },
  { title: "Yesterday", artist: "The Beatles", year: "1965", clue: "Yesterday, all my troubles seemed so far away" },
  { title: "Superstition", artist: "Stevie Wonder", year: "1972", clue: "Very superstitious, writing's on the wall" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", year: "1987", clue: "She's got a smile that it seems to me reminds me of childhood memories" },
  { title: "Thriller", artist: "Michael Jackson", year: "1982", clue: "It's close to midnight and something evil's lurking from the dark" },
];

const SONGS_RU = [
  { title: "Богемская рапсодия", artist: "Queen", year: "1975", clue: "Это реальная жизнь? Или просто фантазия?" },
  { title: "Отель Калифорния", artist: "Eagles", year: "1977", clue: "Добро пожаловать в Отель Калифорния, такое прекрасное место" },
  { title: "Лестница в небо", artist: "Led Zeppelin", year: "1971", clue: "Есть леди, уверенная что всё что блестит — золото" },
  { title: "Представь", artist: "John Lennon", year: "1971", clue: "Представь что нет рая, это легко если попробовать" },
  { title: "Пахнет как подростковый дух", artist: "Nirvana", year: "1991", clue: "Со светом выключено, это менее опасно" },
  { title: "Билли Джин", artist: "Michael Jackson", year: "1982", clue: "Она была скорее как королева красоты из фильма" },
  { title: "Как скользящий камень", artist: "Bob Dylan", year: "1965", clue: "Когда-то ты одевался так хорошо" },
  { title: "Эй Джуд", artist: "The Beatles", year: "1968", clue: "Эй Джуд, не порть всё, возьми грустную песню и сделай лучше" },
  { title: "Вчера", artist: "The Beatles", year: "1965", clue: "Вчера все мои проблемы казались такими далёкими" },
  { title: "Суеверие", artist: "Stevie Wonder", year: "1972", clue: "Очень суеверно, письмо на стене" },
  { title: "Сладкий ребёнок мой", artist: "Guns N' Roses", year: "1987", clue: "У неё улыбка которая напоминает мне детские воспоминания" },
  { title: "Триллер", artist: "Michael Jackson", year: "1982", clue: "Близко к полуночи и что-то злое подстерегает из темноты" },
];

type Song = { title: string; artist: string; clue: string; year: string };
type GameState = { round: number; phase: "clue" | "guess" | "reveal"; song: Song; scores: Record<string, number>; timer: number; hintStage: number; winner: string };

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function GuessSong({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const songs = useMemo(() => shuffle(locale === "ru" ? SONGS_RU : SONGS_EN), [locale]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ round: 0, phase: "clue", song: songs[0], scores: {}, timer: 12, hintStage: 0, winner: "" }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { round: 0, phase: "clue", song: songs[0], scores: {}, timer: 12, hintStage: 0, winner: "" });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;
  const complete = isHost ? stageHook.complete : undefined;

  const [guess, setGuess] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => { setGuess(""); setSent(false); }, [state.round]);

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "guess" && state.phase === "guess" && !state.winner) {
        const g = ((a.payload as { title: string }).title || "").toLowerCase().trim();
        const title = state.song.title.toLowerCase();
        if (g.length >= 3 && title.includes(g)) {
          setState?.((prev) => ({ ...prev, scores: { ...prev.scores, [a.userId]: (prev.scores[a.userId] || 0) + (prev.timer > 6 ? 3 : 1) }, winner: a.userId, phase: "reveal" }));
        }
      }
    }
    clearActions?.();
  }, [playerActions, state.phase, state.song.title, state.timer, state.winner, isHost, setState, clearActions]);

  useEffect(() => {
    if (!isHost) return;
    if ((state.phase === "clue" || (state.phase === "guess" && !state.winner)) && state.timer > 0) {
      const id = setTimeout(() => setState?.((p) => ({ ...p, timer: p.timer - 1 })), 1000);
      return () => clearTimeout(id);
    }
  }, [state.phase, state.timer, state.winner, isHost, setState]);

  useEffect(() => {
    if (!isHost) return;
    if (state.phase === "clue" && state.timer === 9) setState?.((p) => ({ ...p, hintStage: 1 }));
    if (state.phase === "clue" && state.timer === 6) setState?.((p) => ({ ...p, hintStage: 2, phase: "guess" }));
    if (state.phase === "guess" && state.timer === 0 && !state.winner) setState?.((p) => ({ ...p, phase: "reveal" }));
  }, [state.timer, state.phase, state.winner, isHost, setState]);

  const sorted = useMemo(() => Object.entries(state.scores).sort(([, a], [, b]) => b - a), [state.scores]);

  const submitGuess = useCallback(() => {
    if (!guess.trim() || sent) return; setSent(true); sendAction("guess", { title: guess.trim() });
  }, [guess, sent, sendAction]);

  const handleKey = useCallback((e: React.KeyboardEvent) => { if (e.key === "Enter") submitGuess(); }, [submitGuess]);

  const next = useCallback(() => {
    if (!isHost) return;
    const nextRound = state.round + 1;
    if (nextRound >= songs.length) { complete?.(); const top = sorted[0]?.[1] || 0; onSave(top); return; }
    setState?.((p) => ({ ...p, round: nextRound, phase: "clue", song: songs[nextRound], timer: 12, hintStage: 0, winner: "" }));
  }, [state.round, sorted, songs, isHost, setState, complete, onSave]);

  const hint1 = state.song.artist + ", " + state.song.year;
  const hint2 = state.song.clue;
  const full = state.song.title + " — " + state.song.artist;

  return <div className="party-game-board game-board-enter">
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
    <span className="game-step">{t("round")} {state.round + 1}/{songs.length}</span>
    <div style={{ fontSize: 48, fontWeight: 700, color: state.timer <= 5 ? "var(--red)" : "var(--lime)", margin: "8px 0" }}>{state.timer}s</div>
    {state.phase === "clue" && <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--gray)" }}>{t("listen")}</p>
      {state.hintStage === 0 && <p style={{ fontSize: 24, marginTop: 8 }}>🎵 🎵 🎵</p>}
      {state.hintStage >= 1 && <div style={{ fontSize: 18, background: "var(--dark)", borderRadius: 8, padding: 12, marginTop: 8 }}>{hint1}</div>}
    </div>}
    {state.phase === "guess" && <div>
      <div style={{ fontSize: 18, background: "var(--dark)", borderRadius: 8, padding: 12, marginBottom: 8 }}>{hint1}</div>
      <div style={{ fontSize: 16, color: "var(--gray)", marginBottom: 8 }}>&ldquo;{hint2}&rdquo;</div>
      <input value={guess} onChange={(e) => setGuess(e.target.value)} onKeyDown={handleKey} placeholder={t("typeTitle")} disabled={sent} style={{ width: "100%", padding: 14, borderRadius: 8, border: "1px solid #404040", background: "#1a1a1a", color: "var(--white)", fontSize: 16, marginTop: 12 }} />
      <button className="demo-action demo-action--lime" onClick={submitGuess} disabled={sent || !guess.trim()} type="button" style={{ marginTop: 8, width: "100%" }}>{sent ? t("guessed") : t("submit")}</button>
    </div>}
    {state.phase === "reveal" && <div style={{ textAlign: "center" }}>
      {state.winner ? <p style={{ color: "var(--lime)", fontWeight: 700 }}>{state.winner.slice(0, 8)} {t("guessed")}!</p> : <p style={{ color: "var(--red)" }}>{t("noOneGuessed")}</p>}
      <div style={{ fontSize: 20, fontWeight: 700, background: "var(--dark)", borderRadius: 8, padding: 12, marginTop: 8 }}>🎵 {full}</div>
      {sorted.length > 0 && <div style={{ marginTop: 12 }}>{sorted.slice(0, 5).map(([uid, score], i) => <p key={uid} style={{ color: "var(--gray)" }}>{i + 1}. {uid.slice(0, 8)} — {score} {t("pts")}</p>)}</div>}
      {isHost && <button className="demo-action demo-action--lime" onClick={next} type="button" style={{ marginTop: 12 }}>{state.round >= songs.length - 1 ? t("finish") : t("next")}</button>}
    </div>}
  </div>;
}

const EN: Record<string, string> = { round: "Round", listen: "Listen to the clue...", guessed: "Guessed!", noOneGuessed: "No one guessed", pts: "pts", next: "Next", finish: "Finish", typeTitle: "Type song title", submit: "Submit" };
const RU: Record<string, string> = { round: "Раунд", listen: "Слушай подсказку...", guessed: "Угадал!", noOneGuessed: "Никто не угадал", pts: "очк", next: "Далее", finish: "Завершить", typeTitle: "Введите название песни", submit: "Отправить" };
