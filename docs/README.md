# TUSA.game documentation index

**Current checkpoint:** 16 August 2026, local working checkpoint
**Product state:** supported public beta; 32 modes are Beta and `certified = 0`  
**Production:** https://tusa.game  
**Verified production baseline:** last external database check was schema v12; the current code requires migration v13 before deployment. Database, local auth, realtime, rate limit, media and observability are exposed through `/api/health`.

## Read in this order

1. [Documentation governance](./DOCUMENTATION_GOVERNANCE_2026-07-19.md) - claim precedence and meanings of shipped, gap, target and pre-implementation.
2. [Current implementation status](./IMPLEMENTATION_STATUS_2026-07-19.md) - the authoritative shipped/gap checkpoint.
3. [Production readiness audit](./PRODUCTION_READINESS_AUDIT.md) - release gates and remaining external work.
4. [Platform audit](./PLATFORM_AUDIT.md) - product and game readiness.
5. [Master plan](./PLAN.md) - target architecture and release sequence.

## Current verified facts

- 32 canonical modes and 32 server-owned SDK definitions; all remain Beta until browser certification evidence exists.
- Guest HMAC join, local email/password accounts, Party Room, chat, gallery, profile, KOINS, moderation, controlled Blob media, analytics and admin RBAC are implemented for the beta.
- Production uses versioned Drizzle migrations. Schema v12 covers party, auth, admin and waitlist tables; runtime DDL is a local-development compatibility fallback only.
- The connected production database reports schema v12. The latest production deployment is `Ready` on `tusa.game` and `tusagame.vercel.app`.
- 65 unit/invariant tests, TypeScript, ESLint, production build and the local RAG build pass at this checkpoint.

## Remaining release gates

1. Capture isolated browser certification evidence for the eight core games, then certify modes one at a time.
2. Configure and verify production email delivery and root-admin MFA enrollment.
3. Run venue-load, reconnect-storm and incident-recovery drills.
4. Complete independent DNS/TLS, legal/privacy and naming/IP reviews.
5. Do not enable real payments, subscriptions, white-label or marketplace claims before their legal and operational gates pass.

## Document classes

| Class | Documents | How to use |
| --- | --- | --- |
| Current | implementation status, readiness audit, platform audit, environment runbook | Operational decisions and release gates |
| Target | plan, growth OS, global platform, product strategy, monetization | Direction only; not proof of shipped features |
| Historical | 16 July checkpoint and dated full audit | Retained for traceability; never overrides the current checkpoint |
| Research | market research, UX/UI audit | Inputs to prioritisation; validate against code before implementation |
