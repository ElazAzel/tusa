"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const TRAITS_EN = ["Professional chef", "Experienced doctor", "Former military", "Skilled engineer", "Radiation immunity", "Knows first aid", "Can start fire", "Master locksmith", "Linguist speaking 5 languages", "Expert farmer", "Can fix electronics", "Mountain climber", "Expert navigator", "Black belt martial artist", "Veterinarian", "Can play guitar"];
const TRAITS_RU = ["Профессиональный повар", "Опытный врач", "Бывший военный", "Опытный инженер", "Иммунитет к радиации", "Знает первую помощь", "Может развести огонь", "Мастер-взломщик", "Лингвист, знает 5 языков", "Эксперт-фермер", "Чинит электронику", "Альпинист", "Эксперт-навигатор", "Мастер боевых искусств", "Ветеринар", "Играет на гитаре"];
const SPOTS = [3, 4, 2, 5, 3, 4, 2, 6];

function shuffle<T>(arr: T[]): T[] { const r = [...arr]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

type Trait = { userId: string; trait: string };
type GameState = { round: number; phase: "reveal" | "argue" | "vote" | "result"; traits: Trait[]; votes: Record<string, string>; eliminated: string[]; bunkerSpots: number; timer: number; revealedIndex: number };

export default function Bunker({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const traits = useMemo(() => shuffle(locale === "ru" ? TRAITS_RU : TRAITS_EN), [locale]);
  const [spots] = useState(() => SPOTS[Math.floor(Math.random() * SPOTS.length)]);
  const isHost = role === "stage";

  const stageHook = useStageGame<GameState>(isHost ? (sessionId ?? null) : null, () => ({ round: 0, phase: "reveal", traits: [], votes: {}, eliminated: [], bunkerSpots: spots, timer: 0, revealedIndex: 0 }));
  const controllerHook = useControllerGame<GameState>(!isHost ? (sessionId ?? null) : null, { round: 0, phase: "reveal", traits: [], votes: {}, eliminated: [], bunkerSpots: 3, timer: 0, revealedIndex: 0 });

  const state = isHost ? stageHook.state : controllerHook.state;
  const sendAction = isHost ? stageHook.sendAction : controllerHook.sendAction;
  const setState = isHost ? stageHook.setState : undefined;
  const playerActions = isHost ? stageHook.playerActions : [];
  const clearActions = isHost ? stageHook.clearActions : undefined;

  const [hasVoted, setHasVoted] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => { setHasVoted(false); }, [state.round]);

  useEffect(() => {
    if (!isHost || playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "join" && state.phase === "reveal") {
        setState?.((prev) => { if (prev.traits.find((tr) => tr.userId === a.userId)) return prev; const ti = prev.traits.length % traits.length; return { ...prev, traits: [...prev.traits, { userId: a.userId, trait: traits[ti] }] }; });
      }
      if (a.actionType === "vote" && state.phase === "vote") { setState?.((prev) => ({ ...prev, votes: { ...prev.votes, [a.userId]: (a.payload as { target: string }).target } })); }
    }
    clearActions?.();
  }, [playerActions, state.phase, traits, isHost, setState, clearActions]);

  useEffect(() => { if (!isHost) return; if (state.phase === "reveal" && state.traits.length >= 4) setState?.((prev) => ({ ...prev, phase: "argue", timer: 30 })); }, [state.traits.length, state.phase, isHost, setState]);
  useEffect(() => { if (!isHost) return; if (state.phase !== "argue" || state.timer <= 0) return; const id = setTimeout(() => setState?.((p) => ({ ...p, timer: p.timer - 1 })), 1000); return () => clearTimeout(id); }, [state.phase, state.timer, isHost, setState]);
  useEffect(() => { if (!isHost) return; if (state.phase !== "vote") return; const id = setTimeout(() => { setState?.((prev) => { if (prev.phase !== "vote") return prev; const tally: Record<string, number> = {}; for (const t of Object.values(prev.votes)) if (t) tally[t] = (tally[t] || 0) + 1; const sorted = Object.entries(tally).sort(([, a], [, b]) => b - a); const eliminated = sorted.slice(prev.bunkerSpots).map(([u]) => u); return { ...prev, phase: "result", eliminated }; }); }, 60000); return () => clearTimeout(id); }, [state.phase, isHost, setState]);
  useEffect(() => { if (!isHost) return; if (state.phase === "argue" && state.timer === 0) setState?.((p) => ({ ...p, phase: "vote", votes: {} })); }, [state.timer, state.phase, isHost, setState]);
  useEffect(() => {
    if (!isHost) return;
    if (state.phase === "vote") {
      const totalVotes = Object.keys(state.votes).length;
      if (totalVotes >= state.traits.length) {
        const tally: Record<string, number> = {}; for (const t of Object.values(state.votes)) if (t) tally[t] = (tally[t] || 0) + 1;
        const sorted = Object.entries(tally).sort(([, a], [, b]) => b - a);
        const eliminated = sorted.slice(state.bunkerSpots).map(([u]) => u);
        setState?.((prev) => ({ ...prev, phase: "result", eliminated }));
      }
    }
  }, [state.phase, state.votes, state.traits.length, state.bunkerSpots, isHost, setState]);

  const revealNext = useCallback(() => { if (!isHost) return; setState?.((prev) => ({ ...prev, revealedIndex: Math.min(prev.revealedIndex + 1, prev.traits.length - 1) })); }, [isHost, setState]);
  const finish = useCallback(() => { onSave(state.traits.length - state.eliminated.length); }, [onSave, state.traits.length, state.eliminated.length]);
  const join = useCallback(() => { setHasJoined(true); sendAction("join"); }, [sendAction]);
  const voteFor = useCallback((target: string) => { setHasVoted(true); sendAction("vote", { target }); }, [sendAction]);

  const getVoteTally = useMemo(() => { const tally: Record<string, number> = {}; for (const t of Object.values(state.votes)) if (t) tally[t] = (tally[t] || 0) + 1; return tally; }, [state.votes]);

  if (!isHost && state.phase === "reveal" && !hasJoined) {
    return <div className="party-game-board game-board-enter"><h3>{t("joining")}</h3><p style={{ color: "var(--gray)" }}>{t("waitForTrait")}</p><button className="demo-action demo-action--lime" onClick={join} type="button">{t("joinBunker")}</button></div>;
  }

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("phase")}: {t(state.phase)}</span>
    <p style={{ color: "var(--gray)" }}>{t("spots")}: {state.bunkerSpots}</p>
    {state.phase === "reveal" && <div>{state.traits.slice(0, state.revealedIndex + 1).map((tr) => (<div key={tr.userId} style={{ background: "var(--dark)", borderRadius: 8, padding: 10, marginBottom: 6 }}><span style={{ fontWeight: 700 }}>{tr.userId.slice(0, 8)}</span>: {tr.trait}</div>))}{isHost && state.revealedIndex < state.traits.length - 1 && <button className="demo-action demo-action--lime" onClick={revealNext} type="button" style={{ marginTop: 8 }}>{t("revealNext")}</button>}</div>}
    {state.phase === "argue" && <div><p style={{ fontSize: 36, fontWeight: 700, color: state.timer <= 10 ? "var(--red)" : "var(--lime)" }}>{state.timer}s</p><p style={{ color: "var(--gray)" }}>{t("argueDesc")}</p>{state.traits.map((tr) => (<p key={tr.userId} style={{ color: "var(--gray)" }}>{tr.userId.slice(0, 8)}: {tr.trait}</p>))}</div>}
    {state.phase === "vote" && <div><p style={{ color: "var(--gray)", marginBottom: 8 }}>{t("voting")}</p>{state.traits.map((tr) => (<p key={tr.userId} style={{ color: getVoteTally[tr.userId] ? "var(--lime)" : "var(--gray)" }}>{tr.userId.slice(0, 8)}: {getVoteTally[tr.userId] || 0} {t("votes")}</p>))}{!isHost && !hasVoted && <div style={{ marginTop: 8 }}>{state.traits.map((tr) => (<button key={tr.userId} className="demo-action demo-action--white" onClick={() => voteFor(tr.userId)} type="button" style={{ marginBottom: 6, width: "100%", textAlign: "left" }}>{tr.userId.slice(0, 8)}: {tr.trait}</button>))}</div>}{!isHost && hasVoted && <p style={{ color: "var(--lime)" }}>{t("voted")}</p>}</div>}
    {state.phase === "result" && <div><p style={{ fontSize: 20, fontWeight: 700, color: "var(--lime)" }}>{t("saved")}: {state.traits.length - state.eliminated.length}</p><p style={{ color: "var(--red)" }}>{t("eliminatedOut")}: {state.eliminated.map((e) => e.slice(0, 8)).join(", ") || "—"}</p><button className="demo-action demo-action--lime" onClick={finish} type="button" style={{ marginTop: 12 }}>{t("finish")}</button></div>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}

const EN: Record<string, string> = { phase: "Phase", reveal: "Reveal", argue: "Argue", vote: "Vote", result: "Result", spots: "Bunker spots", revealNext: "Reveal Next", argueDesc: "Argue why you should survive!", voting: "Voting...", votes: "votes", saved: "Saved", eliminatedOut: "Eliminated", finish: "Finish", joining: "Join the bunker", waitForTrait: "Wait for your trait...", joinBunker: "Join", voted: "Voted! Waiting..." };
const RU: Record<string, string> = { phase: "Фаза", reveal: "Раскрытие", argue: "Дебаты", vote: "Голосование", result: "Итог", spots: "Мест в бункере", revealNext: "Следующий", argueDesc: "Аргументируй, почему ты должен выжить!", voting: "Голосование...", votes: "голосов", saved: "Спасены", eliminatedOut: "Устранены", finish: "Завершить", joining: "Присоединяйся к бункеру", waitForTrait: "Жди свою черту...", joinBunker: "Войти", voted: "Проголосовал! Жди..." };
