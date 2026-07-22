# Production environment and distributed runtime

> **Актуализировано: 19.07.2026 · Baseline: `main@0356f6d`.** Этот runbook задаёт production gate, а не подтверждает наличие credentials. Активный production build использует local auth compatibility layer; Clerk остаётся возможным целевым решением, пока не выбран единый provider.

This runbook records the production configuration that cannot be safely invented in source code. Values are added as **sensitive** Vercel environment variables; the application reports their state through `/admin/system` but never returns values.

## Verified checkpoint — 22.07.2026

- `main@edee56e` is deployed to `https://tusa.game` and `https://tusagame.vercel.app`.
- The connected production database is at schema version 12. Party, local auth, waitlist and admin traffic fail closed before issuing queries when the migration baseline is missing.
- `/api/health` reports `ready` for database, local auth, realtime, rate limit, media and observability.
- `/api/health` still reports `missing` for email delivery and admin MFA because their provider/enrollment configuration cannot be completed from source code.
- This does not certify games or replace the venue-load, incident and real-device gates.

## Required before strict production mode

| Integration | Required variables | Purpose |
| --- | --- | --- |
| Neon | `DATABASE_URL` | Authoritative party, membership, game and chat data. |
| Local auth transition | `LOCAL_AUTH_SECRET`, `GUEST_SESSION_SECRET`, `ADMIN_SESSION_SECRET` | Signed sessions while the legacy local-auth compatibility layer remains enabled. |
| Clerk production | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…`, `CLERK_SECRET_KEY=sk_live_…` | Production account provider. Test keys must not be used after Clerk is re-enabled. |
| Ably | `ABLY_API_KEY` | Distributed event delivery and presence. |
| Upstash | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting. |
| Blob | `BLOB_READ_WRITE_TOKEN` | Signed photo and voice uploads. |
| Sentry | `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` | Client/server error reporting. |

## Enabling strict distributed runtime

1. Add Ably and Upstash credentials to the **Production** Vercel environment.
2. Verify `/admin/system` reports `ready` for realtime and rate limit.
3. Set `TUSA_REQUIRE_DISTRIBUTED_SERVICES=true` in Production.
4. Redeploy and verify `/api/live` returns an SSE stream for an authorized party member.

When the strict flag is enabled, an unconfigured realtime provider returns a controlled `503` from `/api/live`; it never quietly falls back to a single function instance. Local development keeps the in-memory fallback intentionally.

## External operations checklist

- Replace Clerk test keys with live keys and configure the Clerk custom domain.
- Point `tusa.game` DNS to Vercel (`A @ → 76.76.21.21` or Vercel nameservers) and redirect `www.tusa.game` to the canonical host.
- Keep Preview and Development credentials separate from Production.
- Use `/admin/system` after every integration change and before enabling strict mode.
