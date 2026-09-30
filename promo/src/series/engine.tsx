import React, { useMemo } from "react";
import { AbsoluteFill, Html5Audio as Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Character, type Emotion, type Pose, type Prop } from "./Character";
import { CAST, type CastId } from "./cast";

const INK = "#121218";
const FPS = 30;

export type Shot = { kind: "wide" } | { kind: "close"; on: CastId; zoom?: number } | { kind: "two"; a: CastId; b: CastId } | { kind: "custom"; x: number; y: number; s: number };

export type Sfx = { name: string; at?: number; vol?: number };

export type Beat = {
  who?: CastId;
  text?: string;
  dur?: number;
  shot?: Shot;
  emo?: Partial<Record<CastId, Emotion>>;
  pose?: Partial<Record<CastId, Pose>>;
  props?: Partial<Record<CastId, Prop>>;
  look?: Partial<Record<CastId, CastId | "cam">>;
  chip?: string;
  clearChips?: boolean;
  arrive?: CastId[];
  caption?: string;
  sfx?: Sfx[];
  shake?: number;
  screen?: (f: number, dur: number) => React.ReactNode;
  overlay?: (f: number, dur: number) => React.ReactNode;
  flags?: string[];
};

export type Spot = { x: number; y: number; s: number; row: "back" | "front" };

export type SetProps = { frame: number; flags: Record<string, number> };

export type SceneSpec = {
  width: number;
  height: number;
  wide: { x: number; y: number; s: number };
  spots: Partial<Record<CastId, Spot>>;
  Back: React.FC<SetProps>;
  Middle?: React.FC<SetProps>;
  Front?: React.FC<SetProps>;
  ambience?: { name: string; vol: number };
};

export function beatDuration(b: Beat) {
  if (b.dur) return b.dur;
  if (!b.text) return 45;
  return Math.max(42, Math.min(140, Math.round((b.text.length / 16 + 0.65) * FPS)));
}

export function talkFrames(b: Beat) {
  if (!b.text) return 0;
  return Math.min(beatDuration(b) - 6, Math.round((b.text.length / 17) * FPS) + 10);
}

export function scriptDuration(beats: Beat[]) {
  return beats.reduce((a, b) => a + beatDuration(b), 0);
}

type CharState = { emo: Emotion; pose: Pose; prop: Prop; look: CastId | "cam" | null; present: boolean; arrivedAt: number };

type Snapshot = { start: number; dur: number; chars: Record<CastId, CharState>; chips: Partial<Record<CastId, { text: string; at: number }>>; flags: Record<string, number> };

function buildTimeline(beats: Beat[], initial: SceneInitial) {
  const ids = Object.keys(CAST) as CastId[];
  let chars = Object.fromEntries(
    ids.map((id) => [id, { emo: initial.emo?.[id] ?? "neutral", pose: initial.pose?.[id] ?? "idle", prop: initial.props?.[id] ?? null, look: null, present: initial.present.includes(id), arrivedAt: -999 }]),
  ) as Record<CastId, CharState>;
  let chips: Snapshot["chips"] = {};
  let flags: Record<string, number> = {};
  let t = 0;
  return beats.map((b) => {
    chars = { ...chars };
    ids.forEach((id) => {
      const cur = { ...chars[id] };
      if (b.emo?.[id]) cur.emo = b.emo[id]!;
      if (b.pose?.[id]) cur.pose = b.pose[id]!;
      if (b.props && id in b.props) cur.prop = b.props[id] ?? null;
      cur.look = b.look?.[id] ?? null;
      if (b.arrive?.includes(id)) {
        cur.present = true;
        cur.arrivedAt = t;
      }
      chars[id] = cur;
    });
    if (b.clearChips) chips = {};
    if (b.chip && b.who) chips = { ...chips, [b.who]: { text: b.chip, at: t } };
    if (b.flags) flags = { ...flags, ...Object.fromEntries(b.flags.map((name) => [name, t])) };
    const snap: Snapshot = { start: t, dur: beatDuration(b), chars, chips, flags };
    t += snap.dur;
    return snap;
  });
}

function cameraFor(shot: Shot, spec: SceneSpec) {
  if (shot.kind === "wide") return spec.wide;
  if (shot.kind === "custom") return shot;
  if (shot.kind === "close") {
    const p = spec.spots[shot.on]!;
    return { x: p.x, y: p.y - 330 * p.s, s: (shot.zoom ?? 1.45) / p.s };
  }
  const a = spec.spots[shot.a]!;
  const b = spec.spots[shot.b]!;
  const span = Math.abs(a.x - b.x) + 520;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 300, s: Math.min(1.2, 1080 / span) };
}

export const Subtitle: React.FC<{ who: CastId; text: string; f: number; voiceOver?: boolean }> = ({ who, text, f, voiceOver }) => {
  const c = CAST[who];
  const shown = text.slice(0, Math.ceil(f * 2 + 1));
  const s = spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, bottom: 150, transform: `translateY(${(1 - s) * 60}px)`, opacity: s }}>
      <div style={{ position: "relative", background: "#fffdf4", border: `6px solid ${INK}`, borderRadius: 36, padding: voiceOver ? "40px 40px 38px 170px" : "40px 44px 38px", boxShadow: `0 12px 0 ${INK}` }}>
        <div style={{ position: "absolute", top: -34, left: voiceOver ? 150 : 34, background: c.tag, color: c.tagText, border: `5px solid ${INK}`, borderRadius: 999, padding: "6px 26px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 36 }}>{c.name}</div>
        {voiceOver && (
          <div style={{ position: "absolute", left: 18, top: 26, width: 130, height: 130, borderRadius: "50%", background: c.tag, border: `5px solid ${INK}`, overflow: "hidden" }}>
            <Character id={who} crop="head" width={130} talking={f < 200} emotion="happy" style={{ marginTop: 6 }} />
          </div>
        )}
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 52, lineHeight: 1.18, color: INK, minHeight: 62 }}>{shown}</div>
      </div>
    </div>
  );
};

export const Caption: React.FC<{ text: string; f: number }> = ({ text, f }) => {
  const s = spring({ frame: f, fps: FPS, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${(1 - s) * -80}px) rotate(-2deg)`, opacity: s }}>
      <div style={{ background: "#c9ff05", color: INK, border: `5px solid ${INK}`, borderRadius: 18, padding: "18px 34px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 40, boxShadow: `0 8px 0 ${INK}` }}>{text}</div>
    </div>
  );
};

const Chip: React.FC<{ text: string; age: number; who: CastId }> = ({ text, age, who }) => {
  const s = spring({ frame: age, fps: FPS, config: { damping: 9, stiffness: 200 } });
  const c = CAST[who];
  return (
    <div style={{ transform: `translate(-50%, -100%) scale(${s}) rotate(${who === "aliya" ? 4 : -3}deg)`, background: c.tag, color: c.tagText, border: `6px solid ${INK}`, borderRadius: 22, padding: "14px 30px", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 46, whiteSpace: "nowrap", boxShadow: `0 8px 0 ${INK}` }}>{text}</div>
  );
};

export type SceneInitial = { present: CastId[]; emo?: Partial<Record<CastId, Emotion>>; pose?: Partial<Record<CastId, Pose>>; props?: Partial<Record<CastId, Prop>> };

export const DialogueScene: React.FC<{ spec: SceneSpec; beats: Beat[]; initial: SceneInitial }> = ({ spec, beats, initial }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = useMemo(() => buildTimeline(beats, initial), [beats, initial]);
  let i = timeline.findIndex((s) => frame >= s.start && frame < s.start + s.dur);
  if (i < 0) i = frame < 0 ? 0 : timeline.length - 1;
  const snap = timeline[i];
  const beat = beats[i];
  const lf = frame - snap.start;
  const speaking = beat.who && beat.text && lf < talkFrames(beat) ? beat.who : null;
  const lastWorld = (() => {
    for (let k = i; k >= 0; k--) if (!beats[k].screen) return k;
    return 0;
  })();
  const worldBeat = beats[lastWorld];
  const shot = worldBeat.shot ?? (worldBeat.who && spec.spots[worldBeat.who] ? { kind: "close" as const, on: worldBeat.who } : { kind: "wide" as const });
  const cam = cameraFor(shot, spec);
  const worldLf = frame - timeline[lastWorld].start;
  const creep = 1 + Math.min(worldLf, 150) * 0.00025;
  const shake = beat.shake ? Math.sin(lf * 2.1) * beat.shake * Math.max(0, 1 - lf / 20) : 0;
  const s = cam.s * creep;
  const tx = 540 - cam.x * s + shake;
  const ty = 960 - cam.y * s;

  const order = (Object.keys(spec.spots) as CastId[]).sort((a, b) => spec.spots[a]!.y - spec.spots[b]!.y);
  const renderChar = (id: CastId) => {
    const st = snap.chars[id];
    if (!st.present) return null;
    const p = spec.spots[id]!;
    const arriveAge = frame - st.arrivedAt;
    const inSpring = st.arrivedAt >= 0 ? spring({ frame: arriveAge, fps, config: { damping: 13, stiffness: 120 } }) : 1;
    const dir = p.x < spec.width / 2 ? -1 : 1;
    const ox = (1 - inSpring) * dir * 900;
    const land = st.arrivedAt >= 0 && arriveAge > 8 && arriveAge < 22 ? Math.sin(((arriveAge - 8) / 14) * Math.PI) * 0.8 : 0;
    const target = st.look && st.look !== "cam" ? st.look : speaking && speaking !== id ? speaking : beat.who && beat.who !== id ? beat.who : null;
    const look = st.look === "cam" ? 0 : target && spec.spots[target] ? Math.max(-1, Math.min(1, (spec.spots[target]!.x - p.x) / 280)) : 0;
    const w = 440 * p.s;
    return (
      <div key={id} style={{ position: "absolute", left: p.x - w / 2 + ox, top: p.y - 680 * p.s, width: w }}>
        <Character id={id} emotion={st.emo} pose={st.pose} prop={st.prop} talking={speaking === id} look={look} width={w} bounce={land} />
      </div>
    );
  };

  const chips = Object.entries(snap.chips) as [CastId, { text: string; at: number }][];
  const flags = snap.flags;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: INK }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: spec.width, height: spec.height, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        <spec.Back frame={frame} flags={flags} />
        {order.filter((id) => spec.spots[id]!.row === "back").map(renderChar)}
        {spec.Middle && <spec.Middle frame={frame} flags={flags} />}
        {order.filter((id) => spec.spots[id]!.row === "front").map(renderChar)}
        {spec.Front && <spec.Front frame={frame} flags={flags} />}
        {chips.map(([id, chip]) => {
          const p = spec.spots[id]!;
          if (!snap.chars[id].present) return null;
          return (
            <div key={id} style={{ position: "absolute", left: p.x, top: p.y - (p.row === "front" ? 590 : 720) * p.s }}>
              <Chip text={chip.text} age={frame - chip.at} who={id} />
            </div>
          );
        })}
      </div>
      {beat.screen && <AbsoluteFill>{beat.screen(lf, snap.dur)}</AbsoluteFill>}
      {beat.overlay && <AbsoluteFill>{beat.overlay(lf, snap.dur)}</AbsoluteFill>}
      {beat.caption && <Caption text={beat.caption} f={lf} />}
      {beat.who && beat.text && <Subtitle who={beat.who} text={beat.text} f={lf} voiceOver={Boolean(beat.screen)} />}
      {spec.ambience && <Audio src={staticFile(`sfx/${spec.ambience.name}.wav`)} volume={spec.ambience.vol} loop />}
      {timeline.map((t, k) => {
        const b = beats[k];
        const items: React.ReactNode[] = [];
        if (b.who && b.text) {
          const len = talkFrames(b);
          const offset = Math.floor(((k * 97) % 180) + 5);
          items.push(
            <Sequence key={`v${k}`} from={t.start} durationInFrames={len} layout="none">
              <Audio src={staticFile(`sfx/voice-${b.who}.wav`)} trimBefore={offset} volume={0.5} />
            </Sequence>,
          );
        }
        (b.sfx ?? []).forEach((x, n) =>
          items.push(
            <Sequence key={`s${k}-${n}`} from={t.start + (x.at ?? 0)} layout="none">
              <Audio src={staticFile(`sfx/${x.name}.wav`)} volume={x.vol ?? 0.7} />
            </Sequence>,
          ),
        );
        if (b.arrive?.length)
          items.push(
            <Sequence key={`a${k}`} from={t.start + 8} layout="none">
              <Audio src={staticFile("sfx/boing.wav")} volume={0.5} />
            </Sequence>,
          );
        if (b.chip)
          items.push(
            <Sequence key={`c${k}`} from={t.start} layout="none">
              <Audio src={staticFile("sfx/pop.wav")} volume={0.6} />
            </Sequence>,
          );
        return items;
      })}
    </AbsoluteFill>
  );
};

export const fade = (f: number, dur: number, inF = 6, outF = 6) => interpolate(f, [0, inF, dur - outF, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
