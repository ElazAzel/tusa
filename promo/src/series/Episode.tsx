import React from "react";
import { AbsoluteFill, Html5Audio as Audio, Sequence, Series, staticFile } from "remotion";
import type { Emotion, Pose } from "./Character";
import { CAST, type CastId } from "./cast";
import { type Beat, DialogueScene, type SceneInitial, type SceneSpec, beatDuration, scriptDuration } from "./engine";
import { ChatBubble, IntroCard, NextEpisode, Stopwatch, TitleCard } from "./screens";

export const TITLE_LEN = 90;
export const OUTRO_LEN = 170;
export const MUSIC_VOLUME = 0.1;

export type EpisodeScene = { spec: SceneSpec; beats: Beat[]; initial: SceneInitial };

export type EpisodeDef = {
  season: number;
  episode: number;
  title: string;
  explainer: CastId;
  games: string[];
  cold: EpisodeScene;
  scenes: EpisodeScene[];
  next: { who: CastId; game: string };
  cta: string;
};

export type EpisodeEntry = { id: string; duration: number; Component: React.FC; def: EpisodeDef };

const pad = (n: number) => String(n).padStart(2, "0");

export function makeEpisode(def: EpisodeDef): EpisodeEntry {
  const cold = scriptDuration(def.cold.beats);
  const scenes = def.scenes.map((s) => scriptDuration(s.beats));
  const duration = cold + TITLE_LEN + scenes.reduce((a, b) => a + b, 0) + OUTRO_LEN;
  const Component: React.FC = () => (
    <AbsoluteFill style={{ background: "#121218" }}>
      <Series>
        <Series.Sequence durationInFrames={cold}>
          <DialogueScene spec={def.cold.spec} beats={def.cold.beats} initial={def.cold.initial} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={TITLE_LEN}>
          <TitleCard season={def.season} episode={def.episode} title={def.title} />
          <Audio src={staticFile("sfx/sting.wav")} volume={0.6} />
        </Series.Sequence>
        {def.scenes.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={scenes[i]}>
            <DialogueScene spec={s.spec} beats={s.beats} initial={s.initial} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={OUTRO_LEN}>
          <NextEpisode who={def.next.who} game={def.next.game} cta={def.cta} />
          <Sequence from={90} layout="none">
            <Audio src={staticFile("sfx/tada.wav")} volume={0.5} />
          </Sequence>
        </Series.Sequence>
      </Series>
      <Audio src={staticFile("sfx/music.wav")} loop volume={MUSIC_VOLUME} />
    </AbsoluteFill>
  );
  return { id: `TusaS${pad(def.season)}E${pad(def.episode)}`, duration, Component, def };
}

export type ChatLine = { who: CastId; text: string; x: number; y: number; r: number };

export function chatBeat(lines: ChatLine[], beat: Omit<Beat, "overlay">, step = 8, start = 6): Beat {
  return {
    ...beat,
    sfx: [...(beat.sfx ?? []), ...lines.map((_, i) => ({ name: "msg", at: start + i * step, vol: 0.5 }))],
    overlay: (f) => (
      <>
        {lines.map((m, i) => (
          <ChatBubble key={i} {...m} age={f - start - i * step} />
        ))}
      </>
    ),
  };
}

export function introCard(who: CastId, index: number, emotion: Emotion, pose: Pose): Beat {
  return {
    dur: 66,
    screen: (f) => <IntroCard who={who} f={f} index={index} emotion={emotion} pose={pose} />,
    sfx: [{ name: "whoosh", vol: 0.45 }, { name: "tick", at: 6, vol: 0.6 }],
  };
}

export function timedRules(beats: Beat[], timer: CastId): { beats: Beat[]; seconds: number } {
  let clock = 0;
  const timed = beats.map((b) => {
    const base = clock;
    clock += beatDuration(b);
    return { ...b, overlay: (f: number) => <Stopwatch frame={base + f} label={`секундомер ${CAST[timer].nameGen}`} /> };
  });
  return { beats: timed, seconds: Math.floor(clock / 30) };
}
