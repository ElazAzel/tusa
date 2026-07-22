# TUSA.game implementation status - 2026-07-19

**Repository:** `ElazAzel/tusa`<br>
**Branch:** `main`<br>
**Baseline:** `main` through `57ce503` plus the production schema-gate follow-up<br>
**Product status:** public beta / supported pilot at 8.8/10; autonomous paid production remains 7.9/10 until external release gates pass

**Remediation update:** controlled Blob media, moderation/report/appeal, atomic KOINS bets, first-party error monitoring, a production health gate, email verification lifecycle, Resend delivery adapter/webhook journal, database-backed TOTP enrollment and one-use recovery codes, operational SLO events, certification/load/canonical harnesses, thirteen applied migrations with schema version 12, 61 unit/invariant tests and 52 browser smokes are verified. Vercel production now always enforces the migration gate instead of falling through to request-time DDL; RBAC and waitlist are also migration-backed. Core evidence is still 0/8 because an isolated preview party and Host storage state were not supplied; Resend DNS/domain verification, root enrollment, venue load, public DNS/legal approval and the in-person pilot remain external gates.

## 12-week roadmap implementation checkpoint

Shipped in code on 19.07.2026:

- Playwright core-eight harness with isolated Host + two Controller contexts, real guest joins, manifest-minimum participant coverage, full round drivers, reconnect, rematch, privacy, moderation, spectator/leave, RU/EN and mobile evidence. The supplied preview URL is now used as the Playwright base URL, and evidence requires screenshots for both locales.
- Source-bound certification gate in CI. `releaseStatus: "certified"` fails CI without current evidence and every required scenario.
- Resend verification/reset delivery, signed Svix webhook verification and hashed-recipient delivery journal.
- Root-admin TOTP enrollment with QR provisioning, AES-256-GCM secret storage and ten one-use hashed recovery codes.
- Join, game action/start/round, reconnect and media operational events plus 24-hour SLO and email delivery summaries in `/admin/system`.
- Confirmed venue-load harness for 30 real guest/SSE clients, DNS/canonical checker, incident drill and Venue Night runbook.
- Technical `www.tusa.game` to apex 308 redirect and privacy processor disclosure for Vercel, Blob, Neon, Ably, Clerk and Resend.

Not claimed as complete:

- Core games remain Beta (`0/8 certified`) until the preview certification run writes valid evidence.
- Resend domain delivery to Gmail, Outlook and Yandex, root-admin enrollment, 20-minute venue load, DNS/TLS, WCAG manual pass, legal approval and Venue Night require owner/external execution.
- The autonomous production score reaches the planned 8.2 only after those gates pass. Commercial expansion remains frozen.

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
4. Versioned migrations и strict schema gate работают; подключённая база подтверждена на schema version 12.
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

## 22.07.2026 follow-up

- New commits `252b8eb` and `57ce503` were reviewed and preserved: they add the current UX/UI audit, platform snapshot and plan cleanup.
- Mobile Party Room now keeps emoji input clear, keeps reactions and the More sheet inside the viewport, and uses a body-level sheet with safe-area handling.
- The offline banner now appears only when both authenticated party streams have actually disconnected. A single channel reconnect no longer falsely tells participants that the whole party is offline.
- RBAC and waitlist are migration-backed at schema version 12; production admin and waitlist traffic fail closed if their migrations are absent. `elaz263@gmail.com` is an active full-permission `admin` through the local account mapping and the assignment is audited.
- Local account, party, waitlist and admin traffic now share the schema-version-12 production gate. Runtime DDL remains a local-development compatibility fallback only and is never attempted for production requests.
- The next code-independent release gates remain unchanged: isolated core-eight evidence, provider setup for production email/TOTP, venue load and incident drill, then DNS and legal approval.

## Document impact

- `README.md` и `AGENTS.md` описывают shipped baseline, а не target architecture.
- `PRODUCTION_READINESS_AUDIT.md` и `PLATFORM_AUDIT.md` используют certified = 0.
- Полный code/document/visual audit и evidence: `FULL_PLATFORM_AUDIT_2026-07-19.md`.
- Product, growth, monetization and global-platform documents остаются стратегическими, но их неотгруженные разделы помечаются как target/pre-implementation.
- Checkpoint от 16.07.2026 является историческим и не используется для новых решений.
