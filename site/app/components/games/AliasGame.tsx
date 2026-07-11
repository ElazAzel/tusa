"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";
import { useMultiplayerGame } from "@/app/components/useMultiplayerGame";
import { soundCorrect, soundPass, soundWin } from "@/lib/audio";
import { confetti } from "@/lib/confetti";

const wordsEn = [
  "BBQ", "Karaoke", "Crush", "Alarm", "Almaty", "Meme", "Friday", "Door code", "Playlist",
  "Sunset", "Road trip", "Kite", "Trampoline", "Flashlight", "Pancake", "Hammock", "Snorkel",
  "Treasure map", "Hot air balloon", "Igloo", "Tornado", "Lighthouse", "Cactus", "Ferris wheel",
  "Snow globe", "Tattoo", "Robot", "Puzzle", "Rainbow", "Volcano", "Spaceship", "Pirate",
  "Unicorn", "Lava lamp", "Yo-yo", "Telescope", "Popcorn", "Pinwheel", "S'more",
  "Jetski", "Waterfall", "Skyscraper", "Labyrinth", "Safari", "Coral reef", "Trophy",
  "Spaghetti", "Chandelier", "Sled", "Pogo stick", "Glow stick",
  "Bubble", "Kite surfer", "Snowboard", "Scooter", "Drone", "VR headset", "Smartwatch",
  "Earbuds", "Power bank", "Selfie stick", "Tripod", "Gimbal", "Projector", "Speaker",
  "Turntable", "Vinyl", "Cassette", "Polaroid", "Film camera", "Prism", "Binoculars",
  "Microscope", "Compass", "Hourglass", "Barometer", "Thermometer", "Stethoscope",
  "Helicopter", "Submarine", "Zeppelin", "Parachute", "Hang glider", "Skateboard", "Rollerblades",
  "Kayak", "Canoe", "Raft", "Surfboard", "Wakeboard", "Water skis", "Jetpack", "Hoverboard",
  "Slinky", "Frisbee", "Boomerang", "Jump rope", "Hula hoop", "Kendama", "Spinning top",
  "Rubik's cube", "Jigsaw", "Dominoes", "Dice", "Marbles", "Checkers", "Chess", "Backgammon",
  "Badminton", "Croquet", "Bowling", "Darts", "Pool", "Ping pong", "Foam ball", "Nerf gun",
  "Water balloon", "Squirt gun", "Slingshot", "Bubble wand", "Glider", "Paper plane",
  "Pinata", "Confetti", "Streamer", "Party blower", "Disco ball", "String lights",
  "Campfire", "Bonfire", "Torch", "Lantern", "Candle", "Fireworks", "Sparkler", "Glow bracelet",
  "Popcorn machine", "Cotton candy", "Snow cone", "Sundae", "Smoothie", "Lemonade", "Hot cocoa",
  "Marshmallow", "Graham cracker", "Chocolate bar", "Lollipop", "Gumball", "Jellybean", "Licorice",
  "Cupcake", "Donut", "Croissant", "Bagel", "Waffle", "Pancake stack", "French toast", "Omelette",
  "Sushi", "Ramen", "Dim sum", "Taco", "Burrito", "Nachos", "Guacamole", "Paella", "Borscht",
  "Pelmeni", "Blini", "Caviar", "Pickle", "Sauerkraut", "Vareniki", "Chebureki", "Shashlik",
  "Manti", "Lagman", "Plov", "Beshbarmak", "Kurt", "Baursak", "Kazy", "Kumis", "Shubat",
];

const wordsRu = [
  "Шашлык", "Караоке", "Краш", "Будильник", "Алматы", "Мем", "Пятница", "Код от двери", "Плейлист",
  "Закат", "Поездка", "Воздушный змей", "Батут", "Фонарик", "Блин", "Гамак", "Маска для снорклинга",
  "Карта сокровищ", "Воздушный шар", "Иглу", "Торнадо", "Маяк", "Кактус", "Колесо обозрения",
  "Снежный шар", "Татуировка", "Робот", "Пазл", "Радуга", "Вулкан", "Космический корабль", "Пират",
  "Единорог", "Лава-лампа", "Йо-йо", "Телескоп", "Попкорн", "Вертушка", "Зефир",
  "Водопад", "Небоскрёб", "Лабиринт", "Сафари", "Коралловый риф", "Кубок", "Спагетти", "Люстра",
  "Санки", "Светящаяся палочка", "Пузырь", "Сноуборд", "Самокат", "Дрон", "Очки виртуальной реальности",
  "Пауэрбанк", "Селфи-палка", "Штатив", "Проектор", "Колонка", "Винил", "Полароид", "Бинокль",
  "Компас", "Песочные часы", "Термометр", "Вертолёт", "Подводная лодка", "Парашют", "Скейтборд", "Ролики",
  "Каяк", "Сёрфборд", "Водные лыжи", "Джетпак", "Фрисби", "Бумеранг", "Скакалка", "Кубик Рубика",
  "Домино", "Шахматы", "Нарды", "Бадминтон", "Боулинг", "Дартс", "Бильярд", "Пиньята",
  "Конфетти", "Диско-шар", "Гирлянда", "Костёр", "Фейерверк", "Бенгальский огонь", "Лимонад",
  "Круассан", "Суши", "Рамен", "Тако", "Пельмени", "Манты", "Лагман", "Плов", "Бешбармак", "Баурсак"
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

type AliasState = { running: boolean; seconds: number; wordIndex: number; score: number; round: number };

export default function AliasGame({ partyId, sessionId, onSave }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void }) {
  const { locale, t } = useLocale();
  const shuffled = useMemo(() => shuffle(locale === "ru" ? wordsRu : wordsEn), [locale]);
  const { state, setState } = useMultiplayerGame<AliasState>(sessionId ?? null, () => ({ running: false, seconds: 60, wordIndex: 0, score: 0, round: 1 }));
  const { running, seconds, wordIndex, score, round } = state;

  useEffect(() => {
    if (!running || !sessionId) return;
    const timer = setTimeout(() => {
      if (seconds <= 1) { setState((prev) => ({ ...prev, running: false, seconds: 60 })); } else { setState((prev) => ({ ...prev, seconds: prev.seconds - 1 })); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [running, seconds, sessionId, setState]);

  function answer(guessed: boolean) {
    if (!running) return;
    if (guessed) soundCorrect(); else soundPass();
    setState((prev) => ({
      ...prev,
      score: guessed ? prev.score + 1 : prev.score,
      wordIndex: (prev.wordIndex + 1) % shuffled.length,
    }));
  }

  function finish() { soundWin(); confetti(); onSave(score); setState({ running: false, seconds: 60, wordIndex: 0, score: 0, round: round + 1 }); }

  function start() { setState({ running: true, seconds: 60, wordIndex: 0, score: 0, round }); }

  return <div className={`party-game-board alias-board game-board-enter ${running ? "is-running" : ""}`}>
    <span className="game-step">{t("aliasExplain")}</span>
    <div className="alias-timer" aria-label={`${seconds} sec`}>{seconds}<small>{locale === "ru" ? "сек" : "sec"}</small></div>
    <strong className="game-word-pop" key={`word-${wordIndex}`}>{shuffled[wordIndex]}</strong>
    <div className="alias-score" key={`score-${score}`}>{t("aliasScore")}{score}</div>
    <div className="alias-actions">
      <button className="demo-action demo-action--white" disabled={!running} onClick={() => answer(false)} type="button"><span className="material-symbols-rounded">close</span> {t("aliasSkip")}</button>
      <button className="demo-action demo-action--lime" disabled={!running} onClick={() => answer(true)} type="button"><span className="material-symbols-rounded">check</span> {t("aliasGuessed")}</button>
    </div>
    <div className="game-primary-actions">
      <button className="demo-action demo-action--lime" onClick={running ? () => setState((prev) => ({ ...prev, running: false })) : start} type="button">
        <span className="material-symbols-rounded">{running ? "pause" : "play_arrow"}</span>
        {running ? t("aliasPause") : score ? t("aliasContinue") : t("aliasStart")}
      </button>
      <button className="demo-action demo-action--white" disabled={!score} onClick={finish} type="button">
        <span className="material-symbols-rounded">save</span> {t("aliasSave")}
      </button>
    </div>
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}
