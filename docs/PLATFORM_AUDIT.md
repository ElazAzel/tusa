# TUSA.game — platform completion audit

Source of truth: `tusa-style-guide-v1.4.html`, product PRD and the 28-mode game development guide.

## Release gates

- Mobile: 375, 390 and 430 px; no horizontal scroll; 44 px minimum touch target; safe-area aware fixed controls.
- Accessibility: keyboard focus, text/icon status in addition to colour, reduced-motion support and usable screen-reader labels.
- Multiplayer: server-authoritative snapshot via SSE; lobby, ready state, active round, results, rematch and match end.
- Devices: each player uses their own controller; the shared Stage never receives private roles or correct answers early.
- Recovery: `playerId + session + roomId`; reconnect restores the last server snapshot and deadline-derived default action.
- Spectators: joining after lock/start opens the public Stage view without leaking private state.
- Host controls: start, pause, resume, skip, kick, moderation, family/adult preset and timer settings.
- Locales: every game and system state is complete in RU and EN.

## Game matrix

| # | Mode | Controller mechanic | Status |
|---:|---|---|---|
| 1 | Alias / Word Blast | private word, team timer, pass/correct | **Stage+Controller**, timer, score |
| 2 | Mafia Lite | private role, night actions, day vote | **Stage+Controller**, role assignment |
| 3 | Werewolf / One Night | private role, timed actions, reveal | **Stage+Controller**, seer result display, night timeout (30s) |
| 4 | Codenames | spymaster board, team guesses | **Stage+Controller**, 4x4 board, clue phase |
| 5 | Spyfall | private location/spy role, vote | **Stage+Controller**, vote timeout |
| 6 | Impostor | private word, bluff and vote | **Stage+Controller**, clue circle + vote |
| 7 | Crocodil / Mime Riot | private prompt, team timer | **Stage+Controller**, streak bonus |
| 8 | Heads Up | private card, gesture fallback | **Stage+Controller**, timer |
| 9 | Quiplash | private prompt, anonymous answers, vote | **Stage+Controller**, answer voting |
| 10 | Fibbage | decoys, answer lock, reveal | **Stage+Controller**, truth reveal |
| 11 | Truth or Dare | private choice, prompt, completion | **Stage+Controller**, mode switch, atomic state |
| 12 | Never Have I Ever | private response, public aggregate | **Stage+Controller**, count tracking |
| 13 | Would You Rather | private vote, live aggregate | **Stage+Controller**, 12 prompts |
| 14 | Two Truths and a Lie | submissions, private vote, reveal | **Stage+Controller**, lie detection |
| 15 | Blank Slate | simultaneous word submit and matching | **Stage+Controller**, match-based scoring |
| 16 | Wavelength | private target, team dial and reveal | **Stage+Controller**, lastGuesser tracking |
| 17 | Brain Burst | locked quiz answers and response time | **Stage+Controller**, anti-double-score guard |
| 18 | Guess the Song | protected audio round and answer lock | **Stage+Controller**, progressive clues |
| 19 | Bomb Party | realtime syllable turn and timeout | **Stage+Controller**, elimination detection |
| 20 | Bunker | private character card, debate and elimination | **Stage+Controller**, trait assignment inside setState, vote timeout (60s) |
| 21 | Wheel of Fate | shared deterministic spin and result | **Stage+Controller**, SVG wheel |
| 22 | Kiss / Marry / Kill | private choices and moderated reveal | **Stage+Controller**, 8 name sets |
| 23 | Charades | private prompt and team scoring | **Stage+Controller**, mime timer |
| 24 | Trivia | questions, locked answers, timer and leaderboard | **Stage+Controller**, anti-double-score guard |
| 25 | Beer Pong | score tracker | Local (host only) |
| 26 | Random Pair | random partner generator | Local (host only) |
| 27 | Uno Tracker | card score tracker | Local (useState) |
| 28 | Quiz Battle | multiplayer quiz answers | **Stage+Controller**, uses useStageGame |

### Supplementary modes (not in 28-mode guide)

| Mode | Status | Notes |
|---|---|---|
| Beer Pong | Local | Score tracker, no multiplayer |
| Random Pair | Local | Random generator, no multiplayer |
| Uno Tracker | Local | useState, not yet converted to useMultiplayerGame |

## High-priority fixes applied (this session)

1. **QuizBattle** — Converted from `useMultiplayerGame` to `useStageGame` with `playerActions` processing (controller answers were silently lost).
2. **AliasGame** — Fixed stale `score` closure in `onSave` via `scoreRef`.
3. **TruthOrDare** — Merged split `setState` calls into single atomic update.
4. **BrainBurst/Trivia** — Moved locked/answered guard inside `setState(prev)` callback to prevent double-scoring.
5. **Wavelength** — Added `lastGuesser` state tracking; credits actual guesser instead of highest scorer.
6. **Codenames** — Moved `revealed` check inside `setState(prev)` callback; disabled buttons properly.
7. **Crocodil** — Moved `streakBonus` computation inside `setState(prev)` callback.
8. **Bunker** — Moved `traitIdx` inside `setState(prev)` callback; added 60s vote timeout.
9. **Werewolf** — Added `seerResult` state (seer can now see investigation results on controller); added 30s night timeout.
10. **BlankSlate** — Score now tracks match count across rounds instead of raw submission count.
11. **Mobile quiz overflow** — Added `word-break: break-word` to `.quiz-options button`.
12. **Party room tabs** — Fixed white-on-white text, added Material icons, `color: var(--muted)`.
13. **Codenames/Wavelength/Wheel fonts** — Increased inline font sizes to 14px/13px minimum.
14. **Quiplash/Fibbage word-break** — Added `word-break: break-word` on user answers.
15. **GuessSong touch target** — Increased input padding for 44px target.
16. **ensurePartySchema()** — Added `information_schema.tables` check; skips 48 DDL statements on warm starts.

## Infrastructure fixes applied

17. **SSE reconnect** — All hooks (`useStageGame`, `useControllerGame`, `useMultiplayerGame`, `useLiveStream`) now reconnect on SSE error with 3s retry.
18. **BOLA/IDOR auth guards** — `requirePartyMember()` / `requireOwner()` patched in 13 vulnerable functions.
19. **Version locking** — `version` column on `game_sessions`. Server rejects stale state updates with 409 Conflict.
20. **Rate limiting** — In-memory throttle wired to all 25 API routes (POST 5-30 req/min, GET 60 req/min).
21. **Idempotency** — `client_mutation_id` column + unique constraint on `chat_messages` and `game_scores`. `ON CONFLICT DO NOTHING`.
22. **RSVP counts update** — `updateRsvp()` now processes API response; `rsvpCounts` local state refreshes immediately.
23. **Party SSE channel** — PartyRoom subscribes to `party:<id>` channel. Games API publishes session events to it. All members see Join button in real-time.
24. **State restoration on mount** — All three game hooks fetch current session state from DB on mount. Controllers joining mid-game get correct state.
25. **Hardcoded promo codes removed** — `ensurePartySchema()` no longer inserts `ELAZ`, `JEDAI`, `TUSA02` promo codes.
26. **White text on lime fixed** — Nav tab buttons in party cover changed from `color: var(--white)` to `color: var(--black)`.

## SEO/GEO/AEO pages deployed

| Page | Schema | Purpose |
|---|---|---|
| `/` | WebApplication + Organization | Landing with hreflang, OG, Twitter |
| `/games` | CollectionPage | Manifest-driven 32-mode catalogue with i18n |
| `/games/[slug]` (32 game pages) | VideoGame | Per-game detail, rules, JSON-LD |
| `/games/for-2-players` … `/games/drinking` (24 pages) | FAQPage | Programmatic SEO — player counts, niches, events, tool queries (RU + EN) |
| `/faq` | FAQPage (7 Q&A) | Expandable FAQ with JSON-LD |
| `/about` | Organization | Mission, story, features, tech |
| `/use-cases/online-parties` | WebPage | "Online party games" SEO landing |
| `/use-cases/remote-teams` | WebPage | "Virtual team building" SEO landing |
| `/use-cases/in-person-parties` | WebPage | "Group party games" SEO landing |
| `/ru/guides/[slug]` (10 guides) | FAQPage | RU guide content — soft-redirects humans to homepage |
| `/en/guides/[slug]` (10 guides) | FAQPage | EN guide content — soft-redirects humans to homepage |
| `/robots.txt` | — | AI-bot permissions (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot) |
| `/sitemap.xml` | — | 80+ entries with priorities (games, guides, programmatic, use-cases) |

## TUSA Growth Operating System

Full 18-section strategic document at `docs/TUSA_GROWTH_OPERATING_SYSTEM.md` (~2500 lines):

Product Vision, Information Architecture, SEO (page-by-page matrix), GEO (ChatGPT/Gemini/Claude/Perplexity), AEO (question clusters, snippets), Knowledge Graph, Semantic SEO, Topic Authority (150+ page plan), Programmatic SEO, EEAT, Technical SEO, Performance, International SEO, AI Crawlers, Social SEO, Growth Engine, Analytics, Backlog.

## Known remaining issues

- UnoTracker still uses local `useState` instead of `useMultiplayerGame` (pass-the-device game, intentional).
- Party room mobile tabs need horizontal scroll on small screens (6 tabs in fixed bottom bar).
- Neon Postgres cold start latency improved but still ~100ms for schema check.
- Stripe payment integration pending (needs Stripe account).
- Push notifications pending (needs VAPID keys).
- Custom domain DNS setup pending.
- Redis/KV layer needed for cross-instance SSE pub/sub.

## Definition of done for a game

A catalogue card is not considered implemented until two real browser sessions can join the same lobby, ready up, play every phase with private/public state separation, see results, rematch, refresh during an active round and recover without losing role, input or score. The same scenario must pass on one Stage viewport plus at least two 375–430 px controller viewports in RU and EN.
