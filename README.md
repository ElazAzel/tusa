# TUSA.game

Твоя туса. Твои правила. TUSA.game — browser-first платформа для создания тусовок, общего чата, списка покупок, фотографий, результатов и многопользовательских игр.

**Документационный checkpoint:** 16.08.2026
**Repository baseline:** `main@edee56e`
**Production:** https://tusa.game
**Статус:** supported public beta. Платформа не объявляется готовой к автономным платным B2B-мероприятиям.

## Подтверждено кодом и production health

- 32 canonical режима в manifest и 32 server-owned Game SDK definitions.
- Все режимы имеют `releaseStatus: "beta"`; `certified = 0`. Contract-tested режим не равен browser-certified игре.
- Guest-first вход через подписанные HMAC guest sessions и локальные email/password аккаунты с verification, reset и revoke-all-sessions.
- Party Room, RSVP, chat, gallery, shopping, profile, KOINS, moderation, controlled Blob media и admin RBAC.
- Server-authoritative snapshots, strict Zod game commands, optimistic version locking и idempotency.
- Authenticated SSE, Ably integration, reconnect и Upstash rate limiting с fail-closed режимом для strict production.
- RU/EN UI, PWA install surface, public SEO/knowledge pages и локальный RAG index.
- Production schema v12: party, auth, admin и waitlist управляются Drizzle migrations; production request не выполняет runtime DDL.
- На checkpoint проходят 65 unit/invariant tests, TypeScript, ESLint, production build и RAG build.

## Запуск

Требуется Node.js 20.9 или новее.

```bash
npm install
npm run dev
```

Проверки перед коммитом:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run rag:build
```

## Текущие release gates

1. Получить изолированное browser evidence для core eight: host + два controller, reconnect, privacy, rematch и mobile.
2. Настроить и проверить production email delivery и root-admin MFA enrollment.
3. Провести venue-load, reconnect-storm и incident-recovery drills.
4. Завершить независимые DNS/TLS, legal/privacy и naming/IP проверки.
5. Не включать реальные платежи, подписки, white-label, marketplace или коммерческие гарантии до прохождения их юридических и operational gates.

## Документация

Начните с [docs/README.md](docs/README.md). Он объясняет приоритет документов и разделяет текущие факты, целевую архитектуру, историю и исследования.

- [Governance](docs/DOCUMENTATION_GOVERNANCE_2026-07-19.md) — приоритет фактов и значения shipped/gap/target.
- [Implementation status](docs/IMPLEMENTATION_STATUS_2026-07-19.md) — текущий authoritative checkpoint.
- [Production readiness](docs/PRODUCTION_READINESS_AUDIT.md) — release gates.
- [Platform audit](docs/PLATFORM_AUDIT.md) — продуктовая и игровая готовность.
- [Master plan](docs/PLAN.md) — целевая архитектура и порядок релизов.

GitHub: https://github.com/ElazAzel/tusa
