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

## Known remaining issues

- UnoTracker still uses local `useState` instead of `useMultiplayerGame` (527 lines, deferred).
- Party room mobile tabs need horizontal scroll on small screens (6 tabs in fixed bottom bar).
- Neon Postgres cold start latency improved but still ~100ms for schema check.
- Stripe payment integration pending (needs Stripe account).
- Push notifications pending (needs VAPID keys).
- Self-serve ad platform deferred to v3+.

## Definition of done for a game

A catalogue card is not considered implemented until two real browser sessions can join the same lobby, ready up, play every phase with private/public state separation, see results, rematch, refresh during an active round and recover without losing role, input or score. The same scenario must pass on one Stage viewport plus at least two 375–430 px controller viewports in RU and EN.
