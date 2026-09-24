import { MUSIC_QUIZ_BANK } from "./content/music";
import { deckItem, type ContentDeck } from "./content-deck";

export type MusicQuizLocale = "ru" | "en";

export type MusicQuizPrompt = {
  answer: string;
  artist: string;
  year: string;
  fact: string;
};

const pools: Record<MusicQuizLocale, typeof MUSIC_QUIZ_BANK> = {
  ru: MUSIC_QUIZ_BANK.filter((entry) => entry.locales.includes("ru")),
  en: MUSIC_QUIZ_BANK.filter((entry) => entry.locales.includes("en")),
};

export function musicQuizPoolSize(locale: MusicQuizLocale) {
  return pools[locale].length;
}

export function musicQuizPrompt(locale: MusicQuizLocale, round: number, deck: ContentDeck = { deckSeed: "default:music", deckStart: 0 }): MusicQuizPrompt {
  const entry = deckItem(pools[locale], deck, round);
  return { answer: entry.answer, artist: entry.artist, year: entry.year, fact: entry.fact[locale] };
}

export const MUSIC_QUIZ_ROUNDS = 5;
