# Venue Night runbook

## Release gate

- All eight core game evidence files pass `npm run certification:verify`.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run rag:build` and dependency audit pass.
- Root admin MFA is enabled and recovery codes are held offline.
- Resend verification/reset delivery is checked with Gmail, Outlook and Yandex addresses.
- `npm run check:canonical` passes for `https://tusa.game`.
- Venue load report: 30 clients / 20 minutes, 5xx below 0.5%, join p95 <= 1500 ms, action p95 <= 750 ms, reconnect p95 <= 5 seconds.

## Preview incident drill

1. Record `/api/health` and `/api/admin/system` baselines.
2. Disable the preview Ably credential and verify a visible degraded state without secret leakage.
3. Restore Ably and confirm reconnect p95 returns below five seconds.
4. Trigger one invalid game command and verify a controlled 4xx, not a 5xx.
5. Trigger a signed Resend test webhook and verify the delivery journal transition.
6. Record owner, start/end time, impact, detection, mitigation and follow-up in `docs/evidence`.

## Venue Night

- One host laptop is connected to power and the venue display before doors open.
- A backup hotspot and a second host browser are signed in but idle.
- 15–20 real devices join through the public QR/invite.
- Record join attempts, successful joins within two minutes, game starts, completed rounds, reconnects and reports.
- Stop the pilot on secret-state disclosure, repeated join failure, uncontrolled 5xx growth or any Sev1.
- Success: no Sev1, at least 95% join within two minutes, and at least two completed game sessions.

## Owner actions

DNS changes, Resend domain verification, legal approval and venue scheduling require the platform owner. Technical checks in this runbook do not claim those external actions have happened.
