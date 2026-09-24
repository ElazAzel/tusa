# TUSA.game - управление документацией

**Версия:** 2.1<br>
**Дата актуализации:** 19.07.2026<br>
**Repository baseline:** `main@edee56e` on 22.07.2026<br>
**Статус продукта:** public beta; не готов к автономным платным B2B-событиям

## Источник истины

При конфликте утверждений используется следующий приоритет:

1. Фактический код и тесты на зафиксированном commit.
2. `docs/IMPLEMENTATION_STATUS_2026-07-19.md`.
3. Документы 00-04 из `tmp/pdfs/Editable_DOCX/`.
4. Рабочие таблицы из `tmp/pdfs/Spreadsheets/`.
5. Остальные документы 05-19 из актуального пакета.
6. `Source_Materials` и документы с более ранней датой.

PDF из `tmp/pdfs/PDF_Exports/` являются опубликованными копиями. Для содержательных правок используются соответствующие DOCX.

## Статусы утверждений

- **shipped** - подтверждено кодом и доступным workflow;
- **gap** - реализовано частично либо не прошло production verification;
- **target** - целевая архитектура, процесс или продуктовая модель;
- **pre-implementation** - коммерческая или продуктовая гипотеза без полного flow в коде.

Наличие карточки режима, SDK definition или проходящего contract-теста не означает production certification.

## Текущий baseline

- 32 canonical modes в manifest, 32 SDK definitions.
- Все 32 режима имеют `releaseStatus: "beta"`; certified = 0.
- Guest-first join, Party Room, chat, gallery, profile, KOINS, SSE/Ably integration, Upstash integration и CI существуют.
- Production build использует локальные email/password auth-модули и подписанные сессии; внешнего account provider в runtime нет.
- Drizzle migrations are the production source of schema changes. Runtime DDL remains only as a non-production developer compatibility fallback; Vercel production requires schema version 13 before serving party, auth, waitlist and admin data.
- Venue Night, Event Pass, TUSA Plus, payments, white-label, partner console и marketplace являются pre-implementation.

## Release gates

1. Применить migration 0013 к подключённой production database и повторить `/api/health`.
2. Пройти browser, reconnect, rematch, privacy и moderation certification для core eight; пока все режимы остаются Beta.
3. Проверить Ably/Upstash strict production mode, venue load, monitoring и incident fallback.
4. Настроить production email delivery и завершить root-admin MFA enrollment.
5. Завершить DNS, legal/privacy и naming/IP review.
6. Провести сопровождаемый платный Venue pilot; только затем заменять гипотезы фактическими коммерческими данными.

## Правило обновления

Любое изменение стратегии, цены, архитектуры, юридической модели, certification status или North Star требует обновления текущего checkpoint и ссылок на него. Дата документа отражает дату последней содержательной сверки, а не дату исходного черновика.
