# Production environment and distributed runtime

> **Актуализировано: 22.07.2026 · Baseline: `main@edee56e`.** Этот runbook задаёт production gate, а не подтверждает наличие credentials. Активный production build использует local auth compatibility layer.

This runbook records the production configuration that cannot be safely invented in source code. Values are added as **sensitive** Vercel environment variables; the application reports their state through `/admin/system` but never returns values.

## Verified checkpoint — 22.07.2026

- `main@edee56e` is deployed to `https://tusa.game` and `https://tusagame.vercel.app`.
- The connected production database is at schema version 12. Party, local auth, waitlist and admin traffic fail closed before issuing queries when the migration baseline is missing.
- The verified checkpoint above predates migration `0013_safety_restrictions.sql`; the current code requires schema version 13 and the migration must be applied before deploying it.
- `/api/health` reports `ready` for database, local auth, realtime, rate limit, media and observability.
- `/api/health` still reports `missing` for email delivery and admin MFA because their provider/enrollment configuration cannot be completed from source code.
- This does not certify games or replace the venue-load, incident and real-device gates.

## Required before strict production mode

| Integration | Required variables | Purpose |
| --- | --- | --- |
| Neon | `DATABASE_URL` | Authoritative party, membership, game and chat data. |
| Local auth | `LOCAL_AUTH_SECRET`, `GUEST_SESSION_SECRET`, `ADMIN_SESSION_SECRET` | Signed sessions for the current local email/password account flow. |
| Resend | `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `RESEND_WEBHOOK_SECRET` | Production verification and password-reset delivery. The webhook fallback is development-only. |
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

- Verify local auth secrets and Resend sender/domain verification before enabling paid traffic.
- Point `tusa.game` DNS to Vercel (`A @ → 76.76.21.21` or Vercel nameservers) and redirect `www.tusa.game` to the canonical host.
- Keep Preview and Development credentials separate from Production.
- Use `/admin/system` after every integration change and before enabling strict mode.
