# Production preflight - 2026-07-19

## Scope

This run verifies the production runtime without creating users, parties, messages, media or game sessions. It is a safe read-only baseline, not a replacement for a 20-30 player venue rehearsal.

## Verified production state

- Deployment: `dpl_2fW9fH2h3s5ubETt7zQEWD2UPUSy`.
- Public URL: `https://tusagame.vercel.app`.
- `/api/health`: HTTP 200, `status=ready`.
- Database schema: version 10, eleven applied migrations.
- Database, authentication, realtime, rate limiting, media and first-party observability report ready.
- Resend delivery and database-backed root-admin MFA are implemented; production health still reports both missing until the owner configures `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `RESEND_WEBHOOK_SECRET`, `ADMIN_MFA_ENCRYPTION_KEY` and completes enrollment.
- `tusa.game` is assigned as the Vercel production alias, but external DNS does not resolve as of the last check. `tusagame.vercel.app` remains reachable.

## Load baseline

Command:

```bash
PREFLIGHT_BASE_URL=https://tusagame.vercel.app PREFLIGHT_REQUESTS=120 PREFLIGHT_CONCURRENCY=6 npm run load:preflight
```

Result: 120 requests, 100% success, p50 288 ms, p95 1641 ms, p99 2007 ms, max 2011 ms. Evidence is stored in `docs/audit-evidence-2026-07-19/load-preflight.json`.

The profile covers `/`, `/api/public/content`, `/api/auth/session` and `/api/health`. It does not certify SSE fan-out, game commands or media uploads under venue load.

## Incident drill

1. Open `/api/health`; stop the launch if it is not HTTP 200 with the expected schema version.
2. Open `/admin/system`; record errors in the last hour and the top fingerprint.
3. If errors increase, pause new sessions and keep existing party rooms in supported mode.
4. Check the Vercel deployment and function logs using the release SHA from the error event.
5. Roll back to the last ready deployment if the issue is release-specific.
6. For database or realtime incidents, disable risky writes, keep the public status honest and preserve the error evidence.
7. After recovery, repeat `/api/health`, the read-only preflight and one Stage + two Controller game flow.
8. Record timeline, impact, root cause, corrective action and owner before the next Venue Night.

## Remaining release gates

- Run the implemented Stage + two isolated Controller certification harness against an isolated preview party; core status remains 0/8 until evidence passes.
- Configure and verify Resend domain delivery for Gmail, Outlook and Yandex.
- Set the MFA encryption key and complete root-admin enrollment, invalid-code and recovery-code checks.
- Canonical `tusa.game` DNS smoke.
- Real device/network Venue Night rehearsal and legal/privacy sign-off.
