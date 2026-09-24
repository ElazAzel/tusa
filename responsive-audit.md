# TUSA.game responsive audit

## Audit scope

Combined responsive UX and accessibility review of the Party OS landing, game catalogue, demo Party Room and sign-in flow.

Tested viewport widths: 320, 390, 768, 1024, 1440 and 1920 pixels.

## User goal and accessibility target

Users must be able to discover the primary action, join a party, browse games and sign in without clipped content, overlapping controls or horizontal scrolling. Motion must respect the user's reduced-motion preference.

## Steps and evidence

1. Landing at 320 px — healthy after fixes.
   - Evidence: `responsive-audit/15-landing-320-final.png`
   - Primary actions and invite form fit the viewport.

2. Landing at 768 px — healthy after fixes.
   - Evidence: `responsive-audit/16-landing-768-final.png`
   - Tablet layout uses the compact horizontal header and a single-column launcher.

3. Landing at 1440 px — healthy after fixes.
   - Evidence: `responsive-audit/17-landing-1440-final.png`
   - Sidebar, launcher, invite form, room preview and proof metrics remain visually separated.

4. Sign-in at 320 px — healthy after fixes.
   - Evidence: `responsive-audit/18-sign-in-320-final.png`
   - Fields and account links reflow without clipping.

5. Games catalogue at 390 px — healthy.
   - Evidence: `responsive-audit/19-games-390-final.png`
   - Search, filters and game cards use a single-column flow.

6. Demo Party Room at 390 px — healthy.
   - Evidence: `responsive-audit/20-demo-390-final.png`
   - Event controls and bottom navigation remain reachable and legible.

## Fixes made

- Rebuilt the ticker from two identical content groups.
- Matched both ticker group widths and translated by one complete group plus the inter-group gap for a seamless loop.
- Added a reduced-motion pause for the ticker.
- Moved the Party OS tablet breakpoint to 860 px.
- Hid proof metrics where their container is too narrow and reduced their desktop type scale.
- Stretched the invite form across tablet and mobile layouts.
- Removed intrinsic minimum widths from sign-in form fields and links.
- Reduced sign-in form padding at 360 px and below.

## Accessibility checks

- Primary buttons retain at least 44 px touch height.
- No tested route permits horizontal page scrolling.
- The ticker is decorative and hidden from assistive technology.
- `prefers-reduced-motion` pauses the ticker animation.

## Evidence limits

Screenshots and DOM measurements do not prove full WCAG compliance. Screen-reader announcements, keyboard order across authenticated states, browser zoom above 100% and real user-generated content still require dedicated testing.

## Result

No actionable responsive P0, P1 or P2 issues remain in the tested routes and viewport set.
