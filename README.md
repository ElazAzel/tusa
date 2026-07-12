# TUSA.game

Твоя туса. Твои правила: одна ссылка для гостей, игр, покупок, фотографий, чата и KOINS.

## Что готово

- адаптивный лендинг в визуальной системе TUSA.game (Unbounded + Inter + JetBrains Mono);
- официальные длинный и компактный логотипы (`public/brand/`);
- local-first платформа встречи на `/demo` с несколькими ивентами;
- Event Hub: создание, редактирование, дублирование, удаление, RSVP, роли, заметки, QR и Blast;
- **28 multiplayer-игр** с архитектурой Stage+Controller (хост = stage, игроки = controllers);
- покупки с защитой от дублей, назначением покупателя, ценами и расчётом сплита;
- чат с тредами, реакциями, закрепами, удалением, голосовыми сообщениями и стикерами;
- KOINS с пулами, odds, ставками, расчётом исхода и журналом транзакций;
- галерея с bulk upload, сжатием, тегами, обложкой, FlashBack и recap;
- профиль с VibeScore, streak, лигами, 60 типами бейджей, рамкой и экспортом данных;
- приглашение через Web Share, копирование ссылки и синхронизация между вкладками;
- **i18n** — полная локализация RU/EN для всех компонентов и игр;
- **SSE real-time** для multiplayer-сессий (совместимо с Vercel serverless);
- **аудио/визуальные эффекты** — Web Audio API синтезатор звуков + Canvas confetti;
- PWA-манифест, service worker и offline-экран;
- SEO/Open Graph metadata, 404 и мобильная навигация;
- **бренд-бук** (`tusa-style-guide-v1.4.html`): 3px black border, shadow offset, translate on hover.

## 28 игровых режимов

| # | Режим | Механика |
|---:|---|---|
| 1 | Alias / Word Blast | Таймер, pass/correct, Stage+Controller |
| 2 | Mafia Lite | Приватные роли, night actions, day vote |
| 3 | Werewolf / One Night | Mafia, Doctor, Seer + night timeout |
| 4 | Codenames | 4x4 board, spymaster clues, team guesses |
| 5 | Spyfall | Private location/spy role, vote |
| 6 | Impostor | Private word, bluff and vote |
| 7 | Crocodil / Mime Riot | Team mime, streak bonus, timer |
| 8 | Heads Up | Private card, gesture guessing |
| 9 | Quiplash | Anonymous answers, vote |
| 10 | Fibbage | Decoy answers, truth reveal |
| 11 | Truth or Dare | Mode switch, counter |
| 12 | Never Have I Ever | Private response, aggregate |
| 13 | Would You Rather | Poll, 12 prompts |
| 14 | Two Truths and a Lie | Lie detection |
| 15 | Blank Slate | Word matching |
| 16 | Wavelength | Scale spectrum guessing |
| 17 | Brain Burst | Kahoot-style timed quiz |
| 18 | Guess the Song | Progressive clue music quiz |
| 19 | Bomb Party | Hot-potato word timer |
| 20 | Bunker | Argument + elimination |
| 21 | Wheel of Fate | SVG spinning wheel |
| 22 | Kiss / Marry / Kill | Social vote |
| 23 | Charades | Mime guessing |
| 24 | Trivia | 12-question general knowledge |
| 25 | Beer Pong | Score tracker |
| 26 | Random Pair | Random partner generator |
| 27 | Uno Tracker | Card score tracker |
| 28 | Quiz Battle | Multiplayer quiz (was Quiz component) |

## Архитектура

- **Next.js 16** App Router + Turbopack
- **React 19** + TypeScript
- **CSS-дизайн-система** — переменные `--lime`, `--blue`, `--pink`, brutal shadows, без runtime UI-зависимостей
- **Clerk** — авторизация (Google, Apple)
- **Neon Postgres** — БД через `@neondatabase/serverless`
- **SSE** через `/api/live` — real-time для multiplayer
- **Stage+Controller** — `useStageGame`, `useControllerGame`, `useMultiplayerGame` generic hooks
- **Web Audio API** — синтезированные звуки (без внешних файлов)
- **Canvas 2D** — confetti без зависимостей
- **localStorage** + `storage` events для local-first состояния и синхронизации вкладок
- **Vercel** для production hosting (elazazels-projects/tusagame)

## Запуск

Требуется Node.js 20.9 или новее.

```bash
npm install
npm run dev
```

Проверки перед публикацией:

```bash
npm run lint
npm run build
```

## Деплой

```bash
vercel --prod
```

GitHub: `https://github.com/ElazAzel/tusa` — branch `main` only.
Production: `https://tusa.game`

## Аккаунты и промодоступ

- `/sign-in` и `/sign-up` — авторизация через Clerk;
- `/app` — серверный профиль пользователя, созданные и добавленные тусы;
- `/app/new` — создание тусы через промокод. Предзагружены коды `ELAZ`, `JEDAI`, `TUSA02`;
- `/join/[inviteCode]` — защищённое присоединение к тусе;
- `/admin/promos` — защищённая админ-консоль промокодов.

## Текущие ограничения

- Stripe оплата — нужен Stripe account + webhook endpoint;
- Push notifications — нужны VAPID keys + service worker handler;
- Self-serve рекламная платформа — нужна команда модерации (v3+);
- Neon cold starts — `ensurePartySchema()` оптимизирован (1 SELECT вместо 48 DDL при warm start);
- UnoTracker — локальный useState вместо `useMultiplayerGame`.
