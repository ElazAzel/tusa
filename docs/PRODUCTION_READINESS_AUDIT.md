# TUSA.game - Production Readiness Audit

**Date:** 19.07.2026<br>
**Branch:** `main`<br>
**Commit:** `0356f6d`<br>
**Decision:** not ready for unsupervised paid B2B events

This audit follows `docs/DOCUMENTATION_GOVERNANCE_2026-07-19.md` and `docs/IMPLEMENTATION_STATUS_2026-07-19.md`.

## Executive decision

The platform has a broad public-beta surface and a complete 32-mode SDK registry, but production readiness is blocked by auth ambiguity, schema bootstrap, economy consistency, missing per-mode certification, safety controls, media handling, naming/IP cleanup and production verification. CI success and SDK contract coverage are necessary evidence, not event-readiness evidence.

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
| P0 | Two auth stories: local compatibility layer in production build vs Clerk in older docs | One provider decision; recovery, verification, revocation, rate limits and admin MFA tested |
| P0 | Business schema still depends on request-time runtime DDL | Versioned migrations, clean bootstrap and rollback rehearsal |
| P0 | KOINS reward retry is fixed; betting join/settle/cancel are not atomic | PostgreSQL transaction tests and reconciliation |
| P0 | 32 Beta modes, certified = 0 | Manifest-pinned core eight and per-mode certification evidence |
| P0 | UGC moderation/reporting absent | Report, review, action and appeal workflow plus abuse tests |
| P0 | Voice/photo storage controls incomplete | Signed object upload, MIME/size validation, retention, deletion and moderation |
| P0 | Production distributed runtime unverified | Ably/Upstash strict mode, load results, dashboards, alerts and fallback drill |
| P0 | SEO timed redirects and third-party visible names | Human-useful pages, redirect removal, neutral UI names and trademark review |

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

The proposed core eight is Impostor, Word Blast, Trivia, Word Bomb, Punchline, Fake Fact, Would You Rather and Two Truths and a Lie. It is not authoritative until encoded in the manifest.

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
