# Core game certification evidence

Evidence is generated only by `tests/e2e/core-certification.spec.ts` against an isolated preview environment. A game may move from `beta` to `certified` only when its JSON evidence matches the current source hash and every required scenario passes.

Required environment:

- `CERTIFICATION_BASE_URL`
- `CERTIFICATION_INVITE_CODE`
- `CERTIFICATION_PARTY_ID`
- `CERTIFICATION_HOST_STORAGE_STATE`
- `CERTIFICATION_WRITE_EVIDENCE=true`

Run the preflight before Playwright. It rejects production URLs, a missing Host state file and a dirty worktree so evidence is always tied to one tested commit:

```bash
npm run test:certification
```

`CERTIFICATION_BASE_URL` is also the Playwright `baseURL`; no local server is started for this command. The harness creates enough isolated Controller contexts to meet each mode's manifest minimum, with at least two controllers and one mobile controller in every run.

Each run uses a Host browser context and two isolated Controller contexts, performs real guest joins and game commands, reconnects, rematch, leave/spectator checks, RU/EN coverage, a mobile viewport, privacy checks and moderation for UGC modes. Evidence contains no cookies, tokens, user names, email addresses, party content or secret game state.

## Current evidence

The 08.11.2026 evidence for all core eight games was captured on an isolated production build (`next start` behind HTTPS, Postgres 16 behind the Neon HTTP protocol, a fresh Host account and party). Realtime ran on the SSE fallback. Before a paid venue night, re-run the same command against a Vercel preview with Ably and a preview database.

The source hash ignores only the manifest `releaseStatus` value, so promoting a game keeps its evidence valid while any other change to the hashed files makes it stale.
