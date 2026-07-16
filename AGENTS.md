# TUSA.game — AI Context & Orchestration Hub

> Multiplayer party platform · Next.js 16 · React 19 · TypeScript · Clerk · Neon Postgres · SSE realtime · 53 routes · 32 games · 32 modes

---

## Quick Start

```bash
npm install          # dependencies
npm run dev          # dev server (localhost:3000)
npm run build        # production build
npm test             # 29 tests (must pass before commit)
npm run lint         # 0 errors required
npm run rag:build    # rebuild RAG index after changes
```

---

## Architecture (TL;DR)

```
proxy.ts             ← Clerk auth + i18n routing (middleware)
next.config.ts        ← CSP + security headers
lib/
  live.ts             ← SSE event bus (Ably prod / in-memory dev)
  parties.ts          ← All DB functions (raw SQL via @neondatabase/serverless)
  games/engine.ts     ← Monolithic server game reducer (legacy, 560 lines)
  games/sdk.ts        ← Game SDK registry (definitions dispatch)
  games/definition.ts ← GameDefinition<TState> type system
  games/definitions/  ← Individual game definitions (8 migrated; remaining migration tracked in readiness audit)
  games/commands.ts   ← Zod validation schemas + SDK dispatch
  games/scoring.ts    ← Server-only score derivation
  i18n.ts             ← 32 modes × RU/EN UI strings
  audio.ts            ← Web Audio API sound effects
  confetti.ts         ← Canvas confetti
  rag/                ← RAG indexing + TF-IDF search (911 chunks)
  rate-limit.ts       ← Throttle (Upstash Redis prod / in-memory dev)
  guest-session.ts    ← HMAC guest auth (import "server-only")
app/
  api/games/route.ts  ← Game sessions + player actions + SSE publish + version locking
  api/chat/route.ts   ← Chat with retry + idempotency
  api/live/route.ts   ← SSE streaming endpoint
  components/
    useStageGame.ts   ← Stage hook (processes playerActions, restores state from DB)
    useControllerGame.ts ← Controller hook (sendAction, restores state from DB)
    useLiveStream.ts  ← SSE hook with 3s reconnect
    useGameRole.ts    ← "stage" | "controller" detection
    games/*.tsx       ← 32 game/mode components
  party/[inviteCode]/PartyRoom.tsx ← Main room (manifest-driven game catalogue)
app/globals.css       ← ~3980 lines brand CSS, brutal design, mobile-first
```

---

## For LLMs / Bots

### How to read this codebase

1. **Start with AGENTS.md** (this file) — it's the orchestration hub
2. **Use RAG search** to find relevant code:
   ```bash
   npm run rag:search "chat input" --type component
   npm run rag:search "useStageGame" --type hook
   npm run rag:search "game session" --type route
   ```
3. **Follow the dependency chain**: middleware → API route → lib function → DB
4. **Check opencode.json** for available skill workflows

### Key entry points

| Purpose | File |
|---|---|
| Auth + routing | `proxy.ts` |
| Game server reducer (legacy) | `lib/games/engine.ts` |
| Game SDK definitions (migrated) | `lib/games/definitions/*.ts` |
| Game SDK registry | `lib/games/sdk.ts` |
| API route (games) | `app/api/games/route.ts` |
| SSE realtime | `lib/live.ts` + `app/api/live/route.ts` |
| DB schema + queries | `lib/parties.ts` |
| State hooks | `app/components/use{Stage,Controller,Multiplayer}Game.ts` |
| CSS global | `app/globals.css` |
| i18n strings | `lib/i18n.ts` |
| Party room UI | `app/party/[inviteCode]/PartyRoom.tsx` |

### RAG index structure

- **911 chunks** across 9 types: `docs`, `component`, `utility`, `game`, `route`, `css`, `hook`, `config`, `type`
- Index stored at `.rag/index.json` (~6 MB, auto-generated, gitignored)
- **Always rebuild after changes**: `npm run rag:build`

---

## For Developers

### Conventions

- **No comments** in code unless essential — let types and naming speak
- **Brutal CSS**: 3px black border, shadow offset, translate on hover
- **Mobile-first**: `@media (max-width: 600px)` breakpoints
- **Touch targets**: minimum 44px
- **i18n**: All user-facing text via `t()` function from `useLocale()`
- **Never white text on lime background** — enforce `color: var(--black)`

### Game architecture

Every multiplayer game has two views:
- **Stage** (host): `useStageGame<T>()` — receives `playerActions`, manages shared state, restores from DB on mount
- **Controller** (player): `useControllerGame<T>()` — `sendAction(type, payload)`, restores from DB on mount

Component signature:
```tsx
export default function Game({ partyId, sessionId, onSave, role }:
  { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" })
```

### Adding a new game

1. Create `app/components/games/NewGame.tsx` (game component)
2. Add i18n keys to `lib/i18n.ts`
3. Create `lib/games/definitions/NewGame.ts` (server definition)
4. Register in `lib/games/sdk.ts`
5. Register in `PartyRoom.tsx` (catalogue array + import + render)
6. Build, test, rebuild RAG

### Testing

```bash
npm test             # 29 tests (game engine, routes, security)
npm run test:e2e     # Playwright E2E (requires install)
```

### Common issues

| Symptom | Root cause | Fix |
|---|---|---|
| Chat 500 | Schema DDL timeout on cold start | Already optimized (checks `information_schema` first) |
| Game not receiving actions | Wrong hook | Stage must use `useStageGame`, not `useMultiplayerGame` |
| 409 Conflict | Version lock | Retry optimistic concurrency in API route |
| Controller sees stale state | No state restore | All hooks fetch `GET /api/games?sessionId=X` on mount |
| SSE silent disconnect | No reconnect | All hooks reconnect on error with 3s retry |
| White on lime | Missing color rule | Add `color: var(--black)` |
| Customization error | Unlocked check | Cosmetics with unchanged values now skip permission check |

---

## For Vibecoding

"Just tell me what you want" patterns:

```
"Add a new game called [name] that's like [description]"
→ Uses add-game skill, creates component + definition + i18n + PartyRoom registration

"Fix the [game name] game, [describe the bug]"
→ Uses fix-game-bug skill, identifies hook/state/engine issue

"Make the [component] look like [description]"
→ Edit CSS in app/globals.css, follow brand conventions

"Add an API endpoint for [purpose]"
→ Create app/api/[name]/route.ts, add DB function in lib/parties.ts, add rate limiting
```

---

## Files to Touch (Quick Reference)

| Task | Files |
|---|---|
| Add new game | `app/components/games/NewGame.tsx`, `lib/i18n.ts`, `lib/games/definitions/NewGame.ts`, `lib/games/sdk.ts`, `PartyRoom.tsx` |
| Fix game bug | `app/components/games/GameName.tsx` |
| Fix game engine | `lib/games/definitions/GameName.ts`, `lib/games/engine.ts` |
| Game SDK | `lib/games/definition.ts`, `lib/games/sdk.ts`, `lib/games/definitions/*.ts` |
| Add API endpoint | `app/api/new-endpoint/route.ts`, `lib/parties.ts` |
| Modify chat | `app/api/chat/route.ts`, `PartyRoom.tsx` |
| CSS changes | `app/globals.css` |
| i18n strings | `lib/i18n.ts` |
| Database schema | `lib/parties.ts` (ensurePartySchema DDL) |
| Auth rules | `proxy.ts` |
| Real-time | `lib/live.ts`, `app/api/live/route.ts` |
| SEO page | `app/games/page.tsx`, `app/faq/page.tsx`, `app/about/page.tsx` |
| SEO landing | `app/use-cases/*/page.tsx` |
| Hook fix | `app/components/use{Stage,Controller,Multiplayer}Game.ts`, `useLiveStream.ts` |
| RAG rebuild | `npm run rag:build` |

---

## Reference Docs

| Doc | Location | Purpose |
|---|---|---|
| 👑 Production Readiness | `docs/PRODUCTION_READINESS_AUDIT.md` | 32-game certification matrix, infrastructure audit, security posture |
| 🧭 Current Implementation Status | `docs/IMPLEMENTATION_STATUS_2026-07-16.md` | Current git/doc/production checkpoint and next implementation order |
| 📈 Growth OS | `docs/TUSA_GROWTH_OPERATING_SYSTEM.md` | Full SEO/GEO/AEO strategy, 18 sections |
| ✅ Platform Audit | `docs/PLATFORM_AUDIT.md` | Platform completion vs style guide + PRD |
| 🎯 Master Plan (RU) | `docs/PLAN.md` | 807-line general plan for full readiness |
| 💰 Monetization | `docs/TUSA_io_Партнёрства_реклама_монетизация.md` | Partnerships, ads, monetization strategy |
| 🌍 Global Platform | `docs/GLOBAL_SOCIAL_GAMING_PLATFORM_2.0.md` | Strategic proposal |

---

## Available Skills

| Skill | Description | File |
|---|---|---|
| `add-game` | Add a new multiplayer game | `.opencode/skills/add-game.md` |
| `fix-game-bug` | Debug and fix a game component/engine | `.opencode/skills/fix-game-bug.md` |
| `rag-index` | Rebuild RAG index | `.opencode/skills/rag-index.md` |

Load a skill with `opencode use-skill <name>` (or equivalent in your AI tool).

---

## Environment

- **DB**: Neon Postgres via `@neondatabase/serverless` (28 tables, raw SQL + Drizzle)
- **Auth**: Clerk (user accounts) + HMAC guest sessions
- **Realtime**: Ably (production) / SSE in-memory fallback
- **Rate limiting**: Upstash Redis (production) / in-memory fallback
- **Deployment**: Vercel (53 routes, 0 build errors)
- **CI**: GitHub Actions (typecheck → lint → test → build → audit → e2e)
