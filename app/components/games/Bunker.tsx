"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const TRAITS_EN = [
  "Professional chef", "Experienced doctor", "Former military", "Skilled engineer",
  "Radiation immunity", "Knows first aid", "Can start fire", "Master locksmith",
  "Linguist speaking 5 languages", "Expert farmer", "Can fix electronics", "Mountain climber",
  "Expert navigator", "Black belt martial artist", "Veterinarian", "Can play guitar",
];

const TRAITS_RU = [
  "Профессиональный повар", "Опытный врач", "Бывший военный", "Опытный инженер",
  "Иммунитет к радиации", "Знает первую помощь", "Может развести огонь", "Мастер-взломщик",
  "Лингвист, знает 5 языков", "Эксперт-фермер", "Чинит электронику", "Альпинист",
  "Эксперт-навигатор", "Мастер боевых искусств", "Ветеринар", "Играет на гитаре",
];

const SPOTS_EN = [3, 4, 2, 5, 3, 4, 2, 6];
const SPOTS_RU = [3, 4, 2, 5, 3, 4, 2, 6];

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

type Trait = { userId: string; trait: string };
type GameState = {
  round: number;
  phase: "reveal" | "argue" | "vote" | "result";
  traits: Trait[];
  votes: Record<string, string>;
  eliminated: string[];
  bunkerSpots: number;
  timer: number;
  revealedIndex: number;
};

function BunkerStage({ sessionId, partyId, onSave }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const traits = useMemo(() => shuffle(locale === "ru" ? TRAITS_RU : TRAITS_EN), [locale]);
  const spots = useMemo(() => SPOTS_EN[Math.floor(Math.random() * SPOTS_EN.length)], []);

  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({
      round: 0, phase: "reveal" as const, traits: [],
      votes: {}, eliminated: [], bunkerSpots: spots, timer: 0, revealedIndex: 0,
    }),
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "join" && state.phase === "reveal") {
        const exists = state.traits.find((t) => t.userId === a.userId);
        if (!exists) {
          const traitIdx = state.traits.length % traits.length;
          setState((prev) => ({
            ...prev,
            traits: [...prev.traits, { userId: a.userId, trait: traits[traitIdx] }],
          }));
        }
      }
      if (a.actionType === "vote" && state.phase === "vote") {
        setState((prev) => ({
          ...prev,
          votes: { ...prev.votes, [a.userId]: (a.payload as { target: string }).target },
        }));
      }
    }
    clearActions();
  }, [playerActions, state.phase, state.traits, traits, setState, clearActions]);

  useEffect(() => {
    if (state.phase === "reveal" && state.traits.length >= 4) {
      setState((prev) => ({ ...prev, phase: "argue", timer: 30 }));
    }
  }, [state.traits.length, state.phase, setState]);

  useEffect(() => {
    if (state.phase !== "argue" || state.timer <= 0) return;
    const id = setTimeout(() => setState((p) => ({ ...p, timer: p.timer - 1 })), 1000);
    return () => clearTimeout(id);
  }, [state.phase, state.timer, setState]);

  useEffect(() => {
    if (state.phase === "argue" && state.timer === 0) {
      setState((p) => ({ ...p, phase: "vote", votes: {} }));
    }
  }, [state.timer, state.phase, setState]);

  useEffect(() => {
    if (state.phase === "vote") {
      const totalVotes = Object.keys(state.votes).length;
      if (totalVotes >= state.traits.length) {
        const tally: Record<string, number> = {};
        for (const t of Object.values(state.votes)) {
          if (t) tally[t] = (tally[t] || 0) + 1;
        }
        const sorted = Object.entries(tally).sort(([, a], [, b]) => b - a);
        const eliminated = sorted.slice(state.bunkerSpots).map(([u]) => u);
        setState((prev) => ({
          ...prev,
          phase: "result",
          eliminated,
        }));
        complete();
      }
    }
  }, [state.phase, state.votes, state.traits.length, state.bunkerSpots, setState, complete]);

  const revealNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      revealedIndex: Math.min(prev.revealedIndex + 1, prev.traits.length - 1),
    }));
  }, [setState]);

  const finish = useCallback(() => {
    onSave(state.traits.length - state.eliminated.length);
  }, [onSave, state.traits.length, state.eliminated.length]);

  const getVoteTally = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const t of Object.values(state.votes)) {
      if (t) tally[t] = (tally[t] || 0) + 1;
    }
    return tally;
  }, [state.votes]);

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("phase")}: {t(state.phase)}</span>
      <p style={{ color: "#a3a3a3" }}>{t("spots")}: {state.bunkerSpots}</p>
      {state.phase === "reveal" && (
        <div>
          {state.traits.slice(0, state.revealedIndex + 1).map((t) => (
            <div key={t.userId} style={{ background: "#262626", borderRadius: 8, padding: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>{t.userId.slice(0, 8)}</span>: {t.trait}
            </div>
          ))}
          {state.revealedIndex < state.traits.length - 1 && (
            <button className="demo-action demo-action--lime" onClick={revealNext} type="button" style={{ marginTop: 8 }}>
              {t("revealNext")}
            </button>
          )}
        </div>
      )}
      {state.phase === "argue" && (
        <div>
          <p style={{ fontSize: 36, fontWeight: 700, color: state.timer <= 10 ? "#f87171" : "#a3e635" }}>{state.timer}s</p>
          <p style={{ color: "#a3a3a3" }}>{t("argueDesc")}</p>
          {state.traits.map((t) => (
            <p key={t.userId} style={{ color: "#a3a3a3" }}>{t.userId.slice(0, 8)}: {t.trait}</p>
          ))}
        </div>
      )}
      {state.phase === "vote" && (
        <div>
          <p style={{ color: "#a3a3a3", marginBottom: 8 }}>{t("voting")}</p>
          {state.traits.map((tr) => (
            <p key={tr.userId} style={{ color: getVoteTally[tr.userId] ? "#a3e635" : "#a3a3a3" }}>
              {tr.userId.slice(0, 8)}: {getVoteTally[tr.userId] || 0} {t("votes")}
            </p>
          ))}
        </div>
      )}
      {state.phase === "result" && (
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#a3e635" }}>{t("saved")}: {state.traits.length - state.eliminated.length}</p>
          <p style={{ color: "#f87171" }}>{t("eliminated")}: {state.eliminated.map((e) => e.slice(0, 8)).join(", ") || "—"}</p>
          <button className="demo-action demo-action--lime" onClick={finish} type="button" style={{ marginTop: 12 }}>{t("finish")}</button>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function BunkerController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, {
    round: 0, phase: "reveal", traits: [], votes: {},
    eliminated: [], bunkerSpots: 3, timer: 0, revealedIndex: 0,
  });
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => { setHasVoted(false); }, [state.round]);

  const join = useCallback(() => sendAction("join"), [sendAction]);
  const vote = useCallback((target: string) => {
    setHasVoted(true);
    sendAction("vote", { target });
  }, [sendAction]);

  if (state.phase === "reveal") {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{t("joining")}</h3>
        <p style={{ color: "#a3a3a3" }}>{t("waitForTrait")}</p>
        <button className="demo-action demo-action--lime" onClick={join} type="button">{t("joinBunker")}</button>
      </div>
    );
  }

  if (state.phase === "argue") {
    return (
      <div className="party-game-board game-board-enter">
        <h3>{t("argue")}</h3>
        <p style={{ color: "#a3a3a3" }}>{t("argueController")}</p>
      </div>
    );
  }

  if (state.phase === "vote" && !hasVoted) {
    return (
      <div className="party-game-board game-board-enter">
        <span className="game-step">{t("voteToSave")}</span>
        {state.traits.map((tr) => (
          <button key={tr.userId} className="demo-action demo-action--white" onClick={() => vote(tr.userId)} type="button" style={{ marginBottom: 6, width: "100%", textAlign: "left" }}>
            {tr.userId.slice(0, 8)}: {tr.trait}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="party-game-board game-board-enter">
      <h3>{hasVoted ? t("voted") : t("waiting")}</h3>
    </div>
  );
}

const EN: Record<string, string> = {
  phase: "Phase", reveal: "Reveal", argue: "Argue", vote: "Vote", result: "Result",
  spots: "Bunker spots", revealNext: "Reveal Next", argueDesc: "Argue why you should survive!",
  voting: "Voting...", votes: "votes", saved: "Saved", eliminated: "Eliminated",
  finish: "Finish", joining: "Join the bunker", waitForTrait: "Wait for your trait...",
  joinBunker: "Join", argueController: "Make your case!", voteToSave: "Vote who gets in",
  voted: "Voted! Waiting...", waiting: "Waiting...",
};

const RU: Record<string, string> = {
  phase: "Фаза", reveal: "Раскрытие", argue: "Дебаты", vote: "Голосование", result: "Итог",
  spots: "Мест в бункере", revealNext: "Следующий", argueDesc: "Аргументируй, почему ты должен выжить!",
  voting: "Голосование...", votes: "голосов", saved: "Спасены", eliminated: "Устранены",
  finish: "Завершить", joining: "Присоединяйся к бункеру", waitForTrait: "Жди свою черту...",
  joinBunker: "Войти", argueController: "Скажи почему ты нужен!", voteToSave: "Голосуй, кто попадёт",
  voted: "Проголосовал! Жди...", waiting: "Ожидание...",
};

export default function Bunker({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  if (role === "controller" && sessionId) return <BunkerController sessionId={sessionId} />;
  return <BunkerStage sessionId={sessionId} partyId={partyId} onSave={onSave} />;
}
