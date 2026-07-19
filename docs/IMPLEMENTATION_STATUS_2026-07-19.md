# TUSA.game implementation status - 2026-07-19

**Repository:** `ElazAzel/tusa`<br>
**Branch:** `main`<br>
**Commit:** `0356f6d`<br>
**Product status:** public beta / supported pilot at 8.6/10; autonomous paid production remains 7.6/10

**Remediation update:** controlled Blob media, moderation/report/appeal, atomic KOINS bets, first-party error monitoring, a production health gate, email verification lifecycle, optional root-admin TOTP, ten applied migrations with schema version 9, and a 120-request production baseline are verified. Browser certification, actual email delivery/TOTP enrollment, DNS and legal/venue gates remain open. See `docs/FULL_PLATFORM_AUDIT_2026-07-19.md` and `docs/PRODUCTION_PREFLIGHT_2026-07-19.md`.

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
2. Core eight закреплены в manifest, но полный Stage + two Controllers + reconnect/rematch/privacy browser evidence ещё не снят.
3. Recovery, verification tokens, session revocation и TOTP enforcement реализованы; production email webhook и enrollment `ADMIN_TOTP_SECRET` не настроены.
4. Versioned migrations и strict schema gate работают; текущий production schema version равен 9.
5. KOINS join/settle/cancel и reward idempotency выполняются атомарными SQL CTE.
6. UGC report/block/appeal, moderator queue и controlled Blob lifecycle реализованы для Beta.
7. First-party server/client error journal и `/api/health` работают; внешний paging/webhook для SLO alert ещё не настроен.
8. Read-only production baseline пройден, но event-night profile с SSE, game commands, media и 20-30 участниками ещё нужен.
9. SEO aliases и видимые third-party game names требуют legal review.
10. Canonical `tusa.game` пока не подтверждён независимым DNS/browser smoke.

## Commercial status

Venue Night, Event Pass, TUSA Plus, subscriptions, payments, white-label, brand inventory, partner console и creator marketplace являются **pre-implementation**. В репозитории нет законченного merchant, self-serve booking или partner reporting flow. Venue Night до закрытия release gates допустим только как вручную сопровождаемый pilot.

Все цены, прогнозы, CAC/LTV, количество пилотов и revenue targets считаются гипотезами, пока не подтверждены договорами, оплатами и измеренными cohorts.

## Current execution order

1. Core-eight multi-browser certification harness and evidence.
2. Production auth email delivery and root-admin TOTP enrollment.
3. Venue load profile and incident drill.
4. DNS, naming/IP and legal/privacy review.
5. One supported Venue pilot, debrief and repeat-sale test.

## Document impact

- `README.md` и `AGENTS.md` описывают shipped baseline, а не target architecture.
- `PRODUCTION_READINESS_AUDIT.md` и `PLATFORM_AUDIT.md` используют certified = 0.
- Полный code/document/visual audit и evidence: `FULL_PLATFORM_AUDIT_2026-07-19.md`.
- Product, growth, monetization and global-platform documents остаются стратегическими, но их неотгруженные разделы помечаются как target/pre-implementation.
- Checkpoint от 16.07.2026 является историческим и не используется для новых решений.
