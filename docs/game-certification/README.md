# Core game certification evidence

Evidence is generated only by `tests/e2e/core-certification.spec.ts` against an isolated preview environment. A game may move from `beta` to `certified` only when its JSON evidence matches the current source hash and every required scenario passes.

Required environment:

- `CERTIFICATION_BASE_URL`
- `CERTIFICATION_INVITE_CODE`
- `CERTIFICATION_PARTY_ID`
- `CERTIFICATION_HOST_STORAGE_STATE`
- `CERTIFICATION_WRITE_EVIDENCE=true`

Each run uses a Host browser context and two isolated Controller contexts, performs real guest joins and game commands, reconnects, rematch, leave/spectator checks, RU/EN coverage, a mobile viewport, privacy checks and moderation for UGC modes. Evidence contains no cookies, tokens, user names, email addresses, party content or secret game state.
