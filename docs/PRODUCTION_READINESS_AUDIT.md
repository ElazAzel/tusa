# TUSA.game - Production Readiness Audit

**Date:** 19.07.2026<br>
**Branch:** `main`<br>
**Original audit commit:** `0356f6d`<br>
**Current reconciliation:** `main@edee56e` on 22.07.2026<br>
**Decision:** not ready for unsupervised paid B2B events

> **Reconciled 16.08.2026:** local auth is the single account provider in runtime, migration-first schema, atomic KOINS betting/rewards, moderation, controlled Blob media, production health and fail-closed guards are shipped for the beta. The current code requires schema v13; the last external database verification was v12, so migration 0013 must be applied before deployment. Remaining gates are current browser certification evidence (`0/8`), production email and root-admin MFA configuration, venue/load and incident drills, plus DNS, legal/privacy and naming/IP review.

This audit follows `docs/DOCUMENTATION_GOVERNANCE_2026-07-19.md` and `docs/IMPLEMENTATION_STATUS_2026-07-19.md`.

## Executive decision

The platform has a broad public-beta surface and a complete 32-mode SDK registry. Unsupervised paid-event readiness is still blocked by external certification, infrastructure, legal and operational evidence; CI success and SDK contract coverage are necessary evidence, not event-readiness evidence.

## Verified shipped state

- 32 canonical modes in the manifest.
- 32 SDK definitions with strict malformed-command rejection and server-owned snapshots.
- All 32 modes remain `releaseStatus: beta`; certified modes: 0.
- Guest-first join using signed HMAC guest sessions.
- Party Room, chat, gallery, profile, KOINS, game API, optimistic version locking and idempotency.
- Authenticated SSE, Ably integration, Upstash integration and development fallbacks.
- Runtime health surface at `/admin/system`.
- CI coverage for typecheck, lint, tests, RAG build, build, audit and Playwright.

## P0 findings

| Priority | Finding | Required evidence to close |
|---|---|---|
| P0 | Current production database is one migration behind the code gate | Apply migration 0013, then rerun `/api/health` and rollback rehearsal |
| P0 | 32 Beta modes, certified = 0 | Manifest-pinned core eight and per-mode certification evidence |
| P0 | Production distributed runtime unverified | Ably/Upstash strict mode, load results, dashboards, alerts and fallback drill |
| P0 | Production auth delivery and root-admin MFA are not owner-configured | Resend delivery checks and MFA enrollment/recovery evidence |
| P0 | Legal, DNS and naming/IP evidence is external | Canonical DNS smoke and approved privacy/naming review |

## Game readiness

Each manifest entry is SDK-managed and contract-tested. None is certified. Certification requires:

1. Lobby through rematch lifecycle.
2. Host + Stage + at least two independent Controllers.
3. Server-authoritative scores, roles, timers and results.
4. Role-filtered views and negative privacy tests.
5. Refresh, reconnect, network switch, duplicate submit and delayed packet tests.
6. RU/EN UI, accessibility, current mobile browsers and real devices.
7. Analytics and operational error context.
8. Moderation review for UGC modes.

The core eight is pinned in `lib/games/manifest.ts` as `CORE_GAME_IDS` in certification priority order. It remains Beta until browser evidence is written and verified.

## Infrastructure gates

- Neon must be configured and the business schema must migrate without runtime DDL.
- `TUSA_REQUIRE_DISTRIBUTED_SERVICES=true` must fail closed when Ably or Upstash is unavailable.
- `/admin/system` must report ready without exposing secret values.
- Load tests must cover concurrent rooms, fan-out, reconnect storms and rate-limit behavior.
- Error monitoring must include room, game, version, phase and correlation ID without PII or secret roles.
- Incident response must prove disable/rollback/fallback steps before a paid event.

## Security, privacy and legal gates

- Every mutation requires membership/role authorization and negative tests.
- Final auth provider and actual processors must match Terms/Privacy documents.
- UGC requires report/moderation operations before certification.
- KOINS remain non-cash, non-withdrawable and unavailable for paid gambling.
- Media requires consent, retention, deletion and controlled storage.
- User-facing game names, SEO copy, screenshots and rules require naming/IP review.

## Commercial gate

Payments, self-serve Venue booking, subscriptions, white-label, partner console and marketplace are not shipped. Prices and forecasts are hypotheses. Before public commercial claims, complete one manually supported paid pilot, collect cash, record reliability and engagement, run a debrief, and obtain a repeat/no-repeat decision.

## Recommended order

1. Auth decision.
2. Migration-first schema.
3. Atomic betting and reconciliation (reward retry idempotency is already covered).
4. Core-eight manifest decision and certification harness.
5. Moderation and controlled media.
6. Naming/IP and SEO cleanup.
7. Production distributed-runtime and observability preflight.
8. Supported paid pilot.
