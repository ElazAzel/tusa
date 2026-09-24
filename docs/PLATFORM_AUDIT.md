# TUSA.game - platform completion audit

**Актуализировано:** 19.07.2026<br>
**Original audit baseline:** `main@0356f6d`<br>
**Current reconciliation:** `main@edee56e` on 22.07.2026<br>
**Status:** public beta; 32 Beta modes; certified = 0

> **Reconciled 16.08.2026:** this dated audit is retained for its certification criteria. Its findings about request-time business DDL, non-atomic KOINS bets, absent moderation/reporting and incomplete controlled media are resolved in the current beta baseline. The current code requires schema v13; the last external database verification was v12. All 32 games still remain Beta; no mode may be called certified until current browser evidence is recorded.

Источник текущих фактов: `docs/IMPLEMENTATION_STATUS_2026-07-19.md`. Target-требования определяются актуальными документами 02 Product Requirements и 04 Game Platform из `tmp/pdfs/Editable_DOCX/`.

## Summary

| Область | Подтверждено | Gap / gate |
|---|---|---|
| Catalogue | 32 canonical manifest modes | Не использовать количество как readiness metric |
| Game SDK | 32 registered definitions, strict schemas, server snapshots | Per-mode browser certification отсутствует |
| Release status | Все 32 Beta | Certified = 0 |
| Join | Guest-first HMAC session and local email/password lifecycle | Production email/MFA setup remains |
| Realtime | Authenticated SSE, Ably integration, reconnect | Production credentials, strict mode и load не подтверждены |
| Rate limiting | Upstash integration + local fallback | Strict production preflight не подтверждён |
| Persistence | Neon, version locking, idempotency, versioned migrations | Connected production baseline needs migration v13 |
| Economy | KOINS, pools, bets, transaction log; atomic join/settle/cancel and idempotent rewards | Reconciliation and event-night evidence remain |
| Safety | Authz, report/review/action/appeal, blocks and restrictions | Abuse certification evidence remains |
| Media | Controlled Blob storage, consent, validation, retention and deletion | Production/device evidence remains |
| Commercial | Marketing/partner surfaces exist | Payment, booking, subscriptions and partner console absent |

## Certification gate

Режим может перейти из Beta в Certified только после проверки:

- complete lifecycle `LOBBY -> INTRO -> ACTIVE -> REVEAL -> RESULTS -> REMATCH`;
- server-authoritative scoring and deadlines;
- reconnect in every phase;
- role-filtered snapshots with no secret leakage;
- strict command schemas and duplicate-command protection;
- host controls, timeouts and failure recovery;
- complete RU/EN copy;
- unit, integration, contract and browser E2E tests;
- real-device playtest on current iOS Safari and Android Chrome;
- analytics events and operational diagnostics;
- content/moderation review where the mode accepts UGC.

SDK contract coverage alone does not satisfy this gate.

## Proposed core eight

The current Game Platform document proposes:

1. Impostor.
2. Word Blast.
3. Trivia.
4. Word Bomb.
5. Punchline.
6. Fake Fact.
7. Would You Rather.
8. Two Truths and a Lie.

Этот список закреплён в `CORE_GAME_IDS` модуля manifest в certification priority order. Punchline и Fake Fact всё ещё требуют browser/moderation evidence до Certified.

## Release blockers

1. Production database must be migrated to schema v13 before this checkpoint is deployed.
2. No certified core modes until isolated Host + two Controller browser evidence passes.
3. Production Ably/Upstash/load/observability, email and root-admin MFA evidence is external.
4. DNS, legal/privacy and naming/IP review are external release gates.
5. Payments, booking and merchant flows remain intentionally pre-implementation.

## Commercial interpretation

Venue Night, Event Pass, TUSA Plus, white-label, brand inventory, partner console and marketplace are pre-implementation. A marketing page or pricing hypothesis is not a shipped commercial product. The first valid proof is a supported paid pilot with an invoice, measured delivery metrics and a repeat decision.

## Exit criteria

Platform readiness for an unsupervised paid event requires all P0 blockers closed, at least one manifest-pinned core mode certified through the full gate, production preflight evidence, incident fallback, published legal/privacy processes matching actual data flows, and an operational runbook proven on real devices.

Full 19.07.2026 code/document/visual evidence is recorded in `FULL_PLATFORM_AUDIT_2026-07-19.md`.
