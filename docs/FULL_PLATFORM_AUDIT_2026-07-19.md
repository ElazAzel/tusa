# TUSA.game: полный аудит платформы

**Дата проверки:** 19.07.2026  
**Репозиторий:** `ElazAzel/tusa`  
**Проверенный baseline:** текущая рабочая копия поверх `main@0356f6d`  
**Вердикт:** сильная public beta, но не готовая к автономным платным B2B-мероприятиям

## 1. Основание аудита

Проверка выполнена по актуальному пакету `tmp/pdfs/`, включая 20 редактируемых DOCX, 20 PDF-экспортов, четыре рабочие таблицы, governance-файлы и source materials. При конфликте применён порядок из `DOCUMENTATION_GOVERNANCE_2026-07-19.md`: фактический код и current repository status выше старых стратегических материалов.

Проверены:

- production-страницы `tusagame.vercel.app`: главная, demo, sign-in и sign-up;
- реальная `PartyRoom` в desktop/mobile viewport через локальный preview с настоящим компонентом;
- 44 API route-файла, 30 page route-файлов, manifest, Game SDK, auth, schema, realtime, economy и media paths;
- `lint`, TypeScript и 51 автоматический тест;
- скриншоты пользователя: chat 500, shopping, KOINS history, Party Pass, quests, highlights, gratitude, themes и profile cosmetics.

Ограничение: полный authenticated production E2E с хостом и двумя независимыми controller-сессиями в рамках этой проверки не выполнялся. Это отдельный обязательный certification gate.

## 2. Итоговая оценка

| Область | Состояние | Оценка |
|---|---|---:|
| Party Room и guest join | Реализованы; визуальная оболочка реальной комнаты приведена к demo | 8/10 |
| Игровая платформа | 32 режима, 32 server-authoritative definitions, строгие команды | 7/10 |
| Browser-certification игр | Все 32 Beta; certified = 0 | 2/10 |
| Chat и realtime | Idempotency/reconnect есть; production strict-services надо доказать | 6/10 |
| KOINS и engagement | Double-credit устранён; reward/gratitude paths атомарны | 7/10 |
| Auth и account lifecycle | Local email/password работает; recovery/verification/revocation/MFA неполны | 4/10 |
| Data/schema | Контракты сильные; основной schema bootstrap всё ещё runtime DDL | 4/10 |
| Safety и UGC | Authz/validation есть; report/review/action/appeal workflow отсутствует | 2/10 |
| Media | Gallery и voice/photo UI есть; storage/retention/deletion/moderation неполны | 3/10 |
| Observability и operations | Runtime health существует; Sentry/SLO/load/strict prod не подтверждены | 4/10 |
| Коммерческий продукт | Venue Night возможен только как сопровождаемый pilot | 3/10 |
| Документационная честность | Governance настроен; public copy местами завышает readiness | 6/10 |

**Сводная готовность:** 4.8/10 для автономного production-продукта; 7/10 для контролируемой public beta.

## 3. Что исправлено 19.07.2026

### Функциональность

- `/api/chat` исправлен: idempotent insert теперь совпадает с partial unique index и не падает на production PostgreSQL.
- `game_sessions.version` добавляется до использования optimistic locking.
- KOINS reward path больше не допускает повторное начисление при retry/reconnect.
- Party Pass получает рабочий active season; engagement surfaces больше не зависят от отсутствующей ручной инициализации.
- Shopping, highlights, gratitude, quests, room themes и cosmetics получили исправления error/empty/entitlement states.

### Интерфейс реальной тусы

- `PartyRoom` использует визуальную систему `/demo`: rail/dock navigation, sticky event topbar, lime event hero, brutal panels и одинаковую mobile information hierarchy.
- Demo не подменяет данные: реальная комната продолжает использовать настоящие API, роли, RSVP, чат, игры, участников и invite URL.
- На mobile hero больше не обрезает название события; вкладки Games/Chat открываются без лишнего hero; меню «Ещё» не перекрывается нижним dock.
- Навигационные icon buttons получили доступные имена и `aria-current`.

Визуальные подтверждения:

- `docs/audit-evidence-2026-07-19/07-real-party-demo-shell-1280.png`
- `docs/audit-evidence-2026-07-19/08-real-party-demo-shell-mobile-fixed.png`
- `docs/audit-evidence-2026-07-19/09-real-party-games-mobile.png`
- `docs/audit-evidence-2026-07-19/11-real-party-more-mobile-final.png`

## 4. Критические находки

### P0-1. Ни одна игра не сертифицирована

`lib/games/manifest.ts` содержит 32 canonical modes, и все имеют `releaseStatus: "beta"`. Тесты подтверждают server-owned snapshots и malformed-command rejection, но не заменяют host + two controllers + reconnect + rematch + privacy + load browser certification.

**Нужно:** закрепить core eight в manifest (`isCore`/priority/owner), создать reusable multi-context browser harness и сертифицировать режимы по одному. До этого нельзя публиковать формулировку «32 режима готовы» без слова Beta.

### P0-2. Нет продуктового moderation/reporting workflow

Admin roles содержат `moderator`, но API report/review/action/appeal и пользовательских report/mute/block controls нет. Это напрямую противоречит документам 10, 15, 16 и 19 и блокирует Punchline/Fake Fact, чат и массовый gallery rollout.

**Нужно:** reports table, reason taxonomy, room/user/content targets, moderator queue, enforcement actions, appeals, audit trail, rate limits и abuse tests.

### P0-3. Media lifecycle не закрыт

Код умеет показывать gallery/voice/photo flows, а runtime status знает `BLOB_READ_WRITE_TOKEN`, но нет доказанного end-to-end signed upload, MIME/size checks, retention schedule, user deletion и moderation pipeline.

**Нужно:** controlled object storage, quarantine, metadata-only DB rows, signed delivery, lifecycle deletion и documented consent/removal flow.

### P0-4. Production infrastructure не доказана

Ably, Upstash и Sentry поддерживаются кодом, но их production readiness нельзя выводить из наличия env-переменных. Нужны подтверждённые `/admin/system`, strict mode, load profile, reconnect metrics, error reporting и incident drill.

### P0-5. Auth lifecycle не соответствует требованиям

Production использует `lib/local-auth/server`, хотя старые материалы описывают Clerk. Local sign-in/sign-up есть, но отсутствует законченный password recovery, email verification, global session revocation и admin MFA.

**Решение:** официально выбрать одну auth-модель, обновить docs и закрыть полный lifecycle до paid pilot.

### P0-6. Core schema всё ещё создаётся во время запросов

`lib/parties.ts` содержит крупный `ensurePartySchema()` с `CREATE TABLE IF NOT EXISTS` и `ALTER TABLE`. Это повышает cold-start latency, усложняет rollback и уже проявлялось как chat 500.

**Нужно:** перенести все business tables в versioned Drizzle migrations, оставить runtime только для health check и fail-fast schema-version verification.

## 5. Значимые UX и product gaps

### P1

1. Главная страница заявляет готовность 32 режимов сильнее, чем подтверждает certification status.
2. Cookie banner на desktop и mobile перекрывает hero, CTA и ключевые показатели; он должен быть компактнее и не блокировать основную задачу.
3. Production sign-up во время проверки оставался в состоянии «Готовим регистрацию…» дольше ожидаемого. Нужны timeout, явная ошибка и fallback на email form.
4. KOINS history использует технические записи вида `Reward: chat`; требуется локализованный reason catalogue, grouping и понятное время.
5. Empty states Party Pass/quests/highlights/gratitude раньше выглядели как недоделанные экраны. Данные и CTA должны объяснять следующий доступный шаг, а не показывать пустой синий canvas.
6. Cosmetics должны использовать swatches/segmented controls и lock/price states вместо строки названий цветов.
7. Shopping amount unit, responsibility и completion state требуют отдельной mobile browser-проверки с двумя участниками.

### P2

1. Footer auth-страниц смешивает RU и EN (`Privacy`, `Terms`).
2. Некоторые большие пустые surfaces используют слишком низкий контраст текста.
3. Demo и public copy показывают ISO-date в части состояний; нужно единое locale-aware форматирование.
4. Public SEO aliases и видимые third-party game names требуют trademark review и удаления автоматических редиректов с таймером.

## 6. Игровой аудит

Автотесты подтверждают:

- ровно 32 уникальных id/slug;
- server-authoritative SDK definition для каждого режима;
- secret-state isolation для игр с ролями/картами;
- scoring/deadline/turn/vote validation;
- idempotency multiplayer commands и rewards;
- invalid/unknown payload rejection;
- guest access и reconnect restore contracts.

Не подтверждено для каждого режима:

- реальный браузерный Stage + два Controllers;
- network loss/reconnect во всех фазах;
- host transfer/leave и spectator behavior;
- rematch, next game и session cleanup;
- iOS Safari/Android Chrome/audio permission;
- 20-30 players, latency p95 и event-night load;
- UGC privacy/moderation и screenshot evidence.

Следовательно, правильная формулировка: **32 режима реализованы и contract-tested; 0 режимов browser-certified**.

## 7. Соответствие актуальным документам

| Требование пакета 19.07.2026 | Факт |
|---|---|
| Вход в комнату без обязательной установки/регистрации | Реализован HMAC guest session |
| State survives reconnect | Реализованы restore + idempotency contracts; нужен полный browser gate |
| Analytics и error reporting | Частично; Sentry/SLO production evidence отсутствует |
| Core eight fully certified | Не выполнено; core eight не закреплена в manifest |
| Legal/privacy review перед public launch | Drafts есть; процессы и контакты требуют финализации |
| Report рядом с сообщением/пользователем/material | Не выполнено |
| Media consent/removal/retention | Не выполнено end-to-end |
| Один paid Venue Night после production blockers | Допустим только после закрытия P0 и preflight |
| Marketplace/ticketing/cash-out вне beta scope | Соответствует: законченных flows нет |

## 8. План закрытия

### 0-30 дней

1. Выбрать auth-модель и закрыть recovery, verification, revocation, admin MFA.
2. Перенести runtime DDL в migrations и ввести schema version gate.
3. Закрепить core eight в manifest; сертифицировать первые два режима.
4. Реализовать базовый report/mute/block и moderator queue.
5. Подтвердить Ably/Upstash strict mode, Sentry и production load baseline.
6. Исправить public readiness claims, cookie banner и sign-up timeout.

### 31-60 дней

1. Сертифицировать оставшиеся core modes с reconnect/rematch/privacy evidence.
2. Перенести media в controlled object storage с retention/deletion.
3. Добавить product analytics: activation, join success, round completion, reconnect, next-game rate.
4. Провести accessibility pass по keyboard/focus/contrast/live regions.
5. Удалить/переименовать спорные game names и завершить legal review.

### 61-90 дней

1. Провести один вручную сопровождаемый Venue Night.
2. Выполнить incident drill, debrief и измерить join/round/reconnect/NPS.
3. Только после успешного gate принимать решение о repeat sale, Event Pass и partner tooling.

## 9. Release gate

TUSA.game можно считать готовой к автономному платному мероприятию только когда одновременно выполнены:

- минимум один manifest-pinned core mode сертифицирован end-to-end;
- moderation/reporting и media lifecycle работают;
- production realtime/rate-limit/observability имеют evidence;
- auth lifecycle и schema migrations закрыты;
- legal/privacy documents соответствуют реальным data flows;
- venue runbook проверен на реальных устройствах и сети.

До этого корректный статус продукта: **public beta / supported pilot only**.

## 10. Результат ремедиации 19.07.2026

После выполнения плана из раздела 8 подтверждённая оценка **public beta / supported pilot** повышена с 7.0 до **8.2/10**. Оценка автономного платного production-продукта повышена с 4.8 до **7.0/10**; она намеренно не доведена до 8 без реального browser-certification core-игр, почтовой доставки auth-сообщений, error-monitoring и venue load evidence.

| Область | Было | Стало | Подтверждение |
|---|---:|---:|---|
| Party Room и guest join | 8.0 | 8.5 | Реальная комната использует demo-shell; production auth-страницы проверены во встроенном браузере |
| Игровая платформа | 7.0 | 8.0 | 32 server-authoritative definitions; core eight закреплены в manifest |
| Browser-certification игр | 2.0 | 3.0 | Core-порядок формализован, но `certified = 0`; статус остаётся Beta |
| Chat и realtime | 6.0 | 8.0 | Chat больше не отвечает 500; Ably имеет распределённый Neon fallback между serverless-инстансами |
| KOINS и engagement | 7.0 | 8.5 | Join/settle/cancel bet выполняются атомарными SQL CTE; ledger локализован и уплотнён |
| Auth lifecycle | 4.0 | 7.0 | Timeout/fallback, password reset, одноразовые токены, global session revocation; email webhook и MFA ещё нужны |
| Data/schema | 4.0 | 8.5 | 8 migration journal entries, полная business-schema migration, production schema gate `version = 7` |
| Safety и UGC | 2.0 | 8.0 | Report/block, moderator queue, actions, appeal, audit trail, server-side filtering |
| Media | 3.0 | 8.0 | Vercel Blob, MIME/size/consent checks, metadata rows, delete, 90-day retention и cron cleanup |
| Operations | 4.0 | 7.0 | Neon distributed rate-limit/realtime fallbacks и strict schema; external error monitoring/load drill остаются gate |
| Документационная честность | 6.0 | 9.0 | Public copy везде использует Beta; readiness не завышена до paid production |

### Закрытые пункты исходного аудита

- P0-2 moderation/reporting: закрыт для Beta.
- P0-3 media lifecycle: закрыт для Beta; object URLs публичны по непредсказуемому адресу и удаляются по lifecycle policy.
- P0-5 auth lifecycle: recovery и revocation закрыты; verification/MFA/email delivery остаются перед paid production.
- P0-6 runtime DDL: production переведён на versioned migrations и fail-fast schema gate.
- KOINS concurrency: ставки, выплаты и возвраты атомарны.
- P1 public claims/sign-up/footer/KOINS history: исправлены.
- Production distributed fallback: rate limits и realtime больше не зависят от памяти одного serverless-инстанса.

### Проверка

- `npm run lint` — 0 ошибок.
- `npm run typecheck` — успешно.
- `npm test` — 56 тестов, 56 passed.
- `npm run db:check` — успешно.
- `npm run build` — успешно, 133 static/dynamic page outputs.
- Neon: 8 migration journal entries, `platform_schema_version.version = 7`.
- Production smoke: `/api/auth/session` = 200, unauthenticated `/api/chat` = 401 вместо 500, public content = 200.
- Final production deployment: `dpl_HEb8ZyBNau7Fr71dXsrbvzLSMDfv`, aliased to `https://tusagame.vercel.app`; final browser smoke has no console errors.

### Оставшийся путь до 8/10 autonomous paid production

1. Сертифицировать минимум две core-игры через Stage + два Controller + reconnect/rematch/privacy/load browser harness, затем пройти все восемь.
2. Подключить production email delivery, email verification и MFA для admin.
3. Подключить error monitoring, SLO alerts и выполнить документированный load/incident drill.
4. Завершить DNS для `tusa.game` и повторить smoke на canonical domain.
5. Провести legal/privacy review и один сопровождаемый Venue Night.

## 11. Operations and auth checkpoint - 19.07.2026

После следующего remediation-прохода подтверждённая оценка **public beta / supported pilot** повышена до **8.6/10**. Оценка автономного paid production повышена до **7.6/10**. Она остаётся ниже 8 до реального multi-browser game certification, доставленного auth email, включённого admin MFA, DNS и venue/legal evidence.

### Реализовано

- First-party `platform_error_events` с fingerprint, очисткой PII/secrets, release/environment и агрегатами за 1/24 часа.
- Next.js `onRequestError`, client global error reporting и явная запись обработанных chat/game 500.
- `/api/health` с проверкой database schema gate и latency; `/admin/system` показывает database latency и top error fingerprints.
- Email verification: одноразовый 24-часовой токен, повторная отправка, confirmation endpoint и статус в кабинете.
- Root-admin TOTP enforcement с окном ±30 секунд; включается только после задания `ADMIN_TOTP_SECRET`.
- Auth email webhook получил timeout, проверку HTTP status и запись delivery failure в error journal.
- Safe read-only production preflight и incident runbook.

### Production evidence

- Deployment: `dpl_BUTwHn2UUBQPTDLLAzS6TJaFRPK6`.
- Neon: 10 applied migrations, `platform_schema_version.version = 9`.
- `/api/health`: HTTP 200, `status=ready`, database latency 72 ms на smoke-запросе.
- Runtime ready: database, local auth, Clerk compatibility, realtime, rate limit, media, observability.
- Runtime missing: production email webhook и admin TOTP secret; это видно в health/admin, а не скрыто.
- Preflight: 120/120 successful, concurrency 6, p50 288 ms, p95 1641 ms, p99 2007 ms, max 2011 ms.
- Browser smoke: homepage и sign-up semantic flow открываются; screenshot `docs/audit-evidence-2026-07-19/12-sign-up-observability-release.png`.
- Verification: lint and typecheck pass; 58/58 tests pass; production build generates 136 route outputs.

### Скорректированные оценки

| Область | Предыдущая | Сейчас | Причина |
|---|---:|---:|---|
| Auth lifecycle | 7.0 | 7.8 | Verification и TOTP enforcement готовы; delivery/enrollment требуют env и реального письма |
| Data/schema | 8.5 | 9.0 | 10 migrations, schema v9, health gate |
| Operations | 7.0 | 8.4 | First-party errors, health, admin metrics, production baseline и runbook |
| Supported pilot | 8.2 | 8.6 | Основные Beta-контуры наблюдаемы и воспроизводимо проверены |
| Autonomous paid production | 7.0 | 7.6 | Multi-browser, email/MFA enrollment, DNS, legal и venue load ещё не подтверждены |
