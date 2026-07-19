# TUSA.game - platform completion audit

**Актуализировано:** 19.07.2026<br>
**Baseline:** `main@0356f6d`<br>
**Status:** public beta; 32 Beta modes; certified = 0

Источник текущих фактов: `docs/IMPLEMENTATION_STATUS_2026-07-19.md`. Target-требования определяются актуальными документами 02 Product Requirements и 04 Game Platform из `tmp/pdfs/Editable_DOCX/`.

## Summary

| Область | Подтверждено | Gap / gate |
|---|---|---|
| Catalogue | 32 canonical manifest modes | Не использовать количество как readiness metric |
| Game SDK | 32 registered definitions, strict schemas, server snapshots | Per-mode browser certification отсутствует |
| Release status | Все 32 Beta | Certified = 0 |
| Join | Guest-first HMAC session | Account provider и lifecycle требуют решения |
| Realtime | Authenticated SSE, Ably integration, reconnect | Production credentials, strict mode и load не подтверждены |
| Rate limiting | Upstash integration + local fallback | Strict production preflight не подтверждён |
| Persistence | Neon, version locking, idempotency | Runtime business DDL остаётся P0 |
| Economy | KOINS, pools, bets, transaction log; reward retry идемпотентен | Join/settle/cancel bets неатомарны |
| Safety | Authz guards and input validation | Moderation/reporting отсутствуют |
| Media | Gallery and voice/photo flows exist | Object storage, retention and moderation incomplete |
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

Этот список остаётся **target product decision**, пока он не закреплён в manifest через явное поле owner/priority/isCore. Punchline и Fake Fact дополнительно заблокированы отсутствием moderation/reporting.

## Release blockers

1. Auth ambiguity and incomplete account lifecycle.
2. Runtime DDL instead of migration-first business schema.
3. Non-atomic bet join/settle/cancel and missing reconciliation.
4. No certified core modes and no reusable host + two controllers + reconnect harness.
5. No UGC moderation/reporting workflow.
6. Incomplete media upload, retention and moderation controls.
7. Unverified production Ably/Upstash/load/observability.
8. Timed SEO redirects and user-facing third-party game names.
9. No complete payment, booking or merchant flow.

## Commercial interpretation

Venue Night, Event Pass, TUSA Plus, white-label, brand inventory, partner console and marketplace are pre-implementation. A marketing page or pricing hypothesis is not a shipped commercial product. The first valid proof is a supported paid pilot with an invoice, measured delivery metrics and a repeat decision.

## Exit criteria

Platform readiness for an unsupervised paid event requires all P0 blockers closed, at least one manifest-pinned core mode certified through the full gate, production preflight evidence, incident fallback, published legal/privacy processes matching actual data flows, and an operational runbook proven on real devices.

Full 19.07.2026 code/document/visual evidence is recorded in `FULL_PLATFORM_AUDIT_2026-07-19.md`.
