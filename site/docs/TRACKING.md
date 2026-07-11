# TUSA.game — Progress Tracker (RAG)

## Architecture

- **Next.js 16** App Router, React 19, TypeScript
- **Neon Postgres** — parties, profiles, chat, games, shopping
- **Clerk** — auth (dev keys, Google/Apple in prod)
- **CSS design system** — no runtime UI libs
- **Mobile-first PWA** — manifest, SW, offline page

## ✓ Done

### Auth & Profile
- Clerk sign-in/sign-up, `/app` dashboard, `/app/profile`
- `user_profiles` table: display_name, handle, city, bio, image_url, compashka, cosmetics, xp
- Profile editor: compashka, league (Fresh Lime → Neon Legend), 60 badge types, XP progress bar
- Event history, push notification request, data export (JSON)
- Promo code redemption: `ELAZ`, `JEDAI`, `TUSA02` — beta_access, profile_cover, avatar_frame, etc.

### Parties (CRUD + RSVP)
- `parties` table with title, date, time, venue, category, description, adult_only, invite_code
- `party_members` with role (owner/co_host/guest) and rsvp_status (going/maybe/pass)
- Create (promo-gated), edit (owner-only), delete (owner-only)
- RSVP toggle in PartyRoom + JoinPartyCard
- QR code invite (via `qrcode` lib)
- Dashboard with RSVP counts and member role badge

### Chat (DB + Polling)
- `chat_messages` table (id, party_id, clerk_user_id, display_name, text, created_at)
- POST/GET `/api/chat` — send + fetch with membership check
- PartyRoom polling every 3 seconds
- Auto-load on mount

### Games (8/8 modes ported from demo)
- **Infrastructure**: `game_sessions` + `game_scores` tables, POST/GET `/api/games`
- **Alias** (`AliasGame.tsx`): 60s timer, word bank, score tracking, save
- **Mafia Lite** (`MafiaGame.tsx`): player entry, role dealing (Mafia/Doctor/Sheriff/Civilian), pass-the-phone reveal
- **Truth or Dare** (`TruthOrDare.tsx`): 6 truth + 6 dare cards, mode switch, counter
- **Never Have I Ever** (`NeverHaveIEver.tsx`): 8 prompts, confession counter, skip/me/save
- **Beer Pong** (`BeerPong.tsx`): two-team score (10 cups each), hit/return buttons
- **Quiz Battle** (`QuizBattle.tsx`): 6 questions, multiple choice, correct/wrong feedback, score
- **Random Pair** (`RandomPair.tsx`): player entry, shuffle into pairs, random challenge card
- **Uno Tracker** (`UnoTracker.tsx`): player entry, ±10/+50 scoring, lowest-wins leaderboard

### i18n (RU/EN)
- `lib/i18n.ts` — ~760 keys per locale
- `detectLocale()` from `Accept-Language`
- `LocaleProvider` + `LocaleToggle`
- All pages translated: landing, dashboard, profile, demo hubs, admin, waitlist, partners, offline, 404
- Date/time: `type="date"` / `type="time"` in both locales

### Admin
- `/admin/promos` — CRUD promo codes, inline editing, status toggle, delete unused
- `/admin` — waitlist management, CSV export, limit settings
- Metrics: users, parties, joins, redemptions

### Shopping List (production)
- `party_shopping_items` table (id, party_id, clerk_user_id, display_name, text, quantity, unit, price, purchased, created_at)
- POST/GET `/api/shopping` — add, update, delete, list items
- `ShoppingList` component with add form, duplicate detection, toggle purchased, price input, delete
- PartyRoom "shop" tab

### Co-host Management
- `getPartyMembers()` — list all members with roles and RSVP status
- `setMemberRole()` — owner can promote guests to co_host or demote back
- `GET/PUT /api/parties/[inviteCode]/members` — list and update roles
- Member cards in PartyRoom space tab with role badges and promote/demote button

### Chat (Efficient Polling)
- `getMessages()` now accepts `after` (ISO timestamp) cursor — only returns newer messages
- PartyRoom deduplicates by message ID, appends only new ones
- Dramatically reduced bandwidth per poll

### Profile Enhancements
- `/api/user/stats` — returns `gamesPlayed` and `totalScore` from DB
- ProfileEditor shows real game count and total score from completed sessions
- League system with XP progress bar (Fresh Lime → Neon Legend)

### Admin Expansion
- `/api/admin/data` — returns users (100) and parties (100) for admin panel
- Admin dashboard now has 3 tabs: Waitlist, Users, Parties
- Users tab: displayName, handle, city, XP, party count
- Parties tab: title, date, venue, owner, member count

### Infrastructure
- Schema auto-migration via `ensurePartySchema()` (`CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`)
- Neon Postgres via `@neondatabase/serverless`
- Vercel deployment configured

## 🔄 In Progress

- *(none — all planned blocks completed)*

## 📋 Planned (in priority order)

1. **WebSocket/Realtime** — replace chat polling with WS, presence events, role sync
2. **Gallery** — object storage, upload, compression, live feed, tags, recap
3. **Partner network** — venue catalog, campaigns, native placements, impressions/clicks
4. **Analytics** — events pipeline, admin dashboard
5. **Admin roles & moderation** — owner/co_host/moderator/analyst/support, permission assignment

## 🧱 Key Decisions

| Decision | Rationale |
|---|---|
| Chat polling (3s) over WebSocket | MVP speed; WS after shopping + game content |
| Game state in JSONB `game_sessions.state` | Each game is self-contained, no per-game tables |
| Shopping in DB (not localStorage) | Cross-device sync; follows chat pattern |
| Schema via `ensurePartySchema()` | Zero-migration setup for dev; will migrate to proper migrations before prod |
| `cosmetics JSONB` in user_profiles | Flexible; promo codes unlock items dynamically |

## ⚠️ Known Limitations

- Clerk keys are development-only; Apple OAuth needs Apple Developer account
- Push notifications need VAPID keys + server
- Multiplayer games need WebSocket for real-time
- Gallery needs object storage (S3/R2)
- No payment integration
- Test files (`tests/e2e/waitlist-admin.spec.ts`) have pre-existing TS errors

## 🧪 Build Status

- `npx tsc --noEmit` — 0 errors in app/lib code; 3 pre-existing errors in tests
- `npx next build` — successful
- `npm run lint` — 0 errors, 2 warnings (`@next/next/no-img-element`)
