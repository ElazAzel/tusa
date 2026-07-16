export type MusicQuizLocale = "ru" | "en";

export type MusicQuizPrompt = {
  answer: string;
  artist: string;
  year: string;
  fact: string;
};

const prompts: Record<MusicQuizLocale, MusicQuizPrompt[]> = {
  en: [
    { answer: "Bohemian Rhapsody", artist: "Queen", year: "1975", fact: "A genre-bending rock epic with several distinct sections.", },
    { answer: "Imagine", artist: "John Lennon", year: "1971", fact: "A piano-led peace anthem from a former Beatle.", },
    { answer: "Billie Jean", artist: "Michael Jackson", year: "1982", fact: "A landmark pop single with an instantly recognisable bassline.", },
    { answer: "Smells Like Teen Spirit", artist: "Nirvana", year: "1991", fact: "A grunge anthem that helped define the early nineties.", },
    { answer: "Hey Jude", artist: "The Beatles", year: "1968", fact: "A seven-minute Beatles singalong named after a child named Julian.", },
    { answer: "Rolling in the Deep", artist: "Adele", year: "2010", fact: "A soul-pop breakthrough built around a dramatic breakup.", },
  ],
  ru: [
    { answer: "Bohemian Rhapsody", artist: "Queen", year: "1975", fact: "Рок-эпос с несколькими разными музыкальными частями.", },
    { answer: "Imagine", artist: "John Lennon", year: "1971", fact: "Фортепианный гимн миру от бывшего участника The Beatles.", },
    { answer: "Billie Jean", artist: "Michael Jackson", year: "1982", fact: "Знаковый поп-сингл с узнаваемой басовой партией.", },
    { answer: "Smells Like Teen Spirit", artist: "Nirvana", year: "1991", fact: "Гранж-гимн, определивший звучание ранних девяностых.", },
    { answer: "Hey Jude", artist: "The Beatles", year: "1968", fact: "Семиминутная песня The Beatles, названная в честь Джулиана.", },
    { answer: "Rolling in the Deep", artist: "Adele", year: "2010", fact: "Прорывной соул-поп хит о драматичном расставании.", },
  ],
};

export function musicQuizPrompt(locale: MusicQuizLocale, round: number): MusicQuizPrompt {
  return prompts[locale][round % prompts[locale].length];
}

export const MUSIC_QUIZ_ROUNDS = 5;
