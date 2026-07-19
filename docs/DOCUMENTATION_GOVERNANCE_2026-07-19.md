# TUSA.game - управление документацией

**Версия:** 2.1<br>
**Дата актуализации:** 19.07.2026<br>
**Repository baseline:** `main@0356f6d`<br>
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
- Production build использует local email/password compatibility layer через aliases; старые упоминания активного Clerk-flow не являются фактом.
- Business schema всё ещё зависит от runtime DDL; Drizzle не является единым источником миграций.
- Venue Night, Event Pass, TUSA Plus, payments, white-label, partner console и marketplace являются pre-implementation.

## Release gates

1. Выбрать и укрепить одну auth-модель.
2. Перевести business schema на versioned migrations.
3. Завершить atomic join/settle/cancel betting и reconciliation; reward double-credit уже закрыт.
4. Закрепить core eight в manifest и пройти browser, reconnect, rematch, privacy и moderation certification.
5. Проверить Ably/Upstash strict production mode, load, monitoring и incident fallback.
6. Удалить SEO auto-redirects и завершить naming/IP review.
7. Реализовать moderation/reporting и контролируемое object storage для media.
8. Провести сопровождаемый платный Venue pilot; только затем заменять гипотезы фактическими коммерческими данными.

## Правило обновления

Любое изменение стратегии, цены, архитектуры, юридической модели, certification status или North Star требует обновления текущего checkpoint и ссылок на него. Дата документа отражает дату последней содержательной сверки, а не дату исходного черновика.
