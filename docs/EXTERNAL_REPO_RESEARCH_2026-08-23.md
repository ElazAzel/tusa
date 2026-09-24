# Внешнее исследование: 151 репозиторий на пользу TUSA.game

> 23.08.2026 · research-only · источник: майнинг 4 кураторских списков + 8 глубоких разборов исходников
> Методика: awesome-nextjs, awesome-react, awesome-typescript, awesome-open-source-games + точечные заходы в Jackbox-клоны, Neon/Vercel примеры, security/a11y/testing инструменты
> Итог: **151 различный репозиторий** просмотрен, из них 8 разобраны по коду/докам

---

## 1. Игры и realtime (lib/live.ts, Stage/Controller хуки)

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `nickavv/free-radish-client` | Таксономия ошибок входа (`ERROR_INVALID_ROOM`, `ERROR_NAME_TAKEN`) и флаг `vip` хоста в `PLAYER_JOINED` — для join-flow PartyRoom | S | сейчас |
| `fanout/reconnecting-eventsource` | Экспоненциальный backoff + jitter + бюджет ~3 попыток вместо плоского 3s retry; резюм через Last-Event-ID | S | сейчас |
| `neondatabase/examples` | Рецепты `with-realtime-sse/chat`: keepalive-комментарии и очистка через `req.signal` в `/api/live` | S | сейчас |
| `lipp/jet-chat` | SSE-only чат без WebSocket: валидация архитектуры, обработка backpressure | M | дальше |
| `playpip/pip-web` | PWA-карточная игра с QR/tablet flow: референс офлайн-терпимого контроллера | M | дальше |
| `socketio/socket.io`, `ably/ably-js` | Decision-record: почему SSE-first с Ably fallback; закрывает спор «почему не сокеты» | S | дальше |
| `wolfcha` | Next.js + LLM «Мафия»: blueprint для AI-модерации social deduction режима | M | потом |
| `yiliansource/party-js` | Конфетти-движок: сравнить с lib/confetti.ts перед вложениями в кастомный canvas | S | потом |
| Jackbox-клоны (`imdarkmode/jackbox_server`, `tomalama/hackbox`, `redparty`, `songup`) | UX комнатных кодов и QR-джойна | S | потом |
| `ornicar/lila` (lichess) | Пэйринг/Elo для турниров — тяжело, только как идея | L | потом |

Прочий каталог: `mozilla/BrowserQuest`, `untrusted`, `2048`, `Hextris`, `binb`, `Couchfriends/*`, `excaliburjs/Excalibur` и др.

## 2. Безопасность (proxy.ts, guest-session, raw SQL)

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `vercel/next.js` `with-strict-csp` | Nonce-CSP (`strict-dynamic`, dev-only `unsafe-eval`) в proxy.ts + next.config.ts; matcher исключения `/api`, `_next/*`. Ключевой факт: в Next.js 16 middleware переименован в Proxy — наш proxy.ts уже на новой модели | M | сейчас |
| `upstash/ratelimit` | GA-поверхность: `slidingWindow(10,"10s")`, MultiRegion CRDT, динамические лимиты, `{rate}` cost, `waitUntil(pending)` — убрать молчаливый in-memory fallback в проде | S | сейчас |
| `colinhacks/zod` | Довести Zod до КАЖДОГО SDK-action payload (сейчас строгая валидация не везде) | S | сейчас |
| `nextauthjs/next-auth` | Вход в P0-решение по провайдеру: аккаунты на Auth.js, гости остаются HMAC | M | сейчас |
| `jawj/zapatos` | Типизированный слой максимально близкий к raw SQL — типы для lib/parties.ts без миграции на Drizzle | M | дальше |
| `vercel/ai-chatbot` | Референс Neon + Auth.js + стриминговый чат: паттерны миграций и ревокации сессий | M | дальше |
| `Blazity/next-enterprise` | Структура CI-гейтов (typecheck → lint → test → build → audit) | S | дальше |
| `kysely/kysely` | Второй кандидат typed-SQL после zapatos | M | потом |
| `unkeyed/unkey`, `arcjet/js` | Альтернативы rate-limit; у Arcjet нет free tier — держим Upstash | S | потом |
| `flightcontrolhq/superjson` | Если в SSE-полезной нагрузке появятся Date/Map | S | потом |
| `trpc/trpc` | Отклонено: 46 REST-роутов + OpenAPI-планы важнее RPC-связности | S | решение |

## 3. Доступность

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `focus-trap/focus-trap-react` | Обёртка для всех оверлеев PartyRoom (auto-activate/unmount); React 19 — propTypes выпилены, прокидывать пропсы напрямую. Сейчас у нас собственный trapTab-хендлер — сравнить и при росте сложности заменить | S | сейчас |
| `brunopulis/awesome-a11y` | Хаб чеклистов под наши mobile-first правила | S | дальше |
| `radix-ui/primitives` | Dialog/Popover примитивы, если какой-то кастомный оверлей не доводится до SR-корректности | M | потом |

## 4. Производительность

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `bvaughn/react-window`, `TanStack/virtual` | Виртуализация чата и сетки 32 игр; целевое устройство — слабые телефоны контроллеров | S | дальше |
| `biomejs/biome` | Единый lint+format взамен ESLint-цепочки; ждать зрелости интеграции с Next 16 | M | потом |
| `facebook/react` | Следить за React Compiler: стоимость ре-рендеров Stage растёт с числом игроков | S | потом |

## 5. Тестирование (61 тест, e2e не установлен)

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `microsoft/playwright` | Один тест = три контекста (stage + 2 контроллера) через реальный SSE — защищает весь Stage/Controller контракт | M | сейчас |
| `dubzzz/fast-check` | Property-тесты engine.ts: монотонность version lock, отсутствие двойного применения action, консистентность скоринга | M | дальше |
| `mswjs/msw` | Моки SSE и /api/games для тестов reconnect/backoff путей | M | дальше |

## 6. i18n

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `UnlyEd/universal-language-detector` | Accept-Language/cookie детект для i18n-роутинга в proxy.ts | S | дальше |
| `ilyautov/humanizer-ru` | Локальная копия == upstream v3.16.1 (проверено). Держим pinned; весь новый RU-текст через каталог | S | готово |
| `amannn/next-intl` | Только если плоские ключи lib/i18n.ts перестанут справляться (ICU-множественные) | M | потом |

## 7. SEO / GEO

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `garmeeh/next-seo` | JSON-LD `VideoGame` на app/games/[slug]: playMode, numberOfPlayers, gamePlatform, aggregateRating | S | сейчас |
| `iamvishnusankar/next-sitemap` | Sitemap на все программные use-cases/* страницы в build | S | сейчас |
| llmstxt.org (спека v2) | `.md`-версии ключевых страниц, `rel="alternate" type="text/markdown"`, Link-заголовки `describedby`; Lighthouse уже аудирует llms.txt | M | дальше |

## 8. PWA

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `GoogleChrome/workbox` | `setCatchHandler()` + прогрев offline-fallback кэша в install; NavigationRoute фоллбек для глубоких ссылок `/party/*` | M | дальше |
| `shadowwalker/next-pwa` (+ форк `ducanh2912`) | Генератор SW для статики; обязательно исключить `/api/live` из кэша | M | потом |

## 9. Деплой и платформа

| Репозиторий | Что взять | Труд | Приоритет |
|---|---|---|---|
| `vercel/examples` | Cron-шаблоны для GC устаревших сессий против Neon parties | S | дальше |
| `partykit/partykit` | Edge-комнаты при всплеске стоимости Ably/SSE fan-out; прототип только | L | потом |
| `vercel/turborepo` | Актуально лишь при разделении на пакеты site/engine/sdk | S | потом |

## Кросс-доменный обзор (из awesome-react/typescript README)

Состояние/данные (19): redux, redux-toolkit, mobx, zustand, jotai, valtio, xstate, TanStack query/router/table/form, swr, immer, react-use, usehooks, axios, date-fns, dayjs, lodash
UI (24): mui, chakra, mantine, ant-design, shadcn/ui, tailwind, headlessui, styled-components, emotion, framer-motion, react-three-fiber, drei, visx, recharts, dnd-kit, react-beautiful-dnd, downshift, floating-ui, react-select, classnames, clsx, react-icons, react-toastify, embla-carousel
Формы/фреймворки/мета (17): react-hook-form, formik, final-form, remix, gatsby, astro, preact, million, vercel/commerce, supabase, appwrite, pocketbase, react-markdown, openai-node, posthog, umami, CopilotKit
TS-экосистема (11): TypeScript, DefinitelyTyped, typescript-eslint, type-challenges, typescript-book, nest, hono, fp-ts, type-fest, ts-essentials, utility-types

**Подсчёт:** 25+25+5+6+7+5+2+3+4+19+24+17+11 − 4 двойных списка = **151 репозиторий**

---

## Top-10 «делать следующими»

1. Порт `with-strict-csp` в proxy.ts + next.config.ts — закрывает A02-разрыв CSP (nonce вместо unsafe-inline) *(M · security)*
2. Upstash sliding windows по семействам роутов в proxy.ts c `waitUntil(pending)` — конец молчаливого in-memory fallback *(S · security)*
3. Харденинг reconnect в useLiveStream: backoff+jitter+бюджет ~3, Last-Event-ID resume, abort-cleanup в /api/live *(S · realtime)*
4. Первый Playwright e2e: три контекста (stage + 2 контроллера) через реальную сессию *(M · testing)*
5. fast-check property-набор на lib/games/engine.ts *(M · testing)*
6. focus-trap-react во всех оверлеях + eslint-plugin-jsx-a11y в гейт *(S · a11y)*
7. Таксономия ошибок join-flow из free-radish: INVALID_ROOM / NAME_TAKEN + vip-флаг хоста *(S · games)*
8. SEO-день: JSON-LD VideoGame на страницах игр + next-sitemap на use-cases/* *(S · seo)*
9. Апгрейд llms.txt до v2: .md-альтернативы + rel="alternate"/describedby заголовки *(M · geo)*
10. Workbox setCatchHandler офлайн-фоллбек с прогревом offline.html *(M · pwa)*

## Замены и пробелы

| Проблема | Решение |
|---|---|
| awesome-react raw 404 | Взята HTML-страница GitHub |
| awesome-typescript архивирован (2026) | Снимок исторический, записи валидны |
| workbox advanced-recipes 404 | Заменено web.dev/learn/pwa/workbox |
| Канонический awesome-pwa не получен | PWA-раздел опирается на Workbox + next-pwa |
| Whitepaper Ably не скачался | База: ably-js доки + Next.js 16 realtime статья |
