# Движок серии: шпаргалка

Всё, что нужно, чтобы написать сценарий в коде. Исходники: `promo/src/series/engine.tsx`, `Episode.tsx`, `screens.tsx`.

## makeEpisode

```ts
export const E02 = makeEpisode({
  season: 1,
  episode: 2,
  title: "Название-вопрос",
  explainer: "dana",
  games: ["alias"],
  cold: { spec: ROOM, beats: coldOpen, initial: { present: ["amir"] } },
  scenes: [{ spec: CAFE, beats: mainBeats, initial: { present: ["amir"] } }],
  next: { who: "erlan", game: "Угадай песню" },
  cta: "Играйте в Alias со своими",
});
```

Каркас сам собирает: открытие → титр (90 кадров) → сцены → анонс (170 кадров) и кладёт музыку. `id` композиции будет `TusaS01E02`. После создания добавь серию в `episodes/index.ts`.

## Реплика (Beat)

Сцена состоит из массива реплик. Длительность считается сама из длины текста (около 16 знаков в секунду, от 42 до 140 кадров) или задаётся `dur`.

| Поле | Тип | Что делает |
|---|---|---|
| `who` | `CastId` | кто говорит: субтитр, рот, голос, камера на нём |
| `text` | `string` | субтитр, до 70 знаков |
| `dur` | кадры | фиксированная длительность, для реплик без текста обязательно |
| `shot` | `Shot` | камера, по умолчанию крупный план `who` или общий план |
| `emo` | `{ id: Emotion }` | эмоции, сохраняются до следующей смены |
| `pose` | `{ id: Pose }` | позы, сохраняются |
| `props` | `{ id: Prop \| null }` | предметы (`phone`, `coals`), сохраняются |
| `look` | `{ id: CastId \| "cam" }` | куда смотрит герой только в этой реплике. По умолчанию все смотрят на говорящего |
| `chip` | `string` | подсказка над головой `who`, остаётся до `clearChips` |
| `clearChips` | `boolean` | убрать все подсказки |
| `arrive` | `CastId[]` | герой выезжает сбоку и приземляется, до этого его нет |
| `caption` | `string` | лаймовая подпись сверху |
| `sfx` | `{ name, at?, vol? }[]` | звуки, `at` в кадрах от начала реплики |
| `shake` | число | тряска камеры |
| `screen` | `(f, dur) => node` | вставка на весь экран вместо сцены. С `who` субтитр становится голосом за кадром с аватаром |
| `overlay` | `(f, dur) => node` | слой поверх сцены (чат, секундомер) |
| `flags` | `string[]` | событие для локации, например `bauyrsak` вызывает тарелку. Локация читает `flags[name]` как кадр начала |

Эмоции и позы накапливаются. После большой реакции верни героев в `neutral` и `idle`, иначе шок останется до конца сцены.

## Камера (Shot)

| Значение | Когда |
|---|---|
| `{ kind: "wide" }` | общий план |
| `{ kind: "close", on: "dana", zoom?: 1.45 }` | крупный план, `zoom` 1.2–1.7 |
| `{ kind: "two", a: "dana", b: "timur" }` | двое в кадре |
| `{ kind: "custom", x, y, s }` | ручная камера в координатах мира |

## Хелперы из Episode.tsx

- `chatBeat(lines, beat, step = 8, start = 6)`: реплика с пузырями чата и звуком `msg` на каждом. `lines`: `{ who, text, x, y, r }`, x и y в пикселях экрана, пузыри сверху вниз с шагом около 140 px.
- `introCard(who, index, emotion, pose)`: карточка «Знакомьтесь», 66 кадров.
- `timedRules(beats, timer)`: оборачивает реплики правил секундомером героя `timer` и возвращает `{ beats, seconds }`. `seconds` подставляй в реплику после правил, так шутка про время всегда честная. Для слова «секунд» есть `plural(n, ["секунда", "секунды", "секунд"])` из `screens.tsx`.

## Общие экраны (screens.tsx)

`IntroCard`, `TitleCard`, `NextEpisode`, `ChatBubble`, `MiniPhone`, `Stopwatch`, `Halftone`, `plural`. Обычно их вызывают хелперы и каркас, напрямую нужен только `MiniPhone` для своих вставок.

## Экраны игр

Образец: `games/impostor.tsx`. Внутри `Backdrop`, `Kicker`, `Head`, `GameTop`, `SecretCard` и готовые экраны `PhonesRow`, `ClueInput`, `ClueBalance`, `VoteScreen`, `ScoreRules`, `RoundsCard`, `WordReveal`, `ResultScreen`. Для новой игры сделай `games/<game>.tsx`. Если тебе нужны те же `Backdrop`, `Kicker`, `Head`, `GameTop`, вынеси их в общий `games/ui.tsx` и импортируй в обоих файлах. Копия со своими цветами размоет стиль.

## Локация (SceneSpec)

```ts
export const PARK: SceneSpec = {
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
  Back: ParkBack,
  Middle: ParkBench,
  ambience: { name: "crowd", vol: 0.1 },
};
```

`Back`, `Middle` и `Front` получают `{ frame, flags }` и рисуют SVG размером с мир. Героев движок ставит между `Back` и `Middle` (задний ряд) и между `Middle` и `Front` (передний).

## Звуки

`msg`, `buzz`, `pop`, `boing`, `whoosh`, `tick`, `ding`, `drumroll`, `sting`, `tada`, `wahwah`, `cricket`, `glint`, фоны `crowd`, `music`, голоса `voice-<id>`. Что за каким событием закреплено, смотри в `visual-bible.md`.
