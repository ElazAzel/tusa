# TUSA.game

Твоя туса. Твои правила: browser-first платформа для общих комнат, игр, чата, покупок, фотографий, результатов и KOINS.

**Документация актуализирована:** 19.07.2026<br>
**Repository baseline:** `main@0356f6d`<br>
**Статус:** public beta; не готово к автономным платным B2B-событиям<br>
**Production:** https://tusa.game

## Подтверждено кодом

- 32 canonical modes в manifest и 32 Game SDK definitions;
- все 32 режима имеют `releaseStatus: "beta"`; certified = 0;
- guest-first join через подписанные HMAC guest sessions;
- Party Room, Event Hub, shopping, chat, gallery, profile и KOINS;
- server-owned game snapshots, strict Zod commands, version locking и idempotency;
- authenticated SSE, Ably integration и reconnect;
- distributed rate limiting через Upstash с development fallback;
- RU/EN UI, PWA, public SEO/knowledge pages и локальный RAG-поиск;
- CI для typecheck, lint, tests, RAG build, production build, audit и Playwright.

Наличие SDK definition или карточки режима не означает production certification. Сертификация требует полного lifecycle, host + two controllers browser E2E, reconnect/rematch, privacy filtering, real-device playtest, analytics и moderation по типу игры.

## Архитектура

- Next.js 16 App Router, React 19, TypeScript;
- Neon Postgres через `@neondatabase/serverless`;
- Game SDK в `lib/games/definitions/` и registry в `lib/games/sdk.ts`;
- authenticated SSE в `/api/live`, Ably для distributed realtime;
- Upstash Redis для distributed rate limiting;
- local email/password compatibility layer для текущих account flows;
- HMAC guest identity для входа без обязательной регистрации;
- Vercel для deployment.

Старые документы описывают Clerk как активный account provider, однако текущая production-сборка алиасит Clerk imports на local compatibility layer. Выбор и укрепление одной auth-модели остаётся P0.

## Запуск

Требуется Node.js 20.9 или новее.

```bash
npm install
npm run dev
```

Проверки:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run rag:build
```

## Текущие P0

1. Принять одно production auth-решение и закрыть account lifecycle.
2. Заменить runtime DDL для business schema на versioned migrations.
3. Завершить atomic join/settle/cancel betting и reconciliation; reward double-credit уже закрыт.
4. Закрепить core eight в manifest и пройти certification gates.
5. Реализовать moderation/reporting до сертификации UGC-режимов.
6. Перевести voice/photo payloads в контролируемое object storage.
7. Удалить SEO auto-redirects и завершить naming/IP review.
8. Проверить production credentials, strict mode, load, monitoring и incident fallback.

## Коммерческий статус

Venue Night, Event Pass, TUSA Plus, subscriptions, payments, white-label, brand inventory, partner console и creator marketplace являются **pre-implementation**. В коде нет законченного merchant, self-serve booking или partner reporting flow. До закрытия production gates возможен только вручную сопровождаемый Venue pilot.

Цены, прогнозы и показатели спроса в стратегических документах считаются гипотезами, пока не подтверждены оплатами и измеренными cohorts.

## Документация

- `docs/DOCUMENTATION_GOVERNANCE_2026-07-19.md` - приоритет источников и статусы утверждений;
- `docs/IMPLEMENTATION_STATUS_2026-07-19.md` - текущий repository checkpoint;
- `docs/PRODUCTION_READINESS_AUDIT.md` - release gates и риски;
- `docs/PLATFORM_AUDIT.md` - продуктовый и игровой аудит;
- `docs/PLAN.md` - target master plan;
- `docs/TUSA_GROWTH_OPERATING_SYSTEM.md` - target growth/SEO/GEO/AEO operating system;
- `tmp/pdfs/Editable_DOCX/` - актуальная редактируемая база документов;
- `tmp/pdfs/PDF_Exports/` - PDF-копии актуальной базы;
- `tmp/pdfs/Source_Materials/` - исторические материалы, не источник текущего shipped status.

GitHub: https://github.com/ElazAzel/tusa
