import React from "react";
import { AbsoluteFill, Html5Audio as Audio, Sequence, Series, spring, staticFile } from "remotion";
import { type Beat, DialogueScene, beatDuration, scriptDuration } from "../engine";
import { CAFE, ROOM } from "../sets";
import { ChatBubble, IntroCard, MiniPhone, NextEpisode, Stopwatch, TitleCard, plural } from "../screens";
import { ClueBalance, ClueInput, PhonesRow, ResultScreen, RoundsCard, ScoreRules, VoteScreen, WordReveal } from "../games/impostor";
import type { CastId } from "../cast";

const INK = "#121218";
const sp = (f: number) => spring({ frame: f, fps: 30, config: { damping: 12, stiffness: 190 } });

const flood: { who: CastId; text: string; x: number; y: number; r: number }[] = [
  { who: "dana", text: "кто идёт в пятницу?", x: 60, y: 160, r: -3 },
  { who: "erlan", text: "а где?", x: 520, y: 300, r: 4 },
  { who: "aliya", text: "я подумаю", x: 90, y: 420, r: 2 },
  { who: "timur", text: "какие правила?", x: 430, y: 560, r: -4 },
  { who: "dana", text: "кто берёт лёд???", x: 40, y: 700, r: 3 },
  { who: "erlan", text: "скиньте адрес ещё раз", x: 250, y: 850, r: -2 },
  { who: "aliya", text: "в каком чате ссылка??", x: 110, y: 1000, r: 5 },
];

const replies: { who: CastId; text: string; x: number; y: number; r: number }[] = [
  { who: "dana", text: "иду", x: 70, y: 180, r: -2 },
  { who: "erlan", text: "иду. беру угли", x: 380, y: 320, r: 3 },
  { who: "aliya", text: "уже еду!", x: 90, y: 460, r: -3 },
  { who: "timur", text: "изучаю правила", x: 360, y: 600, r: 2 },
];

const CreateTusa: React.FC<{ f: number }> = ({ f }) => {
  const done = f > 40;
  const title = "Импостор-пятница".slice(0, Math.max(0, Math.floor((f - 4) / 1.6)));
  const s = sp(f - 40);
  return (
    <AbsoluteFill style={{ background: "#0f1016", alignItems: "center", justifyContent: "center" }}>
      <MiniPhone width={660} height={1180} style={{ marginTop: -200 }}>
        <div style={{ padding: "60px 34px", display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 46, color: "#f2f3f8" }}>Новая туса</div>
          <div style={{ background: "#161823", border: "3px solid #c9ff05", borderRadius: 22, padding: 24, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 38, color: "#f2f3f8", minHeight: 46 }}>{title}</div>
          <div style={{ background: "#161823", border: "3px solid rgba(255,255,255,.12)", borderRadius: 22, padding: 24, fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 34, color: "#d7dae6" }}>Пятница · 21:00 · кафе на Абая</div>
          <div style={{ marginTop: 20, background: "#c9ff05", color: INK, border: `5px solid ${INK}`, borderRadius: 999, padding: "30px 0", textAlign: "center", fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 40, transform: `translateY(${f > 34 && f < 40 ? 8 : 0}px)` }}>Создать тусу</div>
        </div>
        {done && (
          <AbsoluteFill style={{ background: "#c9ff05", alignItems: "center", justifyContent: "center", gap: 26, clipPath: `circle(${s * 150}% at 50% 70%)` }}>
            <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 900, fontSize: 56, color: INK }}>Ивент открыт</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 34, color: INK }}>Ссылка ушла в чат</div>
            <div style={{ background: INK, color: "#c9ff05", borderRadius: 18, padding: "16px 24px", fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 30 }}>tusa.game/join/…</div>
          </AbsoluteFill>
        )}
      </MiniPhone>
    </AbsoluteFill>
  );
};

const coldOpen: Beat[] = [
  {
    dur: 84,
    shot: { kind: "close", on: "amir", zoom: 1.25 },
    emo: { amir: "panic" },
    pose: { amir: "phone" },
    sfx: [{ name: "buzz", vol: 0.5 }, ...flood.map((_, i) => ({ name: "msg", at: 6 + i * 8, vol: 0.5 }))],
    overlay: (f) => (
      <>
        {flood.map((m, i) => (
          <ChatBubble key={i} {...m} age={f - 6 - i * 8} />
        ))}
      </>
    ),
  },
  { who: "amir", text: "Всё. Хватит.", shot: { kind: "close", on: "amir", zoom: 1.7 }, emo: { amir: "angry" }, pose: { amir: "idle" }, shake: 12 },
  { who: "amir", text: "Создаю тусу.", shot: { kind: "close", on: "amir", zoom: 1.4 }, emo: { amir: "smug" }, pose: { amir: "phone" } },
  { dur: 78, screen: (f) => <CreateTusa f={f} />, sfx: [{ name: "whoosh", vol: 0.5 }, { name: "ding", at: 40, vol: 0.5 }] },
  {
    who: "amir",
    text: "Вот так-то.",
    dur: 80,
    shot: { kind: "close", on: "amir", zoom: 1.25 },
    emo: { amir: "happy" },
    pose: { amir: "hips" },
    sfx: replies.map((_, i) => ({ name: "msg", at: 4 + i * 7, vol: 0.5 })),
    overlay: (f) => (
      <>
        {replies.map((m, i) => (
          <ChatBubble key={i} {...m} age={f - 4 - i * 7} />
        ))}
      </>
    ),
  },
];

const intro = (who: CastId, index: number, emotion: "happy" | "smug" | "dreamy" | "panic", pose: "wave" | "hips" | "hold" | "glasses" | "cheer" | "shrug"): Beat => ({
  dur: 66,
  screen: (f) => <IntroCard who={who} f={f} index={index} emotion={emotion} pose={pose} />,
  sfx: [{ name: "whoosh", vol: 0.45 }, { name: "tick", at: 6, vol: 0.6 }],
});

const arrival: Beat[] = [
  { dur: 66, shot: { kind: "wide" }, caption: "Кафе на Абая. Пятница, 21:00", pose: { amir: "phone" } },
  intro("amir", 1, "happy", "wave"),
  { who: "amir", text: "Ссылку кинул. Все в тусе. Где все?", pose: { amir: "shrug" }, emo: { amir: "neutral" } },
  { dur: 36, arrive: ["dana"], shot: { kind: "wide" }, emo: { dana: "smug" }, pose: { dana: "hips", amir: "idle" } },
  intro("dana", 2, "smug", "hips"),
  { who: "dana", text: "Я вовремя. Это вы все опоздали." },
  { who: "amir", text: "Я тут с восьми.", emo: { amir: "sad" }, shot: { kind: "two", a: "dana", b: "amir" } },
  { dur: 36, arrive: ["erlan"], shot: { kind: "wide" }, emo: { erlan: "happy", amir: "neutral" }, pose: { erlan: "hold" }, props: { erlan: "coals" } },
  intro("erlan", 3, "dreamy", "hold"),
  { who: "dana", text: "Ерлан. Мы в кафе.", emo: { dana: "angry" }, look: { dana: "erlan" } },
  { who: "erlan", text: "Угли взял. На всякий.", emo: { erlan: "happy" } },
  { dur: 36, arrive: ["aliya"], shot: { kind: "wide" }, emo: { aliya: "happy", dana: "neutral" }, pose: { aliya: "wave" } },
  intro("aliya", 4, "happy", "cheer"),
  { who: "aliya", text: "Привет! Я с мастер-класса, краска не смывается." },
  { dur: 36, arrive: ["timur"], shot: { kind: "wide" }, emo: { timur: "smug" }, pose: { timur: "glasses", aliya: "idle" }, sfx: [{ name: "glint", at: 16, vol: 0.5 }] },
  intro("timur", 5, "smug", "glasses"),
  { who: "timur", text: "Добрый вечер. Я прочитал правила.", sfx: [{ name: "glint", at: 4, vol: 0.4 }] },
  { who: "amir", text: "Сегодня Импостор. Кто объясняет?", shot: { kind: "wide" }, pose: { timur: "idle" } },
  { dur: 40, shot: { kind: "wide" }, look: { amir: "timur", dana: "timur", erlan: "timur", aliya: "timur" }, pose: { timur: "wave" }, sfx: [{ name: "cricket", vol: 0.35 }] },
  { who: "timur", text: "Я. Уложусь в сорок секунд.", pose: { timur: "idle" } },
  { who: "dana", text: "Засекаю.", pose: { dana: "phone" }, emo: { dana: "smug" }, sfx: [{ name: "tick", at: 20, vol: 0.6 }] },
];

const rulesRaw: Beat[] = [
  { who: "timur", text: "Все получают на телефон одно секретное слово.", screen: (f) => <PhonesRow f={f} word="пицца" impostor="erlan" showImpostor={false} kicker="ИМПОСТОР · ПРАВИЛА" />, sfx: [{ name: "whoosh", vol: 0.4 }, { name: "buzz", at: 10, vol: 0.3 }] },
  { who: "timur", text: "Кроме одного. Это импостор, слова он не знает.", screen: (f) => <PhonesRow f={f + 30} word="пицца" impostor="erlan" showImpostor kicker="ИМПОСТОР · ПРАВИЛА" />, sfx: [{ name: "sting", vol: 0.35 }] },
  { who: "timur", text: "Каждый пишет подсказку. Одно слово.", screen: (f) => <ClueInput f={f} clue="Италия" who="timur" sent={2} total={5} /> },
  { who: "timur", text: "Слишком точно: палево. Мимо: подозрительно.", screen: (f) => <ClueBalance f={f} />, sfx: [{ name: "pop", at: 0 }, { name: "pop", at: 16 }, { name: "pop", at: 32 }] },
  {
    who: "timur",
    text: "Потом все голосуют, кто лишний.",
    screen: (f) => (
      <VoteScreen
        f={f}
        kicker="ШАГ 2 · ГОЛОСОВАНИЕ"
        step={9}
        votes={[
          ["amir", "erlan"],
          ["dana", "erlan"],
          ["aliya", "erlan"],
          ["erlan", "dana"],
          ["timur", "erlan"],
        ]}
      />
    ),
    sfx: [0, 1, 2, 3, 4].map((i) => ({ name: "tick", at: 14 + i * 9, vol: 0.5 })),
  },
  { who: "timur", text: "Поймали импостора: всем остальным по очку.", screen: (f) => <ScoreRules f={f} stage={0} />, sfx: [{ name: "ding", vol: 0.4 }] },
  { who: "timur", text: "Не поймали: импостору два.", screen: (f) => <ScoreRules f={f} stage={1} />, sfx: [{ name: "ding", vol: 0.4 }] },
  { who: "timur", text: "А угадает слово, сразу плюс три.", screen: (f) => <ScoreRules f={f} stage={2} />, sfx: [{ name: "ding", vol: 0.4 }] },
  { who: "timur", text: "Пять раундов. Всё.", screen: (f) => <RoundsCard f={f} />, sfx: [{ name: "boing", vol: 0.4 }] },
];

let clock = 0;
const rules: Beat[] = rulesRaw.map((b) => {
  const base = clock;
  clock += beatDuration(b);
  return { ...b, overlay: (f) => <Stopwatch frame={base + f} label="секундомер Даны" /> };
});
const rulesSeconds = Math.floor(clock / 30);

const round: Beat[] = [
  { who: "dana", text: `${rulesSeconds} ${plural(rulesSeconds, ["секунда", "секунды", "секунд"])}.`, emo: { dana: "smug" }, pose: { dana: "phone" }, sfx: [{ name: "ding", vol: 0.5 }] },
  { who: "timur", text: "Я округлил.", emo: { timur: "neutral" } },
  {
    who: "amir",
    text: "Поехали. Раунд первый, смотрим в телефоны.",
    shot: { kind: "wide" },
    emo: { amir: "happy", dana: "neutral", erlan: "neutral", aliya: "neutral", timur: "neutral" },
    pose: { amir: "phone", dana: "phone", erlan: "phone", aliya: "phone", timur: "phone" },
    props: { erlan: null },
    sfx: [{ name: "buzz", at: 30, vol: 0.4 }],
  },
  { dur: 56, screen: (f) => <WordReveal f={f} owner="dana" word="баурсак" />, sfx: [{ name: "whoosh", vol: 0.4 }] },
  { who: "erlan", text: "О-о-о, к чаю бы сейчас…", emo: { erlan: "dreamy" } },
  { who: "dana", text: "Ерлан! Не пали слово.", emo: { dana: "angry" }, look: { dana: "erlan" } },
  { dur: 36, shot: { kind: "close", on: "aliya" }, emo: { aliya: "panic" } },
  { dur: 38, shot: { kind: "close", on: "timur" }, emo: { timur: "smug" }, sfx: [{ name: "glint", at: 8, vol: 0.5 }] },
];

const clues: Beat[] = [
  { who: "amir", text: "Начинаю. Моя подсказка: той.", chip: "ТОЙ", emo: { amir: "happy" }, pose: { amir: "idle", dana: "idle", erlan: "idle", aliya: "idle", timur: "idle" } },
  { who: "dana", text: "Тесто.", chip: "ТЕСТО", emo: { dana: "smug" }, pose: { dana: "hips" } },
  { who: "erlan", text: "Жарят в казане.", chip: "КАЗАН", emo: { erlan: "dreamy" } },
  { who: "aliya", text: "Э-э-э… Круглый? Вкусный! Очень вкусный!", chip: "ВКУСНЫЙ", emo: { aliya: "panic" }, pose: { aliya: "shrug" } },
  { who: "timur", text: "Классика.", chip: "КЛАССИКА", emo: { timur: "smug" }, sfx: [{ name: "glint", at: 12, vol: 0.4 }] },
  { dur: 46, shot: { kind: "wide" }, look: { amir: "aliya", dana: "aliya", erlan: "aliya", timur: "aliya" }, emo: { erlan: "neutral", dana: "angry" }, pose: { aliya: "idle" }, sfx: [{ name: "cricket", vol: 0.4 }] },
  { who: "dana", text: "Алия. «Вкусный»?", pose: { dana: "point" }, shot: { kind: "two", a: "dana", b: "aliya" } },
  { who: "aliya", text: "Я не импостор! Я просто плохо вру!", pose: { aliya: "shrug" }, shake: 8 },
  { who: "erlan", text: "Так все импосторы и говорят.", emo: { erlan: "smug" }, pose: { erlan: "cross" } },
  { who: "amir", text: "Голосуем.", shot: { kind: "wide" }, pose: { amir: "phone", dana: "phone", erlan: "phone", aliya: "phone", timur: "phone" } },
  {
    dur: 84,
    screen: (f) => (
      <VoteScreen
        f={f}
        kicker="РАУНД 1 · ГОЛОСОВАНИЕ"
        votes={[
          ["dana", "aliya"],
          ["erlan", "aliya"],
          ["aliya", "timur"],
          ["amir", "aliya"],
          ["timur", "aliya"],
        ]}
      />
    ),
    sfx: [{ name: "whoosh", vol: 0.4 }, ...[0, 1, 2, 3, 4].map((i) => ({ name: "tick", at: 14 + i * 12, vol: 0.6 }))],
  },
  { who: "amir", text: "Открываю результат.", dur: 72, emo: { amir: "neutral" }, sfx: [{ name: "drumroll", at: 14, vol: 0.7 }] },
  {
    dur: 110,
    screen: (f) => <ResultScreen f={f} word="баурсак" impostor="timur" accused="aliya" crewWin={false} points="+2 Тимуру" />,
    sfx: [{ name: "sting", at: 34, vol: 0.8 }, { name: "tada", at: 72, vol: 0.4 }],
  },
];

const finale: Beat[] = [
  {
    dur: 48,
    shot: { kind: "wide" },
    clearChips: true,
    emo: { amir: "shock", dana: "shock", erlan: "shock", aliya: "shock", timur: "smug" },
    pose: { amir: "idle", dana: "idle", erlan: "idle", aliya: "idle", timur: "glasses" },
    look: { amir: "timur", dana: "timur", erlan: "timur", aliya: "timur" },
    sfx: [{ name: "wahwah", vol: 0.5 }],
  },
  { who: "aliya", text: "Я ЖЕ ГОВОРИЛА!", emo: { aliya: "angry" }, pose: { aliya: "cheer" }, shake: 14 },
  { who: "dana", text: "Ты же сам объяснял правила!", emo: { dana: "angry" }, pose: { dana: "point" }, shot: { kind: "two", a: "dana", b: "timur" }, look: { dana: "timur" } },
  { who: "timur", text: "Поэтому и выиграл.", emo: { timur: "smug" }, pose: { timur: "glasses" }, sfx: [{ name: "glint", at: 6, vol: 0.5 }] },
  { who: "timur", text: "Слово я понял ещё на «казане». Мог угадать и забрать плюс три.", pose: { timur: "idle" } },
  { who: "erlan", text: "Кстати. А баурсаки тут подают?", emo: { erlan: "dreamy", amir: "neutral", aliya: "neutral" } },
  {
    dur: 66,
    shot: { kind: "wide" },
    flags: ["bauyrsak"],
    emo: { amir: "happy", dana: "happy", erlan: "happy", aliya: "happy", timur: "happy" },
    pose: { dana: "idle", aliya: "cheer", erlan: "cheer", timur: "idle" },
    look: { amir: "cam", dana: "cam", erlan: "cam", aliya: "cam", timur: "cam" },
    sfx: [{ name: "ding", at: 10, vol: 0.6 }, { name: "tada", at: 18, vol: 0.4 }],
  },
  { who: "dana", text: "Реванш. Следующую игру объясняю я.", emo: { dana: "smug" }, pose: { dana: "hips", aliya: "idle", erlan: "idle" } },
];

const cafeBeats = [...arrival, ...rules, ...round, ...clues, ...finale];
const cafeInitial = { present: ["amir"] as CastId[], pose: { amir: "phone" as const } };
const roomInitial = { present: ["amir"] as CastId[] };

const COLD = scriptDuration(coldOpen);
const TITLE = 90;
const CAFE_LEN = scriptDuration(cafeBeats);
const OUTRO = 170;

export const E01_DURATION = COLD + TITLE + CAFE_LEN + OUTRO;

export const Episode01: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Series>
      <Series.Sequence durationInFrames={COLD}>
        <DialogueScene spec={ROOM} beats={coldOpen} initial={roomInitial} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={TITLE}>
        <TitleCard season={1} episode={1} title="Кто здесь лишний?" />
        <Audio src={staticFile("sfx/sting.wav")} volume={0.6} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={CAFE_LEN}>
        <DialogueScene spec={CAFE} beats={cafeBeats} initial={cafeInitial} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={OUTRO}>
        <NextEpisode who="dana" game="Alias" cta="Играйте в Импостора со своими" />
        <Sequence from={90} layout="none">
          <Audio src={staticFile("sfx/tada.wav")} volume={0.5} />
        </Sequence>
      </Series.Sequence>
    </Series>
    <Audio src={staticFile("sfx/music.wav")} loop volume={0.1} />
  </AbsoluteFill>
);
