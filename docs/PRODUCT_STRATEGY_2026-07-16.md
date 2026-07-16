# TUSA.game — Product and Commercial Strategy

This document turns the July 2026 external product and monetization audits into decisions that do not compromise the core party experience.

## Product thesis

TUSA.game is a browser-first social party platform: one host creates one room and shares one link; guests join from their phones; a shared screen can act as a stage. The product is not positioned as a paid library of browser games. It is infrastructure for social play before, during, and after an event.

The first non-negotiable experience is:

```text
invite link → nickname + avatar → join → first game → optional account
```

Guest join, first game and reconnect matter more than new catalogue cards. A feature is not considered complete because it renders; it needs server authorization, recovery, mobile behavior and a test.

## Product metric hierarchy

North Star: **Weekly Successful Party Sessions**.

A successful party session has at least three participants, one completed game, two played rounds, at least ten minutes of activity and no critical desync.

Leading indicators:

- invite opened → joined room;
- joined room → first game started;
- time to first game and time to first laugh;
- game completion and rematch rate;
- reconnect success and failed-command rate;
- host return rate and repeat group rate.

Initial operating targets are guest join in under 20 seconds, first game in under 90 seconds, invite conversion above 45%, completion above 75%, reconnect success above 95%, and critical session failure below 1%.

## Commercial model

The intended long-term model is a hybrid, sequenced rather than launched all at once:

1. **Free social core.** Guests join free through an invite; a small, reliable core catalogue stays free so sharing remains frictionless.
2. **Host monetization.** A host can buy a one-event pass or a Plus subscription for premium catalogue access, controls, room themes, recap and higher capacity. Until a payment provider and legal review are complete, the product remains promo/beta access only.
3. **B2B and white-label.** Teams, universities, venues and event agencies pay for branded rooms, facilitation, repeatable scenarios, analytics and support. This is the first revenue path that can work before consumer scale.
4. **Brand integrations.** Only clearly labelled, native placements outside an active game round. No alcohol targeting for under-age profiles and no aggressive banners.
5. **Creator marketplace.** This comes after audience, moderation, publishing templates and demand are proven. It is not a launch dependency.
6. **Digital cosmetics and seasonal content.** Cosmetic-only, never pay-to-win. KOINS remain virtual and cannot be used as betting, cash-out or real-world prize currency without a separate legal decision.

## Decisions already made

- Guests must not be forced through Clerk before their first game.
- One host can pay; invited guests keep free access to the event.
- Free games are the acquisition loop, not an accidental loss leader.
- A game card labelled Beta is not a promise of full multiplayer certification.
- Marketplace, paid KOINS, ticketing and open API/SDK remain later-stage initiatives.
- Advertising can never interrupt an active round or expose private party data.

## Implementation order

1. Stabilize production auth, guest join, session recovery and the first-game flow.
2. Complete the Game SDK migration and certify every catalogue mode with a host and two controller clients.
3. Deliver chat/gallery/profile safety, moderation and recap reliability.
4. Add admin RBAC, partner inventory and campaign measurement.
5. Enable real billing only after merchant onboarding, webhooks, tax/refund policy and legal review.
6. Start creator marketplace and public API only after the core retention and safety gates are consistently met.

See `docs/IMPLEMENTATION_STATUS_2026-07-16.md` for the factual implementation checkpoint, and `docs/TUSA_io_Партнёрства_реклама_монетизация.md` for the detailed partner and advertising design.
