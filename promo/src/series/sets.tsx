import React from "react";
import { spring } from "remotion";
import type { SceneSpec, SetProps } from "./engine";

const INK = "#121218";

const Lamp: React.FC<{ x: number; color: string; frame: number; phase: number }> = ({ x, color, frame, phase }) => (
  <g transform={`rotate(${Math.sin(frame / 38 + phase) * 2.2} ${x} 0)`}>
    <line x1={x} y1={0} x2={x} y2={430} stroke={INK} strokeWidth={8} />
    <ellipse cx={x} cy={600} rx={260} ry={200} fill={color} opacity={0.12} />
    <path d={`M${x - 90},510 L${x - 40},420 L${x + 40},420 L${x + 90},510 Z`} fill={color} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <ellipse cx={x} cy={514} rx={40} ry={14} fill="#fff6c9" />
  </g>
);

const Bokeh: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {[
      [120, 820, "#ffc247"],
      [200, 760, "#ff4d9f"],
      [300, 840, "#57c2ff"],
      [360, 790, "#ffc247"],
      [160, 880, "#c9ff05"],
      [260, 900, "#ff4d9f"],
    ].map(([x, y, c], i) => (
      <circle key={i} cx={x as number} cy={y as number} r={12 + ((i * 5) % 8)} fill={c as string} opacity={0.55 + 0.3 * Math.sin(frame / 12 + i)} />
    ))}
  </g>
);

const CafeBack: React.FC<SetProps> = ({ frame }) => {
  const flicker = frame % 97 > 92 ? 0.35 : 1;
  const bob = (i: number) => Math.sin(frame / 10 + i * 1.7) * 8;
  return (
    <svg width={1800} height={3400} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="cafe-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f1036" />
          <stop offset="1" stopColor="#40205f" />
        </linearGradient>
        <pattern id="brick" width="160" height="80" patternUnits="userSpaceOnUse">
          <rect width="160" height="80" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="4" />
          <line x1="80" y1="40" x2="80" y2="80" stroke="rgba(255,255,255,.05)" strokeWidth="4" />
          <line x1="0" y1="40" x2="160" y2="40" stroke="rgba(255,255,255,.05)" strokeWidth="4" />
        </pattern>
        <pattern id="checker" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="#1c1a2c" />
          <rect width="100" height="100" fill="#2a2740" />
          <rect x="100" y="100" width="100" height="100" fill="#2a2740" />
        </pattern>
        <filter id="neon" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="14" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={1800} height={2300} fill="url(#cafe-wall)" />
      <rect width={1800} height={2300} fill="url(#brick)" />
      <rect x={60} y={380} width={380} height={560} rx={24} fill="#0d1030" stroke={INK} strokeWidth={14} />
      <path d="M72,800 L150,650 L210,720 L290,560 L360,690 L428,620 L428,928 L72,928 Z" fill="#26305e" />
      <path d="M270,592 L290,560 L312,600 Z M140,670 L150,650 L162,672 Z" fill="#e9ecff" />
      <Bokeh frame={frame} />
      <line x1={250} y1={380} x2={250} y2={940} stroke={INK} strokeWidth={10} />
      <line x1={60} y1={660} x2={440} y2={660} stroke={INK} strokeWidth={10} />
      <rect x={1340} y={380} width={400} height={560} rx={20} fill="#1d2a24" stroke="#8a5a37" strokeWidth={18} />
      <text x={1540} y={470} textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight={900} fontSize={46} fill="#f6f6ee">
        МЕНЮ
      </text>
      {["чай с молоком", "баурсаки", "самса", "лимонад", "настолки"].map((item, i) => (
        <text key={item} x={1380} y={550 + i * 72} fontFamily="Inter, sans-serif" fontWeight={700} fontSize={40} fill={i === 1 ? "#ffc247" : "rgba(246,246,238,.85)"}>
          · {item}
        </text>
      ))}
      <g filter="url(#neon)" opacity={flicker}>
        <text x={900} y={940} textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight={900} fontSize={190} fill="none" stroke="#c9ff05" strokeWidth={12} letterSpacing={10}>
          TUSA
        </text>
      </g>
      <g filter="url(#neon)">
        <text x={900} y={1040} textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight={800} fontSize={54} fill="#ff4d9f">
          ЧАЙ · ИГРЫ · ДРУЗЬЯ
        </text>
      </g>
      {[1180, 1380].map((y) => (
        <g key={y}>
          <rect x={0} y={y} width={1800} height={22} fill="#8a5a37" stroke={INK} strokeWidth={6} />
        </g>
      ))}
      {[40, 190, 330, 520, 1060, 1220, 1470, 1620].map((x, i) => {
        const colors = ["#c9ff05", "#ff4d9f", "#57c2ff", "#ffc247", "#6a45ff", "#3ecf8e"];
        const c = colors[i % colors.length];
        return i % 3 === 0 ? (
          <g key={x}>
            <rect x={x} y={1080} width={130} height={100} rx={8} fill={c} stroke={INK} strokeWidth={6} />
            <rect x={x + 10} y={1040} width={110} height={40} rx={6} fill={colors[(i + 2) % 6]} stroke={INK} strokeWidth={6} />
          </g>
        ) : (
          <g key={x}>
            <rect x={x} y={1070} width={60} height={110} rx={20} fill={c} opacity={0.85} stroke={INK} strokeWidth={6} />
            <rect x={x + 14} y={1050} width={32} height={24} rx={6} fill="#f6f6ee" stroke={INK} strokeWidth={5} />
            <rect x={x + 70} y={1100} width={50} height={80} rx={14} fill={colors[(i + 3) % 6]} opacity={0.85} stroke={INK} strokeWidth={6} />
          </g>
        );
      })}
      {[120, 640, 1160, 1680].map((x, i) => (
        <g key={x} transform={`translate(0 ${bob(i)})`} opacity={0.9}>
          <rect x={x - 70} y={1330} width={140} height={260} rx={70} fill="#170b28" />
          <circle cx={x} cy={1300} r={62} fill="#170b28" />
          {i % 2 === 0 && <rect x={x + 60} y={1250 + bob(i + 2)} width={34} height={60} rx={8} fill="#2a1646" />}
        </g>
      ))}
      <rect x={0} y={2250} width={1800} height={1150} fill="url(#checker)" />
      <rect x={0} y={2230} width={1800} height={30} fill="#170b28" />
      <Lamp x={300} color="#c9ff05" frame={frame} phase={0} />
      <Lamp x={900} color="#ff4d9f" frame={frame} phase={1.3} />
      <Lamp x={1500} color="#57c2ff" frame={frame} phase={2.6} />
    </svg>
  );
};

const Piala: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-44,-10 Q-40,40 0,44 Q40,40 44,-10 Z" fill="#f6f6ee" stroke={INK} strokeWidth={6} />
    <ellipse cx={0} cy={-10} rx={44} ry={12} fill="#b5652d" stroke={INK} strokeWidth={6} />
    <path d="M-30,10 L30,10" stroke="#2d00f7" strokeWidth={6} />
  </g>
);

const CafeTable: React.FC<SetProps> = ({ frame, flags }) => {
  const plateAt = flags.bauyrsak;
  const plate = plateAt === undefined ? 0 : spring({ frame: frame - plateAt, fps: 30, config: { damping: 11, stiffness: 150 } });
  return (
    <svg width={1800} height={3400} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <rect x={250} y={1860} width={40} height={700} fill="#6b4226" stroke={INK} strokeWidth={8} />
      <rect x={1510} y={1860} width={40} height={700} fill="#6b4226" stroke={INK} strokeWidth={8} />
      <path d="M80,1650 L1720,1650 L1720,1790 Q900,1900 80,1790 Z" fill="#8e5b33" stroke={INK} strokeWidth={10} />
      <ellipse cx={900} cy={1650} rx={830} ry={118} fill="#c0874f" stroke={INK} strokeWidth={10} />
      <ellipse cx={900} cy={1640} rx={760} ry={86} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={8} />
      <Piala x={590} y={1640} />
      <Piala x={1260} y={1630} />
      <g transform="translate(165 1610)">
        <ellipse cx={0} cy={40} rx={80} ry={20} fill="rgba(0,0,0,.25)" />
        <path d="M-70,30 Q-80,-60 0,-66 Q80,-60 70,30 Z" fill="#2d00f7" stroke={INK} strokeWidth={7} />
        <path d="M70,-10 Q120,-30 116,-70" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M-70,-20 Q-110,-10 -100,20" stroke={INK} strokeWidth={10} fill="none" />
        <ellipse cx={0} cy={-66} rx={36} ry={12} fill="#c9ff05" stroke={INK} strokeWidth={6} />
        <circle cx={0} cy={-26} r={14} fill="#c9ff05" />
      </g>
      <rect x={560} y={1650} width={120} height={60} rx={10} fill={INK} stroke="#2b2e3d" strokeWidth={5} transform="rotate(-8 620 1680)" />
      {plateAt !== undefined && (
        <g transform={`translate(${1490 + (1 - plate) * 700} 1650) scale(${0.6 + plate * 0.4})`}>
          <ellipse cx={0} cy={10} rx={170} ry={44} fill="#f6f6ee" stroke={INK} strokeWidth={8} />
          {[
            [-80, -10],
            [-20, -26],
            [45, -12],
            [100, 0],
            [-50, 18],
            [20, 14],
            [10, -50],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 34} y={y - 30} width={68} height={56} rx={24} fill="#e3a24a" stroke={INK} strokeWidth={6} />
              <path d={`M${x - 16},${y - 14} q10,-8 22,0`} stroke="#ffe0a3" strokeWidth={6} fill="none" strokeLinecap="round" />
            </g>
          ))}
          {plate > 0.9 &&
            [0, 1, 2].map((k) => (
              <path key={k} d={`M${-40 + k * 40},${-90 - ((frame + k * 10) % 30)} q14,-20 0,-40`} stroke="rgba(255,255,255,.45)" strokeWidth={7} fill="none" strokeLinecap="round" />
            ))}
        </g>
      )}
    </svg>
  );
};

export const CAFE: SceneSpec = {
  width: 1800,
  height: 3400,
  wide: { x: 900, y: 1720, s: 0.64 },
  spots: {
    dana: { x: 430, y: 1600, s: 0.9, row: "back" },
    amir: { x: 900, y: 1600, s: 0.9, row: "back" },
    erlan: { x: 1370, y: 1600, s: 0.9, row: "back" },
    timur: { x: 665, y: 2200, s: 1.25, row: "front" },
    aliya: { x: 1135, y: 2200, s: 1.25, row: "front" },
  },
  Back: CafeBack,
  Middle: CafeTable,
  ambience: { name: "crowd", vol: 0.14 },
};

const RoomBack: React.FC<SetProps> = ({ frame }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <linearGradient id="room-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1b2466" />
        <stop offset="1" stopColor="#2d1b5e" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#room-wall)" />
    <rect x={640} y={260} width={360} height={500} rx={20} fill="#0c1233" stroke={INK} strokeWidth={14} />
    <path d="M652,640 L730,520 L800,600 L880,470 L950,580 L990,540 L990,748 L652,748 Z" fill="#2a3470" />
    <path d="M864,494 L880,470 L898,500 Z" fill="#e9ecff" />
    <circle cx={900} cy={360} r={42} fill="#fff4c2" />
    <line x1={820} y1={260} x2={820} y2={760} stroke={INK} strokeWidth={10} />
    <rect x={80} y={300} width={300} height={400} rx={10} fill="#c9ff05" stroke={INK} strokeWidth={10} transform="rotate(-4 230 500)" />
    <text x={230} y={520} textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight={900} fontSize={84} fill={INK} transform="rotate(-4 230 500)">
      TUSA
    </text>
    <path d="M0,160 Q270,240 540,170 Q810,240 1080,160" stroke={INK} strokeWidth={5} fill="none" />
    {Array.from({ length: 11 }).map((_, i) => {
      const x = 50 + i * 98;
      const y = 175 + Math.sin((i / 10) * Math.PI * 2) * 30 + 20;
      const on = (Math.floor(frame / 12) + i) % 3 !== 0;
      return <circle key={i} cx={x} cy={y} r={14} fill={["#ffc247", "#ff4d9f", "#c9ff05", "#57c2ff"][i % 4]} opacity={on ? 1 : 0.35} />;
    })}
    <rect x={0} y={1640} width={1080} height={280} fill="#3a2458" />
    <ellipse cx={540} cy={1740} rx={420} ry={70} fill="#ff4d9f" opacity={0.55} stroke={INK} strokeWidth={8} />
  </svg>
);

export const ROOM: SceneSpec = {
  width: 1080,
  height: 1920,
  wide: { x: 540, y: 960, s: 1 },
  spots: { amir: { x: 540, y: 1560, s: 1.25, row: "front" } },
  Back: RoomBack,
};
