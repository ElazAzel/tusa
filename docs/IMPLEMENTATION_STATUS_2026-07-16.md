# TUSA.game implementation status — 2026-07-16

This document is the current operational checkpoint for continuing the master plan. It reconciles the plan, docs and git history against the current repository state.

## Current git baseline

- Branch inspected: `main`
- Latest upstream commit before this checkpoint: `d54962f` — `fix: catch-all error handling for /app/* server pages, redirect to sign-in on render error`
- Current work branch: `codex/auth-runtime-resilience`
- Production target: `https://tusa.game` / `https://tusagame.vercel.app`

## Verified current state

- Game manifest is the source of truth for the public catalogue and contains 32 canonical modes.
- Every one of the 32 manifest games now has an SDK definition, Zod command contract and server-side reducer. The catalogue invariant is covered by a test so a UI-only mode cannot be added accidentally.
- Tests currently cover server reducers and platform invariants through `npm test`.
- CI exists and recent PRs have been merged through GitHub/Vercel.
- `/admin/system` exposes a permission-gated, secret-free runtime health report. Ably and Upstash are integrated with local fallback; `TUSA_REQUIRE_DISTRIBUTED_SERVICES=true` turns a missing realtime provider into a controlled `503` instead of a silent single-instance fallback.
- `llms.txt`, `llms-full.txt`, `/api/public/content`, `/api/knowledge/search` and `/api/assistant` exist.
- Runtime DDL still exists in `lib/parties.ts`; versioned migrations are not the source of truth for all business tables.
- URL-based locale routing (`/ru`, `/en`) is not complete; current locale behavior still relies heavily on cookie/runtime locale.
- Full multiplayer E2E certification for all 32 modes is not complete.

## Auth incident status

Observed user-facing issue:

- After account login, the browser reports a production Server Components render error digest.
- Clerk also logs that development keys are loaded in production.

Code-side action in this checkpoint:

- Removed the uncommitted experimental `proxyUrl="/__clerk"` and `/__clerk` middleware rewrite because it was not a valid Clerk production fix.
- Added `app/app/auth-runtime.ts`.
- `/app`, `/app/friends`, `/app/leaderboard`, and `/app/profile` now require `auth()` but treat `currentUser()` as best-effort.
- If `currentUser()` or profile/dashboard DB calls fail after login, the app falls back to a minimal signed-in profile instead of throwing an RSC digest.

External action still required:

- Replace Vercel Production Clerk env with live keys:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live...`
  - `CLERK_SECRET_KEY=sk_live...`
- The warning cannot be removed safely in code while production still uses `pk_test`/`sk_test`.

## Domain status

`tusa.game` is attached to the Vercel project, but its external DNS is not yet delegated to Vercel and does not resolve publicly. At the DNS provider, either point the apex `A` record to `76.76.21.21` or delegate the domain to `ns1.vercel-dns.com` and `ns2.vercel-dns.com`. Until this is done, `https://tusagame.vercel.app` remains the reachable production alias.

## Completion gaps against the master plan

### P0 — production blockers

1. Clerk production keys and custom domain must be configured in Vercel/Clerk.
2. External DNS for `tusa.game` must be pointed at Vercel.
3. Runtime DDL must be replaced by versioned migrations for core business tables.
4. Ably/Upstash production env must be verified and fail-closed or visibly degraded.
5. All authenticated app pages and critical APIs need deterministic error states, not generic RSC failure.
6. Maintain the server-authoritative reducer invariant while adding certification and operational coverage.

### P1 — game completion

1. Add multiplayer E2E for host + at least two controllers per certified game.
3. Add privacy tests for every hidden role/card/word/answer.
4. Add reconnect/session recovery tests per game.
5. Keep UI labels honest: Beta until certification gates pass.

### P1 — mobile/design

1. Complete mobile overflow matrix from 320 px through tablet and landscape.
2. Replace remaining native selects/date/time controls with branded accessible components.
3. Fix residual Cyrillic heading compression and long-line wrapping in game/app screens.
4. Add visual regression coverage for landing, app shell, party room, invite, chat, gallery and game views.

### P1 — international/SEO/RAG

1. Finish URL-based `/ru` and `/en` architecture.
2. Ensure sitemap uses stable `updatedAt` values.
3. Keep `llms.txt` and public content feed manifest-driven.
4. Separate public support RAG from engineering/admin RAG with explicit visibility boundaries and evaluation.

### P2 — admin/commercial

1. Complete RBAC modules for analytics, ads, moderation, roles and system health.
2. Complete promo-code benefit analytics and admin lifecycle controls.
3. Keep payment in promo beta-mode until merchant/legal onboarding is complete.

## Next implementation order

1. Stabilize auth runtime and production login.
2. Ship the chat reliability and mobile UX phase described below.
3. Keep product claims aligned with the certification matrix and production environment.
4. Continue SDK migration for the remaining high-impact games.
5. Add the first real multiplayer E2E harness for one certified game.
6. Start migration plan from runtime DDL to versioned schema.

## Chat reliability and brand-book UX phase

The current working phase makes chat delivery idempotent per party, actor and client mutation ID. A duplicate POST now returns the original message without publishing it twice or awarding engagement twice. Chat history and realtime payloads consistently include profile handle, name color and client mutation ID so optimistic messages reconcile correctly.

The party room refreshes its chat snapshot after a realtime reconnect, preserves a user reading history instead of forcing scroll-to-bottom, and exposes a branded jump-to-latest action. The composer now has explicit sending and failure states, keyboard-safe multiline behavior, visible touch reaction controls and RU/EN copy. The visual treatment follows `tusa-style-guide-v1.4.html`: cream stream, white incoming bubbles, lime outgoing bubbles, black offset shadows, mono metadata, compact pink notification and reduced-motion fallback.

This phase does not yet move voice media from base64 payloads to Vercel Blob. That storage migration remains a P1 production task because it needs signed upload and retention/moderation paths rather than a client-only replacement.

## External audit reconciliation

The July 2026 architecture audit and commercial strategy have been reviewed. Their central conclusion is adopted: product breadth must not outrun the invite-to-first-game path. `docs/PRODUCT_STRATEGY_2026-07-16.md` records the resulting operating model: free guest core, host monetization, B2B first, then partner integrations and only later creator marketplace/API work.
