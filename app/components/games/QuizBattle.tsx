"use client";

import { useEffect, useMemo, useState } from "react";
import { useStageGame } from "@/app/components/useStageGame";
import { useControllerGame } from "@/app/components/useControllerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { soundCorrect, soundWrong, soundWin } from "@/lib/audio";
import { confetti } from "@/lib/confetti";

const questionsEn = [
  { question: "What is the capital of Kazakhstan?", options: ["Almaty", "Astana", "Shymkent", "Karaganda"], answer: "Astana" },
  { question: "How many minutes in an hour and a half?", options: ["75", "80", "90", "100"], answer: "90" },
  { question: "What color do you get from blue and yellow?", options: ["Purple", "Orange", "Green", "Pink"], answer: "Green" },
  { question: "What year did the first iPhone come out?", options: ["2005", "2007", "2009", "2011"], answer: "2007" },
  { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "Mars" },
  { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], answer: "7" },
  { question: "Which is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific" },
  { question: "Who wrote Romeo and Juliet?", options: ["Dickens", "Shakespeare", "Twain", "Austen"], answer: "Shakespeare" },
  { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], answer: "Au" },
  { question: "Which country has the largest population?", options: ["USA", "India", "China", "Indonesia"], answer: "India" },
  { question: "What is the tallest mountain in the world?", options: ["K2", "Everest", "Denali", "Kilimanjaro"], answer: "Everest" },
  { question: "How many bones are in the adult human body?", options: ["106", "206", "306", "406"], answer: "206" },
  { question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], answer: "1945" },
  { question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Da Vinci", "Raphael", "Donatello"], answer: "Da Vinci" },
  { question: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Gazelle"], answer: "Cheetah" },
  { question: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], answer: "6" },
  { question: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], answer: "Mercury" },
  { question: "Which language has the most native speakers?", options: ["English", "Spanish", "Mandarin", "Hindi"], answer: "Mandarin" },
  { question: "What is the boiling point of water in Celsius?", options: ["90", "95", "100", "110"], answer: "100" },
  { question: "Which instrument has 88 keys?", options: ["Guitar", "Violin", "Piano", "Organ"], answer: "Piano" },
  { question: "What is the largest mammal on Earth?", options: ["Elephant", "Blue whale", "Giraffe", "Hippo"], answer: "Blue whale" },
  { question: "How many days in a leap year?", options: ["364", "365", "366", "367"], answer: "366" },
  { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican", "San Marino", "Liechtenstein"], answer: "Vatican" },
  { question: "Which year did Kazakhstan gain independence?", options: ["1989", "1990", "1991", "1992"], answer: "1991" },
  { question: "What is the currency of Japan?", options: ["Won", "Yuan", "Yen", "Ringgit"], answer: "Yen" },
  { question: "How many Harry Potter books are there?", options: ["6", "7", "8", "9"], answer: "7" },
  { question: "What is the speed of light approx?", options: ["100k km/s", "200k km/s", "300k km/s", "400k km/s"], answer: "300k km/s" },
  { question: "Which country invented paper?", options: ["India", "Egypt", "China", "Greece"], answer: "China" },
  { question: "What is the largest desert on Earth?", options: ["Sahara", "Gobi", "Antarctic", "Arabian"], answer: "Antarctic" },
  { question: "How many teeth does an adult human have?", options: ["28", "30", "32", "34"], answer: "32" },
  { question: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], answer: "Saturn" },
  { question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: "Nile" },
  { question: "Which element has the symbol Fe?", options: ["Silver", "Iron", "Copper", "Tin"], answer: "Iron" },
  { question: "What year was the first email sent?", options: ["1969", "1971", "1975", "1980"], answer: "1971" },
  { question: "Which country has the most time zones?", options: ["USA", "Russia", "France", "China"], answer: "France" },
  { question: "What is the national sport of Canada?", options: ["Hockey", "Lacrosse", "Curling", "Skiing"], answer: "Lacrosse" },
  { question: "How many elements are in the periodic table?", options: ["98", "108", "118", "128"], answer: "118" },
  { question: "Which animal can sleep for 3 years?", options: ["Bear", "Snail", "Turtle", "Frog"], answer: "Snail" },
  { question: "What is the only letter not in any US state name?", options: ["X", "Q", "Z", "B"], answer: "Q" },
  { question: "How many legs does a lobster have?", options: ["6", "8", "10", "12"], answer: "10" },
  { question: "Which country drinks the most coffee?", options: ["Colombia", "Brazil", "Finland", "Italy"], answer: "Finland" },
  { question: "What is the most spoken language in Africa?", options: ["Swahili", "Arabic", "Hausa", "Amharic"], answer: "Arabic" },
  { question: "Which year was Google founded?", options: ["1996", "1998", "2000", "2002"], answer: "1998" },
  { question: "How many keys on a standard piano?", options: ["76", "88", "92", "108"], answer: "88" },
  { question: "What is the rarest blood type?", options: ["A", "B", "AB", "O"], answer: "AB" },
  { question: "Which planet rotates backwards?", options: ["Mars", "Venus", "Jupiter", "Neptune"], answer: "Venus" },
  { question: "What is the largest organ in the human body?", options: ["Liver", "Brain", "Skin", "Heart"], answer: "Skin" },
  { question: "How many bones does a shark have?", options: ["50", "100", "200", "0"], answer: "0" },
  { question: "Which country has the most islands?", options: ["Indonesia", "Sweden", "Philippines", "Japan"], answer: "Sweden" },
  { question: "What is the most abundant gas in the atmosphere?", options: ["Oxygen", "Nitrogen", "CO2", "Argon"], answer: "Nitrogen" },
  { question: "Which year was the first iPhone released?", options: ["2005", "2007", "2009", "2011"], answer: "2007" },
  { question: "How many hearts does an octopus have?", options: ["1", "2", "3", "4"], answer: "3" },
  { question: "What is the longest bone in the human body?", options: ["Spine", "Femur", "Tibia", "Humerus"], answer: "Femur" },
  { question: "Which country invented pizza?", options: ["France", "Italy", "Spain", "Greece"], answer: "Italy" },
  { question: "How many time zones does Russia have?", options: ["5", "7", "9", "11"], answer: "11" },
  { question: "What is the smallest bird in the world?", options: ["Sparrow", "Hummingbird", "Finch", "Wren"], answer: "Hummingbird" },
  { question: "Which ocean is the deepest?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific" },
  { question: "How many chromosomes do humans have?", options: ["23", "44", "46", "48"], answer: "46" },
  { question: "What is the most popular car color in the world?", options: ["Black", "White", "Silver", "Blue"], answer: "White" },
  { question: "Which country has the most pyramids?", options: ["Egypt", "Mexico", "Sudan", "Peru"], answer: "Sudan" },
  { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Quartz"], answer: "Diamond" },
  { question: "How many stars are on the flag of USA?", options: ["48", "49", "50", "52"], answer: "50" },
  { question: "Which country invented chess?", options: ["China", "India", "Persia", "Greece"], answer: "India" },
  { question: "What is the longest-running TV show?", options: ["Simpsons", "Doctor Who", "SNL", "Coronation Street"], answer: "Coronation Street" },
  { question: "How many millimeters in a centimeter?", options: ["5", "10", "100", "1000"], answer: "10" },
  { question: "Which animal has the longest lifespan?", options: ["Elephant", "Turtle", "Whale", "Bowhead whale"], answer: "Bowhead whale" },
  { question: "What is the most popular programming language?", options: ["Python", "Java", "JS", "C++"], answer: "JS" },
  { question: "Which country has the most UNESCO sites?", options: ["Italy", "China", "Spain", "France"], answer: "Italy" },
  { question: "How many sides does a dodecahedron have?", options: ["6", "8", "10", "12"], answer: "12" },
  { question: "What is the most streamed song on Spotify?", options: ["Blinding Lights", "Shape of You", "Dance Monkey", "Someone Like You"], answer: "Blinding Lights" },
  { question: "Which planet has a Great Red Spot?", options: ["Mars", "Jupiter", "Saturn", "Neptune"], answer: "Jupiter" },
  { question: "What is the most consumed manufactured drink?", options: ["Coffee", "Tea", "Cola", "Beer"], answer: "Tea" },
  { question: "How many official languages does Switzerland have?", options: ["2", "3", "4", "5"], answer: "4" },
  { question: "Which country has the most lakes?", options: ["Finland", "Canada", "Sweden", "Russia"], answer: "Canada" },
  { question: "What is the only mammal that can truly fly?", options: ["Squirrel", "Bat", "Bird", "Pterosaur"], answer: "Bat" },
  { question: "How many rings on the Olympic flag?", options: ["4", "5", "6", "7"], answer: "5" },
  { question: "Which country invented zero as a number?", options: ["Greece", "China", "India", "Arabia"], answer: "India" },
  { question: "What is the most expensive spice by weight?", options: ["Vanilla", "Saffron", "Cardamom", "Cinnamon"], answer: "Saffron" },
  { question: "How many colors in a rainbow?", options: ["5", "6", "7", "8"], answer: "7" },
  { question: "Which animal is the symbol of Australia?", options: ["Koala", "Kangaroo", "Emu", "Platypus"], answer: "Kangaroo" },
  { question: "What is the longest word in English?", options: ["Pneumonoultramicroscopicsilicovolcanoconiosis", "Floccinaucinihilipilification", "Antidisestablishment", "Supercalifragilistic"], answer: "Pneumonoultramicroscopicsilicovolcanoconiosis" },
  { question: "Which country drives on the left side?", options: ["USA", "Germany", "Japan", "Brazil"], answer: "Japan" },
  { question: "How many bones in the human hand?", options: ["17", "22", "27", "32"], answer: "27" },
  { question: "What is the most popular fruit in the world?", options: ["Banana", "Apple", "Tomato", "Mango"], answer: "Tomato" },
  { question: "Which sea has no coasts?", options: ["Red", "Sargasso", "Caspian", "Dead"], answer: "Sargasso" },
  { question: "How many minutes in a week?", options: ["5040", "7200", "10080", "14400"], answer: "10080" },
  { question: "What is the fastest bird?", options: ["Eagle", "Falcon", "Swift", "Ostrich"], answer: "Falcon" },
  { question: "Which country has the most McDonald's?", options: ["USA", "China", "Japan", "Germany"], answer: "USA" },
  { question: "What is the most watched TV show ever?", options: ["Game of Thrones", "Friends", "Breaking Bad", "The Office"], answer: "Friends" },
  { question: "How many keys on a standard keyboard?", options: ["101", "104", "108", "112"], answer: "104" },
  { question: "Which element makes up most of the Sun?", options: ["Helium", "Hydrogen", "Carbon", "Iron"], answer: "Hydrogen" },
  { question: "What is the most common eye color?", options: ["Blue", "Green", "Brown", "Grey"], answer: "Brown" },
  { question: "How many legs does a spider have?", options: ["6", "8", "10", "12"], answer: "8" },
  { question: "Which country has the oldest flag?", options: ["France", "Denmark", "UK", "Sweden"], answer: "Denmark" },
  { question: "What is the most sold book after the Bible?", options: ["Quotations of Mao", "Harry Potter", "LotR", "Don Quixote"], answer: "Quotations of Mao" },
  { question: "How many days does it take for the Earth to orbit the Sun?", options: ["360", "365.25", "370", "355"], answer: "365.25" },
  { question: "Which animal has the most powerful bite?", options: ["Lion", "Crocodile", "Great White", "Hippo"], answer: "Crocodile" },
  { question: "What is the most popular sport in the world?", options: ["Cricket", "Soccer", "Basketball", "Tennis"], answer: "Soccer" },
  { question: "How many zeros in a million?", options: ["4", "5", "6", "7"], answer: "6" },
  { question: "Which country invented paper money?", options: ["China", "Italy", "Persia", "India"], answer: "China" },
  { question: "What is the longest river in Europe?", options: ["Danube", "Rhine", "Volga", "Seine"], answer: "Volga" },
  { question: "How many bones does a baby have at birth?", options: ["206", "256", "270", "300"], answer: "270" },
  { question: "Which planet is known as the Morning Star?", options: ["Mars", "Venus", "Mercury", "Jupiter"], answer: "Venus" },
];

const questionsRu = [
  { question: "Столица Казахстана?", options: ["Алматы", "Астана", "Шымкент", "Караганда"], answer: "Астана" },
  { question: "Сколько минут в полутора часах?", options: ["75", "80", "90", "100"], answer: "90" },
  { question: "Какой цвет получится из синего и жёлтого?", options: ["Фиолетовый", "Оранжевый", "Зелёный", "Розовый"], answer: "Зелёный" },
  { question: "В каком году вышел первый iPhone?", options: ["2005", "2007", "2009", "2011"], answer: "2007" },
  { question: "Какую планету называют Красной?", options: ["Венера", "Марс", "Юпитер", "Сатурн"], answer: "Марс" },
  { question: "Сколько материков на Земле?", options: ["5", "6", "7", "8"], answer: "7" },
  { question: "Какой океан самый большой?", options: ["Атлантический", "Индийский", "Северный Ледовитый", "Тихий"], answer: "Тихий" },
  { question: "Кто написал «Ромео и Джульетту»?", options: ["Диккенс", "Шекспир", "Твен", "Остин"], answer: "Шекспир" },
  { question: "Какой химический символ у золота?", options: ["Go", "Gd", "Au", "Ag"], answer: "Au" },
  { question: "Какая страна самая населённая?", options: ["США", "Индия", "Китай", "Индонезия"], answer: "Индия" },
  { question: "Какая гора самая высокая в мире?", options: ["К2", "Эверест", "Денали", "Килиманджаро"], answer: "Эверест" },
  { question: "Сколько костей у взрослого человека?", options: ["106", "206", "306", "406"], answer: "206" },
  { question: "В каком году закончилась Вторая мировая война?", options: ["1943", "1944", "1945", "1946"], answer: "1945" },
  { question: "Кто написал «Мону Лизу»?", options: ["Микеланджело", "Да Винчи", "Рафаэль", "Донателло"], answer: "Да Винчи" },
  { question: "Какое наземное животное самое быстрое?", options: ["Лев", "Гепард", "Лошадь", "Газель"], answer: "Гепард" },
  { question: "Сколько сторон у шестиугольника?", options: ["5", "6", "7", "8"], answer: "6" },
  { question: "Какая планета ближе всего к Солнцу?", options: ["Венера", "Земля", "Меркурий", "Марс"], answer: "Меркурий" },
  { question: "При какой температуре кипит вода?", options: ["90", "95", "100", "110"], answer: "100" },
  { question: "У какого инструмента 88 клавиш?", options: ["Гитара", "Скрипка", "Фортепиано", "Орган"], answer: "Фортепиано" },
  { question: "В каком году Казахстан получил независимость?", options: ["1989", "1990", "1991", "1992"], answer: "1991" }
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

type QuizState = { index: number; score: number; selected: string };

function QuizBattleStage({ sessionId, partyId, onSave, questions }: { sessionId?: string | null; partyId: string; onSave: (score: number) => void; questions: { question: string; options: string[]; answer: string }[] }) {
  const { t } = useLocale();
  const { state, setState, playerActions, clearActions, complete } = useStageGame<QuizState>(
    sessionId ?? null,
    () => ({ index: 0, score: 0, selected: "" })
  );

  useEffect(() => {
    if (playerActions.length === 0) return;
    for (const a of playerActions) {
      if (a.actionType === "answer") {
        const { option } = a.payload as { option: string };
        setState((prev) => {
          if (prev.selected) return prev;
          const correct = option === questions[prev.index]?.answer;
          return { ...prev, selected: option, score: correct ? prev.score + 1 : prev.score };
        });
      }
    }
    clearActions();
  }, [playerActions, questions, setState, clearActions]);

  function select(option: string) {
    if (state.selected) return;
    const correct = option === questions[state.index].answer;
    setState((prev) => ({ ...prev, selected: option, score: correct ? prev.score + 1 : prev.score }));
    if (correct) soundCorrect(); else soundWrong();
  }

  function next() {
    if (state.index === questions.length - 1) { soundWin(); confetti(); complete(); onSave(state.score); }
    else setState((prev) => ({ ...prev, index: prev.index + 1, selected: "" }));
  }

  const q = questions[state.index % questions.length];

  return <div className="party-game-board game-board-enter"><span className="game-step">{t("quizQuestion")}{state.index + 1}/{questions.length}</span><h3>{q.question}</h3><div className="quiz-options">{q.options.map((option) => <button className={state.selected === option ? (option === q.answer ? "correct" : "wrong") : ""} disabled={Boolean(state.selected)} key={option} onClick={() => select(option)} type="button">{option}</button>)}</div>{state.selected && <p className="quiz-feedback">{state.selected === q.answer ? t("quizCorrect") : `${t("quizWrong")}${q.answer}`}</p>}<div className="game-primary-actions"><button className="demo-action demo-action--lime" disabled={!state.selected} onClick={next} type="button">{state.index === questions.length - 1 ? t("quizFinish") : t("quizNext")}</button></div></div>;
}

function QuizBattleController({ sessionId, questions, total }: { sessionId: string; questions: { question: string; options: string[]; answer: string }[]; total: number }) {
  const { t } = useLocale();
  const { state, sendAction } = useControllerGame<QuizState>(sessionId, { index: 0, score: 0, selected: "" });
  const [answered, setAnswered] = useState("");
  const currentIndex = (state as QuizState).index || 0;

  function select(option: string) {
    if (answered) return;
    setAnswered(option);
    sendAction("answer", { option });
  }

  const q = questions[currentIndex % questions.length];

  return <div className="party-game-board game-board-enter"><span className="game-step">{t("quizQuestion")}{currentIndex + 1}/{total}</span><h3>{q.question}</h3><div className="quiz-options">{q.options.map((option) => <button className={answered === option ? "selected" : ""} disabled={Boolean(answered)} key={option} onClick={() => select(option)} type="button">{option}</button>)}</div>{answered && <p className="controller-answered">{t("quizYouAnswered")}: {answered}</p>}</div>;
}

export default function QuizBattle({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale } = useLocale();
  const shuffled = useMemo(() => shuffle(locale === "ru" ? questionsRu : questionsEn), [locale]);

  if (role === "controller" && sessionId) {
    return <QuizBattleController sessionId={sessionId} questions={shuffled} total={shuffled.length} />;
  }

  return <QuizBattleStage sessionId={sessionId} partyId={partyId} onSave={onSave} questions={shuffled} />;
}
