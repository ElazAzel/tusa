# Landing and Party Room alignment audit

## Editable Figma audit

- [TUSA — Landing ↔ Party Room Responsive Audit](https://www.figma.com/design/FsjbNbACMHuSAVkSMk81AE)

## Scope

Visual and responsive alignment between the approved Party OS landing and the Party Room shell on desktop and mobile.

## Steps

1. Desktop landing reference — healthy.
   - Evidence: `party-room-audit/01-landing-desktop-current.png`

2. Desktop Party Room before alignment — inconsistent.
   - Evidence: `party-room-audit/02-party-desktop-current.png`
   - The rail width, workspace origin, topbar border and headline typography did not match the landing.

3. Mobile landing reference — healthy.
   - Evidence: `party-room-audit/03-landing-mobile-current.png`

4. Mobile Party Room before alignment — inconsistent.
   - Evidence: `party-room-audit/04-party-mobile-current.png`
   - The screen started directly with the event topbar and lacked the landing's black brand strip.

5. Desktop Party Room after alignment — healthy.
   - Evidence: `party-room-audit/10-party-desktop-final.png`
   - Comparison: `party-room-audit/07-desktop-comparison.png`

6. Mobile Party Room after alignment — healthy.
   - Evidence: `party-room-audit/09-party-mobile-final.png`
   - Comparison: `party-room-audit/08-mobile-comparison.png`

## Changes

- Matched the desktop rail to the landing's 274 px width and 92 px compact breakpoint.
- Aligned the workspace and topbar to the landing content grid.
- Replaced the heavy topbar divider with the landing's subtle divider.
- Matched event headline weight, spacing and line height to the landing.
- Added the same 68 px black brand strip on mobile.
- Preserved Party Room bottom navigation and all existing event controls.

## Accessibility

- Existing 44 px minimum touch targets remain intact.
- Mobile content has no horizontal scrolling at 390 px.
- Navigation order and labels were not changed.

## Limits

The visual review covers the public demo state. Authenticated owner-only panels and real user-generated content may still require a separate content-stress pass.
