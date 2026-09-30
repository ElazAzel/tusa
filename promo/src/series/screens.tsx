import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Character, type Emotion, type Pose } from "./Character";
import { CAST, type CastId } from "./cast";

const INK = "#121218";
const FPS = 30;

const sp = (f: number, cfg: { damping?: number; stiffness?: number } = {}) => spring({ frame: f, fps: FPS, config: { damping: 13, stiffness: 170, ...cfg } });

export const Halftone: React.FC<{ color: string; dot?: string }> = ({ color, dot = "rgba(18,18,24,.16)" }) => (
  <AbsoluteFill style={{ background: color }}>
    <AbsoluteFill style={{ backgroundImage: `radial-gradient(${dot} 22%, transparent 24%)`, backgroundSize: "44px 44px" }} />
  </AbsoluteFill>
);

export const IntroCard: React.FC<{ who: CastId; f: number; emotion?: Emotion; pose?: Pose; index: number }> = ({ who, f, emotion = "happy", pose = "wave", index }) => {
  const c = CAST[who];
  const inS = sp(f, { damping: 12, stiffness: 190 });
  const name = sp(f - 4, { damping: 10, stiffness: 200 });
  const tag = sp(f - 12);
  return (
    <AbsoluteFill style={{ overflow: "hidden", clipPath: `polygon(0 0, ${inS * 140}% 0, ${inS * 100}% 100%, 0 100%)` }}>
      <Halftone color={c.tag} />
      <div style={{ position: "absolute", left: -200, right: -200, top: 1080, height: 360, background: INK, transform: "rotate(-8deg)" }} />
      <div style={{ position: "absolute", top: 150, left: 70, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ background: INK, color: c.tag, fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 34, padding: "10px 24px", borderRadius: 999 }}>ЗНАКОМЬТЕСЬ · {String(index).padStart(2, "0")}</div>
      </div>
      <div style={{ position: "absolute", top: 230, left: 60, transform: `scale(${name}) rotate(-4deg)`, transformOrigin: "left center" }}>
        <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 190, color: c.tagText === "#ffffff" ? "#ffffff" : INK, letterSpacing: -6, WebkitTextStroke: `6px ${INK}`, textShadow: `10px 12px 0 ${INK}` }}>{c.name}</div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 540, transform: `translateY(${(1 - tag) * 60}px)`, opacity: tag }}>
        <div style={{ background: "#fffdf4", border: `6px solid ${INK}`, borderRadius: 30, padding: "30px 36px", boxShadow: `0 12px 0 ${INK}`, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 48, lineHeight: 1.2, color: INK }}>{c.tagline}</div>
      </div>
      <div style={{ position: "absolute", left: 540 - 380, top: 740, transform: `translateX(${(1 - inS) * 600}px) rotate(-3deg)` }}>
        <Character id={who} emotion={emotion} pose={pose} width={760} frozen />
      </div>
    </AbsoluteFill>
  );
};

export const TitleCard: React.FC<{ season: number; episode: number; title: string }> = ({ season, episode, title }) => {
  const f = useCurrentFrame();
  const logo = sp(f, { damping: 9, stiffness: 140 });
  const pill = sp(f - 12);
  const t = sp(f - 20);
  const burst = interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0f1016", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${f}deg at 50% 45%, rgba(201,255,5,.16) 0deg 10deg, transparent 10deg 20deg)`, transform: `scale(${0.4 + burst * 1.2})` }} />
      <div style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -18}deg)`, marginTop: -120 }}>
        <Img src={staticFile("tusa-logo.svg")} style={{ width: 760 }} />
      </div>
      <div style={{ marginTop: 70, transform: `scale(${pill})`, background: "#ff007f", color: "#ffffff", border: `6px solid ${INK}`, borderRadius: 999, padding: "16px 44px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 46, boxShadow: `0 10px 0 ${INK}` }}>
        СЕЗОН {season} · СЕРИЯ {episode}
      </div>
      <div style={{ marginTop: 60, padding: "0 70px", textAlign: "center", transform: `translateY(${(1 - t) * 80}px)`, opacity: t, fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 96, lineHeight: 1.05, color: "#f2f3f8" }}>{title}</div>
    </AbsoluteFill>
  );
};

export const NextEpisode: React.FC<{ who: CastId; game: string; cta: string }> = ({ who, game, cta }) => {
  const f = useCurrentFrame();
  const c = CAST[who];
  const a = sp(f);
  const b = sp(f - 10);
  const swap = f > 90;
  const d = sp(f - 92);
  const e = sp(f - 104);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {!swap ? (
        <>
          <Halftone color={c.tag} />
          <div style={{ position: "absolute", top: 170, left: 70, right: 70, transform: `translateY(${(1 - a) * -80}px)`, opacity: a }}>
            <div style={{ display: "inline-block", background: INK, color: "#ffffff", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 40, padding: "12px 28px", borderRadius: 999 }}>В СЛЕДУЮЩЕЙ СЕРИИ</div>
            <div style={{ marginTop: 40, fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 100, lineHeight: 1.02, color: c.tagText === "#ffffff" ? "#ffffff" : INK, WebkitTextStroke: `4px ${INK}` }}>
              Объясняет {c.name}.
              <br />
              Игра: {game}
            </div>
          </div>
          <div style={{ position: "absolute", left: 540 - 400, top: 800, transform: `translateY(${(1 - b) * 600}px)` }}>
            <Character id={who} emotion="smug" pose="hips" width={800} />
          </div>
        </>
      ) : (
        <>
          <AbsoluteFill style={{ background: "#0f1016" }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60, padding: 80 }}>
            <div style={{ transform: `scale(${d})` }}>
              <Img src={staticFile("tusa-logo.svg")} style={{ width: 640 }} />
            </div>
            <div style={{ transform: `translateY(${(1 - e) * 60}px)`, opacity: e, textAlign: "center", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 70, lineHeight: 1.1, color: "#f2f3f8" }}>{cta}</div>
            <div style={{ transform: `scale(${e})`, background: "#c9ff05", color: INK, border: `6px solid ${INK}`, borderRadius: 999, padding: "34px 70px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 70, boxShadow: `0 14px 0 #000` }}>tusa.game</div>
            <div style={{ opacity: e, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 38, color: "#b3b7c9" }}>Одна ссылка. Без скачивания. Бета бесплатно</div>
          </AbsoluteFill>
        </>
      )}
    </AbsoluteFill>
  );
};

export const ChatBubble: React.FC<{ who: CastId; text: string; age: number; x: number; y: number; r?: number }> = ({ who, text, age, x, y, r = 0 }) => {
  if (age < 0) return null;
  const c = CAST[who];
  const s = sp(age, { damping: 11, stiffness: 240 });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s}) rotate(${r}deg)`, transformOrigin: "left center", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", background: c.tag, border: `5px solid ${INK}`, overflow: "hidden", flexShrink: 0 }}>
        <Character id={who} crop="head" width={84} frozen style={{ marginTop: 4 }} />
      </div>
      <div style={{ background: "#fffdf4", border: `5px solid ${INK}`, borderRadius: 28, padding: "16px 26px", boxShadow: `0 8px 0 ${INK}` }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 24, color: c.tag === "#fffdf4" ? INK : c.tag, WebkitTextStroke: c.tag === "#c9ff05" || c.tag === "#ffc247" ? `1px ${INK}` : undefined }}>{c.name}</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 38, color: INK, whiteSpace: "nowrap" }}>{text}</div>
      </div>
    </div>
  );
};

export const MiniPhone: React.FC<{ width: number; height: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ width, height, children, style }) => (
  <div style={{ width, height, borderRadius: width * 0.14, background: INK, border: "6px solid #2b2e3d", padding: width * 0.035, boxShadow: `0 14px 0 #05060a, 0 30px 80px rgba(0,0,0,.5)`, boxSizing: "border-box", ...style }}>
    <div style={{ width: "100%", height: "100%", borderRadius: width * 0.11, background: "#0b0c11", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export const Stopwatch: React.FC<{ frame: number; label: string }> = ({ frame, label }) => {
  const sec = Math.floor(frame / FPS);
  return (
    <div style={{ position: "absolute", top: 120, right: 50, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <div style={{ background: "#ff007f", color: "#ffffff", border: `5px solid ${INK}`, borderRadius: 999, padding: "12px 28px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 48, boxShadow: `0 8px 0 ${INK}` }}>
        00:{String(sec).padStart(2, "0")}
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 26, color: "#ffffff", background: INK, padding: "6px 16px", borderRadius: 999 }}>{label}</div>
    </div>
  );
};

export function plural(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
