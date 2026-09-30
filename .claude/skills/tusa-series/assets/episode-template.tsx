import type { Beat } from "../engine";
import { chatBeat, makeEpisode, timedRules, type ChatLine } from "../Episode";
import { CAFE, ROOM } from "../sets";
import { plural } from "../screens";

// Шаблон серии. Скопируй в promo/src/series/episodes/E0N.tsx, замени все TODO,
// поменяй локации и экраны игры, добавь серию в episodes/index.ts.
// Порядок блоков фиксирован каноном: чат → титр → общий план → правила → раунд → развязка → тег → анонс.

const EXPLAINER = "dana" as const;
const TIMER = "timur" as const;

const chat: ChatLine[] = [
  { who: "amir", text: "TODO повод встречи", x: 60, y: 180, r: -3 },
  { who: "erlan", text: "TODO", x: 420, y: 320, r: 3 },
  { who: "aliya", text: "TODO", x: 90, y: 460, r: -2 },
];

const coldOpen: Beat[] = [
  chatBeat(chat, { dur: 70, shot: { kind: "close", on: "amir", zoom: 1.25 }, emo: { amir: "neutral" }, pose: { amir: "phone" }, sfx: [{ name: "buzz", vol: 0.5 }] }),
  { who: "amir", text: "TODO реакция хоста", emo: { amir: "smug" }, pose: { amir: "idle" } },
];

const setup: Beat[] = [
  { dur: 60, shot: { kind: "wide" }, caption: "TODO Место. День, время" },
  { who: "amir", text: "TODO Сегодня играем в … Кто объясняет?" },
  { who: EXPLAINER, text: "TODO обещание уложиться во время", emo: { [EXPLAINER]: "smug" } },
  { who: TIMER, text: "Засекаю.", pose: { [TIMER]: "phone" }, sfx: [{ name: "tick", at: 20, vol: 0.6 }] },
];

const rulesRaw: Beat[] = [
  { who: EXPLAINER, text: "TODO правило 1", screen: () => null, sfx: [{ name: "whoosh", vol: 0.4 }] },
  { who: EXPLAINER, text: "TODO правило 2", screen: () => null },
  { who: EXPLAINER, text: "TODO очки", screen: () => null, sfx: [{ name: "ding", vol: 0.4 }] },
];

const { beats: rules, seconds } = timedRules(rulesRaw, TIMER);

const round: Beat[] = [
  { who: TIMER, text: `${seconds} ${plural(seconds, ["секунда", "секунды", "секунд"])}.`, emo: { [TIMER]: "smug" }, sfx: [{ name: "ding", vol: 0.5 }] },
  { who: EXPLAINER, text: "TODO ответ на время" },
  { who: "amir", text: "Поехали. Раунд первый.", shot: { kind: "wide" }, sfx: [{ name: "buzz", at: 20, vol: 0.4 }] },
  { dur: 60, screen: () => null, sfx: [{ name: "whoosh", vol: 0.4 }] },
];

const reveal: Beat[] = [
  { dur: 70, screen: () => null, sfx: [{ name: "drumroll", vol: 0.7 }] },
  { dur: 45, shot: { kind: "wide" }, clearChips: true, emo: { amir: "shock", dana: "shock", erlan: "shock", aliya: "shock", timur: "shock" }, sfx: [{ name: "sting", vol: 0.6 }] },
  { who: "dana", text: "TODO реакция", emo: { amir: "neutral", dana: "angry", erlan: "neutral", aliya: "neutral", timur: "neutral" } },
];

const tag: Beat[] = [
  { who: "erlan", text: "TODO бытовая шутка и отсылка к прошлой серии" },
  { who: "erlan", text: "TODO крючок на следующую серию", emo: { erlan: "smug" } },
];

export const E0N = makeEpisode({
  season: 1,
  episode: 0,
  title: "TODO Название-вопрос?",
  explainer: EXPLAINER,
  games: ["TODO"],
  cold: { spec: ROOM, beats: coldOpen, initial: { present: ["amir"] } },
  scenes: [{ spec: CAFE, beats: [...setup, ...rules, ...round, ...reveal, ...tag], initial: { present: ["amir", "dana", "erlan", "aliya", "timur"] } }],
  next: { who: "erlan", game: "TODO" },
  cta: "Играйте в TODO со своими",
});
