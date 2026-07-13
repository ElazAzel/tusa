# AGENTS.md — TUSA.game AI Context

## Project Overview

TUSA.game is a real-time party platform with 28 multiplayer games, a PWA experience, and mobile-first design. Built with Next.js 16, React 19, TypeScript, Clerk auth, Neon Postgres, and SSE real-time.

53 routes, 0 build errors. Deployed at https://tusa.game.

## Quick Start

```bash
npm install          # install dependencies
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npx next build       # verify build
```

## Architecture

```
proxy.ts              — Clerk middleware + auth redirect + i18n routing
next.config.ts        — CSP + security headers
lib/
  live.ts             — SSE event bus (in-memory, needs Redis for multi-instance)
  rate-limit.ts       — In-memory throttle (wired to all 25 API routes)
  parties.ts          — All DB functions + ensurePartySchema() + idempotent mutations
  i18n.ts             — 32 modes × title/desc keys + game UI strings (RU/EN)
  audio.ts            — Web Audio API sound effects
  confetti.ts         — Canvas confetti
  rag/                — RAG indexing + search system (527 chunks, 10k terms)
app/
  api/
    games/route.ts    — Game sessions + playerAction + version locking + party SSE publish
    chat/route.ts     — Chat with retry logic + idempotency (clientMutationId)
    live/route.ts     — SSE streaming endpoint
  components/
    useGameRole.ts    — useGameRole(participants, userId) → "stage" | "controller"
    useStageGame.ts   — Stage hook: state restore from DB, setState, playerActions, clearActions, complete
    useControllerGame.ts — Controller hook: state restore from DB, sendAction(type, payload)
    useMultiplayerGame.ts — Generic typed multiplayer hook with state restore
    useLiveStream.ts  — SSE hook with reconnect (3s retry)
    games/            — 28 game components
  party/[inviteCode]/
    PartyRoom.tsx     — Main room: manifest-driven 32-mode catalogue, game routing, chat, party realtime channel
app/globals.css       — ~3600 lines: brand CSS, game boards, mobile responsive, .games-grid, .faq-*
```

## Stage+Controller Architecture

Every multiplayer game has two views:
- **Stage** (host's phone): uses `useStageGame<T>` — receives `playerActions`, calls `clearActions()`, manages shared state. RESTORES state from DB on mount/reconnect.
- **Controller** (player's phone): uses `useControllerGame<T>` — calls `sendAction(actionType, payload)`. RESTORES state from DB on mount/reconnect.

Game component signature:
```tsx
export default function GameName({ partyId, sessionId, onSave, role }:
  { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" })
```

## Key Patterns

### Adding a new game
1. Create `app/components/games/NewGame.tsx`
2. Add i18n keys to `lib/i18n.ts` (titleKey, descKey, UI strings)
3. Register in `PartyRoom.tsx` game catalogue array (add GameId type, import, render, catalogue entry)
4. Use `useStageGame`/`useControllerGame` for multiplayer
5. Call `onSave(numericScore)` at game end

### State management pattern
```tsx
// Stage processes ALL actions, not just last
useEffect(() => {
  if (playerActions.length === 0) return;
  for (const a of playerActions) {
    if (a.actionType === "someAction") {
      setState((prev) => {
        // CHECK INSIDE CALLBACK to prevent double-processing
        if (prev.locked[a.userId]) return prev;
        return { ...prev, /* update */ };
      });
    }
  }
  clearActions();
}, [playerActions, setState, clearActions]);
```

### SSE reconnect pattern
All hooks (`useStageGame`, `useControllerGame`, `useMultiplayerGame`, `useLiveStream`) use:
```ts
es.onerror = () => {
  es.close();
  reconnectTimer = setTimeout(connect, 3000);
};
```

### State restoration on mount
All three game hooks fetch current state from DB on mount:
```ts
fetch(`/api/games?sessionId=${sessionId}`)
  .then((r) => r.json())
  .then((data) => {
    if (data.session?.state && Object.keys(data.session.state).length > 0) {
      if (data.session.version) versionRef.current = data.session.version;
      _setState((prev) => ({ ...prev, ...data.session.state }));
    }
  }).catch(() => undefined);
```

### Party-level SSE channel
PartyRoom subscribes to `party:<id>` SSE channel for real-time session events:
- `session:created` — new game session appears for all party members
- `session:updated` — player joins/leaves session
- `session:completed` — session removed from active list

Games API publishes to both `game:<sessionId>` AND `party:<partyId>` channels.

### Version locking (optimistic concurrency)
`game_sessions` has a `version` column. Stage increments version on each state update.
Server rejects stale updates with 409 Conflict. Hooks track `versionRef.current`.

### Idempotency
`client_mutation_id` column + unique constraint on `chat_messages` and `game_scores`.
`ON CONFLICT DO NOTHING` + fallback SELECT. Chat + games API routes auto-generate `mutationId`.

### CSS conventions
- Brand colors: `--lime: #C9FF05`, `--blue: #2D00F7`, `--pink: #FF007F`, `--white: #fff`, `--black: #000`, `--cream: #F7F7F2`, `--gray: #a3a3a3`, `--dark: #262626`, `--red: #f87171`
- Brutal design: 3px black border, shadow offset, translate on hover
- Fonts: Unbounded (headings), Inter (body), JetBrains Mono (code/chips)
- Mobile: `@media (max-width: 600px)` breakpoints
- Minimum touch target: 44px
- All text via `t()` i18n function
- **Never white text on lime background** — enforce `color: var(--black)` on lime backgrounds

### Database
- All tables via `ensurePartySchema()` — runs on cold start
- Optimized: checks `information_schema.tables` first (skips DDL if exists)
- Neon Postgres via `@neondatabase/serverless`
- Tables: `parties`, `party_members`, `chat_messages`, `game_sessions`, `game_scores`, `party_shopping_items`, `gallery_photos`, `koins_ledger`, `bets`, `promo_codes`, `promo_redemptions`, `engagement_rewards`, `notes`, `user_profiles`, `friends`

## Common Issues

### Chat 500 error
Root cause: `ensurePartySchema()` DDL timeout on cold starts. Fix: already optimized with schema check (SELECT information_schema first, skip DDL if tables exist).

### Game not receiving controller actions
Check: stage must use `useStageGame`, not `useMultiplayerGame`. Stage must call `clearActions()` after processing. Guard inside `setState(prev)` callback, not outside.

### Stale state in game logic
Never read outer state inside a `for` loop processing `playerActions`. Always use `setState(prev)` callback pattern with checks inside the callback.

### RSVP buttons don't update counts
Fixed: `updateRsvp` now processes API response and updates local `rsvpCounts` state. Counts refresh immediately.

### Multiplayer — players don't see Join button
Fixed: PartyRoom subscribes to `party:<id>` SSE channel. Games API publishes `session:created/updated/completed` to party channel. All members see session changes in real-time.

### Controller joins mid-game — sees wrong state
Fixed: All hooks fetch current session state from DB on mount (`GET /api/games?sessionId=X`) and restore it.

### SSE disconnects silently
Fixed: All hooks (`useLiveStream`, `useStageGame`, `useControllerGame`, `useMultiplayerGame`) now reconnect on error with 3s retry.

## SEO/GEO/AEO Pages

| Page | Purpose |
|---|---|
| `/` | Landing — WebApplication + Organization JSON-LD, hreflang |
| `/games` | 32-mode catalogue — CollectionPage schema |
| `/games/[slug]` (future) | Individual game pages — Game schema |
| `/faq` | 7 Q&As — FAQPage JSON-LD |
| `/about` | Mission/story — Organization schema |
| `/use-cases/online-parties` | SEO landing — online party games |
| `/use-cases/remote-teams` | SEO landing — virtual team building |
| `/use-cases/in-person-parties` | SEO landing — group party games |
| `/robots.txt` | AI-bot permissions (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot) |
| `/sitemap.xml` | 11+ entries with priorities |

Full strategy: `docs/TUSA_GROWTH_OPERATING_SYSTEM.md` (18 sections, ~2500 lines).

## Files to Touch

| Task | Files |
|---|---|
| Add new game | `app/components/games/NewGame.tsx`, `lib/i18n.ts`, `app/party/[inviteCode]/PartyRoom.tsx` |
| Add game to SDK | `lib/games/definitions/GameName.ts`, `lib/games/sdk.ts` (register) |
| Fix game bug | `app/components/games/GameName.tsx` |
| Fix game engine | `lib/games/definitions/GameName.ts`, `lib/games/engine.ts` |
| Game SDK | `lib/games/definition.ts`, `lib/games/sdk.ts`, `lib/games/definitions/*.ts` |
| Add API endpoint | `app/api/new-endpoint/route.ts` |
| Modify chat | `app/api/chat/route.ts`, `app/party/[inviteCode]/PartyRoom.tsx` |
| CSS changes | `app/globals.css` |
| i18n strings | `lib/i18n.ts` |
| Database schema | `lib/parties.ts` (ensurePartySchema) |
| Auth rules | `proxy.ts` |
| Real-time | `lib/live.ts`, `app/api/live/route.ts` |
| SEO page | `app/games/page.tsx`, `app/faq/page.tsx`, `app/about/page.tsx` |
| SEO landing | `app/use-cases/*/page.tsx` |
| Robots | `app/robots.ts` |
| Sitemap | `app/sitemap.ts` |
| Layout (JSON-LD) | `app/layout.tsx` |
| Hook fix | `app/components/use{Stage,Controller,Multiplayer}Game.ts`, `useLiveStream.ts` |

## RAG System

After making code changes, rebuild the index:
```bash
npm run rag:build
```

Search the codebase:
```bash
npm run rag:search "how multiplayer works"
npm run rag:search "chat input" --type component
npm run rag:search "useStageGame" --type hook
npm run rag:search "game session" --type route
```

## TUSA Growth Operating System

Full strategy document at `docs/TUSA_GROWTH_OPERATING_SYSTEM.md` — 18 sections:
Product Vision, Information Architecture, SEO (page-by-page matrix), GEO (ChatGPT/Gemini/Claude/Perplexity), AEO (question clusters, snippets), Knowledge Graph, Semantic SEO, Topic Authority (150+ page plan), Programmatic SEO, EEAT, Technical SEO, Performance, International SEO, AI Crawlers, Social SEO, Growth Engine, Analytics, Backlog.
