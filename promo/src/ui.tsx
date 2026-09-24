import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { color, font, tone as toneMap, type Tone } from "./theme";

export function useSpring(delay = 0, config: { damping?: number; stiffness?: number; mass?: number } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 160, mass: 0.8, ...config } });
}

export function ease(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
}

export const Backdrop: React.FC<{ glow?: Tone; grid?: boolean }> = ({ glow = "blue", grid = true }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 60;
  const glowColor = glow === "lime" ? "rgba(201,255,5,.22)" : glow === "pink" ? "rgba(255,0,127,.28)" : glow === "cream" ? "rgba(246,246,238,.12)" : "rgba(106,69,255,.35)";
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1400, height: 1400, left: -500 + drift, top: -400, borderRadius: "50%", background: `radial-gradient(circle, ${glowColor} 0%, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1200, height: 1200, right: -500 - drift, bottom: -300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,0,127,.16) 0%, transparent 60%)" }} />
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.045) 2px, transparent 2px)",
            backgroundSize: "90px 90px",
            backgroundPosition: `0 ${frame * 0.6}px`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const Icon: React.FC<{ name: string; size?: number; fill?: boolean; style?: React.CSSProperties }> = ({ name, size = 48, fill = true, style }) => (
  <span
    style={{
      fontFamily: font.icon,
      fontSize: size,
      lineHeight: 1,
      fontFeatureSettings: '"liga"',
      fontVariationSettings: `"FILL" ${fill ? 1 : 0}, "wght" 600, "GRAD" 0, "opsz" 48`,
      display: "inline-block",
      ...style,
    }}
  >
    {name}
  </span>
);

export const Card: React.FC<{ children: React.ReactNode; tone?: Tone | "panel"; style?: React.CSSProperties; shadow?: number; radius?: number }> = ({ children, tone = "panel", style, shadow = 12, radius = 32 }) => {
  const palette = tone === "panel" ? { bg: color.panel2, fg: color.fg } : toneMap[tone];
  return (
    <div
      style={{
        background: palette.bg,
        color: palette.fg,
        border: `5px solid ${color.ink}`,
        borderRadius: radius,
        boxShadow: `0 ${shadow}px 0 ${color.ink}${tone === "panel" ? `, 0 0 0 2px rgba(255,255,255,.08)` : ""}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; tone?: Tone | "panel"; size?: number; style?: React.CSSProperties }> = ({ children, tone = "lime", size = 34, style }) => {
  const palette = tone === "panel" ? { bg: color.panel, fg: color.fg } : toneMap[tone];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.35,
        padding: `${size * 0.4}px ${size * 0.8}px`,
        background: palette.bg,
        color: palette.fg,
        border: `4px solid ${color.ink}`,
        borderRadius: 999,
        boxShadow: `0 6px 0 ${color.ink}`,
        fontFamily: font.body,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: 0.5,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Sticker: React.FC<{ children: React.ReactNode; tone?: Tone; rotate?: number; delay?: number; size?: number; style?: React.CSSProperties }> = ({ children, tone = "lime", rotate = -6, delay = 0, size = 38, style }) => {
  const s = useSpring(delay, { damping: 10, stiffness: 200 });
  return (
    <div style={{ position: "absolute", transform: `rotate(${rotate}deg) scale(${s})`, ...style }}>
      <Pill tone={tone} size={size} style={{ fontFamily: font.display, fontWeight: 800, textTransform: "uppercase" }}>
        {children}
      </Pill>
    </div>
  );
};

export const Pop: React.FC<{ children: React.ReactNode; delay?: number; from?: "up" | "down" | "left" | "right" | "scale"; distance?: number; style?: React.CSSProperties }> = ({ children, delay = 0, from = "up", distance = 80, style }) => {
  const s = useSpring(delay);
  const d = (1 - s) * distance;
  const transform =
    from === "scale" ? `scale(${s})` : from === "up" ? `translateY(${d}px)` : from === "down" ? `translateY(${-d}px)` : from === "left" ? `translateX(${-d}px)` : `translateX(${d}px)`;
  return <div style={{ opacity: Math.min(1, s * 1.4), transform, ...style }}>{children}</div>;
};

export const Kinetic: React.FC<{ text: string; delay?: number; stagger?: number; size?: number; color?: string; highlight?: string[]; highlightColor?: string; align?: "left" | "center"; lineHeight?: number; weight?: number }> = ({
  text,
  delay = 0,
  stagger = 3,
  size = 110,
  color: textColor = color.fg,
  highlight = [],
  highlightColor = color.lime,
  align = "left",
  lineHeight = 1.02,
  weight = 900,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = text.split("\n");
  let index = 0;
  return (
    <div style={{ fontFamily: font.display, fontWeight: weight, fontSize: size, lineHeight, color: textColor, textAlign: align, letterSpacing: -1 }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.26 }}>
          {line.split(" ").map((word, wi) => {
            const i = index++;
            const s = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 13, stiffness: 170 } });
            const isHi = highlight.includes(word.replace(/[.,!?]/g, ""));
            return (
              <span key={wi} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.08 }}>
                <span style={{ display: "inline-block", transform: `translateY(${(1 - s) * 110}%) rotate(${(1 - s) * 6}deg)`, color: isHi ? highlightColor : undefined }}>{word}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Logo: React.FC<{ width?: number; style?: React.CSSProperties }> = ({ width = 520, style }) => <Img src={staticFile("tusa-logo.svg")} style={{ width, ...style }} />;

export const LogoIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 120, style }) => <Img src={staticFile("tusa-icon.svg")} style={{ width: size, height: size, ...style }} />;

const avatarTones = [color.lime, color.pink, color.blueBright, color.cream, color.warn, color.info, color.ok];

export const Avatar: React.FC<{ name: string; size?: number; index?: number; style?: React.CSSProperties }> = ({ name, size = 88, index = 0, style }) => {
  const bg = avatarTones[index % avatarTones.length];
  const dark = bg === color.pink || bg === color.blueBright;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: dark ? color.white : color.ink,
        border: `4px solid ${color.ink}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.display,
        fontWeight: 800,
        fontSize: size * 0.42,
        flexShrink: 0,
        ...style,
      }}
    >
      {name[0]}
    </div>
  );
};

export const Phone: React.FC<{ children: React.ReactNode; width?: number; height?: number; style?: React.CSSProperties; screen?: string }> = ({ children, width = 640, height = 1300, style, screen = color.bgDeep }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 86,
      background: color.ink,
      border: `6px solid #2b2e3d`,
      padding: 22,
      boxShadow: `0 18px 0 #05060a, 0 40px 120px rgba(0,0,0,.6), 0 0 0 3px rgba(255,255,255,.06)`,
      position: "relative",
      ...style,
    }}
  >
    <div style={{ width: "100%", height: "100%", borderRadius: 64, background: screen, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 170, height: 44, borderRadius: 30, background: color.ink, zIndex: 10 }} />
      {children}
    </div>
  </div>
);

export const Ticker: React.FC<{ items: string[]; tone?: Tone; speed?: number; rotate?: number; style?: React.CSSProperties }> = ({ items, tone = "lime", speed = 6, rotate = -4, style }) => {
  const frame = useCurrentFrame();
  const palette = toneMap[tone];
  const row = [...items, ...items, ...items, ...items];
  return (
    <div style={{ position: "absolute", left: -100, right: -100, transform: `rotate(${rotate}deg)`, background: palette.bg, color: palette.fg, borderTop: `5px solid ${color.ink}`, borderBottom: `5px solid ${color.ink}`, overflow: "hidden", padding: "22px 0", ...style }}>
      <div style={{ display: "flex", gap: 50, whiteSpace: "nowrap", transform: `translateX(${-((frame * speed) % 1400)}px)`, fontFamily: font.display, fontWeight: 900, fontSize: 44 }}>
        {row.map((item, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 50 }}>
            {item}
            <span style={{ fontSize: 30 }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export const StepLabel: React.FC<{ index: string; title: string; delay?: number; tone?: Tone }> = ({ index, title, delay = 0, tone = "lime" }) => (
  <Pop delay={delay} from="left">
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <Pill tone={tone} size={36} style={{ fontFamily: font.display }}>
        {index}
      </Pill>
      <div style={{ fontFamily: font.body, fontWeight: 800, fontSize: 36, color: color.muted, textTransform: "uppercase", letterSpacing: 3 }}>{title}</div>
    </div>
  </Pop>
);

export const Flash: React.FC<{ at: number; duration?: number; tint?: string }> = ({ at, duration = 8, tint = color.lime }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 2, at + duration], [0, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: tint, opacity: o, pointerEvents: "none" }} />;
};
