"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";

const DEFAULTS_EN = ["Do 10 push-ups", "Sing a song", "Tell a joke", "Dance for 15s", "Do an impression", "Take a sip"];
const DEFAULTS_RU = ["Сделай 10 отжиманий", "Спой песню", "Расскажи анекдот", "Танцуй 15 сек", "Изобрази кого-нибудь", "Глотни глоток"];

type GameState = { spinning: boolean; options: string[]; result: string | null; angle: number };

function WheelStage({ sessionId, partyId, onSave, options }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void; options: string[] }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, setState, playerActions, clearActions, complete } = useStageGame<GameState>(
    sessionId ?? null,
    () => ({ spinning: false, options, result: null, angle: 0 })
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "addOption") {
        const text = (a.payload as { text: string }).text?.trim();
        if (text) setState((prev) => ({ ...prev, options: [...prev.options, text] }));
      }
    }
    clearActions();
  }, [playerActions, setState, clearActions]);

  const spin = useCallback(() => {
    if (state.spinning || state.options.length === 0) return;
    const idx = Math.floor(Math.random() * state.options.length);
    const segmentAngle = 360 / state.options.length;
    const targetAngle = 360 * 5 + (360 - idx * segmentAngle - segmentAngle / 2);
    setState((prev) => ({ ...prev, spinning: true, angle: prev.angle + targetAngle }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, spinning: false, result: prev.options[idx] }));
    }, 4200);
  }, [state.spinning, state.options.length, setState]);

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, result: null }));
    complete();
    onSave(1);
  }, [setState, complete, onSave]);

  const segCount = state.options.length;
  const segAngle = segCount > 0 ? 360 / segCount : 360;

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("wheelTitle")}</span>
      <div style={{ position: "relative", width: 260, height: 260, margin: "20px auto" }}>
        <svg viewBox="0 0 260 260" style={{ width: 260, height: 260, transform: `rotate(${state.angle}deg)`, transition: state.spinning ? "transform 4s cubic-bezier(.17,.67,.12,.99)" : "none" }}>
          {state.options.map((opt, i) => {
            const start = i * segAngle;
            const end = start + segAngle;
            const largeArc = segAngle > 180 ? 1 : 0;
            const r = 130;
            const x1 = r + r * Math.sin((start * Math.PI) / 180);
            const y1 = r - r * Math.cos((start * Math.PI) / 180);
            const x2 = r + r * Math.sin((end * Math.PI) / 180);
            const y2 = r - r * Math.cos((end * Math.PI) / 180);
            const colors = ["var(--lime)", "#facc15", "var(--red)", "#60a5fa", "#c084fc", "#fb923c", "#34d399", "#f472b6"];
            const mid = start + segAngle / 2;
            const tx = r + r * 0.55 * Math.sin((mid * Math.PI) / 180);
            const ty = r - r * 0.55 * Math.cos((mid * Math.PI) / 180);
            return (
              <g key={i}>
                <path d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} stroke="#181818" strokeWidth="2" />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#181818" fontSize="13" fontWeight="bold" style={{ pointerEvents: "none" }}>
                  {opt.length > 14 ? opt.slice(0, 13) + "…" : opt}
                </text>
              </g>
            );
          })}
        </svg>
        <div style={{ position: "absolute", top: -6, left: "50%", marginLeft: -8, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "14px solid var(--white)" }} />
      </div>
      {state.result ? (
        <div>
          <h3 style={{ color: "var(--lime)" }}>{state.result}</h3>
          <div className="game-primary-actions">
            <button className="demo-action demo-action--lime" onClick={reset} type="button">{t("finish")}</button>
          </div>
        </div>
      ) : (
        <div className="game-primary-actions">
          <button className="demo-action demo-action--lime" disabled={state.spinning || state.options.length < 2} onClick={spin} type="button">
            {state.spinning ? t("spinning") : t("spin")}
          </button>
        </div>
      )}
      {sessionId && <span className="multiplayer-badge">LIVE</span>}
    </div>
  );
}

function WheelController({ sessionId }: { sessionId: string }) {
  const { locale } = useLocale();
  const t = (key: string) => locale === "ru" ? (RU[key] ?? key) : (EN[key] ?? key);
  const { state, sendAction } = useControllerGame<GameState>(sessionId, { spinning: false, options: [], result: null, angle: 0 });
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => { setSent(false); setText(""); }, [state.result]);

  const add = useCallback(() => {
    if (!text.trim() || sent) return;
    setSent(true);
    sendAction("addOption", { text: text.trim() });
  }, [text, sent, sendAction]);

  if (state.result) {
    return <div className="party-game-board game-board-enter"><h3>{t("wheelResult")}</h3><p style={{ fontSize: 32, color: "var(--lime)", fontWeight: 700 }}>{state.result}</p></div>;
  }

  return (
    <div className="party-game-board game-board-enter">
      <span className="game-step">{t("wheelTitle")}</span>
      <h3>{t("wheelAddOption")}</h3>
      <div className="bs-input-group">
        <input className="bs-input" maxLength={40} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t("wheelPlaceholder")} value={text} />
        <button className="demo-action demo-action--lime" disabled={sent || !text.trim()} onClick={add} type="button">{sent ? t("sent") : t("add")}</button>
      </div>
      <p style={{ marginTop: 12, opacity: 0.6 }}>{state.options.length} {t("optionsAdded")}</p>
    </div>
  );
}

const EN: Record<string, string> = { wheelTitle: "Wheel of Fate", spin: "Spin!", spinning: "Spinning…", wheelResult: "The wheel chose:", wheelAddOption: "Add an option", wheelPlaceholder: "Type an option…", add: "Add", sent: "Added!", optionsAdded: "options so far", finish: "Done" };
const RU: Record<string, string> = { wheelTitle: "Колесо Судьбы", spin: "Крутить!", spinning: "Крутится…", wheelResult: "Колесо выбрало:", wheelAddOption: "Добавь вариант", wheelPlaceholder: "Напиши вариант…", add: "Добавить", sent: "Добавлено!", optionsAdded: "вариантов пока", finish: "Готово" };

export default function Wheel({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const options = useMemo(() => (locale === "ru" ? [...DEFAULTS_RU] : [...DEFAULTS_EN]), [locale]);

  if (role === "controller" && sessionId) return <WheelController sessionId={sessionId} />;
  return <WheelStage sessionId={sessionId} partyId={partyId} onSave={onSave} options={options} />;
}
