# TUSA.game Platform QA

Primary sources:

- `tusa-style-guide-v1.4.html` — visual system and tone of voice.
- `TUSA PRD для CTO.pdf` — MVP modules and acceptance intent.
- Руководство по разработке игровых режимов — game-mode behavior.
- User screenshots `image-1.png` and `image-2.png` — reported mobile overflow states.

Accepted current-run screenshots:

- `tmp/audit/01-overview-320.png`
- `tmp/audit/02-alias-320.png`
- `tmp/audit/03-gallery-320.png`

## Audited flow

1. Event overview — healthy. The 320 px viewport has no horizontal page overflow; RSVP, share and the fixed seven-item navigation remain visible.
2. Alias — healthy. The full word stays inside the game board at 320 px, actions wrap, and the page scrolls vertically without a visible scrollbar.
3. Gallery after two real uploads — healthy. Both cards remain inside a two-column `minmax(0, 1fr)` grid; controls wrap instead of widening the document.
4. Event lifecycle — healthy. Create, edit, duplicate, delete, event switching, three RSVP states, roles, notes, QR and Blast were exercised.
5. Games — healthy. Alias, Mafia Lite, Truth or Dare, Never Have I Ever, Beer Pong, Quiz Battle, Random Pair and Uno Tracker each reached a changed state through normal controls.
6. Shopping — healthy. Duplicate detection/merge, item purchase, buyer, price and minimized split transfers were exercised.
7. Chat — healthy. New thread, text message, reaction, pin and recorded voice message were exercised.
8. KOINS — healthy. Bet creation, stake deduction, odds/pool display, settlement, payout and ledger entry were exercised.
9. Gallery tools — healthy. Upload, compression, tag and Recap were exercised.
10. Profile — healthy. Edit, frame selection, data export and persistence after reload were exercised.
11. Cross-tab local sync — healthy. A profile edit propagated to a second tab through the storage event.

## Responsive and accessibility notes

- Tested widths: 320, 390 and 1440 px.
- Page-level horizontal scroll is eliminated. Rows that need compact mobile reflow wrap; the fixed bottom navigation fits seven 44+ px targets.
- Focusable controls use semantic buttons, links, form labels and visible focus styling.
- Motion honors `prefers-reduced-motion`.
- Screenshot review cannot prove full assistive-technology compliance; semantic and keyboard checks remain part of regression QA.

## Scope boundary

Payment is intentionally absent. The current platform is local-first and synchronizes browser tabs. Cross-device multi-user sync, durable cloud media and SMS require production backend credentials and infrastructure; the UI does not claim those are active.

Final result: passed for the declared local-first beta scope.
