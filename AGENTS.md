# AGENTS.md — TUSA.game AI Context

## Project Overview

TUSA.game is a real-time party platform with 28 multiplayer games, a PWA experience, and mobile-first design. Built with Next.js 16, React 19, TypeScript, Clerk auth, Neon Postgres, and SSE real-time.

## Quick Start

```bash
npm install          # install dependencies
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm run rag:build    # rebuild RAG index (after code changes)
npm run rag:search "query"  # search codebase semantically
```

## Architecture

```
proxy.ts              — Clerk middleware + auth redirect
next.config.ts        — CSP + security headers
lib/
  live.ts             — SSE event bus
  rate-limit.ts       — In-memory throttle
  parties.ts          — All DB functions + ensurePartySchema()
  i18n.ts             — 28 games × title/desc keys (RU/EN)
  audio.ts            — Web Audio API sound effects
  confetti.ts         — Canvas confetti
  rag/                — RAG indexing + search system
app/
  api/
    games/route.ts    — Game sessions + playerAction
    chat/route.ts     — Chat with retry logic
    live/route.ts     — SSE streaming
  components/
    useGameRole.ts    — useGameRole(participants, userId) → "stage" | "controller"
    useStageGame.ts   — Stage hook: setState, playerActions, clearActions, complete
    useControllerGame.ts — Controller hook: sendAction(type, payload)
    useMultiplayerGame.ts — Generic typed multiplayer hook
    games/            — 28 game components
  party/[inviteCode]/
    PartyRoom.tsx     — Main room: 28-game catalogue, game routing, chat
app/globals.css       — ~3560 lines: brand CSS, game boards, mobile responsive
```

## Stage+Controller Architecture

Every multiplayer game has two views:
- **Stage** (host's phone): uses `useStageGame<T>` — receives `playerActions`, calls `clearActions()`, manages shared state
- **Controller** (player's phone): uses `useControllerGame<T>` — calls `sendAction(actionType, payload)`

Game component signature:
```tsx
export default function GameName({ partyId, sessionId, onSave, role }:
  { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" })
```

## Key Patterns

### Adding a new game
1. Create `app/components/games/NewGame.tsx`
2. Add i18n keys to `lib/i18n.ts` (titleKey, descKey, UI strings)
3. Register in `PartyRoom.tsx` game catalogue array
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

### CSS conventions
- Brand colors: `--lime: #C9FF05`, `--blue: #2D00F7`, `--pink: #FF007F`
- Brutal design: 3px black border, shadow offset, translate on hover
- Fonts: Unbounded (headings), Inter (body), JetBrains Mono (code/chips)
- Mobile: `@media (max-width: 600px)` breakpoints
- Minimum touch target: 44px
- All text via `t()` i18n function

### Database
- All tables via `ensurePartySchema()` — runs on cold start
- Optimized: checks `information_schema.tables` first (skips DDL if exists)
- Neon Postgres via `@neondatabase/serverless`

## Common Issues

### Chat 500 error
Root cause: `ensurePartySchema()` DDL timeout on cold starts. Fix: already optimized with schema check. If recurs, check Neon connection limits.

### Game not receiving controller actions
Check: stage must use `useStageGame`, not `useMultiplayerGame`. Stage must call `clearActions()` after processing. Guard inside `setState(prev)` callback, not outside.

### Stale state in game logic
Never read outer state inside a `for` loop processing `playerActions`. Always use `setState(prev)` callback pattern with checks inside the callback.

## Files to Touch

| Task | Files |
|---|---|
| Add new game | `app/components/games/NewGame.tsx`, `lib/i18n.ts`, `app/party/[inviteCode]/PartyRoom.tsx` |
| Fix game bug | `app/components/games/GameName.tsx` |
| Add API endpoint | `app/api/new-endpoint/route.ts` |
| Modify chat | `app/api/chat/route.ts`, `app/party/[inviteCode]/PartyRoom.tsx` |
| CSS changes | `app/globals.css` |
| i18n strings | `lib/i18n.ts` |
| Database schema | `lib/parties.ts` (ensurePartySchema) |
| Auth rules | `proxy.ts` |
| Real-time | `lib/live.ts`, `app/api/live/route.ts` |

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
