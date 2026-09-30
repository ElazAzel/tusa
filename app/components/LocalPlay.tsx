"use client";

import { createContext, Fragment, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale } from "./LocaleProvider";

export type LocalSeat = { id: string; name: string };

type LocalPlayValue = {
  seats: LocalSeat[];
  seat: string;
  setSeat: (seat: string) => void;
  afterAction: (previous: Record<string, unknown>, next: Record<string, unknown>) => void;
  followTurn: (state: Record<string, unknown>) => void;
};

const LocalPlayContext = createContext<LocalPlayValue | null>(null);

export function useLocalPlay() {
  return useContext(LocalPlayContext);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function turnOwner(state: Record<string, unknown>): string {
  const phase = String(state.phase ?? "");
  if (state.game === "headsup") return "";
  if (phase === "judge" && typeof state.judgeId === "string") return state.judgeId;
  for (const key of ["activePlayer", "drawerId", "explainer", "currentPlayer"]) {
    if (typeof state[key] === "string" && state[key]) return state[key] as string;
  }
  if (Array.isArray(state.players) && typeof state.currentIndex === "number") {
    const owner = state.players[state.currentIndex];
    if (typeof owner === "string") return owner;
  }
  return "";
}

export function nextSeatAfterAction(seats: string[], seat: string, previous: Record<string, unknown>, next: Record<string, unknown>) {
  for (const [key, value] of Object.entries(next)) {
    if (!isRecord(value) || !(seat in value)) continue;
    const before = previous[key];
    if (isRecord(before) && seat in before) continue;
    const alive = Array.isArray(next.alive) ? next.alive as string[] : null;
    const excluded = new Set([typeof next.judgeId === "string" ? next.judgeId : ""]);
    const start = seats.indexOf(seat);
    for (let step = 1; step < seats.length; step += 1) {
      const candidate = seats[(start + step) % seats.length];
      if (candidate in value || excluded.has(candidate) || (alive && !alive.includes(candidate))) continue;
      return candidate;
    }
    return "";
  }
  return "";
}

export function LocalPlayProvider({ seats, secret, children }: { seats: LocalSeat[]; secret: boolean; children: ReactNode }) {
  const { locale } = useLocale();
  const ru = locale === "ru";
  const [seat, setSeatState] = useState(seats[0]?.id ?? "");
  const [revealed, setRevealed] = useState(!secret);
  const seatRef = useRef(seat);
  const ids = useMemo(() => seats.map((item) => item.id), [seats]);
  const nameOf = (id: string) => seats.find((item) => item.id === id)?.name ?? id;

  const setSeat = useCallback((next: string) => {
    if (!next || next === seatRef.current || !ids.includes(next)) return;
    seatRef.current = next;
    setSeatState(next);
    if (secret) setRevealed(false);
  }, [ids, secret]);

  const afterAction = useCallback((previous: Record<string, unknown>, next: Record<string, unknown>) => {
    const candidate = nextSeatAfterAction(ids, seatRef.current, previous, next);
    if (candidate) setSeat(candidate);
  }, [ids, setSeat]);

  const followTurn = useCallback((state: Record<string, unknown>) => {
    if (state.game === "headsup" && typeof state.activePlayer === "string" && state.activePlayer === seatRef.current) {
      const start = ids.indexOf(seatRef.current);
      setSeat(ids[(start + 1) % ids.length]);
      return;
    }
    const owner = turnOwner(state);
    if (owner && ids.includes(owner)) setSeat(owner);
  }, [ids, setSeat]);

  const passToNext = useCallback(() => {
    const start = ids.indexOf(seatRef.current);
    const next = ids[(start + 1) % ids.length];
    if (next && next !== seatRef.current) setSeat(next);
    else setRevealed(false);
  }, [ids, setSeat]);

  const value = useMemo(() => ({ seats, seat, setSeat, afterAction, followTurn }), [seats, seat, setSeat, afterAction, followTurn]);

  return <LocalPlayContext.Provider value={value}>
    <div className="local-seat-bar" role="group" aria-label={ru ? "Чей сейчас телефон" : "Who holds the phone"}>
      <span>{ru ? "Телефон у:" : "Phone with:"}</span>
      <div>{seats.map((item) => <button aria-pressed={item.id === seat} className={item.id === seat ? "active" : ""} key={item.id} onClick={() => setSeat(item.id)} type="button">{item.name}</button>)}</div>
    </div>
    <div className="local-board">
      <Fragment key={seat}>{children}</Fragment>
      {secret && !revealed && <div className="local-pass-gate" role="dialog" aria-modal="true" aria-labelledby="local-pass-title">
        <span className="material-symbols-rounded" aria-hidden="true">phone_iphone</span>
        <h3 id="local-pass-title">{ru ? "Передай телефон" : "Pass the phone to"}</h3>
        <strong>{nameOf(seat)}</strong>
        <p>{ru ? "Остальные, не подглядывайте. Здесь секретная информация." : "Everyone else, look away. Secret info ahead."}</p>
        <button className="demo-action demo-action--lime" onClick={() => setRevealed(true)} type="button">{ru ? `Я ${nameOf(seat)}, показать` : `I'm ${nameOf(seat)}, show me`}</button>
      </div>}
      {secret && revealed && <button className="local-hide-button" onClick={passToNext} type="button"><span className="material-symbols-rounded" aria-hidden="true">visibility_off</span>{ru ? "Скрыть и передать" : "Hide and pass"}</button>}
    </div>
  </LocalPlayContext.Provider>;
}
