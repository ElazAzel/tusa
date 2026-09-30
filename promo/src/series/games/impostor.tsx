import React from "react";
import { AbsoluteFill, spring } from "remotion";
import { Character } from "../Character";
import { CAST, CAST_ORDER, type CastId } from "../cast";
import { Halftone, MiniPhone } from "../screens";

const INK = "#121218";
const LIME = "#c9ff05";
const PINK = "#ff007f";
const sp = (f: number, cfg: { damping?: number; stiffness?: number } = {}) => spring({ frame: f, fps: 30, config: { damping: 12, stiffness: 180, ...cfg } });

const Backdrop: React.FC = () => <Halftone color="#1a1030" dot="rgba(201,255,5,.10)" />;

const Kicker: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", top: 130, left: 60, display: "flex" }}>
    <div style={{ background: LIME, color: INK, border: `5px solid ${INK}`, borderRadius: 999, padding: "12px 34px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 38, boxShadow: `0 8px 0 #000` }}>{text}</div>
  </div>
);

const Head: React.FC<{ id: CastId; size: number }> = ({ id, size }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: CAST[id].tag, border: `5px solid ${INK}`, overflow: "hidden" }}>
    <Character id={id} crop="head" width={size} frozen style={{ marginTop: size * 0.05 }} />
  </div>
);

const GameTop: React.FC<{ round?: number; size?: number }> = ({ round = 1, size = 1 }) => (
  <div style={{ padding: `${28 * size}px ${22 * size}px 0`, display: "flex", flexDirection: "column", gap: 8 * size }}>
    <div style={{ alignSelf: "flex-start", background: "rgba(201,255,5,.14)", color: LIME, borderRadius: 999, padding: `${4 * size}px ${14 * size}px`, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 18 * size }}>Раунд {round}/5</div>
    <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 30 * size, color: "#f2f3f8" }}>Импостор</div>
  </div>
);

const SecretCard: React.FC<{ impostor: boolean; word: string; size?: number }> = ({ impostor, word, size = 1 }) => (
  <div style={{ margin: `${14 * size}px ${16 * size}px`, background: impostor ? PINK : LIME, color: impostor ? "#fff" : INK, border: `${4 * size}px solid ${INK}`, borderRadius: 18 * size, padding: `${16 * size}px ${12 * size}px`, textAlign: "center" }}>
    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 16 * size, letterSpacing: 1, textTransform: "uppercase" }}>{impostor ? "Ты импостор" : "Твоё слово"}</div>
    <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: (impostor ? 44 : word.length > 7 ? 26 : 32) * size, marginTop: 6 * size }}>{impostor ? "???" : word.toUpperCase()}</div>
  </div>
);

export const PhonesRow: React.FC<{ f: number; word: string; impostor: CastId; showImpostor: boolean; kicker: string }> = ({ f, word, impostor, showImpostor, kicker }) => (
  <AbsoluteFill>
    <Backdrop />
    <Kicker text={kicker} />
    <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
      {CAST_ORDER.map((id, i) => {
        const s = sp(f - i * 4);
        const isImp = showImpostor && id === impostor;
        const shake = isImp ? Math.sin(f * 1.8) * Math.max(0, 10 - f / 3) : 0;
        return (
          <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transform: `translateY(${(1 - s) * 300 + (isImp ? -30 : 0)}px) rotate(${shake}deg)`, opacity: showImpostor && !isImp ? 0.55 : 1 }}>
            <Head id={id} size={110} />
            <MiniPhone width={184} height={400}>
              <GameTop size={0.62} />
              <SecretCard impostor={isImp} word={word} size={0.62} />
            </MiniPhone>
            <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: 28, color: isImp ? PINK : "#f2f3f8" }}>{CAST[id].name}</div>
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);

export const ClueInput: React.FC<{ f: number; clue: string; who: CastId; sent: number; total: number }> = ({ f, clue, who, sent, total }) => {
  const typed = clue.slice(0, Math.max(0, Math.floor((f - 10) / 3)));
  const done = f > 10 + clue.length * 3 + 10;
  return (
    <AbsoluteFill>
      <Backdrop />
      <Kicker text="ШАГ 1 · ПОДСКАЗКА" />
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <MiniPhone width={620} height={1080}>
          <GameTop size={1.6} />
          <SecretCard impostor={false} word="пицца" size={1.5} />
          <div style={{ margin: "30px 26px 0", display: "flex", gap: 16 }}>
            <div style={{ flex: 1, background: "#161823", border: `3px solid ${done ? "rgba(255,255,255,.14)" : LIME}`, borderRadius: 20, padding: "22px 22px", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 38, color: "#f2f3f8", minHeight: 46 }}>
              {typed || <span style={{ color: "#8b90a2" }}>Одно слово</span>}
            </div>
            <div style={{ background: done ? "#262a38" : LIME, color: done ? LIME : INK, border: `4px solid ${INK}`, borderRadius: 20, padding: "22px 20px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 26, display: "flex", alignItems: "center" }}>{done ? "Отправлено" : "Отправить"}</div>
          </div>
          <div style={{ margin: "30px 26px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 44, color: "#f2f3f8" }}>
            {done ? sent + 1 : sent}/{total}
          </div>
          <div style={{ display: "flex", gap: 10, margin: "0 26px" }}>
            {CAST_ORDER.map((id, i) => (
              <div key={id} style={{ opacity: i < (done ? sent + 1 : sent) ? 1 : 0.3 }}>
                <Head id={id} size={82} />
              </div>
            ))}
          </div>
        </MiniPhone>
      </div>
      <div style={{ position: "absolute", top: 1180, right: 90 }}>
        <Head id={who} size={120} />
      </div>
    </AbsoluteFill>
  );
};

export const ClueBalance: React.FC<{ f: number }> = ({ f }) => {
  const rows = [
    { word: "ПИЦЦА", note: "палево: импостор угадает", ok: false },
    { word: "КОСМОС", note: "мимо: заподозрят тебя", ok: false },
    { word: "ИТАЛИЯ", note: "в самый раз", ok: true },
  ];
  return (
    <AbsoluteFill>
      <Backdrop />
      <Kicker text="СЛОВО: ПИЦЦА" />
      <div style={{ position: "absolute", top: 280, bottom: 480, left: 80, right: 80, display: "flex", flexDirection: "column", justifyContent: "center", gap: 50 }}>
        {rows.map((r, i) => {
          const s = sp(f - i * 16, { damping: 10 });
          return (
            <div key={r.word} style={{ transform: `translateX(${(1 - s) * (i % 2 ? 700 : -700)}px) rotate(${i % 2 ? 2 : -2}deg)`, display: "flex", alignItems: "center", gap: 30, background: r.ok ? LIME : "#2a1646", border: `6px solid ${INK}`, borderRadius: 34, padding: "34px 40px", boxShadow: `0 12px 0 #000` }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: r.ok ? INK : PINK, color: r.ok ? LIME : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 60, flexShrink: 0 }}>{r.ok ? "✓" : "✕"}</div>
              <div>
                <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 64, color: r.ok ? INK : "#f2f3f8" }}>{r.word}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 36, color: r.ok ? INK : "#b3b7c9" }}>{r.note}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const VoteScreen: React.FC<{ f: number; votes: [CastId, CastId][]; kicker: string; step?: number }> = ({ f, votes, kicker, step = 12 }) => {
  const arrived = votes.filter((_, i) => f > 14 + i * step);
  const tally: Partial<Record<CastId, CastId[]>> = {};
  arrived.forEach(([from, to]) => (tally[to] = [...(tally[to] ?? []), from]));
  return (
    <AbsoluteFill>
      <Backdrop />
      <Kicker text={kicker} />
      <div style={{ position: "absolute", top: 290, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <MiniPhone width={760} height={1120}>
          <GameTop size={1.7} />
          <div style={{ margin: "10px 30px", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 34, color: "#b3b7c9" }}>
            Голосование · {arrived.length}/{votes.length} голосов
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, margin: "10px 26px" }}>
            {CAST_ORDER.map((id) => {
              const voters = tally[id] ?? [];
              const lead = voters.length >= 3;
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 18, background: lead ? PINK : "#161823", border: `4px solid ${lead ? INK : "rgba(255,255,255,.12)"}`, borderRadius: 26, padding: "14px 18px" }}>
                  <Head id={id} size={78} />
                  <div style={{ flex: 1, fontFamily: "Unbounded, sans-serif", fontWeight: 800, fontSize: 38, color: "#f2f3f8" }}>{CAST[id].name}</div>
                  <div style={{ display: "flex" }}>
                    {voters.map((v, k) => (
                      <div key={v} style={{ marginLeft: k ? -24 : 0, transform: `scale(${sp(f - 14 - votes.findIndex(([from]) => from === v) * step)})` }}>
                        <Head id={v} size={58} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </MiniPhone>
      </div>
    </AbsoluteFill>
  );
};

export const ScoreRules: React.FC<{ f: number; stage: 0 | 1 | 2 }> = ({ f, stage }) => {
  const cards = [
    { title: "Поймали импостора", pts: "+1", who: "каждому, кроме него", bg: LIME, fg: INK },
    { title: "Не поймали", pts: "+2", who: "импостору", bg: PINK, fg: "#fff" },
    { title: "Импостор угадал слово", pts: "+3", who: "импостору, сразу", bg: "#57c2ff", fg: INK },
  ];
  return (
    <AbsoluteFill>
      <Backdrop />
      <Kicker text="ОЧКИ" />
      <div style={{ position: "absolute", top: 280, bottom: 480, left: 80, right: 80, display: "flex", flexDirection: "column", justifyContent: "center", gap: 44 }}>
        {cards.slice(0, stage + 1).map((c, i) => {
          const current = i === stage;
          const s = current ? sp(f, { damping: 10 }) : 1;
          return (
            <div key={c.title} style={{ transform: `scale(${current ? 0.6 + s * 0.4 : 0.94})`, opacity: current ? s : 0.5, display: "flex", alignItems: "center", gap: 30, background: c.bg, color: c.fg, border: `6px solid ${INK}`, borderRadius: 34, padding: "34px 40px", boxShadow: `0 12px 0 #000` }}>
              <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 110, lineHeight: 1, minWidth: 190 }}>{c.pts}</div>
              <div>
                <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 44, lineHeight: 1.1 }}>{c.title}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 34, marginTop: 8 }}>{c.who}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const RoundsCard: React.FC<{ f: number }> = ({ f }) => {
  const s = sp(f, { damping: 8, stiffness: 160 });
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20, marginTop: -200 }}>
        <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 420, lineHeight: 0.9, color: LIME, transform: `scale(${s}) rotate(${(1 - s) * 30}deg)`, WebkitTextStroke: `10px ${INK}`, textShadow: `16px 18px 0 #000` }}>5</div>
        <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 90, color: "#f2f3f8" }}>раундов</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 40, color: "#b3b7c9", textAlign: "center", padding: "0 100px" }}>каждый раз новое слово и новый импостор</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const WordReveal: React.FC<{ f: number; owner: CastId; word: string; impostor?: boolean }> = ({ f, owner, word, impostor = false }) => {
  const s = sp(f, { damping: 11 });
  return (
    <AbsoluteFill>
      <Backdrop />
      <Kicker text={`ЭКРАН: ${CAST[owner].name.toUpperCase()}`} />
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${(1 - s) * 900}px) rotate(${(1 - s) * 10}deg)` }}>
        <MiniPhone width={640} height={1040}>
          <GameTop size={1.6} />
          <SecretCard impostor={impostor} word={word} size={1.7} />
          <div style={{ margin: "30px 30px", background: "#161823", border: "3px solid rgba(255,255,255,.12)", borderRadius: 20, padding: "22px", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 36, color: "#8b90a2" }}>Одно слово</div>
        </MiniPhone>
      </div>
      <div style={{ position: "absolute", top: 1230, right: 80, transform: `scale(${sp(f - 10)})` }}>
        <Head id={owner} size={140} />
      </div>
    </AbsoluteFill>
  );
};

export const ResultScreen: React.FC<{ f: number; word: string; impostor: CastId; accused: CastId; crewWin: boolean; points: string }> = ({ f, word, impostor, accused, crewWin, points }) => {
  const line = (at: number) => sp(f - at, { damping: 11 });
  const big = line(34);
  return (
    <AbsoluteFill>
      <Backdrop />
      <Kicker text="РЕЗУЛЬТАТ" />
      <div style={{ position: "absolute", top: 290, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <MiniPhone width={780} height={1140}>
          <GameTop size={1.7} />
          <div style={{ margin: "24px 32px", display: "flex", flexDirection: "column", gap: 26, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 40, color: "#d7dae6" }}>
            <div style={{ opacity: line(0), transform: `translateX(${(1 - line(0)) * -200}px)` }}>
              Слово: <b style={{ color: LIME }}>{word}</b>
            </div>
            <div style={{ opacity: line(12), transform: `translateX(${(1 - line(12)) * -200}px)`, display: "flex", alignItems: "center", gap: 16 }}>
              Под подозрением: <Head id={accused} size={70} /> <b style={{ color: "#fff" }}>{CAST[accused].name}</b>
            </div>
            <div style={{ transform: `scale(${big})`, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 20, background: PINK, border: `5px solid ${INK}`, borderRadius: 28, padding: "20px 24px", color: "#fff" }}>
              <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 40 }}>Импостор:</span>
              <Head id={impostor} size={96} />
              <span style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 50 }}>{CAST[impostor].name}</span>
            </div>
            <div style={{ opacity: line(60), transform: `scale(${line(60)})`, fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 56, color: "#f2f3f8", lineHeight: 1.1 }}>{crewWin ? "Команда нашла импостора" : "Импостор выкрутился"}</div>
            <div style={{ opacity: line(72), alignSelf: "flex-start", background: LIME, color: INK, border: `5px solid ${INK}`, borderRadius: 999, padding: "14px 34px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 52, transform: `rotate(-3deg) scale(${line(72)})` }}>{points}</div>
          </div>
        </MiniPhone>
      </div>
    </AbsoluteFill>
  );
};
