# TUSA.game — Production Readiness Audit

**Date**: 2026-07-13
**Branch**: main
**Commit**: cbc6fb8

---

## 1. Game Certification Matrix

Legend:
- **Engine**: `S`=server reducer, `L`=local only, `W`=wrapper (re-exports another)
- **Auth**: `S`=server-authoritative scoring, `C`=client-side scoring
- **CSan**: controller state sanitized for privacy
- **Recon**: reconnect state restore from DB
- **Live**: LIVE badge shown in UI
- **E2E**: Playwright multiplayer E2E exists

| # | Game | ID | Engine | Players | Stage/Ctrl | Server Cmd | Auth Score | Zod | CSan | Timer | Recon | Live | E2E | Status |
|---|------|----|--------|---------|------------|------------|------------|-----|------|-------|-------|------|-----|--------|
| 1 | Alias / Word Blast | alias | L | 2-16 | M (multi) | No | C | No | No | client setTimeout | Yes | Yes | No | **Beta** |
| 2 | Mafia Lite | mafia | L | 5-16 | M (multi) | No | C | No | No | client | Yes | — | No | **Beta** |
| 3 | Werewolf / One Night | werewolf | S | 4-12 | S+C | Yes | S | Yes | Yes | client setTimeout | Yes | Yes | No | **Beta** |
| 4 | Codenames | codenames | S | 4-10 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 5 | Spyfall | spyfall | S | 4-12 | S+C | Yes | S | Yes | Yes | — | Yes | No | No | **Beta** |
| 6 | Impostor | impostor | S | 3-10 | S+C | Yes | S | Yes | Yes | — | Yes | No | No | **Beta** |
| 7 | Crocodil / Mime Riot | crocodil | S | 4-16 | S+C | Yes | S | Yes | Yes | client 200ms | Yes | No | No | **Beta** |
| 8 | Heads Up / Forehead Guess | headsup | S | 2-10 | S+C | Yes | S | Yes | Yes | client 200ms | Yes | No | No | **Beta** |
| 9 | Quiplash / Punchline | quiplash | S | 3-12 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 10 | Fibbage / Fake Fact | fibbage | S | 3-10 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 11 | Truth or Dare | truth | L | 3-20 | M (multi) | No | C | No | No | — | Yes | Yes | No | **Beta** |
| 12 | Never Have I Ever | never | L | 3-20 | M (multi) | No | C | No | No | — | Yes | Yes | No | **Beta** |
| 13 | Would You Rather | wouldRather | S | 3-16 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 14 | Two Truths and a Lie | twoTruths | S | 3-12 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 15 | Blank Slate / Same Word | blankSlate | S | 3-10 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 16 | Wavelength / Spectrum | wavelength | S | 4-12 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 17 | Brain Burst | brainBurst | S | 2-10 | S+C | Yes | S | Yes | Yes | server deadline | Yes | No | No | **Beta** |
| 18 | Guess the Song | guessSong | S | 2-10 | S+C | Yes | S | Yes | Yes | client setTimeout | Yes | No | No | **Beta** |
| 19 | Bomb Party / Word Bomb | bombParty | S | 2-10 | S+C | Yes | S | Yes | Yes | server deadline | Yes | No | No | **Beta** |
| 20 | Bunker | bunker | L | 4-12 | S+C | No | C | No | No | client setTimeout | Yes | Yes | No | **Beta** |
| 21 | Wheel of Fate | wheel | S | 2-20 | S+C | Yes | S | Yes | Yes | client setTimeout | Yes | No | No | **Beta** |
| 22 | Kiss / Marry / Kill | kissMarry | S | 3-10 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 23 | Charades | charades | S | 3-16 | S+C | Yes | S | Yes | Yes | client 200ms | Yes | No | No | **Beta** |
| 24 | Trivia | trivia | S | 2-12 | S+C | Yes | S | Yes | Yes | server deadline | Yes | Yes | No | **Beta** |
| 25 | Beer Pong | beer | L | 2-8 | M (multi) | No | C | No | No | — | Yes | Yes | No | **Beta** |
| 26 | Random Pair | randomPair | L | 2-50 | M (multi) | No | C | No | No | — | Yes | Yes | No | **Beta** |
| 27 | Uno Tracker | uno | S | 2-10 | S+C | Yes | S | Yes | No | — | Yes | Yes | No | **Beta** |
| 28 | Quiz Battle | quiz | S | 2-10 | S+C | Yes | S | Yes | Yes | server deadline | Yes | Yes | No | **Beta** |
| 29 | Cards of Chaos | cardsChaos | S | 3-10 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 30 | Gartic Phone | gartic | S | 4-12 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 31 | Pictionary | pictionary | S | 3-12 | S+C | Yes | S | Yes | Yes | — | Yes | Yes | No | **Beta** |
| 32 | Music Quiz | musicQuiz | W | 2-10 | W→guessSong | — | — | — | — | — | — | — | No | **Beta** |

**Summary**:
- **Server-authoritative (S)**: 24 games
- **Local-only (L)**: 6 games (alias, mafia, truth, never, beer, randomPair, bunker)
- **Client-authoritative scoring (C)**: 6 games
- **Missing LIVE badge**: 9 games
- **Missing controller state sanitization**: 8 games
- **Certified**: 0 games
- **Beta**: 32 games

---

## 2. Infrastructure Matrix

| Component | Status | Production Ready | Fallback | Notes |
|-----------|--------|-----------------|----------|-------|
| **Next.js 16** | ✅ Live | ✅ Yes | — | Turbopack, App Router |
| **React 19** | ✅ Live | ✅ Yes | — | Strict mode enabled |
| **TypeScript** | ✅ Live | ✅ Yes | — | strict mode |
| **Clerk Auth** | ✅ Live | ✅ Yes | Guest sessions | Clerk SDK v7, all CSP domains configured |
| **Guest Sessions** | ✅ Live | ⚠️ Partial | — | HMAC-signed, cookie-based, single-party scope, 30-day expiry |
| **Neon Postgres** | ✅ Live | ⚠️ Partial | — | Serverless driver, connection pooling needed for scale |
| **Drizzle ORM** | ✅ Live | ⚠️ Partial | Raw SQL | Only manages RAG tables (3). Core schema is raw SQL DDL |
| **Ably Realtime** | ✅ Integrated | ⚠️ Partial | In-memory SSE | REST publish + Realtime subscribe. Falls back silently |
| **SSE (in-memory)** | ✅ Live | ❌ No | Ably | `Map<string, Set<Listener>>`. Single-instance only |
| **Upstash Redis** | ✅ Integrated | ⚠️ Partial | In-memory Map | Used only for distributed rate limiting |
| **Rate Limiting** | ✅ Live | ⚠️ Partial | In-memory Map | 2-tier: Upstash → local. 60s cleanup interval |
| **Zod Validation** | ✅ Live | ✅ Yes | — | 27 game command schemas, API input validation |
| **Version Locking** | ✅ Live | ✅ Yes | — | `version` column + 409 Conflict |
| **Idempotency** | ✅ Live | ✅ Yes | — | `clientMutationId` + unique constraint |
| **PWA / SW** | ✅ Live | ⚠️ Partial | — | Skip-waiting added, offline fallback exists |
| **CSP** | ✅ Live | ⚠️ Partial | — | `unsafe-inline` + `unsafe-eval` needed by Clerk |
| **CI Pipeline** | ✅ Live | ✅ Yes | — | GitHub Actions: typecheck, lint, test, build, e2e |
| **Unit Tests** | ✅ Live | ⚠️ Partial | — | 31 tests (node:test), covers 19 game engines |
| **E2E Tests** | ✅ Live | ❌ No | — | 68 tests, but NO multiplayer game E2E |
| **Playwright** | ✅ Integrated | ⚠️ Partial | — | Chromium only, single worker, no mobile Safari / Android |
| **Error Monitoring** | ❌ Not configured | ❌ No | — | No Sentry / logging service |
| **Analytics** | ❌ Not configured | ❌ No | — | No typed analytics events |
| **Load Testing** | ❌ Not done | ❌ No | — | No k6/artillery scripts |
| **SLO Monitoring** | ❌ Not configured | ❌ No | — | No dashboard |

---

## 3. Dead Code / Cleanup Candidates

### 3.1 Unused i18n Keys (~400 keys)

The following keys are defined in `lib/i18n.ts` but never referenced via `t()`:

**Game UI (superseded by game-local i18n)**:
- `blankSlateGuess`, `blankSlateReveal`, `blankSlateSubmit`, `blankSlateWord`
- `bombCut`, `bombDefused`, `bombExplode`, `bombLetter`, `bombSubmit`
- `brainBurstAnswer`, `brainBurstCorrect`, `brainBurstPoints`, `brainBurstQuestion`, `brainBurstWrong`
- `bunkerArgue`, `bunkerDoor`, `bunkerEliminate`, `bunkerResult`, `bunkerSurvive`, `bunkerVote`
- `cardsAnswer`, `cardsDraw`, `cardsRead`, `cardsReveal`, `cardsTitle`
- `charadesActive`, `charadesActor`, `charadesCorrect`, `charadesGuess`, `charadesPass`, `charadesStart`
- `codenamesAssassin`, `codenamesClue`, `codenamesEndTurn`, `codenamesEnterClue`, `codenamesGuess`, `codenamesPick`, `codenamesSpymaster`, `codenamesTeamA`, `codenamesTeamB`, `codenamesWordsLeft`
- `crocodilAction`, `crocodilCorrect`, `crocodilGuess`, `crocodilMime`, `crocodilPass`, `crocodilStart`
- `fibbageLie`, `fibbageQuestion`, `fibbageReveal`, `fibbageSubmit`, `fibbageTruth`, `fibbageVote`
- `garticDescribe`, `garticDraw`, `garticPhase1`, `garticPhase2`, `garticPhase3`
- `guessSongAnswer`, `guessSongArtist`, `guessSongCorrect`, `guessSongListen`, `guessSongReveal`, `guessSongTitle`
- `headsupActive`, `headsupCorrect`, `headsupSkip`, `headsupStart`, `headsupTeam`, `headsupYourTurn`
- `impostorClue`, `impostorGuess`, `impostorReveal`, `impostorSubmit`, `impostorVote`, `impostorWord`, `impostorYouAre`
- `kissMarryKill`, `kissMarryReveal`, `kissMarrySubmit`
- `musicQuizAnswer`, `musicQuizCorrect`, `musicQuizListen`, `musicQuizReveal`
- `pictionaryArtist`, `pictionaryCorrect`, `pictionaryDraw`, `pictionaryPass`, `pictionaryWord`
- `quiplashAnswer`, `quiplashPrompt`, `quiplashReveal`, `quiplashVote`, `quiplashWinner`
- `spyfallAccuse`, `spyfallAsk`, `spyfallCallVote`, `spyfallGuessLocation`, `spyfallLocation`, `spyfallReveal`, `spyfallSpy`, `spyfallTurn`, `spyfallVote`, `spyfallYouAre`
- `triviaAnswer`, `triviaCorrect`, `triviaNext`, `triviaQuestion`, `triviaWrong`
- `twoTruthsReveal`, `twoTruthsShow`, `twoTruthsSubmit`, `twoTruthsVote`
- `wavelengthClue`, `wavelengthReveal`, `wavelengthScale`, `wavelengthTarget`, `wavelengthVote`
- `werewolfAlive`, `werewolfDay`, `werewolfDead`, `werewolfDiscuss`, `werewolfDoctor`, `werewolfInvestigate`, `werewolfKill`, `werewolfMafia`, `werewolfNight`, `werewolfPass`, `werewolfReveal`, `werewolfSave`, `werewolfSeer`, `werewolfSubmit`, `werewolfVillager`, `werewolfVote`, `werewolfYouAre`
- `wheelResult`, `wheelSpin`, `wheelStop`
- `wouldRatherA`, `wouldRatherB`, `wouldRatherQuestion`, `wouldRatherReveal`, `wouldRatherVote`

**Feature/UI keys (may be for future features)**:
- `roomAdultGame`, `roomChoose`, `roomFamilyGame`, `roomSend`, `roomWrite`, `roomYou`
- `chatCancelVoice`, `chatReact`, `chatRecording`
- `dailyPlay`, `dailyPlayed`
- `demoEventCreated`, `demoEventDeleted`, `demoEventDuplicated`, `demoLastEvent`, `demoMetaDesc`, `demoMetaTitle`, `demoToastLink`, `demoToastReset`, `demoXpGain`, `demoXpLabel`
- `eventHubBlastTitle`, `eventHubNotesTitle`, `eventHubPass`, `eventHubShoppingTitle`
- `faqMetaDesc`, `faqMetaTitle`
- `gameActiveSessions`, `gameNoActive`, `gameParticipants`, `gamePaymentAssigned`, `gamePaymentBy`, `gamePaymentSelf`, `gamePaymentWho`, `gameResumeSession`, `gameYouJoined`
- `gratitudeFrom`, `gratitudeTab`, `gratitudeTo`
- `highlightTab`
- `landingDesc`, `landingTitle`, `language`, `ogDesc`, `ogTitle`, `ogTitleAlt`
- `passProgress`, `passXpEarned`
- `profileBeta`, `profileBlack`, `profileCodeTitle`, `profileColor`, `profileCover`, `profileCovers`, `profileEffect`, `profileEffects`, `profileFrame`, `profileFramePick`, `profileGlow`, `profileKicker`, `profileLime`, `profileMidnight`, `profileNeon`, `profileNoEffect`, `profileNoFrame`, `profilePink`, `profileSparkle`
- `questCompleted`, `questDescHostParty`, `questDescPlayGames`, `questDescThankOthers`, `questDescWinRounds`, `questHostParty`, `questPlayGames`, `questProgress`, `questReward`, `questThankOthers`, `questWinRounds`, `questsTab`
- `quizYouAnswered`
- `rewardsChat`, `rewardsFriendAdd`, `rewardsGamePlay`, `rewardsGameWin`, `rewardsPhoto`, `rewardsStreak`
- `scheduleDate`, `scheduleRemind`, `scheduleReminded`, `scheduleSave`, `scheduleTab`, `scheduleTime`, `scheduleTitle`
- `spectatorCount`, `spectatorJoin`, `spectatorNoBet`, `spectatorTitle`
- `themeAccent`, `themeApply`, `themeBg`, `themeColor`, `themeTab`
- `install`, `copied`, `moreTab`, `tools`, `saving`, `cancel`
- All `adminLogin*`, `adminPromo*`, `adminTab*` keys (~100 keys, admin panel)
- `privacyDesc`, `termsDesc`

### 3.2 Legacy / Deprecated Code

| Item | Location | Reason |
|------|----------|--------|
| `.chat-tool-btn` CSS class | app/globals.css | Removed in cbc6fb8, replaced by `.chat-emoji-btn` + `.chat-send-btn` |
| `.party-chat > div:last-child` | app/globals.css | Removed in cbc6fb8, replaced by `.chat-input-bar` |
| `lib/rate-limit.ts` local Map | lib/rate-limit.ts | Fallback only. Primary is Upstash Redis |
| `lib/live.ts` local Map channels | lib/live.ts | Fallback only. Primary is Ably |
| `ensurePartySchema()` runtime DDL | lib/parties.ts | Should be migrated to versioned Drizzle migrations |
| Game-local i18n (17 games) | app/components/games/*.tsx | Duplicates global `lib/i18n.ts` keys. Should use global `t()` |
| Inline RU/EN prompt arrays | Multiple game files | Should be extracted to content files |

### 3.3 Duplicate / Wrapper Components

| File | Wraps | Reason |
|------|-------|--------|
| `MafiaGame.tsx` | Werewolf | Comment: "keeping one engine" |
| `MusicQuiz.tsx` | GuessSong | Comment: "content packs differ at catalogue level" |

---

## 4. Critical Issues

### P0 — Production Blockers

1. **[realtime] SSE is single-instance without Ably**: `lib/live.ts` falls back to in-memory `Map<string, Set<Listener>>` when `ABLY_API_KEY` is unset. On multi-instance Vercel deploys, SSE events from one instance never reach clients connected to another instance.

2. **[rate limiting] In-memory fallback is also single-instance**: Same issue — `lib/rate-limit.ts` falls back to a local `Map` when Upstash Redis env vars are not configured.

3. **[auth] No E2E reconnect test**: No automated test verifies that a player reconnecting after disconnect or page refresh sees the correct game state, can continue playing, and doesn't break the session.

4. **[games] 6 games are client-authoritative**: `alias`, `mafia`, `truth`, `never`, `beer`, `randomPair`, `bunker` score and state are fully client-side. Players can cheat trivially via DevTools.

5. **[games] Stale state in action processing**: 7 games (UnoTracker, GarticPhone, Pictionary, Codenames, Bunker, Werewolf, GuessSong) read outer `state.xxx` inside the action processing loop instead of inside `setState(prev)` callback.

6. **[database] Runtime DDL**: `ensurePartySchema()` and `ensurePartyV2()` execute `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS` at cold start. While optimized with `information_schema` check, this is not a production migration strategy.

### P1 — High Priority

1. **[UX] 9 game components missing LIVE badge**: BombParty, BrainBurst, Charades, Crocodil, GuessSong, HeadsUp, Impostor, Spyfall, Wheel — controllers don't see a visual indicator that the session is active.

2. **[i18n] Game-local translations bypass global system**: 17 games define `RU`/`EN` objects directly in the component instead of using `t()` from `useLocale`. Codenames, GuessSong, Wheel, Werewolf, Bunker have custom `t()` functions.

3. **[i18n] Prompt asymmetry**: TruthOrDare (EN: 215 prompts, RU: ~46), NeverHaveIEver (EN: 126, RU: 26), Pictionary (EN: 8, RU: 8).

4. **[tests] No multiplayer game E2E tests**: Playwright tests only cover public UX and responsive layout. No multi-context (Stage + 3 controllers) game flow is tested.

5. **[tests] No error handling tests**: 0 out of 32 game components have `try/catch`. All error handling is delegated to hooks which silently catch errors.

6. **[state] UnoTracker no completion guard**: Fires `stage.complete(); onSave(1)` in a `useEffect` without a `completed.current` ref guard — could fire twice in strict mode.

### P2 — Medium Priority

1. **[monorepo] No error monitoring**: No Sentry, no logging service.
2. **[analytics] No typed events**: No analytics infrastructure at all.
3. **[monitoring] No performance monitoring**: No RUM, no API latency tracking.
4. **[infra] Drizzle underutilized**: Only 3 RAG tables. All 28+ business tables are raw SQL DDL.
5. **[e2e] Playwright single browser**: Chromium only. No mobile Safari, no Firefox.
6. **[performance] No bundle analysis**: No `@next/bundle-analyzer` or similar.
7. **[a11y] No WCAG audit**: No accessibility testing.

---

## 5. Architecture Snapshot

```
┌──────────────────────────────────────────────┐
│              proxy.ts (Middleware)             │
│  Clerk auth → guest cookie fallback           │
├──────────────────────────────────────────────┤
│          39 API Routes                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ games  │ │ chat   │ │ live   │ │ parties│  │
│  │ 3 rts  │ │ 1 rt   │ │ 1 rt   │ │ 6 rts  │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ profile│ │ koins  │ │ shop   │ │ admin  │  │
│  │ 5 rts  │ │ 1 rt   │ │ 1 rt   │ │ 7 rts  │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
├──────────────────────────────────────────────┤
│          Database (Neon PostgreSQL)            │
│  28 tables via raw SQL + 3 via Drizzle         │
├──────────────────────────────────────────────┤
│          Realtime (dual mode)                  │
│  Ably (primary) ←→ SSE /api/live (fallback)   │
├──────────────────────────────────────────────┤
│          Rate Limiting (dual mode)             │
│  Upstash Redis (primary) ←→ in-memory (local) │
├──────────────────────────────────────────────┤
│    32 Game Components (app/components/games/)  │
│  24 server-authoritative (engine.ts reducers)  │
│   6 local-only (client state)                  │
│   2 wrappers                                   │
├──────────────────────────────────────────────┤
│    10 React Hooks (app/components/)            │
│  useStageGame / useControllerGame              │
│  useMultiplayerGame / useLiveStream            │
│  useGameRole / useLocale / etc.                │
└──────────────────────────────────────────────┘
```

---

## 6. Security Posture

| Category | Status | Notes |
|----------|--------|-------|
| **BOLA/IDOR** | ✅ Protected | `requirePartyMember()` + `requireOwner()` in all vulnerable routes |
| **XSS** | ⚠️ Partial | CSP blocks inline scripts except Clerk's domains |
| **CSRF** | ✅ Protected | Clerk provides CSRF tokens |
| **SQL Injection** | ✅ Protected | Parameterized queries via `@neondatabase/serverless` tagged templates |
| **Auth** | ✅ Protected | Clerk middleware + guest HMAC-signed tokens |
| **Rate Limiting** | ✅ Protected | All API routes rate-limited (distributed + local fallback) |
| **Command Validation** | ✅ Protected | Zod schemas for all 27 server-authoritative games |
| **Idempotency** | ✅ Protected | `clientMutationId` unique constraints |
| **Version Locking** | ✅ Protected | Optimistic concurrency with 409 Conflict |
| **Input Size Limits** | ✅ Protected | Text max lengths, drawing point caps (2200-2500) |
| **Economy** | ⚠️ Partial | Server-side KOINS, but no formal audit trail |
| **CSP** | ⚠️ Partial | `unsafe-inline` + `unsafe-eval` present |
| **Payment** | ❌ Not started | No Stripe integration yet |
| **Moderation** | ❌ Not started | No report/kick/mute functionality |
| **Content Safety** | ❌ Not started | No family/adult presets |

---

## 7. Test Coverage Gap Analysis

| Area | Unit | Integration | E2E | Notes |
|------|------|-------------|-----|-------|
| **Game engine reducers** | 19/33 games | ❌ | ❌ | Missing for 14 games + 6 local-only |
| **Game commands (Zod)** | ❌ | ❌ | ❌ | No schema validation tests |
| **Game privacy (sanitization)** | ❌ | ❌ | ❌ | No state leak tests |
| **Guest join flow** | ❌ | ❌ | ❌ | No E2E for join → play |
| **Multiplayer game session** | ❌ | ❌ | ❌ | No multi-context Playwright tests |
| **Reconnect** | ❌ | ❌ | ❌ | No disconnect/reconnect test |
| **Host migration** | ❌ | ❌ | ❌ | Not implemented |
| **Rate limiting** | ❌ | ❌ | ❌ | No throttle tests |
| **Idempotency** | ❌ | 1 (static) | ❌ | Static analysis only, no runtime test |
| **API validation** | ❌ | ❌ | ❌ | No Zod schema E2E |
| **Mobile responsive** | — | — | 64 cases | Parametric, 8 widths × 8 routes |
| **Public UX** | — | — | 3 cases | Catalogue, sign-up, cookie consent |
| **Service Worker** | — | — | 1 case | Manifest not intercepted |

---

## 8. Roadmap Gaps vs Current State

| Sprint | Target | Current State | Gap |
|--------|--------|---------------|-----|
| **Sprint 1** | Audit + classification | ✅ Complete | This document exists |
| **Sprint 2** | Guest-first onboarding | ⚠️ 80% complete | Guest identity exists, but no account prompt after first game, no device recovery token, no refresh edge cases |
| **Sprint 3** | Unified Game SDK | ⚠️ 60% complete | Monolithic reducer, no `GameDefinition` type per game, no typed state per game |
| **Sprint 4-5** | 8 certified games | ❌ 0% | All 32 games in Beta, none Certified |
| **Sprint 6** | Realtime abstraction | ⚠️ 50% | Dual mode exists (Ably + SSE), but no telemetry, no heartbeat, no exponential backoff in reconnect |
| **Sprint 7** | Database migrations | ❌ 20% | 2 Drizzle migrations exist (RAG tables + idempotency). 28 business tables still use runtime DDL |
| **Sprint 8** | Analytics + monitoring | ❌ 0% | No analytics events, no error monitoring, no SLO dashboard |
| **Sprint 9** | UX simplification | ❌ 10% | Room has 8+ tabs, no Before/Live/After separation |
| **Sprint 10** | Security + moderation | ❌ 10% | CSP, rate limiting, auth exist. No moderation, no content safety, no host controls |
| **Sprint 11** | SEO/i18n routes | ❌ 30% | Landing pages exist. No URL-based locale, no individual game pages |
| **Sprint 12** | Load testing + beta | ❌ 0% | No load testing infrastructure |
