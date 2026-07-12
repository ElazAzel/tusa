# TUSA.game — platform completion audit

Source of truth: `tusa-style-guide-v1.4.html`, product PRD and the 28-mode game development guide.

## Release gates

- Mobile: 375, 390 and 430 px; no horizontal scroll; 44 px minimum touch target; safe-area aware fixed controls.
- Accessibility: keyboard focus, text/icon status in addition to colour, reduced-motion support and usable screen-reader labels.
- Multiplayer: server-authoritative snapshot; lobby, ready state, active round, results, rematch and match end.
- Devices: each player uses their own controller; the shared Stage never receives private roles or correct answers early.
- Recovery: `playerId + session + roomId`; reconnect restores the last server snapshot and deadline-derived default action.
- Spectators: joining after lock/start opens the public Stage view without leaking private state.
- Host controls: start, pause, resume, skip, kick, moderation, family/adult preset and timer settings.
- Locales: every game and system state is complete in RU and EN.

## Game matrix

| # | Mode | Required controller mechanic | Current product state |
|---:|---|---|---|
| 1 | Alias / Word Blast | private word, team timer, pass/correct | Component exists; multiplayer hardening required |
| 2 | Mafia / Nightfall | private role, night actions, day vote | Component exists; full rules/reconnect audit required |
| 3 | Werewolf / One Night | private role, timed actions, reveal | Missing |
| 4 | Codenames / Code Crack | spymaster board, team guesses | Missing |
| 5 | Spyfall | private location/spy role, vote | Missing |
| 6 | Impostor | private word, bluff and vote | Missing |
| 7 | Crocodil / Mime Riot | private prompt, team timer | Missing |
| 8 | Heads Up | private card, gesture fallback | Missing |
| 9 | Pictionary / Scribble Fight | realtime drawing strokes and guesses | Missing |
| 10 | Quiplash | private prompt, anonymous answers, vote | Missing |
| 11 | Psych / Fibbage | decoys, answer lock, reveal | Missing |
| 12 | Cards of Chaos | hand of cards, judge and reveal | Missing |
| 13 | Truth or Dare | private choice, prompt, completion | Component exists; multiplayer round audit required |
| 14 | Never Have I Ever | private response, public aggregate | Component exists; multiplayer round audit required |
| 15 | Would You Rather | private vote, live aggregate | Missing |
| 16 | Two Truths and a Lie | submissions, private vote, reveal | Missing |
| 17 | Blank Slate | simultaneous word submit and matching | Missing |
| 18 | Wavelength | private target, team dial and reveal | Missing |
| 19 | Brain Burst | locked quiz answers and response time | Quiz component exists; content/rules expansion required |
| 20 | Guess the Song | protected audio round and answer lock | Missing |
| 21 | Bomb Party | realtime syllable turn and timeout | Missing |
| 22 | Gartic Phone | drawing/text chain with private handoff | Missing |
| 23 | Bunker / Bunker Escape | private character card, debate and elimination | Missing |
| 24 | Wheel of Fate | shared deterministic spin and result | Missing |
| 25 | Kiss / Marry / Kill | private choices and moderated reveal | Missing |
| 26 | Charades | private prompt and team scoring | Missing |
| 27 | Music Quiz | protected audio/metadata and locked answers | Missing |
| 28 | Trivia | questions, locked answers, timer and leaderboard | Quiz component can be shared; dedicated packs missing |

Existing extra modes (`Beer Pong`, `Random Pair`, `UNO`) remain supported, but do not replace any of the 28 documented modes. UNO must remain a real synced card game rather than a score-only tracker.

## Current high-priority findings

1. The game catalogue exposes eight modes while the guide specifies 28.
2. The shared game-session API has participant/state primitives, but all modes still need the same lobby/ready/spectator/reconnect contract.
3. Several late CSS media queries contradicted the mobile bottom navigation and reduced touch targets below 44 px.
4. Native selects produced unbranded OS popups in key user flows; profile cosmetics now use accessible branded choices.
5. Shopping prices could overflow narrow rows; host/co-host assignment and buyer name synchronisation were incomplete.
6. QR presentation used blend colouring around a machine-readable asset; the code must stay black on white with a quiet zone.
7. Tight negative tracking in large Cyrillic headings caused glyph collisions.

## Definition of done for a game

A catalogue card is not considered implemented until two real browser sessions can join the same lobby, ready up, play every phase with private/public state separation, see results, rematch, refresh during an active round and recover without losing role, input or score. The same scenario must pass on one Stage viewport plus at least two 375–430 px controller viewports in RU and EN.
