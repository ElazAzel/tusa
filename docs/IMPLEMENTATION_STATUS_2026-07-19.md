# TUSA.game implementation status - 2026-07-19

**Repository:** `ElazAzel/tusa`<br>
**Branch:** `main`<br>
**Commit:** `0356f6d`<br>
**Product status:** public beta / supported pilot at 8.2/10; autonomous paid production remains 7.0/10

**Remediation update:** controlled Blob media with retention, moderation/report/appeal, password recovery and global session revocation, atomic KOINS bets, eight applied migrations with schema version 7, and Neon distributed realtime/rate-limit fallbacks are verified. Browser certification, production email delivery/MFA, external error monitoring/load evidence, DNS and legal/venue gates remain open. See `docs/FULL_PLATFORM_AUDIT_2026-07-19.md`.

Этот checkpoint синхронизирует документацию с актуальным пакетом в `tmp/pdfs/` и фактическим состоянием репозитория. Термины `shipped`, `gap`, `target` и `pre-implementation` определены в `docs/DOCUMENTATION_GOVERNANCE_2026-07-19.md`.

## Verified shipped

- Manifest содержит 32 canonical game modes.
- Все 32 режима зарегистрированы в Game SDK и имеют strict command schemas, server-owned snapshots и malformed-command rejection.
- Guest-first join работает через подписанные HMAC guest sessions без обязательной регистрации.
- Реализованы Party Room, chat, gallery, profile, KOINS, server-authoritative game API, version locking и idempotency. Реальная Party Room использует визуальную оболочку demo на desktop и mobile.
- Ably realtime, authenticated SSE и Upstash rate limiting интегрированы; development fallbacks остаются допустимыми только вне strict production.
- CI запускает typecheck, lint, tests, RAG build, production build, audit и Playwright.
- Public knowledge surfaces включают `llms.txt`, `llms-full.txt`, `/api/public/content`, `/api/knowledge/search` и `/api/assistant`.

## Verified gaps

1. Все 32 режима остаются Beta; certified = 0. Contract-tested не равно browser-certified.
2. Core eight предложена в актуальном game-platform документе, но не закреплена в manifest через `isCore`/priority field.
3. Production build использует local email/password compatibility layer, хотя часть старых документов описывает Clerk. Нужна одна auth-модель с recovery, verification, revocation и admin MFA.
4. Core business schema всё ещё создаётся runtime DDL; Drizzle в основном покрывает knowledge/RAG tables.
5. KOINS reward double credit закрыт атомарным idempotent CTE и тестом; join/settle/cancel bets всё ещё не образуют одну атомарную транзакцию.
6. UGC moderation/reporting отсутствует и блокирует certification Punchline/Fake Fact.
7. Voice/photo storage, retention и moderation не готовы для массового сбора media.
8. Production Ably/Upstash credentials, strict mode, load profile, Sentry и product SLO dashboards требуют проверки.
9. SEO auto-redirects и видимые third-party game names требуют удаления/переименования и legal review.
10. Полный host + two controllers + reconnect E2E отсутствует для каждого режима.

## Commercial status

Venue Night, Event Pass, TUSA Plus, subscriptions, payments, white-label, brand inventory, partner console и creator marketplace являются **pre-implementation**. В репозитории нет законченного merchant, self-serve booking или partner reporting flow. Venue Night до закрытия release gates допустим только как вручную сопровождаемый pilot.

Все цены, прогнозы, CAC/LTV, количество пилотов и revenue targets считаются гипотезами, пока не подтверждены договорами, оплатами и измеренными cohorts.

## Current execution order

1. Auth decision and account lifecycle.
2. Migration-first business schema.
3. Завершить atomic join/settle/cancel betting и reconciliation ledger.
4. Core-eight manifest decision and certification harness.
5. Moderation, media storage and privacy controls.
6. SEO redirects and naming/IP cleanup.
7. Production realtime/rate-limit/load/observability preflight.
8. One supported paid Venue pilot, debrief and repeat-sale test.

## Document impact

- `README.md` и `AGENTS.md` описывают shipped baseline, а не target architecture.
- `PRODUCTION_READINESS_AUDIT.md` и `PLATFORM_AUDIT.md` используют certified = 0.
- Полный code/document/visual audit и evidence: `FULL_PLATFORM_AUDIT_2026-07-19.md`.
- Product, growth, monetization and global-platform documents остаются стратегическими, но их неотгруженные разделы помечаются как target/pre-implementation.
- Checkpoint от 16.07.2026 является историческим и не используется для новых решений.
