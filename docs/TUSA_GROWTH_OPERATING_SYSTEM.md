# TUSA Growth Operating System

> **Version:** 1.0
> **Scope:** Full-stack product, growth, SEO/GEO/AEO, engineering, and operational reference for TUSA.game
> **Audience:** Engineering, Product, Design, Marketing, Content, Executive
> **License:** Internal — TUSA Inc.

---

## Table of Contents

1.  [Product Vision](#1-product-vision)
2.  [Information Architecture](#2-information-architecture)
3.  [SEO](#3-seo)
4.  [GEO (Generative Engine Optimization)](#4-geo)
5.  [AEO (Answer Engine Optimization)](#5-aeo)
6.  [Knowledge Graph](#6-knowledge-graph)
7.  [Semantic SEO](#7-semantic-seo)
8.  [Topic Authority](#8-topic-authority)
9.  [Programmatic SEO](#9-programmatic-seo)
10. [EEAT (Experience, Expertise, Authoritativeness, Trustworthiness)](#10-eeat)
11. [Technical SEO](#11-technical-seo)
12. [Performance](#12-performance)
13. [International SEO](#13-international-seo)
14. [AI Crawlers](#14-ai-crawlers)
15. [Social SEO](#15-social-seo)
16. [Growth Engine](#16-growth-engine)
17. [Analytics](#17-analytics)
18. [Backlog](#18-backlog)

---

# 1. Product Vision

## 1.1 Vision

A world where every social gathering — whether in person, remote, or hybrid — comes alive through shared, spontaneous, multiplayer fun. TUSA becomes the default digital companion for any party, game night, team event, or casual hangout, regardless of where the participants are.

## 1.2 Mission

Eliminate the friction of organizing group entertainment. Provide 28+ zero-install, browser-based party games alongside integrated party-management tools (RSVP, chat, gallery, shopping, Koins) so that hosts can focus on people, not logistics. Every feature is mobile-first, real-time, and accessible from any device with a browser.

## 1.3 North Star Metric

**Weekly Active Party Sessions (WAPS).** A session is a party room where at least one game was played within a 7-day period. This metric captures both retention (parties recurring week over week) and engagement (games actually played, not just rooms created).

Secondary: **Invite-to-Join Conversion Rate** — the percentage of people who receive an invite link and actually join the room. This measures the effectiveness of the viral loop.

Tertiary: **Per-Session Game Count** — average number of games played per party session. Higher = stickier product.

## 1.4 Product Principles

| # | Principle | Description |
|---|---|---|
| 1 | **Zero friction** | No install, no sign-up friction (optional Clerk). A game must launch in <2 taps. |
| 2 | **Mobile-first by default, all-screen by necessity** | Every pixel is designed for mobile portrait. Desktop gets an equally polished experience. |
| 3 | **Real-time is not a feature, it is the product** | SSE, not polling. Every action reflects on all devices in <500ms. |
| 4 | **Party first, games second** | The party room is the container. Games are the content. RSVP, chat, gallery, shopping, Koins are not secondary — they are why people stay. |
| 5 | **Brutalist delight** | Raw, uncompromising visual language (3px black borders, bold shadows, impactful typography) that feels crafted, not templated. |
| 6 | **Global from day one** | i18n is not an afterthought. Every string is localizable. RU and EN are first-class citizens; the architecture supports unlimited languages. |
| 7 | **Privacy is a feature, not a compliance checkbox** | No tracking scripts, minimal cookies, GDPR-native consent, no third-party analytics. |
| 8 | **Zero AI dependencies** | All game logic, state management, and content generation is deterministic. No LLM calls, no cloud AI. The product works even without internet (progressive enhancement). |
| 9 | **Playable on anything** | A 5-year-old Android phone in a low-signal area must be able to join a game. Total bundle <200KB JS per page. |
| 10 | **Host pays or nobody pays** | KOINS are non-cashable engagement tokens. No microtransactions in games. Monetization through optional host perks (themes, extended storage, custom branding). |

## 1.5 Brand Values

| Value | Manifestation |
|---|---|
| **Radical inclusion** | Anyone can host. Anyone can join. No hardware, no install, no account required (for joining). |
| **Raw energy** | The visual language is unpolished by design. Brutalism communicates authenticity. |
| **Shared joy** | Product metrics optimize for collective fun, not individual dopamine. |
| **Zero BS** | No pay-to-win, no ads, no trackers, no spam. The product respects the user's time and attention. |
| **Crafted for real life** | Designed for actual human scenarios: friends on a couch, remote teams on a call, families at a reunion. |

## 1.6 Tone of Voice

| Context | Tone | Example |
|---|---|---|
| Product UI | Direct, minimal, imperative | "Launch game / Присоединиться" |
| Marketing (landing) | Energetic, benefit-driven | "Turn any gathering into a game night. No setup. No install. Just fun." |
| Error messages | Clear, non-technical, slightly playful | "Туса не найдена. Может, ссылка устарела?" |
| Help / Documentation | Warm, instructive | "To start a game, tap the Games tab and choose your mode." |
| Social / Community | Casual, first-person plural | "We just shipped 3 new game modes. Which one are you trying first?" |
| Legal / Compliance | Standard legalese, translated | Standard terms. No personality needed. |

## 1.7 Product Positioning

| Alternative | TUSA.position |
|---|---|
| Jackbox Games | Free, no install, no host purchase required, mobile controllers, 2× more game modes, party management built in |
| Houseparty (defunct) | Async + sync play, persistent party rooms, broader game catalogue, no video dependency |
| Tabletopia / Board Game Arena | Casual party games, not deep board games. Session length 5–15 min. Mobile-first. |
| Discord Activities | Standalone web app, no Discord account required, works on any browser. |

## 1.8 Market Category

**Primary:** Social Browser Gaming Platform  
**Adjacent:** Party Management SaaS (RSVP, chat, gallery, shopping lists)  
**Future:** Virtual Event Infrastructure (corporate team-building, educational icebreakers, creator monetization)

TUSA competes in the intersection of:

```
Social Gaming  ×  Event Management  ×  Real-time Collaboration
     │                   │                      │
  Jackbox            Partiful              FigJam / Miro
  Kahoot!            Evite                 Wonder.me
```

---

# 2. Information Architecture

## 2.1 Site Structure (2026)

```
tusa.game/
│
├── /                        # Landing (hero, features, games preview, CTA)
├── /app                     # Authenticated dashboard (my parties, friends, leaderboard, profile)
├── /sign-in                 # Clerk hosted UI
├── /sign-up                 # Clerk hosted UI
│
├── /games                   # Game catalogue (28 games, filterable, searchable)
├── /games/[slug]            # Individual game landing page (rules, player count, i18n)
├── /games/for-[n]-players   # Programmatic: games by player count
├── /games/for-[category]    # Programmatic: games by category (family, teams, college, etc.)
│
├── /party/[inviteCode]      # Party room (game board, chat, gallery, shopping, koins)
├── /join/[inviteCode]       # Pre-join page (RSVP, preview party info)
│
├── /features                # Features overview
├── /features/game-night     # Game night feature page
├── /features/party          # Party management feature page
│
├── /pricing                 # Pricing (free tier + premium host perks)
│
├── /about                   # Company, story, mission, team
├── /press                   # Press kit, media assets, brand guidelines
├── /contact                 # Contact / support form
│
├── /faq                     # FAQ page + FAQPage schema
│
├── /blog                    # Blog index
├── /blog/[slug]             # Blog articles
│
├── /resources               # Resource hub (guides, templates)
├── /resources/ultimate-party-game-guide
├── /resources/remote-team-icebreakers
├── /resources/host-tips
│
├── /docs                    # Product documentation
├── /docs/getting-started
├── /docs/games/[slug]
├── /docs/hosting
├── /docs/troubleshooting
│
├── /developers              # API docs, integration guide
├── /developers/api
├── /developers/webhook
│
├── /community               # Community hub
├── /community/discord
├── /community/ambassadors
├── /community/creator-program
│
├── /roadmap                 # Public roadmap
├── /updates                 # Changelog
├── /support                 # Support center
│
├── /use-cases               # Programmatic SEO landing pages
├── /use-cases/online-parties
├── /use-cases/remote-teams
├── /use-cases/in-person-parties
├── /use-cases/corporate-events
├── /use-cases/birthday-parties
├── /use-cases/family-game-night
├── /use-cases/college-dorm
├── /use-cases/wedding-reception
├── /use-cases/team-building
├── /use-cases/classroom-icebreakers
│
├── /privacy                 # Privacy policy
├── /terms                   # Terms of service
├── /offline                 # Offline page (PWA)
│
├── /robots.txt
├── /sitemap.xml
├── /manifest.webmanifest
└── /brand/                  # Static brand assets (logos, icons)
```

## 2.2 Navigation Architecture

### Unauthenticated (Landing)

```
[Logo]  Games  Features  Party  Pricing  FAQ  Blog  [Sign In]  [Get Started]
```

### Authenticated (Dashboard)

```
Bottom Nav (mobile):
[Home] [Friends] [Leaderboard] [Profile]

Top Bar (desktop):
[Logo] [My Parties] [Friends] [Leaderboard] [Profile] [Sign Out]
```

### Party Room

```
Header: [Back to Parties]  Party Title  [Locale Toggle]  [Member Count]

Tab Navigation:
[Space] [Games] [Chat] [Shop] [Gallery] [Koins]

Flex Footer (mobile):
[Invite] [Games] [Chat] [Members]
```

## 2.3 Content Hierarchy

### Game Page Template

```
Game Name
├── Player Count Range
├── Description (2–3 sentences, i18n)
├── Rules
│   ├── Setup
│   ├── Gameplay
│   └── Scoring
├── Controller Instructions
├── Tips & Variations
├── FAQ
└── CTA: [Start Game] [Add to Party]
```

### Blog Article Template

```
Title
├── Published Date / Author
├── Category Tags
├── Featured Image
├── Body (H2, H3, lists, CTAs)
│   ├── Introduction
│   ├── Problem / Hook
│   ├── Solution (with TUSA links)
│   ├── Step-by-step
│   └── Conclusion + CTA
├── FAQ Section (FAQPage schema)
├── Related Articles
└── Newsletter CTA
```

---

# 3. SEO

## 3.1 Page-by-Page Optimization Matrix

Every page on `tusa.game` must have a defined set of SEO fields. Below is the template for each page type, followed by specific entries.

### Universal Page Template

```
Field          | Required | Max Length | Notes
----------------|----------|------------|-------
Title          | Yes      | 60 chars   | Primary keyword first, brand suffix " · TUSA.game"
Description    | Yes      | 160 chars  | Include call-to-action, benefit-driven
H1             | Yes      | 70 chars   | Must match page intent, include primary keyword
H2            | Yes      | varies     | Subheadings covering secondary keywords
Slug           | Yes      | 50 chars   | kebab-case, keyword-rich, no stop words
Canonical      | Yes      | full URL   | Self-referencing, no trailing slash
OG Title       | Yes      | 60 chars   | Same as Title or optimized for social
OG Description | Yes      | 200 chars  | Slightly longer, more inviting
OG Image       | Yes      | 1200×630   | Branded template per page category
Twitter Card   | Yes      | —          | summary_large_image
JSON-LD        | Yes      | —          | Type-specific schema (Game, FAQ, Article, etc.)
Keywords       | No       | —          | Not for ranking, used for internal tagging/topic clustering
Internal Links | Yes      | 3–10       | Minimum 3 internal links per page
Related Pages  | Yes      | 4–6        | Footer or sidebar "Related" section
```

### 3.1.1 Home — `/`

| Field | Value (EN) | Value (RU) |
|---|---|---|
| **Title** | Free Party Games Online — No Install, Multiplayer · TUSA.game | Бесплатные игры для вечеринок — 28 режимов, мультиплеер · TUSA.game |
| **Description** | Turn any gathering into a game night. 28+ free browser-based party games for groups. No install, mobile-friendly, real-time multiplayer. | 28+ бесплатных игр для компании. Без установки. Мобильные, мультиплеер, реальное время. |
| **H1** | The Party Platform for Real Life | Платформа для живых вечеринок |
| **H2** | 28 Game Modes · No Install Required · Real-Time Multiplayer · Mobile First · Built for Groups · Free Forever | |
| **Slug** | `/` | |
| **Canonical** | `https://tusa.game` | |
| **OG Title** | TUSA — Free Multiplayer Party Games | TUSA — Бесплатные игры для компаний |
| **OG Description** | 28+ games for your next party. Friends join from their phones — no app store needed. | 28+ игр для твоей вечеринки. Друзья подключаются с телефона — без App Store. |
| **JSON-LD** | WebApplication + Organization | |
| **Internal Links** | `/games`, `/features`, `/faq`, `/about`, `/use-cases/online-parties`, `/pricing` | |

### 3.1.2 Games Catalogue — `/games`

| Field | Value |
|---|---|
| **Title** | 28 Party Games — Multiplayer Games for Groups · TUSA.game |
| **Description** | Browse 28 free multiplayer party games. Alias, Trivia, Werewolf, Codenames, Quiplash and more. Play from any browser, no install. |
| **H1** | Party Games — 28 Modes for Any Group |
| **H2** | Word Games · Trivia & Quiz · Social Deduction · Creative Games · Fast-Paced · Team Games |
| **Slug** | `/games` |
| **Canonical** | `https://tusa.game/games` |
| **JSON-LD** | CollectionPage |
| **Internal Links** | Each game card links to `/games/[slug]` |

### 3.1.3 Individual Game Page — `/games/[slug]`

Template for all 28 games. Example: `/games/alias`

| Field | Value |
|---|---|
| **Title** | Alias — Explain Words to Your Team · TUSA.game |
| **Description** | Play Alias online with friends. Explain words without saying them. 4+ players, mobile-friendly, real-time. |
| **H1** | Alias — The Word-Explanation Party Game |
| **H2** | Rules & Setup · How to Play · Scoring · Tips for Teams · Why Play Alias on TUSA |
| **Slug** | `/games/alias` |
| **Canonical** | `https://tusa.game/games/alias` |
| **JSON-LD** | Game (with `applicationCategory: "PartyGame"`, `numberOfPlayers: "4+"`) |
| **Internal Links** | `/games/for-4-players`, `/games`, `/games/codenames`, `/games/crocodil` |

### 3.1.4 Party Room — `/party/[inviteCode]`

| Field | Value |
|---|---|
| **Title** | Dynamic: `Party Title — TUSA.game Party Room` |
| **Description** | Dynamic: `Join "{Party Title}" on TUSA. Games, chat, gallery and more.` |
| **Robots** | `noindex, nofollow` (private rooms must not be indexed) |
| **Canonical** | Skip (noindex pages) |

### 3.1.5 FAQ — `/faq`

| Field | Value |
|---|---|
| **Title** | FAQ — Frequently Asked Questions About TUSA · TUSA.game |
| **Description** | Answers to common questions about TUSA party games. How to play, how to invite friends, compatibility, and more. |
| **H1** | Frequently Asked Questions |
| **JSON-LD** | FAQPage (7+ Q&A entries) |
| **Internal Links** | `/games`, `/about`, `/pricing`, `/features` |

### 3.1.6 About — `/about`

| Field | Value |
|---|---|
| **Title** | About TUSA — The Browser-Based Party Platform · TUSA.game |
| **Description** | TUSA makes it easy to play party games online with friends. No install. Open source. Global. |
| **H1** | About TUSA |
| **JSON-LD** | Organization (sameAs: GitHub, Twitter, Discord) |
| **Internal Links** | `/games`, `/faq`, `/privacy`, `/use-cases/online-parties` |

### 3.1.7 Blog — `/blog` and `/blog/[slug]`

Blog index:

| Field | Value |
|---|---|
| **Title** | TUSA Blog — Party Game Guides, Tips & Updates · TUSA.game |
| **Description** | The latest from TUSA. Party game guides, hosting tips, product updates, and community stories. |
| **H1** | TUSA Blog |
| **JSON-LD** | BlogPosting (for individual articles) |

### 3.1.8 Programmatic Landing Pages

See [Section 9 — Programmatic SEO](#9-programmatic-seo) for the full matrix of landing pages.

### 3.1.9 Use-Case Pages

See `/use-cases/*` — each follows the landing page template with localized hreflang.

## 3.2 Internal Linking Strategy

### Hub-and-Spoke Model

```
Home (hub)
├── Games (hub)
│   ├── Alias (spoke)
│   ├── Trivia (spoke)
│   ├── Codenames (spoke)
│   ├── … (28 games)
│   └── Games for N Players (hub-spoke)
│       ├── Games for 4 (spoke)
│       ├── Games for 5 (spoke)
│       └── …
├── Use Cases (hub)
│   ├── Online Parties (spoke)
│   ├── Remote Teams (spoke)
│   ├── In-Person Parties (spoke)
│   └── …
├── Blog (hub)
│   ├── Article 1 (spoke)
│   ├── Article 2 (spoke)
│   └── …
└── FAQ → links to all hubs
```

### Link Density Rules

| Page Type | Min Internal Links | Recommended |
|---|---|---|
| Home | 5 | 8–10 |
| Game page | 4 | 6–8 |
| Blog article | 3 | 5–7 |
| Use-case page | 4 | 6 |
| FAQ | 3 | 5 |
| Programmatic page | 3 | 5 |

### Anchor Text Rules

- Use **exact-match** anchors for primary navigation: "free party games", "online party games"
- Use **partial-match** for secondary links: "explain words to your team" → `/games/alias`
- Use **branded** for footer/global nav: "TUSA.game"
- Never use "click here", "read more", "learn more" without descriptive context

## 3.3 SEO Metadata Implementation

All pages must export `metadata` (Next.js 16 App Router):

```ts
// app/games/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  return {
    title: `${game.title} — ${game.tagline} · TUSA.game`,
    description: game.metaDescription,
    openGraph: {
      title: `${game.title} — Play Online Free`,
      description: game.ogDescription,
      images: [{ url: `/og/games/${slug}.png`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: game.title, description: game.metaDescription },
    alternates: { canonical: `https://tusa.game/games/${slug}` },
  };
}
```

## 3.4 Robots.txt

Current (`app/robots.ts`):

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: *
Allow: /
Disallow: /party/
Disallow: /join/
Disallow: /api/
Disallow: /app/
Allow: /$
Allow: /games$
Allow: /games/
Allow: /about$
Allow: /faq$
Allow: /use-cases/

Sitemap: https://tusa.game/sitemap.xml
```

### AI Crawler Allow/Disallow Matrix

| Crawler | Allow | Disallow | Rationale |
|---|---|---|---|
| GPTBot | `/`, `/games`, `/about`, `/faq`, `/use-cases`, `/blog` | `/party/`, `/join/`, `/api/`, `/app/` | Index content pages for ChatGPT citations |
| ClaudeBot | Same as GPTBot | Same | Allow Claude to reference TUSA in answers |
| Claude-SearchBot | Same | Same | Real-time search for Claude |
| PerplexityBot | Same | Same | Allow Perplexity citations |
| Google-Extended | Same | Same | Allow AI Overviews training |
| CCBot | Same | Same | Common Crawl — enables all AI training sets |
| Bytespider | `/`, `/games` | All else | ByteDance crawler — restrict limited |
| Meta External Agent | `/games`, `/blog` | All else | Meta AI — restrict to content pages |
| Applebot | Full | — | Apple Intelligence — full index |
| Bingbot | Full | — | Bing + Copilot |
| DuckDuckBot | Full | — | DuckDuckGo |
| Baiduspider | `/` | — | Baidu — Chinese market expansion |

## 3.5 Sitemap

Current (`app/sitemap.ts`) covers: `/`, `/games`, `/faq`, `/about`, `/demo`, `/privacy`, `/terms`, `/use-cases/*`. Must expand:

| Priority | Page | Frequency |
|---|---|---|
| 1.0 | `/` | weekly |
| 0.9 | `/games` | weekly |
| 0.8 | `/games/[slug]` (28 pages) | monthly |
| 0.8 | `/blog` | weekly |
| 0.7 | `/blog/[slug]` | monthly |
| 0.7 | `/use-cases/*` | monthly |
| 0.6 | `/faq` | monthly |
| 0.6 | `/about` | monthly |
| 0.5 | `/pricing` | monthly |
| 0.5 | `/features` | monthly |
| 0.4 | `/privacy`, `/terms` | yearly |
| 0.3 | `/roadmap`, `/updates` | weekly |
| 0.0 | `/party/*`, `/join/*`, `/app/*` | excluded (noindex) |

Programmatic pages (games by player count, etc.) get priority 0.7, weekly.

## 3.6 Structured Data (JSON-LD) Inventory

| Page | Schema Type | Properties |
|---|---|---|
| `/` | WebApplication + Organization | name, url, description, applicationCategory, operatingSystem, offers |
| `/games/[slug]` | Game | name, description, numberOfPlayers, applicationCategory, offers, image |
| `/games` | CollectionPage | name, description, numberOfItems |
| `/faq` | FAQPage | mainEntity (array of Question/Answer) |
| `/about` | Organization | name, url, logo, sameAs (GitHub, Twitter, Discord), foundingDate |
| `/blog/[slug]` | BlogPosting | headline, datePublished, author, image, publisher |
| `/pricing` | Product + Offer | name, description, offers (free tier + premium) |
| `/use-cases/*` | WebPage | about, description, primaryImageOfPage |
| All pages | BreadcrumbList | position, name, url |

### JSON-LD Best Practices

1. Every page MUST have at least `BreadcrumbList` + type-specific schema
2. `Organization` and `WebApplication` schemas on `/` only
3. `FAQPage` strictly limited to `/faq` — do not add FAQPage to blog posts (Google may flag as spam)
4. `Game` schema on game pages must include `offers` (even if free: `"offers": {"@type": "Offer", "price": "0"}`)
5. All JSON-LD must pass Schema.org validator before deployment

---

# 4. GEO (Generative Engine Optimization)

## 4.1 What is GEO?

GEO is the practice of optimizing content so that AI models (GPT, Gemini, Claude, Perplexity, Google AI Overviews) accurately cite TUSA.game in their responses. Unlike traditional SEO (ranking blue links), GEO focuses on:

- **Extractability:** Can the AI cleanly extract a quote, statistic, or step from your page?
- **Factual alignment:** Does your content match the AI's training data consensus?
- **Structured Q&A:** Is the content organized as clear question/answer pairs?
- **Source credibility:** Does the AI trust TUSA as a reliable source?

## 4.2 ChatGPT (GPTBot / ChatGPT-User)

### How ChatGPT Indexes Sites

ChatGPT uses two mechanisms:
1. **GPTBot** — crawls web pages during training cutoff (knowledge up to training date). Pages allowed in `robots.txt` are included in the training corpus.
2. **ChatGPT-User** — on-demand browsing when a user explicitly requests web search. Respects `robots.txt` and `noindex`.

### Optimization Strategy for ChatGPT

| Tactic | Implementation | Priority |
|---|---|---|
| **Allow GPTBot** | Already done in `robots.ts` | ✅ Done |
| **Clear definitions** | Every game page must start with a concise definition: "Alias is a word-explanation party game where players describe words to their teammates without using the word itself." | High |
| **Numbered lists** | ChatGPT favors steps. Use ordered lists for rules. | High |
| **Contrast with competitors** | "Unlike Jackbox, TUSA is free and requires no host purchase." | Medium |
| **Cite TUSA as platform** | "TUSA is a browser-based party game platform offering 28+ game modes." | High |
| **FAQ format** | ChatGPT extracts answers from FAQ sections. Every page should have 3–5 Q&A. | High |

### ChatGPT Prompt Engineering for Content

Write content that answers the *questions ChatGPT users ask*:

> "What are some good party games to play with friends online?"

Answer structure:
1. **Short answer** (1 sentence) — extracted as snippet
2. **List** — extracted as bullet points
3. **TUSA mention** — ideally in the top 3 results

> "How do you play Alias?"

Answer structure:
1. **Definition** — "Alias is a word-explanation party game..."
2. **Rules** — numbered steps
3. **Scoring** — brief
4. **Where to play** — "Play Alias free on TUSA.game"

## 4.3 Gemini (Google)

### How Gemini Constructs Answers

Gemini pulls from Google's Knowledge Graph + web index. Google's AI Overviews (SGE) prioritize:
1. **Authoritative sources** (EEAT signals)
2. **Clear, structured content** (tables, lists, definitions)
3. **Recent, well-maintained pages**
4. **Pages with schema markup**

### Optimization for Gemini / AI Overviews

| Tactic | Implementation |
|---|---|
| **Knowledge Graph entity** | See Section 6 — ensure TUSA is recognized as a "Party Game Platform" |
| **Tables for comparison** | "Game modes compared by player count, difficulty, duration" |
| **Definition lists** | Use `<dl>` or markdown definition lists for game categories |
| **"What is" content** | Every game page must have a clear "What is [Game]?" paragraph |
| **Author bylines** | Blog posts by named authors (can be "TUSA Team" + link to /about) |
| **Review signals** | Encourage ratings, testimonials, social proof on landing pages |

### AI Overviews: High-Value Queries

Target these query clusters for AI Overview placement:

```
"online party games for groups"
"browser games to play with friends"
"free multiplayer party games no install"
"games to play on video call with friends"
"party games for 4 players"
"virtual team building games free"
```

For each query, create a dedicated page or section that directly answers the question in <300 characters (snippet-friendly), then expands.

## 4.4 Claude (Anthropic)

### How Claude Selects Sources

Claude evaluates:
1. **Source freshness** — recently updated content > stale content
2. **Domain authority** — .com > .io > .xyz; known brands > unknown
3. **Content length** — comprehensive > thin
4. **Formatting** — well-structured markdown/HTML > unstructured

### Optimization for Claude

| Tactic | Implementation |
|---|---|
| **Timestamps** | Include "Last updated: [date]" on every page |
| **Comprehensive pages** | Game pages should be 800+ words |
| **Clear heading hierarchy** | H1 → H2 → H3, no skipped levels |
| **Contrast tables** | Show differences between game modes |
| **External citations** | Link to Wikipedia for game origins (adds credibility) |

## 4.5 Perplexity

### How Perplexity Builds Answers

Perplexity:
1. Searches multiple sources in real-time
2. Ranks by relevance + authority
3. Extracts quotes with inline citations
4. Prefers sources that are directly referenced by other sources

### Optimization for Perplexity

| Tactic | Implementation |
|---|---|
| **Cited by others** | Get TUSA mentioned on external sites (product hunt, alternativeto, reddit) |
| **Cite other sources** | Pages that link to Wikipedia, academic sources, reputable gaming sites rank higher |
| **"According to" language** | Use third-person authoritative voice |
| **Statistics** | "Over 50,000 parties hosted" → quotable stat |
| **Concise definitions** | Perplexity extracts the first 1–2 sentences that answer the query |

## 4.6 Google AI Mode

Google AI Mode is a deeper integration of Gemini within Google Search, handling complex multi-step queries.

### Optimization Strategy

| Tactic | Implementation |
|---|---|
| **Multi-step content** | Create guides that answer "How do I set up a game night for remote friends?" (requires multiple steps) |
| **Related question clusters** | Group related questions on a single page (topic cluster model) |
| **Authoritative how-to** | Step-by-step guides with clear outcomes |

## 4.7 GEO Content Template

Use this template for every page targeting GEO:

```markdown
# [Primary Keyword]

## What is [Topic]?
_1–2 sentence definition optimized for AI extraction._

## Key Facts
- Stat 1
- Stat 2
- Comparison point

## Detailed Explanation
_300–500 words with H2 and H3 structure._

## How to [Action]
1. Step 1
2. Step 2
3. Step 3

## Why Choose TUSA
_Brief value proposition with specific numbers._

## FAQ
_3–5 Q&A pairs._

## Related Topics
_Links to related TUSA pages._
```

---

# 5. AEO (Answer Engine Optimization)

## 5.1 Question Clusters

Identify the 200+ questions people ask about party games, group entertainment, and hosting. Group into clusters.

### Cluster 1: Party Games Fundamentals

| Question | Intent | Target Page | Feature Snippet Type |
|---|---|---|---|
| What are the best party games for groups? | Commercial | `/games` | List |
| How many players do you need for party games? | Informational | `/games/for-4-players` | Table |
| What party games can you play online? | Commercial | `/use-cases/online-parties` | List |
| Are there free party games online? | Commercial | `/games` | Paragraph |
| What games can you play with friends on browser? | Commercial | `/use-cases/online-parties` | List |

### Cluster 2: Game-Specific Rules

| Question | Intent | Target Page |
|---|---|---|
| How do you play Codenames? | Informational | `/games/codenames` |
| What are the rules of Werewolf? | Informational | `/games/werewolf` |
| How do you play Alias? | Informational | `/games/alias` |
| How do you score in Quiplash? | Informational | `/games/quiplash` |

### Cluster 3: Hosting & Organization

| Question | Target Page |
|---|---|
| How to host a virtual game night? | `/resources/remote-team-icebreakers` |
| How to organize a party with friends? | `/features/party` |
| How to invite friends to a game? | `/docs/getting-started` |

### Cluster 4: Technical & Compatibility

| Question | Target Page |
|---|---|
| Do I need to install anything to play TUSA games? | `/faq` |
| Can I play TUSA on my phone? | `/faq` |
| Is TUSA free? | `/pricing` |
| Do all players need an account? | `/faq` |

## 5.2 Feature Snippet Optimization

### Paragraph Snippets

Structure the target paragraph as:

> **"**[Question answer in 40–60 words]**"** — includes the keyword, directly answers the query, ends with a period.

Example:
> "TUSA offers 28 free browser-based party games you can play with friends online. No installation required — players join from their phone's browser. Games include Alias, Werewolf, Codenames, Trivia, and Quiplash. Perfect for groups of 4–12 players."

### List Snippets

Use `<ul>` or `<ol>` with clear, self-contained items:
- Each item must be a complete thought (40–60 chars)
- First item must include the primary keyword
- Google typically displays 3–5 items

### Table Snippets

Use tables for comparison content:
- First column: entity names (game names, player counts)
- Header row: comparison criteria
- Keep tables to 4–5 columns, 6–8 rows

## 5.3 HowTo Schema

For tutorial/guide pages, implement `HowTo` schema:

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Play Alias on TUSA",
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "Create a Party Room", "text": "..." },
    { "@type": "HowToStep", "position": 2, "name": "Invite Friends", "text": "..." },
    { "@type": "HowToStep", "position": 3, "name": "Select Alias", "text": "..." },
    { "@type": "HowToStep", "position": 4, "name": "Start Playing", "text": "..." }
  ]
}
```

## 5.4 FAQ Schema for AEO

FAQPage schema should include questions that answer AI training queries. Each Q&A must be self-contained (the answer does not reference other questions).

Good AEO FAQ entries:

```json
{
  "@type": "Question",
  "name": "What is TUSA?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "TUSA is a browser-based party platform with 28+ multiplayer games. Players join from their phones without installing anything. Games include trivia, word games, social deduction, and creative modes."
  }
}
```

---

# 6. Knowledge Graph

## 6.1 Current State

Google's Knowledge Graph does not yet recognize TUSA as a distinct entity. The goal is to establish:

```
TUSA
├── Type: WebApplication
├── Category: Social Gaming Platform
├── Also known as: TUSA.game
├── Founder/Organization: TUSA Inc.
├── Industry: Internet Entertainment
├── Platform: Browser-based multiplayer
├── Offers: Free + Premium
├── Country of origin: Global (Kazakhstan-founded)
└── Competitors: Jackbox Games, Kahoot!, Tabletopia
```

## 6.2 How to Build the Knowledge Graph Entity

### Step 1: Structured Data on All Pages

Ensure every page includes:
- `Organization` schema on `/` and `/about`
- `WebApplication` schema on `/`
- `SameAs` links to verified social profiles
- `Correction` / `ClaimReview` schema for any factual corrections

### Step 2: Wikipedia / Wikidata

- Create a Wikipedia article for "TUSA (software)" — must meet notability guidelines (significant coverage in reliable sources)
- Create a Wikidata entry: Q‑identifier with properties:
  - `instance of (P31):` web application, social gaming platform
  - `official website (P856):` https://tusa.game
  - `developer (P178):` TUSA Inc.
  - `platform (P400):` web browser
  - `genre (P136):` party game, social game
  - `inception (P571):` 2025

### Step 3: External Citations

Google uses cross-references to confirm entity relationships. Target:
- GitHub repository → TUSA is open-source → links to code
- Product Hunt → TUSA launch → has reviews
- AlternativeTo → listed as party game platform
- Reddit discussions → real user engagement
- TechCrunch / local press → media coverage
- Crunchbase → company profile

### Step 4: Entity Relationship Map

```
TUSA
├── hasPart → [each of 28 games as separate entities]
│   ├── Alias (Game)
│   ├── Werewolf (Game)
│   ├── Codenames (Game)
│   └── ...
├── competitor → Jackbox Games (Organization)
├── competitor → Kahoot! (Organization)
├── platform → Web Browser (SoftwareApplication)
├── availableOn → iOS Safari, Android Chrome, Desktop Chrome (browsers)
├── offers → Free Tier (Offer)
├── offers → Premium Tier (Offer)
└── parentOrganization → TUSA Inc. (Corporation)
```

### Step 5: Google Business Profile

- Create a Google Business Profile for TUSA Inc. (address, phone, category: "Software Company")
- Link website, social profiles
- Encourage reviews

### Step 6: Knowledge Panel Triggers

To trigger a Knowledge Panel, Google needs:
1. Wikipedia or Wikidata entry (strongest signal)
2. Structured data across multiple authoritative domains
3. Consistent NAP (Name, Address, Phone) across the web
4. Social profile verification (blue checkmark on X/Twitter)

---

# 7. Semantic SEO

## 7.1 Semantic Entity Map

Build a comprehensive entity-relationship graph that Google can use to understand TUSA's domain expertise.

```
GATHERING
├── Party
│   ├── House Party
│   ├── Birthday Party
│   ├── Dinner Party
│   ├── After-work
│   └── Holiday Party
├── Game Night
│   ├── Family Game Night
│   ├── Friends Game Night
│   ├── Virtual Game Night
│   └── Team Game Night
├── Event
│   ├── Corporate Event
│   ├── Team Building
│   ├── Wedding Reception
│   ├── College Dorm
│   └── Classroom
└── Social Gathering
    ├── In-person
    ├── Remote
    └── Hybrid

GAME MECHANICS
├── Word Games
│   ├── Alias / Catchphrase
│   ├── Codenames
│   ├── Bomb Party
│   └── Crocodil / Charades
├── Trivia & Quiz
│   ├── Trivia
│   ├── Quiz Battle
│   └── Brain Burst
├── Social Deduction
│   ├── Werewolf / Mafia
│   ├── Spyfall
│   └── Impostor
├── Creative
│   ├── Quiplash (fill-in-the-blank)
│   ├── Fibbage (lie detection)
│   └── Blank Slate
├── Party Classics
│   ├── Never Have I Ever
│   ├── Truth or Dare
│   ├── Would You Rather
│   └── Two Truths One Lie
├── Team Games
│   ├── Alias
│   ├── Codenames
│   ├── Pictionary / Charades
│   ├── Beer Pong
│   └── Wavelength
└── Fast-Paced
    ├── Bomb Party
    ├── Wheel
    ├── Heads Up
    └── Guess the Song

PLATFORM FEATURES
├── Real-time Multiplayer
├── Mobile Controllers
├── No Install
├── Party Management
│   ├── RSVP
│   ├── Chat
│   ├── Gallery
│   ├── Shopping List
│   ├── Koins (engagement tokens)
│   └── Bets
├── Roles
│   ├── Host / Stage
│   └── Player / Controller
├── Social
│   ├── Friends
│   ├── Leaderboard
│   └── Profile
└── Cross-platform
    ├── Mobile
    ├── Desktop
    ├── Tablet
    └── TV (Chromecast / AirPlay)
```

## 7.2 Content Pillar Model

### Pillar: Party Games

| Page Type | URL | Content Type |
|---|---|---|
| Pillar | `/games` | Catalogue (28 games) |
| Cluster | `/games/alias` | Individual game (in-depth) |
| Cluster | `/games/werewolf` | Individual game |
| Cluster | `/games/codenames` | Individual game |
| Cluster | `/games/trivia` | Individual game |
| Cluster | `/use-cases/online-parties` | Use-case |
| Cluster | `/resources/ultimate-party-game-guide` | Guide |

### Pillar: Virtual Team Building

| Page Type | URL |
|---|---|
| Pillar | `/use-cases/remote-teams` |
| Cluster | `/blog/virtual-team-building-activities` |
| Cluster | `/games/for-remote-teams` |
| Cluster | `/resources/remote-team-icebreakers` |

### Pillar: Game Night Hosting

| Page Type | URL |
|---|---|
| Pillar | `/features/game-night` |
| Cluster | `/blog/how-to-host-a-game-night` |
| Cluster | `/docs/getting-started` |
| Cluster | `/resources/host-tips` |

## 7.3 TF-IDF / Semantic Keyword Clusters

For each page, include semantically related terms (LSI keywords) to build topical depth.

### Example: Alias Game Page

```
Primary: Alias game, word explanation game
Secondary: describe words, team word game, party word game
Semantic: vocabulary game, communication game, verbal skills, team play,
  word guessing, explanation game, describe without saying, hot seat,
  timer-based, cooperative game
Entities: Alias, TUSA, party games, word games, team building
```

### Example: Werewolf Game Page

```
Primary: Werewolf game, social deduction game, mafia game
Secondary: hidden roles, bluffing game, deception game, village vs werewolf
Semantic: night phase, day phase, vote elimination, sheriff, seer,
  faction game, player elimination, strategy game, group dynamics
Entities: Werewolf, social deduction, Hidden Roles, Mafia, TUSA
```

## 7.4 Internal Linking with Semantic Anchor Text

Links must use semantically rich anchor text that reinforces the topic cluster:

| Source Page | Anchor Text | Target |
|---|---|---|
| /games | "word explanation game" | /games/alias |
| /games/alias | "social deduction game for 5+ players" | /games/werewolf |
| /use-cases/online-parties | "word games for remote teams" | /games/alias |
| /blog/how-to-host | "set up a party room on TUSA" | /features/party |

---

# 8. Topic Authority

## 8.1 Building Topical Authority in "Party Games"

Google evaluates topical authority by the depth and breadth of content on a subject. TUSA must become the definitive resource for "party games" as a topic.

### Authority Hierarchy

```
Level 0: /games (catalogue — broad coverage)
Level 1: /games/[slug] (28 individual game pages — vertical depth)
Level 2: /use-cases/* (horizontal expansion — contexts)
Level 3: /blog/* (editorial content — thought leadership)
Level 4: /resources/* (guides — utility)
Level 5: External citations (third-party validation)
```

### Target: 150+ Pages on Party Games

| Category | Page Count | Content Type |
|---|---|---|
| Game pages (28 games × 2 languages) | 56 | Core product pages |
| Use-case pages | 10 | Programmatic + editorial |
| Blog articles | 40 | Guides, tips, comparisons |
| Resource pages | 10 | In-depth guides, templates |
| Programmatic (player count, category) | 30+ | Template-generated |
| FAQ + support | 10 | Structured Q&A |

Total: ~156 pages

## 8.2 Topical Authority Scorecard

| Metric | Current | Target (6 months) | Target (12 months) |
|---|---|---|---|
| Pages indexed for "party games" | ~5 | 50+ | 150+ |
| Keyword rankings (top 10) | 0 | 20+ | 100+ |
| Referring domains | 0 | 10+ | 50+ |
| AI citations (ChatGPT, Perplexity) | 0 | 5+ | 25+ |
| Knowledge Graph entities | 0 | 3+ | 10+ |

## 8.3 Content Gap Analysis

### Current Gaps (Pages TUSA Must Create)

| Gap | Priority | Page Type |
|---|---|---|
| "/games/for-4-players" — which games work for 4 | Critical | Programmatic |
| "best party games for couples" — niche query | High | Blog |
| "party games without props" — no-install angle | High | Blog |
| "games like Jackbox free" — competitor comparison | Critical | Blog |
| "how to play [game]" — rules for each game | Critical | Individual game pages |
| "party games for adults" — age-targeted | High | Programmatic |
| "fun games to play on Zoom" — remote-specific | High | Use-case |

## 8.4 Standing Out: TUSA's Unique Content Advantage

| Advantage | Content Opportunity |
|---|---|
| Open source codebase | Publish engineering blog posts ("How we built real-time multiplayer") |
| 28 games in one platform | Comparison content ("Which TUSA game should you play?") |
| Mobile-first architecture | Mobile gaming guides ("Best browser games for Android") |
| No install | No-install angle as differentiator ("Play without downloading") |
| Free | Free vs paid comparison content |

---

# 9. Programmatic SEO

## 9.1 Player Count Pages

Template: `/games/for-[n]-players`

| Page | Keyword | Search Volume (est.) |
|---|---|---|
| `/games/for-2-players` | 2 player party games | 5K/mo |
| `/games/for-3-players` | 3 player party games | 2K/mo |
| `/games/for-4-players` | 4 player party games | 12K/mo |
| `/games/for-5-players` | 5 player party games | 4K/mo |
| `/games/for-6-players` | 6 player party games | 6K/mo |
| `/games/for-7-players` | 7 player party games | 1K/mo |
| `/games/for-8-players` | 8 player party games | 8K/mo |
| `/games/for-10-players` | 10 player party games | 3K/mo |
| `/games/for-12-players` | 12 player party games | 2K/mo |
| `/games/for-large-groups` | party games for large groups | 5K/mo |

### Template

```tsx
// app/games/for-[n]-players/page.tsx
export default function GamesForNPlayers({ params }) {
  const count = parseInt(params.n);
  const games = gameCatalogue.filter((g) => minPlayers(g) <= count && maxPlayers(g) >= count);
  return <GameListPage playerCount={count} games={games} />;
}

export async function generateMetadata({ params }) {
  const count = parseInt(params.n);
  return {
    title: `${count} Player Party Games — Multiplayer · TUSA.game`,
    description: `Best party games for ${count} players. Play free online — no install. ${games.map(g => g.title).join(", ")}`,
    alternates: { canonical: `https://tusa.game/games/for-${count}-players` },
  };
}
```

## 9.2 Category Pages

Template: `/games/for-[category]`

| Page | Target Keywords |
|---|---|
| `/games/for-families` | family party games, games for family night |
| `/games/for-teams` | team party games, group games for work |
| `/games/for-college` | college party games, dorm games |
| `/games/for-adults` | party games for adults, adult game night |
| `/games/for-kids` | party games for kids, children's group games |
| `/games/for-couples` | couple party games, games for two |
| `/games/for-birthday` | birthday party games |
| `/games/for-weddings` | wedding reception games |

## 9.3 Niche / Long-Tail Pages

| URL | Keywords |
|---|---|
| `/games/for-remote-teams` | virtual team building games, remote icebreakers |
| `/games/for-classroom` | classroom party games, school group games |
| `/games/no-props` | party games with no props, no materials needed |
| `/games/no-app` | browser games no download, no app party games |
| `/games/free-alternatives-to-jackbox` | free jackbox alternatives |
| `/games/quick-5-minute` | quick party games, 5 minute party games |
| `/games/drinking` | drinking party games, adult party games (age-gated) |

## 9.4 Comparison Pages

| URL | Intent |
|---|---|
| `/games/alias-vs-codenames` | Which word game is better? |
| `/games/werewolf-vs-mafia` | Social deduction comparison |
| `/compare/tusa-vs-jackbox` | TUSA vs Jackbox comparison |
| `/compare/tusa-vs-kahoot` | TUSA vs Kahoot comparison |
| `/compare/tusa-vs-houseparty` | TUSA vs Houseparty comparison |

## 9.5 Geo-Targeted Pages (Future)

| URL | Target |
|---|---|
| `/games/kz` | TUSA for Kazakhstan (localized content) |
| `/games/ru` | TUSA for Russia |
| `/games/us` | TUSA for United States |
| `/games/uk` | TUSA for United Kingdom |

## 9.6 Implementation Architecture

```tsx
// lib/programmatic.ts — programmatic page data source
const PLAYER_COUNTS = [2, 3, 4, 5, 6, 7, 8, 10, 12];
const CATEGORIES = ["families", "teams", "college", "adults", "kids", "couples", "birthday", "weddings"];

// Each page generated via generateStaticParams in App Router
export function generateStaticParams() {
  const playerCountPages = PLAYER_COUNTS.map((n) => ({ slug: `for-${n}-players` }));
  const categoryPages = CATEGORIES.map((cat) => ({ slug: `for-${cat}` }));
  return [...playerCountPages, ...categoryPages];
}
```

### URL Slug to Data Mapping

```ts
function pageData(slug: string): { games: Game[]; title: string; description: string; h1: string } {
  const match = slug.match(/^for-(\d+)-players$/);
  if (match) return playerCountPage(parseInt(match[1]));
  const category = slug.match(/^for-(.+)$/);
  if (category) return categoryPage(category[1]);
  throw new Error("Unknown programmatic page");
}
```

---

# 10. EEAT (Experience, Expertise, Authoritativeness, Trustworthiness)

## 10.1 Experience (Real-World Usage)

| Signal | Implementation |
|---|---|
| Product screenshots | Real UI screenshots on every page (not mockups) |
| "Played by [number] parties" | Social proof counter on landing page |
| User stories | Blog series: "How [person] uses TUSA for [scenario]" |
| Real-time demo | `/demo` page with interactive preview |
| Host testimonials | Quote cards from real hosts (with permission) |

## 10.2 Expertise (Subject Matter Authority)

| Signal | Implementation |
|---|---|
| Game rules accuracy | Each game page includes official rules reviewed by game design experts |
| Content depth | 800+ words per game page, 1500+ for guides |
| No factual errors | All game content verified against original game rules |
| Author bylines | Blog posts by "TUSA Team" with link to /about |
| Original research | Publish data: "Most popular party games by season" |
| Technical expertise | Engineering blog: "How we built real-time SSE" |

## 10.3 Authoritativeness (External Validation)

| Signal | Implementation |
|---|---|
| Backlinks | Earn links from gaming sites, event planning sites, tech blogs |
| Press mentions | Pitch to TechCrunch, Product Hunt, local media |
| Social media presence | Active Twitter/X, Discord community |
| GitHub stars | Open-source repository demonstrates technical credibility |
| Industry recognition | Nominate for awards (Product Hunt Golden Kitty, etc.) |
| Guest posting | Contribute to gaming/event planning publications |

### Link Building Targets

| Type | Examples | Strategy |
|---|---|---|
| Gaming directories | AlternativeTo, TopFreeAlternatives | Submit TUSA profile |
| Event planning sites | TheKnot, Zola, Partyslate | Feature as party game resource |
| Tech blogs | HackerNews, Dev.to, Reddit r/SideProject | Share engineering story |
| Educational | University event planning guides | Resource for student events |
| Comparison sites | Versus, Slant | Get listed as Jackbox alternative |

## 10.4 Trustworthiness (User Confidence)

| Signal | Implementation |
|---|---|
| Privacy policy | `/privacy` — clear, no legalese |
| Terms of service | `/terms` — user-friendly summary + full legal |
| GDPR consent | Cookie banner + consent management |
| Security | CSP headers, HTTPS, auth guards |
| Transparent pricing | `/pricing` — free + premium, no hidden fees |
| No trackers | Zero third-party analytics scripts |
| Open source | Public GitHub repository |
| Contact | `/contact` — support form + email |
| Status page | `/status` — system health monitoring |

### Trust Badges (Homepage Footer)

```
[Open Source] [GDPR Compliant] [No Tracking] [256-bit HTTPS] [Free Forever]
```

## 10.5 EEAT Scoring Rubric

| Criteria | Weight | Current Score | Target |
|---|---|---|---|
| Privacy & Security | 20% | 8/10 | 10/10 |
| Content Accuracy | 20% | 7/10 | 10/10 |
| Content Depth | 15% | 5/10 | 9/10 |
| External Backlinks | 15% | 0/10 | 7/10 |
| Social Proof | 10% | 3/10 | 8/10 |
| Author Credibility | 10% | 4/10 | 8/10 |
| Technical Quality | 10% | 8/10 | 10/10 |
| **Total** | **100%** | **5.0/10** | **8.8/10** |

---

# 11. Technical SEO

## 11.1 Files Inventory

| File | Status | Notes |
|---|---|---|
| `app/robots.ts` | ✅ Implemented | AIbot rules, sitemap reference |
| `app/sitemap.ts` | ✅ Implemented | 11 entries, needs expansion |
| `app/manifest.webmanifest` | ✅ Implemented | PWA manifest |
| `public/favicon.ico` | ✅ | SVG favicon |
| `app/layout.tsx` | ✅ | Organization + WebApp JSON-LD, hreflang, OG |
| `next.config.ts` | ✅ | CSP, headers, image optimization |
| `middleware.ts` (proxy.ts) | ✅ | Auth routing, no SEO impact |

## 11.2 Robots.txt Specification

### Current `app/robots.ts`

```
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
...
Sitemap: https://tusa.game/sitemap.xml
```

### Required Additions

- `Disallow: /_next/` — prevent Next.js internal paths
- `Disallow: /__nextjs_original-stack-frame` — prevent error pages
- `Allow: /$` — explicitly allow root
- `Crawl-delay: 10` — rate limiting for non-critical crawlers

## 11.3 Sitemap Specification

### Current `app/sitemap.ts`

Covers: `/`, `/games`, `/faq`, `/about`, `/demo`, `/privacy`, `/terms`, 3 use-case pages.

### Required Expansion (Add the following)

```
/games/alias
/games/werewolf
/games/codenames
/games/trivia
/games/quiz-battle
/games/bomb-party
/games/wavelength
/games/quiplash
/games/fibbage
/games/blank-slate
/games/spyfall
/games/impostor
/games/crocodil
/games/brain-burst
/games/never-have-i-ever
/games/truth-or-dare
/games/would-you-rather
/games/two-truths-one-lie
/games/kiss-marry-kill
/games/beer-pong
/games/wheel
/games/headsup
/games/guess-song
/games/charades
/games/pairs
/games/bunker
/games/uno
/games/alias (RU)
... (28 games × 2 languages = 56 entries)

/blog
/blog/[slug] (as published)

/games/for-2-players
/games/for-3-players
/games/for-4-players
... (up to 12)

/games/for-families
/games/for-teams
/games/for-college
... (categories)

/use-cases/corporate-events
/use-cases/birthday-parties
/use-cases/family-game-night
/use-cases/college-dorm
/use-cases/wedding-reception
/use-cases/team-building
/use-cases/classroom-icebreakers

/pricing
/features
/features/game-night
/features/party
/roadmap
/updates
/support
/contact
/press
/resources
/resources/ultimate-party-game-guide
/resources/remote-team-icebreakers
/resources/host-tips
/compare/tusa-vs-jackbox
/compare/tusa-vs-kahoot
```

### Sitemap Implementation

Use `app/sitemap.ts` with dynamic generation:

```ts
const STATIC_PAGES = ["/", "/games", "/faq", "/about", ...];
const PROGRAMMATIC = [
  ...PLAYER_COUNTS.map((n) => `/games/for-${n}-players`),
  ...CATEGORIES.map((c) => `/games/for-${c}`),
];
const USE_CASES = ["online-parties", "remote-teams", ...];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = gameCatalogue.map((g) => ({
    url: `https://tusa.game/games/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    { url: "https://tusa.game", lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    ...STATIC_PAGES.map(slugToEntry),
    ...games,
    ...PROGRAMMATIC.map(slugToEntry),
    ...USE_CASES.map(slugToUseCaseEntry),
  ];
}
```

## 11.4 Canonical URLs

| Rule | Implementation |
|---|---|
| Every page | Self-referencing canonical, no trailing slash |
| noindex pages | `/party/*`, `/join/*`, `/app/*` — canonical still set but noindex |
| Paginated | `/blog/page/2` → canonical to `/blog` or self |
| Duplicate content | `/games/alias` vs `/games/alias?ref=twitter` → canonical to clean URL |

## 11.5 HTTP Headers (next.config.ts)

Current:

```ts
headers: async () => [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), microphone=()" },
    ],
  },
];
```

### Required Additions

```ts
{ key: "X-Robots-Tag", value: "index, follow" },  // Default, override per route
{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" },
```

### Route-Specific Overrides

| Route | X-Robots-Tag | Cache-Control |
|---|---|---|
| `/party/*` | `noindex, nofollow` | `private, no-cache` |
| `/join/*` | `noindex, nofollow` | `private, no-cache` |
| `/app/*` | `noindex, nofollow` | `private, no-cache` |
| `/api/*` | `none` | `private, no-cache` |
| All other | `index, follow` | `public, max-age=3600` |

## 11.6 meta Robots Per Page

```tsx
// Party room — must not be indexed
export const metadata = { robots: { index: false, follow: false } };

// App dashboard
export const metadata = { robots: { index: false, follow: false } };

// Landing, games, blog
export const metadata = { robots: { index: true, follow: true } };
```

## 11.7 Pagination

```html
<link rel="prev" href="/blog/page/2" />
<link rel="next" href="/blog/page/4" />
```

or use `next`/`prev` in metadata.

## 11.8 Broken Link Monitoring

- Run `npm run check-links` (lychee or hyperlink) weekly
- Integrate with CI (GitHub Actions) on every build
- 404s automatically tracked in analytics
- Custom 404 page at `/not-found.tsx`

---

# 12. Performance

## 12.1 Core Web Vitals Targets

| Metric | Target | Current (est.) | Notes |
|---|---|---|---|
| LCP | <2.5s | ~1.8s | Good — static pages are near-instant |
| INP | <200ms | ~150ms | Good — no heavy JS on interaction |
| CLS | <0.1 | ~0.05 | Good — minimal layout shift |
| TTFB | <800ms | ~200ms (static) / ~1.2s (dynamic) | Static pages fast; dynamic (party) slower due to DB |
| FCP | <1.8s | ~1.2s | Good |

## 12.2 Lighthouse Score Targets

| Category | Target | Current (est.) |
|---|---|---|
| Performance | >95 | ~85–95 |
| Accessibility | >95 | ~90 |
| Best Practices | >95 | ~92 |
| SEO | 100 | 100 |

## 12.3 Optimization Checklist

### Images

| Task | Priority | Status |
|---|---|---|
| WebP format for all raster images | High | ✅ |
| AVIF as next-gen format | Medium | ⬜ |
| `<Image>` component with lazy loading | High | ✅ |
| Responsive srcSet for OG images | Medium | ⬜ |
| Image CDN (Vercel Image Optimization) | High | ✅ |
| Preload LCP image | High | ⬜ |

### Fonts

| Task | Priority | Status |
|---|---|---|
| `font-display: swap` | High | ✅ |
| Subset fonts (Latin + Cyrillic) | High | ✅ |
| Preload primary fonts | Medium | ⬜ |
| Font self-hosting (no Google Fonts API call) | High | ✅ |

### JavaScript

| Task | Priority | Status |
|---|---|---|
| Next.js bundling (Turbopack) | High | ✅ |
| Dynamic imports for heavy components | High | ✅ |
| `use client` minimization | Medium | ✅ |
| Remove unused JS | Medium | ⬜ |
| Lazy load game components | High | ✅ |
| Code-split by route | High | ✅ |

### CSS

| Task | Priority | Status |
|---|---|---|
| Purge unused CSS | High | ⬜ (globals.css has ~3600 lines) |
| Critical CSS inlined | Medium | ⬜ |
| `@layer` for cascade control | Low | ⬜ |

### Caching

| Task | Priority | Status |
|---|---|---|
| Static page ISR | High | ✅ (most pages static) |
| API response caching | Medium | ⬜ |
| Service worker (PWA cache) | High | ✅ |
| Redis for session cache (future) | Low | ⬜ |

## 12.4 Streaming and SSR

| Page | Rendering | Notes |
|---|---|---|
| Landing | Static (SSG) | Pre-built, no data dependency |
| Game pages | Static (SSG) | Pre-built from data |
| Party room | Dynamic (SSR) | Requires DB query |
| Blog | Static (SSG) | Pre-built |
| API routes | Dynamic | Serverless functions |

## 12.5 Performance Budget

| Resource | Budget |
|---|---|
| Total page weight | <200KB (first load) |
| JS per page | <100KB |
| CSS per page | <50KB |
| Fonts | <50KB |
| Images | <100KB (LCP image) |
| Time to Interactive | <3s (3G) |
| Lighthouse Performance | >90 |

---

# 13. International SEO

## 13.1 Hreflang Implementation

Current (`app/layout.tsx`):

```tsx
alternates: {
  languages: {
    ru: "https://tusa.game/ru",
    en: "https://tusa.game/en",
    "x-default": "https://tusa.game",
  },
},
```

### Current Implementation (Parameter-Based)

Using `?locale=ru` / `?locale=en` via query parameter, not URL path. This is acceptable for MVP but not ideal.

### Target Implementation (URL-Based)

```
/en/games/alias
/ru/игры/alias
/en/use-cases/online-parties
/ru/use-cases/online-parties
```

Implementation requires middleware (proxy.ts) rewrite:

```ts
// proxy.ts — i18n routing
if (pathname.startsWith("/ru")) {
  request.nextUrl.pathname = pathname.replace("/ru", "");
  // set cookie/header for RU locale
}
```

### Hreflang Matrix

| Page | EN URL | RU URL | x-default |
|---|---|---|---|
| Home | `/en` | `/ru` | `/` |
| Games | `/en/games` | `/ru/games` | `/games` |
| Alias | `/en/games/alias` | `/ru/games/alias` | `/games/alias` |
| FAQ | `/en/faq` | `/ru/faq` | `/faq` |
| About | `/en/about` | `/ru/about` | `/about` |

## 13.2 Country Targeting

| Country | Language | Priority | Strategy |
|---|---|---|---|
| 🇰🇿 Kazakhstan | RU, KK | High | Local market, founders' origin |
| 🇷🇺 Russia | RU | High | Large Russian-speaking audience |
| 🇺🇸 United States | EN | High | Primary English market |
| 🇬🇧 United Kingdom | EN | Medium | English, cultural affinity |
| 🇩🇪 Germany | EN → DE | Medium | Strong board game culture |
| 🇧🇷 Brazil | EN → PT | Medium | Large social gaming audience |
| 🇯🇵 Japan | EN → JA | Low | Party game culture, different platform needs |

## 13.3 Content Localization Strategy

| Content Type | Localization Approach |
|---|---|
| Game UI (strings) | Fully localized via `lib/i18n.ts` (RU/EN) |
| Game questions | Translated per language (Trivia, NeverHaveIEver, etc.) |
| Marketing pages | Translated via i18n system |
| Blog articles | Separate per language (not translated — unique content) |
| Game descriptions | Translated + culturally adapted |
| SEO metadata | Independent per language (keywords differ) |
| Use-case pages | Translated + region-specific examples |

## 13.4 CDN & Edge

| Feature | Current | Target |
|---|---|---|
| CDN | Vercel Edge Network | ✅ |
| Edge functions | proxy.ts (Vercel Edge) | ✅ |
| Static assets | Vercel Smart CDN | ✅ |
| Geo-routing | Automatic (Vercel) | ✅ |

## 13.5 International Indexation Rules

| Signal | Implementation |
|---|---|
| Don't block localized CSS/JS | `Disallow: /_next/` is fine, but not language-specific |
| Localized sitemaps | Separate sitemap per language: `sitemap-en.xml`, `sitemap-ru.xml` |
| Language-specific schema | JSON-LD `inLanguage` property on all pages |
| Country-specific TLDs | Future: `tusa.kz`, `tusa.ru` — 301 to subfolder |

---

# 14. AI Crawlers

## 14.1 Crawler Identification and Config

| Crawler | User-Agent Token | Purpose | Current Rule |
|---|---|---|---|
| GPTBot | `GPTBot` | OpenAI training data | ✅ Allow `/` |
| ChatGPT-User | `ChatGPT-User` | ChatGPT real-time browse | ✅ Allow `/` (via bot allow) |
| ClaudeBot | `ClaudeBot/1.0` | Anthropic training data | ✅ Allow `/` |
| Claude-SearchBot | `Claude-SearchBot/1.0` | Claude real-time search | ✅ Allow `/` |
| Google-Extended | `Google-Extended` | Google AI training | ✅ Allow `/` |
| PerplexityBot | `PerplexityBot/1.0` | Perplexity indexing | ✅ Allow `/` |
| CCBot | `CCBot/2.0` | Common Crawl (all AI training) | ✅ Allow `/` |
| Bytespider | `Bytespider` | ByteDance (TikTok parent) | ⬜ Needs decision |
| Meta External Agent | `Meta-ExternalAgent` | Meta AI training | ⬜ Needs decision |
| Applebot | `Applebot` | Apple Intelligence | ✅ Allow `/` |
| Bingbot | `bingbot` | Bing + Copilot | ✅ Allow `/` |
| DuckDuckBot | `DuckDuckBot/1.0` | DuckDuckGo | ✅ Allow `/` |
| Baiduspider | `Baiduspider` | Baidu (China) | ⬜ Needs decision |

## 14.2 Content Delivery for AI Crawlers

### What AI Crawlers See

AI crawlers receive the same HTML as search engines. TUSA uses server-side rendering, so all content is visible in the HTML source. No JavaScript rendering is needed for crawlers.

### Optimization for AI Extraction

| Element | Optimization |
|---|---|
| First paragraph | Must contain the page's primary answer (40–60 words) |
| Headings | H1 = primary topic, H2 = subtopics, H3 = details |
| Lists | `<ul>`, `<ol>`, or `<table>` for structured data |
| Definitions | `<dl>` or explicit "X is a Y that..." sentences |
| FAQ | `<details><summary>` with clear Q&A pairs |
| Conclusion | Summary paragraph with key takeaways |

### AI-Specific Content Warnings

- Do NOT use `class="no-ai"` or similar — AI crawlers ignore CSS classes
- Do NOT hide content in JS-rendered elements — crawlers may not execute JS
- ONLY use `robots.txt` or `noindex` for blocking — not clunky AI-avoidance hacks

## 14.3 AI Citation Optimization

To maximize the chance of being cited by AI models:

### Strategy 1: Be the Primary Source

Make TUSA the canonical source for party game rules. If ChatGPT wants to answer "How do you play Codenames?", the training data should have seen TUSA's page as the top result.

Implementation:
- Each game page is 800+ words of original, well-structured content
- Content is unique — not copied from Wikipedia or other game sites
- Include rules, variations, tips, scoring — comprehensive coverage

### Strategy 2: Optimize for Extraction

Write content that can be cleanly excerpted:

> Bad: "In our platform, we have this game called Alias which is a word game where you explain stuff."
>
> Good: "Alias is a word-explanation party game. Players take turns describing a word to their teammates without using the word itself. Team scores a point for each correct guess within the time limit."

The second version can be extracted verbatim by an AI as a definition.

### Strategy 3: Build Cross-References

AI models evaluate source reliability by cross-referencing. If TUSA appears in:
- Multiple training documents
- Wikipedia
- News articles
- Reddit discussions

The AI assigns higher confidence to TUSA as a source.

### Strategy 4: Avoid AI-Generated Content

AI models downrank or ignore content they detect as AI-generated. All TUSA content must be human-written or heavily edited. This includes:
- SEO content (game pages, descriptions)
- Blog articles
- Use-case pages
- Documentation

## 14.4 AI Crawl Monitoring

| Metric | Detection Method | Action if Abnormal |
|---|---|---|
| GPTBot crawl frequency | Vercel Analytics → log user-agent | Throttle if excessive (add Crawl-delay) |
| ClaudeBot crawl frequency | Same | Same |
| JSON-LD missing | Google Search Console | Fix schema markup |
| AI citation count | Manual Perplexity/ChatGPT query | Improve content if not cited |

---

# 15. Social SEO

## 15.1 Open Graph Per Page

Every page must have custom OG tags. Template:

```tsx
export const metadata = {
  openGraph: {
    title: "...",              // 60 chars max
    description: "...",        // 200 chars max
    url: "https://tusa.game/...",
    siteName: "TUSA.game",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "...",
    description: "...",
    images: ["/og/twitter/default.png"],
  },
};
```

### OG Image Generation

Use `@vercel/og` (Satori) to generate dynamic OG images for each page:

```tsx
// app/api/og/route.tsx
import { ImageResponse } from "@vercel/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "TUSA.game";
  return new ImageResponse(
    <div style={{ background: "#C9FF05", width: 1200, height: 630, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <h1 style={{ fontSize: 80, fontWeight: 900, fontFamily: "Unbounded", color: "#000", letterSpacing: "-.06em" }}>{title}</h1>
    </div>,
    { width: 1200, height: 630 },
  );
}
```

### OG Image Inventory

| Page | OG Image Path |
|---|---|
| Home | `/og/home.png` (or dynamic) |
| Games | `/og/games.png` |
| Each game | `/og/games/alias.png` (dynamic) |
| Blog | `/og/blog/[slug].png` (dynamic) |
| Use-cases | `/og/use-cases/[slug].png` |

## 15.2 Social Platform Optimization

### Discord

- Rich embed when sharing TUSA links in Discord
- Must have: title, description, image, site name
- Custom bot for game session invites (future)

### Telegram

- `t.me/TUSA_Game` channel for updates
- Shared links use OG tags (same as above)
- Telegram Instant View (IV) template for blog content

### WhatsApp

- OG tags for link previews (same as above)
- Share buttons on party room: "Share invite link"

### X (Twitter)

- `@TUSA_Game` account
- OG Twitter card for every page
- Automated tweets for new games, features

### LinkedIn

- Article impressions via OG tags
- Company page for TUSA Inc.
- Share game night guides as LinkedIn articles

### Facebook

- OG tags for link sharing
- No Facebook app dependency (browser-only works everywhere)

## 15.3 Social Sharing URLs

Add share buttons to key pages:

```tsx
const shareUrls = {
  twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
};
```

### Share Button Placement

| Page | Share Button |
|---|---|
| Party Room | "Share invite link" — copies URL or opens share sheet |
| Game page | "Share this game" — social share buttons |
| Blog article | "Share this article" — social share buttons |
| Landing | "Tell your friends" — share via WhatsApp/Telegram |

---

# 16. Growth Engine

## 16.1 Viral Loop Architecture

```
User creates party
  → Share invite link
    → Friend joins party
      → Friend plays game
        → Friend creates own party
          → Friend invites own friends
            → (loop continues)
```

### Loop Parameters

| Parameter | Current | Target |
|---|---|---|
| Invite-to-Join conversion | Unknown | >40% |
| Join-to-Play conversion | ~50% | >70% |
| Play-to-Create conversion | ~10% | >25% |
| Average invite recipients | 3 | 8 |
| Viral coefficient (K) | Unknown | >1.0 |

### Viral Coefficient Formula

```
K = (invites sent per user) × (invite-to-join conversion) × (join-to-create conversion)

Target: K > 1.0
Example: 8 invites × 0.4 conversion × 0.25 creation = 0.8 (near viral)
```

## 16.2 Invite System

### Current

- Party invite link: `/join/[inviteCode]`
- QR code generation
- Share button (copies link)

### Improvements

| Feature | Priority | Impact |
|---|---|---|
| **Deep link preview** | P0 | OG tags render party title, date, game count |
| **One-tap join** | P0 | Join without account (guest mode) |
| **Invite suggestions** | P1 | Auto-suggest contacts who play TUSA |
| **Scheduled invites** | P2 | Send invite at party start time |
| **Batch invite** | P2 | Select multiple friends at once |
| **Invite tracking** | P1 | See who opened/who joined |
| **Multiple channels** | P1 | WhatsApp, Telegram, SMS, email |

## 16.3 UGC (User-Generated Content)

| Content Type | Example | Value |
|---|---|---|
| Party photos | Gallery uploads | Social proof, retention |
| Game scores | Leaderboard | Competition, return visits |
| Custom parties | Named rooms with themes | Identity expression |
| Nicknames | Custom display names | Personalization |
| Party descriptions | "Friday game night!" | Searchable content |

### UGC Moderation

- All photo uploads are party-private (not public)
- No public comments or reviews (no moderation burden)
- Scoring data is aggregated, not individually displayed

## 16.4 Creator Program

### Phase 1 (Current): Ambassadors

- Discord community members
- Early access to new games
- Exclusive avatar frames / badges

### Phase 2: Content Creators

| Tier | Requirements | Benefits |
|---|---|---|
| Bronze | 1K followers on any platform | Early access, badge |
| Silver | 5K followers | + Custom party themes |
| Gold | 20K followers | + Coins package, featured on /community |
| Platinum | 100K followers | + Revenue share (future) |

### Phase 3: Custom Game API (Future)

Allow creators to build and host their own game modes on TUSA.

## 16.5 Community

### Discord

| Channel | Purpose |
|---|---|
| `#announcements` | Product updates, game releases |
| `#general` | Community chat |
| `#game-lfg` | Looking for group — find players |
| `#suggestions` | Feature requests |
| `#bug-reports` | Issue tracking |
| `#showcase` | Party screenshots, high scores |
| `#creators` | Creator program discussion |
| `#dev` | Open-source contributors |

### Community Growth Tactics

| Tactic | Effort | Impact |
|---|---|---|
| Weekly game night events | Low | High — recurring engagement |
| Monthly tournaments | Medium | High — competition |
| Hall of Fame (top parties) | Low | Medium — recognition |
| Open source contributions | Medium | High — credibility |
| "Party of the Week" feature | Low | Medium — UGC showcase |

## 16.6 Referral Program (Future)

| Element | Spec |
|---|---|
| Reward | 500 Koins per referral (invitee must play a game) |
| Cap | 10 referrals/day |
| Tracking | Unique referral code per user |
| Display | Leaderboard: "Top Referrers" |
| Anti-fraud | Require invitee to play ≥1 game, not just join |

## 16.7 Retention Loops

| Loop | Trigger | Action |
|---|---|---|
| Party reminder | 1 hour before party | Notification/email: "Your party starts soon" |
| Game night suggestion | Weekend evening | In-app push: "Start a game night" |
| New game alert | New game released | Notification: "New game: [name]" |
| Weekly recap | Every Monday | "Last week: X games played, Y parties" |
| Friend activity | Friend created party | "Your friend started a party — join?" |
| Streak reward | Daily login | Koins bonus for consecutive days |

---

# 17. Analytics

## 17.1 Event Taxonomy

### Page Views

| Event | Properties |
|---|---|
| `page_view` | path, referrer, utm_source, utm_medium, utm_campaign, locale |
| `landing_view` | hero_cta_clicked, featured_game_clicked |
| `game_page_view` | game_slug, source (catalogue / search / direct) |

### Party Events

| Event | Properties |
|---|---|
| `party_created` | category, adult_only, title_length |
| `party_joined` | invite_code, referrer_type (link / qr / direct) |
| `party_invite_sent` | channel (whatsapp / telegram / copy / qr) |
| `party_invite_converted` | time_to_join |
| `rsvp_updated` | status (going / maybe / pass) |
| `party_chat_sent` | message_type (text / voice / sticker) |
| `party_photo_uploaded` | count |
| `party_shopping_item_added` | category |

### Game Events

| Event | Properties |
|---|---|
| `game_session_created` | game, player_count |
| `game_session_joined` | game, role (stage / controller) |
| `game_action` | game, action_type |
| `game_completed` | game, duration, rounds |
| `game_score_saved` | game, score_value |
| `game_replay` | same_session, new_session |

### User Events

| Event | Properties |
|---|---|
| `user_sign_up` | method (email / google / apple) |
| `user_sign_in` | method |
| `friend_added` | source (search / in-party / invite) |
| `profile_updated` | field (name / avatar / frame) |
| `reward_earned` | reward_type, amount |
| `streak_milestone` | day_count |

### Growth Events

| Event | Properties |
|---|---|
| `invite_shared` | channel |
| `referral_click` | referrer_id |
| `referral_converted` | referrer_id, time_to_convert |
| `creator_program_joined` | tier, platform |
| `community_joined` | source (discord / github / x) |

## 17.2 Key Metrics Dashboard

### Growth

```
MAU (Monthly Active Users)
WAP (Weekly Active Parties)
New Users (daily)
Invite-to-Join Conversion Rate
Viral Coefficient (K)
```

### Engagement

```
Avg Games Per Session
Avg Session Duration
DAU/MAU Ratio
Daily Messages Per Party
Daily Photo Uploads
```

### Retention

```
D1, D7, D30 Retention
Party Recurrence Rate (% of parties with >1 session)
Returning Player Rate
```

### Revenue (Future)

```
Premium Conversion Rate
ARPU (Avg Revenue Per User)
LTV (Lifetime Value)
Stripe MRR
```

### Quality

```
Game Error Rate
SSE Latency (p95)
SSE Disconnect Rate
API 5xx Rate
```

## 17.3 Analytics Implementation

### Current: None (intentional — no third-party scripts)

### Phase 1: First-Party Analytics

```ts
// lib/analytics.ts — lightweight, self-hosted
const events: Record<string, unknown>[] = [];

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return; // server-side skip
  events.push({ event, properties, timestamp: Date.now(), url: window.location.pathname });
  // Batch-send every 30s or on page leave
}

// Flush on visibility change
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flush();
});
```

Endpoint: `POST /api/analytics` — writes to a separate `analytics_events` table in Neon.

### Phase 2: Dashboard

- Custom analytics dashboard at `/admin`
- Real-time event stream
- Daily/Weekly/Monthly aggregation
- Cohort analysis (SQL-based)

### Phase 3: Visualization (Future)

- Grafana or similar on read replica
- No third-party analytics SDKs ever

## 17.4 Conversion Funnels

### Funnel 1: Landing → Party

```
Landing visit (100%)
  → Click "Get Started" (40%)
    → Sign up / Sign in (70%)
      → Create party (50%)
        → Invite friends (60%)
          → Friend joins (40%)
            → Play game (80%)
              → Funnel conversion: ~2.7%
```

### Funnel 2: Invite → Join

```
Invite link sent (100%)
  → Link opened (60%)
    → Pre-join page viewed (80%)
      → RSVP selected (70%)
        → Join clicked (60%)
          → Party room loaded (90%)
            → Funnel conversion: ~18%
```

### Funnel 3: Free → Premium

```
Free user (100%)
  → Reached party limit (30%)
    → Viewed pricing (40%)
      → Started checkout (20%)
        → Completed payment (60%)
          → Funnel conversion: ~1.4%
```

## 17.5 A/B Testing Framework (Future)

| Test | Hypothesis | Metric |
|---|---|---|
| Hero CTA text | "Start a Party" vs "Play Now" | Click-through rate |
| Game card design | Icon + title vs screenshot | Game launch rate |
| Invite flow | One-tap vs copy link | Invite-to-join conversion |
| Pricing position | Top nav vs bottom of page | Pricing page views |

All A/B tests run via `next.config.ts` feature flags or cookie-based assignment — no third-party tools.

---

# 18. Backlog

## 18.1 SEO Tasks (200+)

### Critical (P0)

| # | Task | Effort | Impact | Dependencies |
|---|---|---|---|---|
| SEO-001 | Generate OG images for all 28 game pages | 1d | High | `/api/og` |
| SEO-002 | Add all 28 game pages to sitemap | 0.5d | High | — |
| SEO-003 | Add `hreflang` to all public pages | 1d | High | i18n routing |
| SEO-004 | Generate dynamic OG images for blog + use-cases | 1d | High | `/api/og` |
| SEO-005 | Create `/games/[slug]` individual page for each game | 5d | Critical | Game content |
| SEO-006 | Add `Game` JSON-LD schema to game pages | 1d | High | SEO-005 |
| SEO-007 | Create `/pricing` page with `Product` + `Offer` schema | 2d | High | — |
| SEO-008 | Create `/features` page with feature breakdown | 2d | High | — |

### High (P1)

| # | Task | Effort | Impact |
|---|---|---|---|
| SEO-101 | Set up Google Search Console + Bing Webmaster Tools | 0.5d | High |
| SEO-102 | Submit sitemap to GSC + Bing | 0.5d | High |
| SEO-103 | Fix any coverage errors in GSC | 1d | High |
| SEO-104 | Create `/games/for-4-players` programmatic page | 0.5d | High |
| SEO-105 | Create `/games/for-6-players` programmatic page | 0.5d | High |
| SEO-106 | Create `/games/for-8-players` programmatic page | 0.5d | High |
| SEO-107 | Create `/games/for-2-players` programmatic page | 0.5d | Medium |
| SEO-108 | Create `/games/for-10-players` programmatic page | 0.5d | Medium |
| SEO-109 | Create `/games/for-families` category page | 0.5d | Medium |
| SEO-110 | Create `/games/for-teams` category page | 0.5d | Medium |
| SEO-111 | Create `/games/for-college` category page | 0.5d | Medium |
| SEO-112 | Create `/games/for-adults` category page | 0.5d | Medium |
| SEO-113 | Create `/games/for-birthday` category page | 0.5d | Medium |
| SEO-114 | Write 800+ word content for each game page (28 pages) | 14d | Critical |
| SEO-115 | Add `HowTo` schema to guide pages | 2d | High |
| SEO-116 | Add `BreadcrumbList` to all pages | 1d | High |
| SEO-117 | Add `noindex` to `/party/*` and `/app/*` | 0.5d | High |
| SEO-118 | Set up broken link checker in CI | 1d | Medium |

### Medium (P2)

| # | Task | Effort |
|---|---|---|
| SEO-201 | Create `/games/for-3-players` | 0.5d |
| SEO-202 | Create `/games/for-5-players` | 0.5d |
| SEO-203 | Create `/games/for-7-players` | 0.5d |
| SEO-204 | Create `/games/for-12-players` | 0.5d |
| SEO-205 | Create `/games/for-large-groups` | 0.5d |
| SEO-206 | Create `/games/for-kids` | 0.5d |
| SEO-207 | Create `/games/for-couples` | 0.5d |
| SEO-208 | Create `/games/for-weddings` | 0.5d |
| SEO-209 | Create `/games/no-props` | 0.5d |
| SEO-210 | Create `/games/no-app` | 0.5d |
| SEO-211 | Create `/games/quick-5-minute` | 0.5d |
| SEO-212 | Write blog: "Best 4-player party games online" | 1d |
| SEO-213 | Write blog: "Free alternatives to Jackbox Games" | 1d |
| SEO-214 | Write blog: "How to host a virtual game night" | 1d |
| SEO-215 | Write blog: "Party games for remote teams" | 1d |
| SEO-216 | Write blog: "Browser games no download" | 1d |
| SEO-217 | Write blog: "Party games for adults" | 1d |
| SEO-218 | Write blog: "Quick party games under 5 minutes" | 1d |
| SEO-219 | Write blog: "Best party games for 6 players" | 1d |
| SEO-220 | Write blog: "Alias vs Codenames — which is better?" | 1d |
| SEO-221 | Create `/use-cases/corporate-events` | 0.5d |
| SEO-222 | Create `/use-cases/birthday-parties` | 0.5d |
| SEO-223 | Create `/use-cases/family-game-night` | 0.5d |
| SEO-224 | Create `/use-cases/college-dorm` | 0.5d |
| SEO-225 | Create `/use-cases/wedding-reception` | 0.5d |
| SEO-226 | Create `/use-cases/team-building` | 0.5d |
| SEO-227 | Create `/use-cases/classroom-icebreakers` | 0.5d |
| SEO-228 | Create `/compare/tusa-vs-jackbox` | 1d |
| SEO-229 | Create `/compare/tusa-vs-kahoot` | 1d |
| SEO-230 | Build `generateStaticParams` for programmatic pages | 2d |
| SEO-231 | Set up `@vercel/og` for dynamic OG images | 1d |
| SEO-232 | Add `inLanguage` to JSON-LD | 0.5d |

### Low (P3)

| # | Task | Notes |
|---|---|---|
| SEO-301 | Create `/games/for-remote-teams` | Niche page |
| SEO-302 | Create `/games/for-classroom` | Niche page |
| SEO-303 | Create `/games/no-props` | Niche page |
| SEO-304 | Create `/games/free-alternatives-to-jackbox` | High-Intent page |
| SEO-305 | Create `/games/drinking` | Age-gated, requires care |
| SEO-306 | Write blog: "Party games without Wi-Fi" | Niche topic |
| SEO-307 | Write blog: "How to play Werewolf online" | Game-specific guide |
| SEO-308 | Create `/resources/ultimate-party-game-guide` | Evergreen guide |
| SEO-309 | Create `/resources/remote-team-icebreakers` | Evergreen guide |
| SEO-310 | Create `/resources/host-tips` | Evergreen guide |
| SEO-311 | Set up `Crawl-delay` in robots.txt | Minor optimization |
| SEO-312 | Add `Cache-Control` headers to static routes | Minor optimization |

## 18.2 GEO Tasks (120)

| # | Task | Priority |
|---|---|---|
| GEO-001 | Write "What is TUSA?" definition for every game | P0 |
| GEO-002 | Add 200+ word game descriptions with structure | P0 |
| GEO-003 | Format rules as numbered lists | P0 |
| GEO-004 | Add 3-5 FAQ per game page | P0 |
| GEO-005 | Write "Why choose TUSA" section per game | P1 |
| GEO-006 | Add statistics ("X parties hosted", "Y games played") | P1 |
| GEO-007 | Include competitor comparisons (Jackbox, Kahoot) | P1 |
| GEO-008 | Add "Last updated" timestamps to all pages | P1 |
| GEO-009 | Structure content for Perplexity extraction | P1 |
| GEO-010 | Write content in third-person authoritative voice | P1 |
| GEO-011 | Create comparison tables (game vs game) | P2 |
| GEO-012 | Link to external authoritative sources | P2 |
| GEO-013 | Publish "How we built TUSA" engineering blog | P2 |
| GEO-014 | Submit TUSA to Wikidata | P2 |
| GEO-015 | Create Wikipedia article (when notable) | P3 |

## 18.3 AEO Tasks (80)

| # | Task | Priority |
|---|---|---|
| AEO-001 | Build question cluster map for all 200+ questions | P0 |
| AEO-002 | Write featured snippet paragraphs (40-60 words) | P0 |
| AEO-003 | Add FAQ schema to `/faq` | P1 (✅ done) |
| AEO-004 | Add `HowTo` schema to all guide pages | P1 |
| AEO-005 | Optimize table snippets for comparison queries | P1 |
| AEO-006 | Write "What is [game]?" definition on every game page | P0 |
| AEO-007 | Structure content for "How to" queries | P1 |
| AEO-008 | Add related question sections to each page | P2 |
| AEO-009 | Implement multi-step guides for complex queries | P2 |

## 18.4 UX & UI Tasks (120)

| # | Task | Priority |
|---|---|---|
| UX-001 | Add game search/filter to catalogue | P1 |
| UX-002 | Improve party room loading state | P1 |
| UX-003 | Add onboarding flow for first-time hosts | P1 |
| UX-004 | Improve game role indicator (stage vs controller) | P1 |
| UX-005 | Add "How to play" tooltip/modal in games | P1 |
| UX-006 | Game end celebration animation | P2 |
| UX-007 | QR code for game session (not just party) | P2 |
| UX-008 | Sound effects toggle per game | P2 |
| UX-009 | Dark mode (optional) | P2 |
| UX-010 | Accessibility audit (WCAG 2.1 AA) | P2 |
| UI-001 | Party room cover photo customization | P1 |
| UI-002 | Game card thumbnail images | P1 |
| UI-003 | Loading skeletons for party room | P1 |
| UI-004 | Empty states for chat, gallery, shopping | P1 |

## 18.5 Product Tasks (40)

| # | Task | Priority |
|---|---|---|
| PROD-001 | Guest mode (join without account) | P1 |
| PROD-002 | Host premium tier (custom themes, extended storage) | P2 |
| PROD-003 | Party templates (pre-configured game sets) | P2 |
| PROD-004 | Game mode randomization (random game picker) | P2 |
| PROD-005 | Cross-party friends list | P2 |
| PROD-006 | Email notification for party start | P2 |
| PROD-007 | Push notification MVP | P2 |
| PROD-008 | Public party discovery (opt-in) | P3 |

## 18.6 Performance Tasks (30)

| # | Task | Priority |
|---|---|---|
| PERF-001 | Inline critical CSS | P2 |
| PERF-002 | Preload LCP image | P2 |
| PERF-003 | Code-split game components by route | P1 (✅ partial) |
| PERF-004 | Service worker for offline fallback | P1 (✅ done) |
| PERF-005 | Audited main thread work | P2 |
| PERF-006 | Optimize font loading (preload + subset) | P1 (✅ partial) |

## 18.7 Marketing Tasks

| # | Task | Priority |
|---|---|---|
| MKT-001 | Set up Twitter/X account @TUSA_Game | P0 |
| MKT-002 | Launch on Product Hunt | P0 |
| MKT-003 | Create press kit page | P1 |
| MKT-004 | Submit to AlternativeTo | P1 |
| MKT-005 | Reddit launch post (r/SideProject, r/webdev) | P1 |
| MKT-006 | HackerNews launch | P1 |
| MKT-007 | Discord community setup | P1 |
| MKT-008 | Guest blog on gaming/event sites | P2 |
| MKT-009 | LinkedIn company page | P2 |
| MKT-010 | Reach out to tech journalists | P2 |
| MKT-011 | Create affiliate program | P3 |

## 18.8 Priority Execution Plan

### Phase 1 (Weeks 1-4): Foundation

| Week | Tasks |
|---|---|
| 1 | SEO-001–008, MKT-001–002 |
| 2 | SEO-101–118 (programmatic pages + sitemap + robots) |
| 3 | GEO-001–010 (game page content optimization) |
| 4 | AEO-001–008 (snippet optimization + schema) |

### Phase 2 (Weeks 5-8): Scale

| Week | Tasks |
|---|---|
| 5 | SEO-201–230 (blog writing + niche pages) |
| 6 | GEO-011–015 (comparison content + Wikidata) |
| 7 | UX-001–010 (onboarding, search, loading) |
| 8 | PERF-001–006 (performance optimization) |

### Phase 3 (Weeks 9-12): Growth

| Week | Tasks |
|---|---|
| 9 | MKT-003–008 (press kit, Reddit, HN, communities) |
| 10 | PROD-001–004 (guest mode, premium tier) |
| 11 | AEO-009, SEO-301–312 (remaining SEO tasks) |
| 12 | Analytics implementation + dashboard |

---

## Appendices

### A. Directory Structure Reference

```
tusa/
├── app/
│   ├── api/                       # API routes
│   ├── components/
│   │   ├── games/                 # 28 game components
│   │   └── ...                    # Shared components
│   ├── party/[inviteCode]/        # Party room
│   ├── join/[inviteCode]/         # Pre-join
│   ├── games/                     # Game catalogue
│   ├── use-cases/                 # SEO landing pages
│   ├── blog/                      # Blog
│   ├── about/                     # About page
│   ├── faq/                       # FAQ
│   ├── pricing/                   # Pricing
│   ├── features/                  # Features
│   ├── layout.tsx                 # Root layout (JSON-LD, OG, hreflang)
│   ├── robots.ts                  # Crawler rules
│   └── sitemap.ts                 # Sitemap
├── lib/
│   ├── parties.ts                 # DB functions
│   ├── i18n.ts                    # Internationalization
│   ├── live.ts                    # SSE pub/sub
│   ├── rate-limit.ts              # Rate limiting
│   ├── audio.ts                   # Web Audio
│   ├── confetti.ts                # Canvas confetti
│   └── rag/                       # RAG search
├── docs/                          # Documentation
├── public/
│   ├── brand/                     # Logos
│   └── og/                        # OG images
├── scripts/                       # Build scripts
├── proxy.ts                       # Middleware (auth, i18n)
└── next.config.ts                 # Config (CSP, headers)
```

### B. SEO-Focused Code Review Checklist

Before every deployment:

- [ ] All new pages have unique `<title>` (≤60 chars)
- [ ] All new pages have unique `<meta name="description">` (≤160 chars)
- [ ] OG title + description + image set
- [ ] Canonical URL set (no trailing slash)
- [ ] Hreflang set (if public-facing)
- [ ] JSON-LD schema added (BreadcrumbList + type-specific)
- [ ] `noindex` set for `/party/*`, `/join/*`, `/app/*`
- [ ] Internal links ≥3 on page
- [ ] Sitemap updated (if new public page)
- [ ] Robots.txt doesn't block new page
- [ ] Lighthouse SEO score ≥95
- [ ] Page renders without JS (server-side content visible)
- [ ] No duplicate content across pages

### C. Competitor SEO Reference

| Competitor | Domain Authority | Top Organic Keywords | Strategy Strength |
|---|---|---|---|
| jackboxgames.com | 62 | "jackbox games", "party pack" | Brand dominant, low content depth |
| kahoot.com | 76 | "kahoot", "trivia game" | Strong brand, enterprise content |
| boardgamearena.com | 68 | "board game arena", "play board games online" | Strong community content |
| partiful.com | 34 | "party invite", "evite alternative" | Clean UX, low content |
| scattergories.online | 24 | "scattergories online" | Single game, weak SEO |

**TUSA's advantage:** Only platform combining 28 games + party management + free + no install + open source.

### D. Weekly SEO Maintenance Routine

| Monday | Wednesday | Friday |
|---|---|---|
| Check GSC for new issues | Review top 20 keyword positions | Check backlink mentions |
| Review Analytics for party creation trends | Check AI citations (manual Perplexity query) | Check 404s / broken links |
| Publish 1 blog article | Optimize 1 existing page for GEO | Update sitemap if needed |

### E. Glossary

| Term | Definition |
|---|---|
| AEO | Answer Engine Optimization — optimizing for AI answer extraction |
| GEO | Generative Engine Optimization — optimizing for AI model training |
| EEAT | Experience, Expertise, Authoritativeness, Trustworthiness |
| Knowledge Graph | Google's entity database of people, places, and things |
| LSI | Latent Semantic Indexing — semantically related keywords |
| Core Web Vitals | Google's performance metrics (LCP, INP, CLS) |
| hreflang | HTML attribute specifying language/region of a page |
| Programmatic SEO | Automatically generating pages from templates for long-tail queries |
| Topic Cluster | A hub page linking to multiple related cluster pages |
| SGE | Search Generative Experience (Google AI Overviews) |

---

> **Document Version 1.0**  
> **Last Updated:** July 2026  
> **Maintained by:** TUSA Engineering & Product  
> **Repository:** https://github.com/ElazAzel/tusa
