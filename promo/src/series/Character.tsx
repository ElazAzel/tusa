import React from "react";
import { useCurrentFrame } from "remotion";
import { CAST, type CastId, type CastMember } from "./cast";

export type Emotion = "neutral" | "happy" | "smug" | "shock" | "panic" | "angry" | "sad" | "dreamy";
export type Pose = "idle" | "wave" | "point" | "shrug" | "cheer" | "phone" | "cross" | "hips" | "glasses" | "chin" | "hold";
export type Prop = "phone" | "coals" | null;

const INK = "#121218";
const L1 = 132;
const L2 = 132;
const SHOULDER = { x: 128, y: 400 };

type Pt = { x: number; y: number };

const handTargets: Record<Pose, { r: Pt; l: Pt }> = {
  idle: { r: { x: 168, y: 655 }, l: { x: 168, y: 655 } },
  wave: { r: { x: 255, y: 170 }, l: { x: 168, y: 655 } },
  point: { r: { x: 390, y: 360 }, l: { x: 168, y: 655 } },
  shrug: { r: { x: 285, y: 320 }, l: { x: 285, y: 320 } },
  cheer: { r: { x: 230, y: 90 }, l: { x: 230, y: 90 } },
  phone: { r: { x: 72, y: 470 }, l: { x: 72, y: 470 } },
  cross: { r: { x: -40, y: 478 }, l: { x: -40, y: 462 } },
  hips: { r: { x: 150, y: 560 }, l: { x: 150, y: 560 } },
  glasses: { r: { x: 8, y: 214 }, l: { x: 168, y: 655 } },
  chin: { r: { x: 40, y: 340 }, l: { x: 168, y: 655 } },
  hold: { r: { x: 185, y: 590 }, l: { x: 168, y: 655 } },
};

function ik(target: Pt): { elbow: Pt; hand: Pt } {
  const dx = target.x - SHOULDER.x;
  const dy = target.y - SHOULDER.y;
  const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1);
  const a = Math.atan2(dy, dx);
  const b = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const c1 = { x: SHOULDER.x + L1 * Math.cos(a + b), y: SHOULDER.y + L1 * Math.sin(a + b) };
  const c2 = { x: SHOULDER.x + L1 * Math.cos(a - b), y: SHOULDER.y + L1 * Math.sin(a - b) };
  const elbow = c1.x > c2.x ? c1 : c2;
  const hand = { x: SHOULDER.x + d * Math.cos(a), y: SHOULDER.y + d * Math.sin(a) };
  return { elbow, hand };
}

const Arm: React.FC<{ target: Pt; side: 1 | -1; c: CastMember }> = ({ target, side, c }) => {
  const { elbow, hand } = ik(target);
  const m = (p: Pt) => `${p.x * side},${p.y}`;
  const d = `M${m(SHOULDER)} L${m(elbow)} L${m(hand)}`;
  return (
    <g>
      <path d={d} stroke={INK} strokeWidth={46} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={c.cloth} strokeWidth={32} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand.x * side} cy={hand.y} r={27} fill={c.skin} stroke={INK} strokeWidth={7} />
    </g>
  );
};

const Hair: React.FC<{ c: CastMember; layer: "back" | "front"; frame: number }> = ({ c, layer, frame }) => {
  if (c.id === "amir") {
    if (layer === "back") return <ellipse cx={-150} cy={95} rx={95} ry={26} fill={c.accent} stroke={INK} strokeWidth={8} transform="rotate(-12 -150 95)" />;
    return (
      <g>
        <path d="M-122,150 Q-132,120 -118,104 L-100,150 Z M122,150 Q132,120 118,104 L100,150 Z" fill={c.hair} stroke={INK} strokeWidth={5} />
        <path d="M-128,128 Q-120,30 0,26 Q120,30 128,128 Q0,100 -128,128 Z" fill={c.accent} stroke={INK} strokeWidth={8} />
        <path d="M-60,112 Q0,94 60,112" stroke="rgba(255,255,255,.35)" strokeWidth={6} fill="none" />
        <circle cx={0} cy={30} r={11} fill={c.cloth} stroke={INK} strokeWidth={5} />
      </g>
    );
  }
  if (c.id === "dana") {
    const sway = Math.sin(frame / 9) * 6;
    if (layer === "back")
      return (
        <g transform={`rotate(${sway} 40 40)`}>
          <path d="M30,50 C90,-40 190,-30 210,40 C220,90 190,150 160,170 C175,110 150,40 60,70 Z" fill={c.hair} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        </g>
      );
    return (
      <g>
        <path d="M-132,160 Q-140,40 0,38 Q140,40 132,160 Q110,90 30,86 Q-40,92 -90,120 Q-120,140 -132,160 Z" fill={c.hair} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <rect x={16} y={34} width={42} height={22} rx={10} fill={c.accent} stroke={INK} strokeWidth={5} transform="rotate(-25 36 45)" />
        <circle cx={-139} cy={262} r={9} fill={c.accent} stroke={INK} strokeWidth={4} />
        <circle cx={139} cy={262} r={9} fill={c.accent} stroke={INK} strokeWidth={4} />
      </g>
    );
  }
  if (c.id === "erlan") {
    if (layer === "back") return null;
    return (
      <g>
        <path d="M-126,120 Q-122,40 0,38 Q122,40 126,120 Q60,92 0,94 Q-60,92 -126,120 Z" fill={c.hair} stroke={INK} strokeWidth={7} />
        {[-80, -40, 0, 40, 80].map((x) => (
          <circle key={x} cx={x} cy={70 + Math.abs(x) * 0.15} r={4} fill="rgba(255,255,255,.18)" />
        ))}
      </g>
    );
  }
  if (c.id === "aliya") {
    if (layer === "back") return <path d="M-170,300 Q-190,60 0,26 Q190,60 170,300 Q150,330 118,320 L118,160 L-118,160 L-118,320 Q-150,330 -170,300 Z" fill={c.hair} stroke={INK} strokeWidth={8} strokeLinejoin="round" />;
    return (
      <g>
        <path d="M-134,168 Q-138,44 0,34 Q138,44 134,168 L100,160 L96,140 L60,152 L50,132 L10,148 L0,128 L-36,146 L-50,128 L-84,146 L-96,132 Z" fill={c.hair} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M-60,70 Q-20,48 30,56" stroke="rgba(255,255,255,.35)" strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (layer === "back") return null;
  return (
    <g>
      <path d="M-128,140 Q-130,36 0,32 Q130,36 128,140 Q110,86 20,80 Q-10,110 -128,140 Z" fill={c.hair} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M20,80 Q70,60 118,96" stroke="rgba(255,255,255,.25)" strokeWidth={6} fill="none" />
    </g>
  );
};

const Clothes: React.FC<{ c: CastMember }> = ({ c }) => {
  const base = <rect x={-150} y={372} width={300} height={260} fill={c.cloth} />;
  if (c.id === "amir")
    return (
      <g>
        {base}
        <path d="M-150,372 Q0,440 150,372 L150,392 Q0,462 -150,392 Z" fill={c.clothDark} />
        <path d="M-70,384 Q0,430 70,384" stroke={INK} strokeWidth={7} fill="none" />
        <path d="M-28,410 L-34,470 M28,410 L34,470" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <rect x={-60} y={500} width={120} height={60} rx={14} fill={c.clothDark} stroke={INK} strokeWidth={5} />
      </g>
    );
  if (c.id === "dana")
    return (
      <g>
        {base}
        <path d="M-30,372 L0,430 L30,372 Z" fill="#ffffff" stroke={INK} strokeWidth={5} />
        <path d="M-150,372 L-30,372 L0,430 L-40,420 Z M150,372 L30,372 L0,430 L40,420 Z" fill={c.clothDark} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M0,430 L0,620" stroke={INK} strokeWidth={6} />
        <circle cx={0} cy={470} r={6} fill="#ffffff" stroke={INK} strokeWidth={3} />
      </g>
    );
  if (c.id === "erlan")
    return (
      <g>
        {base}
        <path d="M-60,372 Q0,420 60,372" fill={c.skin} stroke={INK} strokeWidth={6} />
        <text x={0} y={520} textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight={900} fontSize={54} fill={INK}>
          KZ
        </text>
      </g>
    );
  if (c.id === "aliya")
    return (
      <g>
        <rect x={-150} y={372} width={300} height={260} fill="#ff4d9f" />
        <path d="M-80,430 L80,430 L90,632 L-90,632 Z" fill={c.cloth} stroke={INK} strokeWidth={6} />
        <path d="M-80,430 L-110,372 M80,430 L110,372" stroke={c.cloth} strokeWidth={22} />
        <path d="M-80,430 L-110,372 M80,430 L110,372" stroke={INK} strokeWidth={4} opacity={0.5} />
        <circle cx={-30} cy={480} r={12} fill="#c9ff05" />
        <circle cx={40} cy={520} r={9} fill="#6a45ff" />
        <circle cx={10} cy={560} r={14} fill="#57c2ff" />
      </g>
    );
  return (
    <g>
      {base}
      <path d="M-44,372 L0,414 L-10,432 L-60,392 Z M44,372 L0,414 L10,432 L60,392 Z" fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-150,600 L150,600" stroke={c.clothDark} strokeWidth={30} />
      <rect x={70} y={450} width={46} height={56} rx={6} fill={c.clothDark} stroke={INK} strokeWidth={4} />
      <path d="M84,440 L84,470" stroke="#ff007f" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

const Eyes: React.FC<{ c: CastMember; emotion: Emotion; look: number; blink: boolean; frame: number }> = ({ c, emotion, look, blink, frame }) => {
  const shock = emotion === "shock";
  const panic = emotion === "panic";
  const r = shock ? 46 : 40;
  const pr = shock || panic ? 10 : 17;
  const jitter = panic ? Math.sin(frame * 2.3) * 3 : 0;
  const lx = look * 16 + jitter;
  const glasses = c.id === "timur";
  const eye = (x: number) => {
    if (emotion === "dreamy" || emotion === "happy") {
      if (emotion === "dreamy" || blink) return <path key={x} d={`M${x - 30},${215} Q${x},${182} ${x + 30},${215}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
    }
    if (blink) return <path key={x} d={`M${x - 32},${212} Q${x},${226} ${x + 32},${212}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
    const lid = emotion === "smug" ? 0.5 : emotion === "angry" ? 0.45 : emotion === "sad" ? 0.3 : 0;
    const top = 210 - r - 6;
    const inner = x < 0 ? 1 : -1;
    const lidPath =
      emotion === "angry"
        ? `M${x - r - 6},${top} L${x + r + 6},${top} L${x + r + 6},${210 - r + 2 * r * (inner > 0 ? lid : 0.12)} L${x - r - 6},${210 - r + 2 * r * (inner > 0 ? 0.12 : lid)} Z`
        : emotion === "sad"
          ? `M${x - r - 6},${top} L${x + r + 6},${top} L${x + r + 6},${210 - r + 2 * r * (inner > 0 ? 0.08 : lid)} L${x - r - 6},${210 - r + 2 * r * (inner > 0 ? lid : 0.08)} Z`
          : `M${x - r - 6},${top} L${x + r + 6},${top} L${x + r + 6},${210 - r + 2 * r * lid} L${x - r - 6},${210 - r + 2 * r * lid} Z`;
    const clip = `eye-${c.id}-${x}`;
    return (
      <g key={x}>
        <clipPath id={clip}>
          <circle cx={x} cy={210} r={r} />
        </clipPath>
        <circle cx={x} cy={210} r={r} fill="#ffffff" />
        <circle cx={x + lx} cy={214} r={pr} fill={INK} />
        <circle cx={x + lx + pr * 0.35} cy={214 - pr * 0.4} r={pr * 0.32} fill="#ffffff" />
        {lid > 0 && (
          <g clipPath={`url(#${clip})`}>
            <path d={lidPath} fill={c.skin} stroke={INK} strokeWidth={8} />
          </g>
        )}
        <circle cx={x} cy={210} r={r} fill="none" stroke={INK} strokeWidth={7} />
      </g>
    );
  };
  return (
    <g>
      {eye(-56)}
      {eye(56)}
      {glasses && (
        <g>
          <circle cx={-56} cy={210} r={60} fill="rgba(170,225,255,.22)" stroke={INK} strokeWidth={13} />
          <circle cx={56} cy={210} r={60} fill="rgba(170,225,255,.22)" stroke={INK} strokeWidth={13} />
          <path d="M-8,206 Q0,196 8,206" stroke={INK} strokeWidth={10} fill="none" />
          <path d="M-116,206 L-134,200 M116,206 L134,200" stroke={INK} strokeWidth={10} />
          {emotion === "smug" && <path d={`M${-90 + (frame % 40) * 2},170 l30,-8 M${20 + (frame % 40) * 2},170 l30,-8`} stroke="#ffffff" strokeWidth={9} strokeLinecap="round" opacity={0.9} />}
        </g>
      )}
    </g>
  );
};

const Brows: React.FC<{ c: CastMember; emotion: Emotion }> = ({ c, emotion }) => {
  const table: Record<Emotion, [number, number, number]> = {
    neutral: [0, 0, 150],
    happy: [-6, 6, 140],
    smug: [0, -16, 146],
    shock: [0, 0, 118],
    panic: [-18, 18, 134],
    angry: [20, -20, 156],
    sad: [-16, 16, 144],
    dreamy: [-6, 6, 140],
  };
  const [l, r, y] = table[emotion];
  const by = c.id === "timur" ? y - 22 : y;
  return (
    <g fill={c.hair} stroke={INK} strokeWidth={5}>
      <rect x={-92} y={by - 9} width={72} height={18} rx={9} transform={`rotate(${l} -56 ${by})`} />
      <rect x={20} y={by - 9} width={72} height={18} rx={9} transform={`rotate(${r} 56 ${by})`} />
    </g>
  );
};

const Mouth: React.FC<{ emotion: Emotion; talking: boolean; frame: number; seed: number }> = ({ emotion, talking, frame, seed }) => {
  if (talking) {
    const open = Math.abs(Math.sin(frame * 0.55 + seed)) * (0.55 + 0.45 * Math.abs(Math.sin(frame * 0.21 + seed)));
    const wide = emotion === "happy" || emotion === "angry" ? 46 : emotion === "panic" ? 40 : 34;
    const h = 8 + open * 34;
    return (
      <g>
        <ellipse cx={0} cy={306} rx={wide} ry={h} fill="#4a1022" stroke={INK} strokeWidth={7} />
        {h > 18 && <ellipse cx={0} cy={306 + h * 0.5} rx={wide * 0.5} ry={h * 0.35} fill="#ff6b8b" />}
      </g>
    );
  }
  switch (emotion) {
    case "happy":
    case "dreamy":
      return (
        <g>
          <path d="M-52,290 Q0,360 52,290 Z" fill="#4a1022" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <path d="M-24,322 Q0,340 24,322 Q0,312 -24,322 Z" fill="#ff6b8b" />
        </g>
      );
    case "smug":
      return <path d="M-40,304 Q10,318 46,286" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
    case "shock":
      return <ellipse cx={0} cy={312} rx={26} ry={34} fill="#4a1022" stroke={INK} strokeWidth={7} />;
    case "panic":
      return (
        <g>
          <rect x={-50} y={290} width={100} height={36} rx={14} fill="#ffffff" stroke={INK} strokeWidth={7} />
          <path d="M-50,308 L50,308 M-18,290 L-18,326 M16,290 L16,326" stroke={INK} strokeWidth={4} />
        </g>
      );
    case "angry":
      return <path d="M-40,316 Q0,290 40,316" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
    case "sad":
      return <path d="M-36,320 Q0,296 36,320" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
    default:
      return <path d="M-32,300 Q0,318 32,300" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
  }
};

const PhoneProp: React.FC<{ glow: string }> = ({ glow }) => (
  <g>
    <rect x={-64} y={378} width={128} height={132} rx={18} fill={INK} stroke="#2b2e3d" strokeWidth={6} />
    <circle cx={0} cy={430} r={18} fill={glow} />
  </g>
);

const CoalBag: React.FC = () => (
  <g transform="translate(185 600)">
    <path d="M-60,10 Q-70,120 -40,140 L40,140 Q70,120 60,10 Q0,-10 -60,10 Z" fill="#3a3d4a" stroke={INK} strokeWidth={7} />
    <path d="M-30,6 Q0,-24 30,6" stroke={INK} strokeWidth={6} fill="none" />
    <rect x={-44} y={52} width={88} height={40} rx={8} fill="#ffffff" stroke={INK} strokeWidth={4} />
    <text x={0} y={82} textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight={900} fontSize={24} fill={INK}>
      УГЛИ
    </text>
  </g>
);

export type CharacterProps = {
  id: CastId;
  emotion?: Emotion;
  pose?: Pose;
  talking?: boolean;
  look?: number;
  prop?: Prop;
  crop?: "full" | "head";
  frozen?: boolean;
  bounce?: number;
  style?: React.CSSProperties;
  width?: number;
};

const seeds: Record<CastId, number> = { amir: 0.3, dana: 1.7, erlan: 2.9, aliya: 4.1, timur: 5.3 };

export const Character: React.FC<CharacterProps> = ({ id, emotion = "neutral", pose = "idle", talking = false, look = 0, prop = null, crop = "full", frozen = false, bounce = 0, style, width = 400 }) => {
  const live = useCurrentFrame();
  const frame = frozen ? 0 : live;
  const c = CAST[id];
  const seed = seeds[id];
  const bob = Math.sin(frame / 11 + seed) * 5 + (talking ? Math.sin(frame * 0.55 + seed) * 4 : 0);
  const blinkCycle = (frame + Math.round(seed * 37)) % 96;
  const blink = !frozen && blinkCycle < 4 && emotion !== "shock";
  const squash = 1 - bounce * 0.12;
  const wiggle = pose === "wave" || pose === "cheer" ? Math.sin(frame / 3) * 26 : 0;
  const t = handTargets[pose];
  const right = { x: t.r.x + (pose === "wave" || pose === "cheer" ? wiggle : 0), y: t.r.y };
  const left = { x: t.l.x + (pose === "cheer" ? -wiggle : 0), y: t.l.y };
  const viewBox = crop === "head" ? "-190 -20 380 380" : "-220 -80 440 800";
  const height = crop === "head" ? width : (width / 440) * 800;
  const faceGlow = prop === "phone" || pose === "phone";
  return (
    <svg viewBox={viewBox} width={width} height={height} style={{ overflow: "visible", ...style }}>
      <defs>
        <clipPath id={`body-${id}`}>
          <rect x={-140} y={40} width={280} height={560} rx={140} />
        </clipPath>
      </defs>
      <g transform={`translate(0 ${bob + bounce * 40}) translate(0 600) scale(${1 + bounce * 0.08} ${squash}) translate(0 -600)`}>
        <g>
          <rect x={-86} y={580} width={44} height={96} rx={16} fill="#2b2e3d" stroke={INK} strokeWidth={7} />
          <rect x={42} y={580} width={44} height={96} rx={16} fill="#2b2e3d" stroke={INK} strokeWidth={7} />
          <ellipse cx={-70} cy={684} rx={48} ry={24} fill="#ffffff" stroke={INK} strokeWidth={7} />
          <ellipse cx={70} cy={684} rx={48} ry={24} fill="#ffffff" stroke={INK} strokeWidth={7} />
        </g>
        <Hair c={c} layer="back" frame={frame} />
        <rect x={-140} y={40} width={280} height={560} rx={140} fill={c.skin} />
        <g clipPath={`url(#body-${id})`}>
          <Clothes c={c} />
          {faceGlow && <ellipse cx={0} cy={260} rx={150} ry={120} fill="#c9ff05" opacity={0.16} />}
        </g>
        <rect x={-140} y={40} width={280} height={560} rx={140} fill="none" stroke={INK} strokeWidth={9} />
        {id === "erlan" && <path d="M-118,340 Q0,420 118,340" stroke={c.accent} strokeWidth={16} fill="none" />}
        {id === "erlan" && (
          <g fill={c.accent} stroke={INK} strokeWidth={6}>
            <rect x={-150} y={316} width={46} height={62} rx={16} />
            <rect x={104} y={316} width={46} height={62} rx={16} />
          </g>
        )}
        <circle cx={-98} cy={272} r={24} fill="#ff4d9f" opacity={0.28} />
        <circle cx={98} cy={272} r={24} fill="#ff4d9f" opacity={0.28} />
        {id === "aliya" && <path d="M78,250 q22,-8 36,6 q-10,14 -32,8 z" fill="#c9ff05" stroke={INK} strokeWidth={3} />}
        <path d="M-10,256 Q0,270 12,256" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        <Eyes c={c} emotion={emotion} look={look} blink={blink} frame={frame} />
        <Brows c={c} emotion={emotion} />
        <Mouth emotion={emotion} talking={talking} frame={frame} seed={seed} />
        {emotion === "panic" && <path d={`M122,${120 + (frame % 30) * 3} q14,26 0,34 q-14,-8 0,-34 z`} fill="#57c2ff" stroke={INK} strokeWidth={4} />}
        <Hair c={c} layer="front" frame={frame} />
        {(pose === "phone" || prop === "phone") && pose === "phone" && <PhoneProp glow={c.cloth} />}
        {prop === "coals" && <CoalBag />}
        <Arm target={left} side={-1} c={c} />
        <Arm target={right} side={1} c={c} />
      </g>
    </svg>
  );
};
