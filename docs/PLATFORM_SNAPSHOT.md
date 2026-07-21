# PLATFORM_SNAPSHOT.md — TUSA.game Architecture & Status Map

> **Updated:** 22.07.2026  
> **Repository:** `ElazAzel/tusa`  
> **Platform Version:** Next.js 16 (App Router) · React 19 · TypeScript · Neon Postgres · SSE/Ably Realtime

---

## 1. Executive Summary & Architecture Map

TUSA.game is an interactive social gaming and event platform designed for real-world parties, venue nights, and virtual hangouts. Guests join using a single link or QR code with zero app installation (HMAC guest sessions).

### Components & Services Diagram

```
[ Browser / Mobile Client ]
   │
   ├── HMAC Guest Auth / Clerk Proxy (proxy.ts)
   ├── Dynamic i18n & Neo-Brutalist Design System (app/globals.css)
   │
   ▼
[ Next.js 16 App Router ]
   ├── Route Handlers (/api/games, /api/chat, /api/live)
   ├── Game SDK Reducer & Registry (lib/games/sdk.ts + definitions/*.ts)
   ├── Realtime Event Bus (lib/live.ts → Ably / SSE fallback)
   └── DB Layer & Schema Gate (lib/parties.ts → Neon Postgres)
```

---

## 2. Key User Flows (Top 5)

1. **Guest Frictionless Join**:
   - User scans QR code or clicks invite link (`/party/[inviteCode]`).
   - HMAC session created transparently (`guest-session.ts`).
   - User enters PartyRoom immediately with default avatar & guest nickname.

2. **Host Party Creation & Stage View**:
   - Host logs in or creates room (`/app`).
   - Displays Stage view on projector/TV screen (`role="stage"`).
   - Manages party catalog, active game modes, and room settings.

3. **Multiplayer Game Round Flow**:
   - Host selects game (e.g. *Punchline*, *Fake Fact*, *Quiz*).
   - Controllers submit answers/votes via `sendAction()` (`useControllerGame`).
   - Server validates state with Zod schemas & updates Neon DB with version locking.
   - Stage renders real-time countdown, animations, and final scoreboard.

4. **Live Chat & Engagement (KOINS)**:
   - Real-time chat messages via SSE / Ably.
   - Instant KOINS rewards earned through participation & quest completion.
   - Gratitude / Highlight submission and shopping list sync.

5. **Cosmetics & Personalization**:
   - Users unlock themes, avatars, and badge styles using earned KOINS.

---

## 3. Critical Invariants ("Must Never Break")

- **Zero-Install Join**: Guest join flow via HMAC signature must work without forced registration.
- **Server Authority**: Game state transitions & score calculations must happen server-side (`lib/games/scoring.ts` & SDK definitions).
- **State Recovery**: Reconnecting clients must successfully restore session state via `GET /api/games?sessionId=X`.
- **Contrast & Ergonomics**: Text contrast on `--lime` (`#c9ff05`) must enforce `#000000`; touch targets must remain ≥ 44px on mobile.
- **Optimistic Concurrency**: DB version locking (`game_sessions.version`) must prevent race conditions and duplicate rewards.

---

## 4. Environments & Deployment Flow

- **Development**: Local Next.js dev server (`npm run dev`), in-memory SSE/rate-limiting.
- **Production**: Deployed on Vercel (`tusagame.vercel.app`), Neon Postgres DB, Ably realtime, Upstash Redis.
