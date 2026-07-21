# Генеральный план доведения TUSA.game до полной функциональной готовности

> **Актуализировано: 19.07.2026.** Current implementation checkpoint: `docs/IMPLEMENTATION_STATUS_2026-07-19.md`. Этот план описывает target; shipped/gap/pre-implementation определяются текущим checkpoint и `docs/DOCUMENTATION_GOVERNANCE_2026-07-19.md`.

## 1. Цель, исходное состояние и критерии финиша

### Конечная цель

TUSA.game становится коммерчески готовой международной browser-first платформой для игровых тусовок:

- хост создаёт тусу и делится одной ссылкой;
- гости могут войти без обязательной регистрации;
- все участники играют одновременно со своих устройств;
- состояние восстанавливается после закрытия вкладки, смены сети и перезагрузки;
- 32 существующих режима имеют завершённые игровые циклы;
- RU и EN полностью локализованы;
- интерфейс работает от 320 px до планшета, десктопа и общего TV-экрана;
- админка управляет пользователями, ролями, промокодами, контентом, рекламой, аналитикой и модерацией;
- RAG, SEO/GEO/AEO и AI-видимость работают как производственные системы;
- продукт покрыт CI, мониторингом, юридическими документами и эксплуатационными регламентами.

### Проверенный baseline

- Production build проходит.
- ESLint: 30 ошибок и 111 предупреждений.
- 32 игровых компонента, хотя документация и интерфейс местами говорят о 28 или 8 играх.
- Заменить in-memory event bus на Ably Channels.
- Neon остаётся источником истины; Ably отвечает за доставку событий, presence и reconnect.
- Клиент получает краткоживущий realtime token только после проверки доступа к party/session.
- Убрать постоянный polling 1,2 секунды.
- Snapshot запрашивается при первом входе, reconnect, version gap и конфликте.
- События получают `eventId`, `sessionId`, `version`, `occurredAt`, `actorId`, `idempotencyKey`.
- Поддержать resume по последнему event/version и автоматическую полную синхронизацию при пропуске событий.
- Ввести heartbeat, reconnect backoff с jitter и видимый offline/reconnecting state.
- Зафиксировать лимиты payload; рисунки и крупные медиа не передавать в полном snapshot.

#### Rate limiting и защита API

- Перенести rate limits в Upstash Redis.
- Ключи: route + user/guest + IP + party + action type.
- Разделить лимиты чтения, чата, игровых команд, загрузок и admin API.
- Нормализовать trusted proxy IP.
- Добавить Zod-схемы на query, body, params и server responses.
- На каждом действии проверять authentication, party membership, session membership, role, phase, action type и payload.
- Удалить возможность произвольной публикации в любой live channel.
- Использовать CSRF-защиту, строгий CORS allowlist и idempotency keys.
- В production CSP перейти на nonce, убрать `unsafe-eval`, ограничить Clerk production domains, добавить `frame-ancestors`, `object-src`, `base-uri`, `form-action`.
- Подключить production Clerk keys и custom auth domain; development keys не допускаются на production.

#### Наблюдаемость

- Подключить Sentry для server/client errors и source maps.
- Подключить Vercel Web Analytics, Speed Insights и OpenTelemetry.
- Структурированные логи содержат request ID, party ID, session ID и event ID, но не содержат приватный контент.
- Алерты: рост 5xx, потерянные команды, reconnect storm, p95 latency, DB saturation, upload failures, payment webhook failures.
- Создать status page и runbooks для auth, realtime, DB, storage, payments и deployment rollback.

### Этап 2 — server-authoritative multiplayer engine

#### Новая модель

Клиент больше не отправляет полный state или готовый score. Он отправляет намерение:

```ts
interface GameCommand {
  commandId: string;
  sessionId: string;
  gameId: GameId;
  type: string;
  payload: unknown;
  expectedVersion: number;
}
```

Сервер:

1. проверяет пользователя или guest session;
2. проверяет участника, роль, фазу и доступность команды;
3. валидирует payload;
4. применяет game reducer;
5. вычисляет score, награды и переход фазы;
6. сохраняет event и новый snapshot транзакционно;
7. публикует публичное или персональное представление state.

Основные типы:

```ts
interface GameDefinition {
  id: GameId;
  slug: string;
  category: "full_game" | "quick_tool" | "experimental";
  minPlayers: number;
  maxPlayers: number;
  ageRating: "kids" | "teen" | "adult";
  supportedLocales: Locale[];
  phases: string[];
  capabilities: GameCapability[];
  seo: GameSeoDefinition;
}

interface GameEvent {
  eventId: string;
  sessionId: string;
  version: number;
  type: string;
  publicPayload?: unknown;
  privatePayloadByUser?: Record<string, unknown>;
  occurredAt: string;
}

interface GameSnapshot {
  sessionId: string;
  version: number;
  phase: string;
  publicState: unknown;
  privateState?: unknown;
  participants: SessionParticipant[];
}
```

#### Game SDK

Создать общий SDK:

- lobby;
- ready check;
- min/max players;
- countdown;
- rounds;
- timer;
- submissions;
- secret roles;
- voting;
- teams;
- spectator mode;
- scoring;
- tie-break;
- pause/resume;
- reconnect;
- leave/rejoin;
- rematch;
- completion;
- analytics;
- moderation;
- kids/adult content filter.

Каждая игра реализует declarative reducer и presentation/controller views, а не собственный вариант сетевой архитектуры.

#### Сертификация всех 32 режимов

Для каждого режима обязательны:

- понятные правила RU/EN;
- lobby и набор участников;
- запуск не только с одного устройства;
- персональный controller каждого игрока;
- общий stage;
- приватность ролей, карт, слов и ответов;
- завершённый раунд и матч;
- корректный score, рассчитанный сервером;
- позднее подключение как игрок или spectator;
- reconnect и восстановление;
- повторная игра;
- mobile portrait/landscape;
- 18+ и censored content profile;
- empty/error/offline states;
- аналитические события;
- unit, reducer, integration и multi-browser E2E тесты.

Сначала сертифицировать 8 основных режимов, затем выпускать остальные волнами, но конечный релизный gate требует сертификации всех 32.

#### Правовые названия

До глобальной индексации провести IP review и заменить рискованные названия:

- Quiplash → Punchline;
- Fibbage → Fake Fact;
- Uno → Color Cards;
- Codenames → Secret Grid;
- Spyfall → Lost Location;
- Heads Up → Forehead Guess;
- Kahoot-style → Speed Quiz.

Сохранить redirect со старых внутренних slug, но не индексировать чужие товарные знаки как собственные продукты.

### Этап 3 — вход, гости, профили и тусовки

#### Authentication и guest flow

- Хост входит через Google, Apple или email.
- Гость открывает инвайт, выбирает имя и аватар и входит без Clerk-регистрации.
- Guest session подписывается сервером, привязана к party и хранится в защищённом cookie.
- После регистрации guest history объединяется с Clerk account.
- При возвращении восстанавливаются membership, активная игра, controller state и последний экран.
- Регистрацию предлагать после полученной ценности, а не до первой игры.
- Добавить управление активными сессиями и выход со всех устройств.

#### Создание и управление тусой

- Название, дата, время, timezone, место/online, тип, описание, лимит гостей.
- `18+` включено по умолчанию.
- При отключении 18+ каталог, задания, чат-фильтры и тексты переключаются на safe profile.
- Хост назначает co-host и granular permissions.
- RSVP, расписание, список покупок, ответственные и распределение платежей.
- Инвайт: короткая ссылка, брендированный QR, share sheet, WhatsApp, Telegram, копирование.
- Уникальная динамическая OG-карточка каждой тусы без раскрытия приватной информации.
- Отмена, перенос, архив, удаление и экспорт.
- Все длинные формы имеют autosave draft.

#### Профиль и удержание

- Display name, avatar, bio, город, privacy settings.
- Обложка, avatar frame, name color, badge, chat background/effect.
- Пользователь может включать и отключать каждую косметику.
- XP, achievements, quests, streak и party history начисляются сервером.
- Друзья, компании/squads и повторное приглашение прежней группы.
- Recap после тусы: результаты, фотографии, цитаты, достижения, share card.
- KOINS остаются виртуальными, без вывода, покупки за реальные деньги и материальных призов до отдельного legal review.
- Betting UI не использует casino-style terminology и не показывается детям.

### Этап 4 — чат, галерея, уведомления и PWA-поведение

#### Чат

- Realtime сообщения, replies, reactions, stickers, mentions.
- Pagination и виртуализация истории.
- Optimistic send с idempotency и retry.
- Shimmer-эффекты промокодов ограничены одним ненавязчивым эффектом и отключаются в профиле.
- Report, mute, block, delete own message, moderator delete.
- Фильтр adult/safe content зависит от party profile.
- Voice upload с лимитами формата, длительности и размера.
- Chat composer учитывает экранную клавиатуру и safe-area.

#### Галерея

- Vercel Blob для фотографий и голосовых сообщений.
- Client-side resize, EXIF stripping, WebP/AVIF thumbnails.
- Upload progress, retry, deduplication, moderation queue.
- Lazy loading, lightbox, скачивание разрешённых материалов.
- Consent, report/remove, retention и удаление по запросу.
- Gallery live updates и recap без base64 в Postgres.

#### Уведомления и установка

- Web Push с VAPID и отдельной таблицей subscriptions.
- Permission запрашивается только после объяснения ценности.
- Поддержка Chrome, Edge, Firefox, Android и установленного iOS web app.
- Fallback: in-app inbox и email для критических приглашений.
- Service worker версиирует caches и не перехватывает auth/navigation некорректно.
- Offline shell, понятное offline-состояние, reconnect и background sync разрешённых команд.
- В UI использовать формулировку «Установить TUSA.game на телефон», не писать PWA.

### Этап 5 — промокоды, платежи, реклама и админка

#### Промокоды

Промокод содержит:

- code;
- статус;
- дата начала и окончания;
- общее количество использований;
- количество на пользователя;
- одноразовый/многоразовый режим;
- сегмент пользователей;
- разрешённые страны/языки;
- benefits;
- campaign/partner attribution;
- audit metadata.

Benefits поддерживают beta access, бесплатное создание тусы, entitlement, XP modifier, KOINS, cover, frame, name color, badge, chat effect и будущие расширения.

Redemption выполняется транзакционно и идемпотентно. Админ видит issued/redeemed/expired, conversion и пользователей. Исторические `Elaz`, `Jedai`, `Tusa02` мигрируются в новую модель.

#### Платежи

- Ввести `BillingProvider` abstraction.
- Для глобального digital launch использовать Merchant of Record; onboarding выбранного провайдера проходит юридическую проверку до разработки checkout.
- Checkout и webhook являются единственным источником платного entitlement.
- Webhooks подписаны, идемпотентны и повторно обрабатываемы.
- Хост видит цену и право доступа до создания тусы.
- Refund, invoice, tax, failed payment и cancellation states.
- Пока provider onboarding не завершён, production работает в промокодном beta-mode без ложных кнопок оплаты.

#### Полная админка

Роли: owner, superadmin, operations, moderator, support, analyst, marketer, content editor.

Модули:

- пользователи и роли;
- тусы и активные сессии;
- модерация чата, фото и жалоб;
- промокоды и entitlements;
- платежи и refunds;
- game flags и отключение проблемного режима;
- game/content editor;
- waitlist и регистрации;
- реклама и партнёры;
- RAG sources, reindex и evaluation;
- analytics dashboards;
- system health;
- audit log;
- data export/deletion requests.

Каждое чувствительное действие требует granular permission, подтверждение, audit log и при необходимости step-up authentication.

#### Партнёры и реклама

- Страницы: заведения, организации, амбассадоры/UGC, рекламодатели.
- Native placements: площадки для тусы, покупки рядом, партнёрские подборки.
- Direct placements: ограниченное промо-окно с frequency cap.
- Кампания настраивает даты, географию, сегмент, creative, destination, impressions, clicks и conversions.
- Реклама явно маркируется и не вмешивается в активный игровой раунд.
- Детские тусы не получают adult/alcohol targeting.
- Impression учитывается только после viewability threshold, click защищён от повторного спама.

### Этап 6 — два RAG-контура

#### Приватный engineering/operations RAG

Источники:

- исходный код;
- AGENTS.md и README;
- архитектурная документация;
- game manifest и правила;
- runbooks;
- миграции;
- схемы API;
- audit reports;
- разрешённые admin knowledge documents.

Архитектура:

- существующий TF/IDF сохранить как offline fallback;
- основное хранилище — Neon `pgvector`;
- multilingual embeddings;
- hybrid retrieval: lexical + vector;
- reranking;
- metadata filters по file type, subsystem, commit и visibility;
- incremental indexing по изменённым файлам;
- полный rebuild по расписанию и после release merge;
- приватные документы отделены namespace и RBAC;
- secrets, `.env`, пользовательские данные и production logs не индексируются.

#### Публичный support/game RAG

Источники:

- правила игр;
- FAQ;
- help center;
- compatibility guides;
- privacy-safe product documentation;
- troubleshooting;
- публичные release notes;
- страницы партнёров.

Публичный ассистент:

- отвечает на RU/EN;
- всегда показывает ссылки на источники;
- не использует приватный engineering corpus;
- не отвечает выдуманными правилами;
- при недостатке данных сообщает об этом;
- не раскрывает роли, карты и приватный state активной игры;
- имеет feedback и escalation to support.

#### RAG-интерфейсы

```ts
interface KnowledgeDocument {
  id: string;
  locale: Locale;
  visibility: "public" | "admin" | "engineering";
  sourceType: string;
  canonicalUrl?: string;
  version: string;
  checksum: string;
  updatedAt: string;
}

interface SearchHit {
  documentId: string;
  chunkId: string;
  score: number;
  text: string;
  title: string;
  url?: string;
  citationLabel: string;
}

interface RagAnswer {
  answer: string;
  locale: Locale;
  citations: SearchHit[];
  confidence: number;
  requestId: string;
}
```

API:

- `POST /api/knowledge/search`;
- `POST /api/assistant`;
- `POST /api/admin/rag/reindex`;
- `GET /api/admin/rag/jobs/[id]`;
- `GET /api/admin/rag/evaluations`.

#### Evaluation

Создать минимум 200 эталонных RU/EN запросов:

- правила игр;
- подключение;
- reconnect;
- создание тусы;
- промокоды;
- безопасность;
- troubleshooting;
- вопросы вне корпуса;
- prompt injection;
- попытки получить приватные данные.

Гейты: Recall@5 ≥ 0,85, citation precision ≥ 0,95, grounded answer rate ≥ 0,90, ноль утечек между visibility namespaces.

### Этап 7 — i18n и international architecture

- Публичные страницы перевести на URL-based locale: `/ru/...` и `/en/...`.
- `/` делает стабильный redirect на `/en`; язык меняется только явным переключателем.
- Protected app может помнить язык cookie, но URL публичного контента остаётся каноническим.
- Root locale становится частью route params, metadata, structured data и sitemap.
- Разделить переводы по доменам: common, landing, auth, party, games, profile, admin, legal, errors.
- Ввести типобезопасные ключи и ICU plural/date/number formatting.
- Запретить локальные ternary-переводы внутри компонентов.
- Автоматическая проверка отсутствующих, лишних и непереведённых ключей.
- Локализовать metadata, JSON-LD, alt, aria-labels, email, push, OG images, errors и правила игр.
- Форматы времени используют timezone тусы.
- RU и EN являются release-blocking.
- Архитектура готова к `kk`, но казахский не объявляется поддерживаемым до полного перевода и language QA.
- Не смешивать языки внутри одного URL или schema-блока.

### Этап 8 — SEO, GEO, AEO и AI-видимость

#### Домен и техническая индексация

- Подключить `tusa.game` к Vercel и проверить DNS, SSL и HSTS.
- `www.tusa.game` перенаправлять на основной домен.
- Заменить все production canonical, sitemap и robots URL с Vercel-домена на `https://tusa.game`.
- Preview и Vercel alias получают `noindex`.
- Sitemap использовать реальные `updatedAt`, а не текущее время каждого запроса.
- Разбить sitemap на pages, games, guides и blog при росте.
- Настроить Google Search Console, Bing Webmaster и Yandex Webmaster.
- Добавить автоматический broken-link и indexability audit.

#### Структура контента

- Создать локализованные страницы всех 32 игр.
- Каждая содержит: описание, число игроков, длительность, возраст, оборудование, правила, этапы раунда, примеры, FAQ, screenshots, related games и CTA.
- Создать category/player-count/use-case hubs.
- Создать help center, compatibility pages, hosting guides, safety и troubleshooting.
- Programmatic страницы публиковать только при наличии уникальной полезной информации; thin pages остаются `noindex`.
- План 150+ страниц из Growth OS выполнять после первых 32 game pages и проверки search demand.

#### Structured data

Использовать явные JSON-LD scripts:

- Organization;
- WebSite;
- SoftwareApplication/WebApplication;
- VideoGame/Game;
- CollectionPage;
- BreadcrumbList;
- FAQPage;
- HowTo только там, где страница действительно соответствует требованиям;
- Article;
- Event для публичных мероприятий;
- Offer после реального запуска оплаты.

Schema локализована и совпадает с видимым контентом.

#### GEO/AEO

- В начале материалов размещать короткий прямой ответ.
- Добавлять проверяемые fact blocks, списки шагов, таблицы и FAQ.
- Указывать автора, дату обновления, метод тестирования игры и фактические ограничения.
- Создать content freshness workflow и change history.
- Строить entity graph: TUSA.game → games → mechanics → player counts → occasions → audiences.
- Не публиковать массовый безликий AI-контент.
- Развивать внешние упоминания, партнёрские кейсы и обзоры как источник entity authority.

#### AI crawlers

- Сохранить разрешение GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot и Google-Extended для публичного контента.
- Запретить `/api`, `/admin`, `/app`, приватные party и пользовательские данные.
- Добавить `/llms.txt`, `/llms-full.txt` и machine-readable public content feed.
- `llms.txt` содержит продукт, возможности, поддерживаемые языки, canonical docs и game directory.
- Никакого bot-only текста или cloaking: AI получает тот же SSR-контент.
- Логировать crawler traffic отдельно и отслеживать ответы/цитирования вручную по эталонному набору запросов.

#### Social SEO

- Динамические OG images 1200×630 для локалей, игр, инвайтов и recap.
- Проверить Telegram, WhatsApp, Discord, LinkedIn и X previews.
- Инвайтные OG не раскрывают адрес, контакты, список гостей и adult content.
- Share events входят в first-party analytics.

### Этап 9 — дизайн-система и mobile-first аудит

`tusa-style-guide-v1.4.html` остаётся основным визуальным и tone-of-voice источником. Open Design используется только как набор проверяемых craft-критериев.

#### CSS и компоненты

- Разделить `globals.css` на tokens, base, layout, shared components, features и game styles.
- Не потерять существующие пользовательские изменения.
- Создать единые компоненты Button, Input, Select, Dialog, Sheet, Tabs, Card, Badge, QRCard, Toast, DateTimePicker и EmptyState.
- Заменить нестилизованные browser select/date/time controls на доступные branded-компоненты с native fallback.
- Все компоненты имеют default, hover, focus, pressed, disabled, loading, error и success states.
- Сохранить TUSA neo-brutalism: 3px border, offset shadow, lime/pink/blue, но убрать случайные исключения.
- Не использовать белый текст на lime.
- Один согласованный набор SVG-иконок вместо emoji.

#### Типографика

- Unbounded использовать для display/headings, Inter для основного текста, JetBrains Mono для chips/data.
- Исправить слипание кириллицы: более лёгкие веса, безопасный `letter-spacing`, `line-height` и ограничение длины строки.
- Display ≥48 px: tracking примерно `-0.02em`; обычные заголовки не сжимать агрессивно.
- ALL CAPS: `0.06–0.1em`.
- Body на мобильном не меньше 16 px, line-height 1.5–1.6.
- Проверить RU и EN на длинных строках и 200% text zoom.

#### Адаптивная матрица

Обязательные viewport:

- 320×568;
- 360×640;
- 375×667 и 375×812;
- 390×844;
- 412×915;
- 430×932;
- 667×375 и 844×390 landscape;
- 768×1024;
- 820×1180;
- 1024×768;
- 1280×720;
- 1440×900;
- 1920×1080 stage/TV.

На каждом:

- нет горизонтального overflow;
- CTA и контент не перекрываются fixed navigation;
- учитываются safe-area insets;
- используется `dvh`, а не проблемный `100vh`;
- клавиатура не закрывает chat/form controls;
- touch targets минимум 44×44, предпочтительно 48×48;
- между соседними controls минимум 8 px;
- stage остаётся читаемым с расстояния;
- controller не требует desktop hover.

#### Accessibility

- WCAG 2.2 AA как release gate.
- Контраст текста 4.5:1, компонентов и focus 3:1.
- Полная keyboard navigation и видимый `:focus-visible`.
- Семантические landmarks и последовательные headings.
- Native elements прежде ARIA.
- Все формы имеют labels, help, inline errors и focus первого ошибочного поля.
- Toasts используют `role=status`, критические ошибки — корректный alert pattern.
- Все animation/transform учитывают `prefers-reduced-motion`.
- Никаких частых вспышек; confetti и sparkles только одноразовые.
- Screen reader QA: VoiceOver iOS/macOS, TalkBack Android, NVDA Windows.

#### Motion

- Tap feedback: 50–100 ms.
- Основные state transitions: около 150 ms.
- Modals/sheets: 200–300 ms.
- Навигация: максимум 300–500 ms.
- Анимировать transform/opacity, не размеры и layout.
- Motion подтверждает действие и не блокирует управление.
- Игровые эффекты имеют reduced-motion альтернативу.

### Этап 10 — производительность

- Lazy-load каждый game bundle только после выбора режима.
- Убрать импорт всех 32 игр из стартового PartyRoom bundle.
- Перевести изображения на `next/image`, AVIF/WebP и responsive sizes.
- Self-host критические fonts, минимизировать preload.
- Разделение CSS уменьшает unused styles на публичных страницах.
- Виртуализировать длинные chat, gallery и admin lists.
- Не хранить рисунки/фотографии в game snapshots.
- Кэшировать публичный контент и game manifest.
- Performance budgets:

  - LCP ≤2,5 s p75 mobile;
  - INP ≤200 ms p75;
  - CLS ≤0,1;
  - initial JS публичной страницы ≤200 KB gzip;
  - controller route ≤250 KB gzip без выбранной игры;
  - realtime command acknowledgement p95 ≤350 ms;
  - visible state delivery p95 ≤500 ms.

## 3. CI, тестирование и release gates

### GitHub Actions

Каждый pull request запускает:

1. install с lockfile;
2. typecheck;
3. ESLint с нулём ошибок;
4. unit tests;
5. API contract tests;
6. game reducer tests;
7. migration validation;
8. RAG build и evaluation smoke;
9. production build;
10. Playwright public/auth/guest tests;
11. mobile overflow matrix;
12. axe accessibility;
13. visual regression;
14. Lighthouse budgets;
15. dependency/security scan.

Preview deployment получает seed database и тестовый Clerk environment. Production deploy разрешён только после прохождения gates и ручного smoke approval.

### Multiplayer testing

Для каждого режима:

- 2, минимальное, типовое и максимальное число игроков;
- host + controllers в разных browser contexts;
- два одновременных действия;
- duplicate command;
- stale version;
- delayed/reordered event;
- отключение на 5, 30 и 120 секунд;
- переход Wi-Fi/LTE;
- reload stage;
- reload controller;
- late join;
- spectator;
- host leave;
- app background;
- завершение и rematch;
- приватный state невозможно получить через API или DevTools другого игрока.

Нагрузочные сценарии:

- 100, 500 и 1000 одновременных тус;
- burst команд в начале раунда;
- reconnect storm;
- chat burst;
- photo uploads;
- provider outage;
- database failover.

### Mobile и UX testing

Проверять landing, auth, dashboard, create party, join, invite, party room, chat, gallery, shopping, profile, admin и все game views.

Для каждой поверхности:

- loading;
- empty;
- error;
- populated;
- edge/long-content;
- offline;
- permission denied;
- retry exhausted.

Отдельно тестировать:

- экранную клавиатуру;
- safe areas;
- 200% zoom;
- long RU strings;
- missing avatars;
- slow 3G;
- reduced motion;
- touch-only navigation;
- installed mobile web app.

### SEO/RAG testing

- Canonical и hreflang reciprocal validation.
- Один indexable canonical на локаль.
- Sitemap содержит только 200/indexable URL и реальные `lastmod`.
- JSON-LD проходит schema validation и совпадает с контентом.
- AI/public crawlers не получают приватные routes.
- `llms.txt` и feed доступны с canonical domain.
- RAG ответы содержат существующие citations.
- Prompt injection не меняет visibility scope.
- Удалённый документ исчезает из retrieval после reindex.
- RU и EN evaluation проходят одинаковые quality gates.

## 4. Последовательность релиза

| Волна | Содержание | Gate выхода |
|---|---|---|
| 0. Truth baseline | Manifest, документация, сохранение CSS-изменений, domain/DNS, CI skeleton | Один источник истины, воспроизводимый build/test |
| 1. Production core | Migrations, Ably, Redis rate limit, authorization, CSP, monitoring | Нет in-memory production state, нет произвольного score |
| 2. First-play flow | Guest join, session recovery, create/invite, responsive shell | First gameplay менее 90 секунд |
| 3. Core games | Game SDK и первые 8 сертифицированных игр | Полный multi-device/reconnect suite |
| 4. Complete catalogue | Последовательная миграция оставшихся 24 режимов | Все 32 режима сертифицированы |
| 5. Social platform | Chat, gallery, recap, profile, rewards, promos | Privacy/moderation и mobile gates пройдены |
| 6. Admin/commercial | RBAC, ads, partner pages, billing abstraction | Audit, legal и financial flows готовы |
| 7. International discovery | `/ru`, `/en`, 32 game pages, RAG, SEO/GEO/AEO | Search/RAG/i18n quality gates пройдены |
| 8. Global launch | Load test, DR drill, support, status, final accessibility | Zero P0/P1 defects и launch sign-off |

Функции P2 вроде UGC marketplace, creator economy, public game API, Discord Activity, Smart TV app и сложных платных KOINS не блокируют основной запуск и начинаются только после подтверждения retention.

## 5. Итоговый Definition of Done и принятые допущения

### Платформа считается завершённой, когда

- `tusa.game` является рабочим canonical production domain.
- Build, lint, typecheck, unit, integration и E2E зелёные в CI.
- 32 режима прошли multiplayer certification.
- Score, rewards и game state рассчитываются сервером.
- Нет production-зависимости от in-memory realtime/rate limiting.
- Guest может открыть ссылку и начать играть без регистрации.
- Сессия восстанавливается после закрытия вкладки и потери сети.
- RU и EN покрывают 100% UI, metadata, игры, ошибки и уведомления.
- Нет горизонтального overflow от 320 px и на landscape/mobile/tablet.
- WCAG 2.2 AA пройден.
- RAG имеет отдельные public/private namespaces и проходит evaluation.
- Индексируются локализованные game/help pages, а приватные routes закрыты.
- Админка имеет RBAC, audit log, moderation, promo, analytics и system health.
- Фото, голос, чат и профиль имеют consent, export и deletion flows.
- Privacy, Terms, age policy, moderation policy и IP review завершены.
- Мониторинг, алерты, backup, rollback и incident runbooks проверены.
- Нет открытых P0/P1 дефектов.

### Допущения по умолчанию

- Финиш — коммерчески готовый международный продукт, но выпуск выполняется gated-волнами.
- Полностью поддерживаемые языки первого релиза — RU и EN; архитектура готовится к KZ.
- RAG реализуется двумя изолированными контурами: приватным и публичным.
- Конечный каталог — все 32 существующих режима; маркетинговое число меняется только из manifest.
- Хост использует Clerk, гости получают anonymous signed session.
- Ably используется для realtime, Upstash Redis — для distributed rate limiting, Neon — как источник истины и pgvector storage.
- `tusa-style-guide-v1.4.html` имеет приоритет над внешними дизайн-рекомендациями.
- Текущие незакоммиченные изменения `app/globals.css` принадлежат пользователю и должны быть сохранены.
- Реальный payment provider включается только после успешного Merchant of Record onboarding и юридической проверки юрисдикции компании.
