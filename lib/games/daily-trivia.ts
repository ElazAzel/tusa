export type DailyTriviaQuestion = { id: string; prompt: { ru: string; en: string }; options: { ru: string[]; en: string[] }; correct: number };

export const DAILY_TRIVIA: DailyTriviaQuestion[] = [
  { id: "q1", prompt: { ru: "Какой океан самый большой?", en: "Which ocean is the largest?" }, options: { ru: ["Атлантический", "Тихий", "Индийский", "Северный Ледовитый"], en: ["Atlantic", "Pacific", "Indian", "Arctic"] }, correct: 1 },
  { id: "q2", prompt: { ru: "Сколько минут в двух часах?", en: "How many minutes are in two hours?" }, options: { ru: ["60", "90", "120", "180"], en: ["60", "90", "120", "180"] }, correct: 2 },
  { id: "q3", prompt: { ru: "Столица Японии?", en: "What is the capital of Japan?" }, options: { ru: ["Киото", "Осака", "Токио", "Саппоро"], en: ["Kyoto", "Osaka", "Tokyo", "Sapporo"] }, correct: 2 },
  { id: "q4", prompt: { ru: "Какой цвет получится из синего и жёлтого?", en: "What color do blue and yellow make?" }, options: { ru: ["Зелёный", "Фиолетовый", "Оранжевый", "Красный"], en: ["Green", "Purple", "Orange", "Red"] }, correct: 0 },
  { id: "q5", prompt: { ru: "Сколько сторон у шестиугольника?", en: "How many sides does a hexagon have?" }, options: { ru: ["5", "6", "7", "8"], en: ["5", "6", "7", "8"] }, correct: 1 },
  { id: "q6", prompt: { ru: "Какая планета ближе всего к Солнцу?", en: "Which planet is closest to the Sun?" }, options: { ru: ["Венера", "Марс", "Меркурий", "Земля"], en: ["Venus", "Mars", "Mercury", "Earth"] }, correct: 2 },
  { id: "q7", prompt: { ru: "Какой газ нужен человеку для дыхания?", en: "Which gas do humans need to breathe?" }, options: { ru: ["Азот", "Кислород", "Гелий", "Водород"], en: ["Nitrogen", "Oxygen", "Helium", "Hydrogen"] }, correct: 1 },
];

export function dailyQuestionIds(date: string, count = 5) {
  const seed = [...date].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: Math.min(count, DAILY_TRIVIA.length) }, (_, index) => DAILY_TRIVIA[(seed + index * 3) % DAILY_TRIVIA.length].id);
}

export function publicDailyQuestions(ids: string[]) {
  return ids.flatMap((id) => { const question = DAILY_TRIVIA.find((item) => item.id === id); return question ? [{ id: question.id, prompt: question.prompt, options: question.options }] : []; });
}

export function scoreDailyAnswers(ids: string[], answers: Array<{ questionId: string; answer: number }>) {
  const allowed = new Set(ids);
  const unique = new Map(answers.filter((answer) => allowed.has(answer.questionId)).map((answer) => [answer.questionId, answer.answer]));
  return ids.reduce((score, id) => score + (DAILY_TRIVIA.find((question) => question.id === id)?.correct === unique.get(id) ? 100 : 0), 0);
}
