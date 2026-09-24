---
name: security-review
description: "Проверка изменений по OWASP Top 10:2025. Use ALWAYS when touching app/api/** route handlers, proxy.ts, next.config.ts, lib/parties.ts (SQL), lib/guest-session.ts, auth, cookies/headers, rate-limit, admin RBAC, file uploads, webhooks — и когда пользователь просит security review / аудит безопасности / проверить уязвимости."
---

# Security Review (OWASP Top 10:2025)

Источник истины: https://owasp.org/Top10/2025/
Перед ревью свежих деталей открой страницу категории (ссылки ниже).

## Чеклист по категориям → маппинг на кодовую базу

### A01 Broken Access Control
- Каждый новый route handler в `app/api/**` обязан проверять сессию И принадлежность к party/game (userId ↔ party membership) — смотри образцы в `app/api/games/route.ts`, `app/api/chat/route.ts`.
- Admin-эндпоинты: RBAC миграционный (`admin RBAC is migration-backed`), никогда не провижинить админа из запроса.
- Game actions: команда должна быть game-scoped (`every accepted multiplayer command is game-scoped`).
- IDOR: все `sessionId`/`partyId`/`inviteCode` из запроса сверять с БД, не доверять телу.

### A02 Security Misconfiguration
- `next.config.ts`: CSP + security headers не ослаблять; новые внешние домены добавлять осознанно.
- `proxy.ts`: порядок правил account-compat + guest + i18n routing; новые публичные маршруты вносить явно.
- Прод: никаких debug-эндпоинтов, дефолтных кредов, verbose-ошибок клиенту.

### A03 Software Supply Chain Failures
- Зависимости только через npm install (lockfile коммитится); `npm audit` перед релизом; CI гоняет audit.
- Не добавлять пакеты без необходимости; проверять maintainer/popularity.

### A04 Cryptographic Failures
- Пароли: только через установленный KDF-слой auth (никаких md5/sha1/base64).
- Guest sessions: HMAC по `lib/guest-session.ts`; секреты только из env, НИКОГДА не хардкодить и не логировать.
- Токены reset/verify — одноразовые, с TTL и глобальной ревокацией сессии.

### A05 Injection
- `lib/parties.ts` — raw SQL: ВСЁ пользовательское только через параметризацию `$1..$n`. Конкатенация строк в SQL = блокер.
- Ввод игр/чата — Zod-схемы из `lib/games/commands.ts`; новый action = новая схема.
- Chat output: модерация + экранирование; cosmetics безопасны для рендера в чате.

### A06 Insecure Design
- Rate limiting обязателен на мутирующих и дорогих эндпоинтах (`lib/rate-limit.ts`).
- Идемпотентность: повторы/reconnects не должны дублировать награды и сообщения.
- Оптимистичная блокировка версий (409 Conflict) — не обходить.

### A07 Authentication Failures
- Сессии: httpOnly+secure cookies, корректный TTL, revocation при смене пароля.
- Гостевые сессии не могут получать права локального аккаунта.
- MFA/TOTP путь для root-admin не ослаблять.

### A08 Software or Data Integrity Failures
- Webhooks (Resend): проверка подписи до обработки тела.
- Schema DDL в `ensurePartySchema` — идемпотентный, versioned gate; никаких drop/recreate.

### A09 Security Logging and Alerting Failures
- Ошибки в observability идут санитизированными (без secrets/PII) — `runtime health never exposes secrets`.
- Security-события (отказ доступа, невалидная подпись) логируются с контекстом, но без токенов.

### A10 Mishandling of Exceptional Conditions
- Realtime/rate-limit fallbacks fail closed в strict mode.
- Catch-блоки: не глотать молча; наружу — общий текст, внутрь — детали в лог.

## Процедура

1. Для затронутых файлов пройди соответствующие пункты выше.
2. Новые данные от пользователя (строки в SQL, HTML, заголовки) — всегда как untrusted.
3. Блокеры формулируй с категорией (A01–A10) и файлом:строкой.
4. После фиксов: `npm test`, `npm run build`, `npm run lint`.
