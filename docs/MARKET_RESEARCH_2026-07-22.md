# TUSA.game — рынок и продуктовые рекомендации

**Дата:** 22 июля 2026  
**Аудитория:** product stakeholders  
**Решение:** в какой последовательности развивать TUSA.game после supported pilot.

## Executive summary

- **TUSA.game должна занимать не категорию «ещё один party-game pack», а позицию party operating system:** одна ссылка ведёт от инвайта и RSVP к общей игре, координации, моментам и повторному сбору компании. Именно связка до, во время и после встречи даёт защиту от Jackbox-подобных игр и event-инструментов по отдельности.
- **Лучший начальный рынок — офлайн-компании и повторяющиеся сообщества в Казахстане, а не глобальный self-serve B2C.** В январе 2025 года в Казахстане было 19,2 млн пользователей интернета и 15,7 млн social-media identities; канал распространения через мобильный share-link реалистичен. [DataReportal: Digital 2025 Kazakhstan](https://datareportal.com/reports/digital-2025-kazakhstan)
- **Главный продуктовый риск — не нехватка режимов, а доверие к первому игровому опыту.** До включения продаж надо сертифицировать восемь core-игр в реальных multi-device сессиях, довести time-to-first-laugh до менее 90 секунд и доказать повторное использование той же компанией.
- **Самый разумный коммерческий клин после пилота — B2B2C для заведений, университетских клубов и сообществ.** Платить должен организатор/площадка за управляемый вечер и аналитику, а не случайный гость за вход в игру.

## Что рынок уже доказал

### 1. Телефон как controller — привычная модель

Jackbox строит lobby с room-code: один хост запускает игру, остальные подключаются к ней из браузера телефона; для участия не нужны отдельные контроллеры. У их event-предложения есть также audience для больших групп. Это валидирует stage + personal controller и одновременно поднимает планку надёжности: роль, приватная карта или ответ должны корректно переживать reconnect и быть недоступны чужому устройству. [Jackbox: how to play](https://www.jackboxgames.com/how-to-play), [Jackbox for events](https://www.jackboxgames.com/jackbox-for-events/)

**Вывод для TUSA:** QR/invite, shared stage, spectator и zero-download guest flow — не дополнительные фичи, а table stakes. Дифференциация должна быть в локальной social layer, полном вечере и персонализации, а не в самом room code.

### 2. Одной ссылки для события уже недостаточно без social loop

Partiful объединяет shareable invite, RSVP, напоминания, гостевой список с управляемой видимостью, co-admins, фото и повторную коммуникацию с аудиторией. Он также предлагает capacity, waitlist, promo codes, QR check-in и платные тикеты. [Partiful: why use it](https://help.partiful.com/hc/en-us/articles/26526377667739-Why-use-Partiful), [Partiful for organizers](https://partiful.com/org-profiles), [RSVP controls](https://help.partiful.com/hc/en-us/articles/28901391959963-How-do-I-modify-the-types-of-RSVPs-that-are-allowed)

**Вывод для TUSA:** туса должна выигрывать не только в момент игры. RSVP, reminder, co-host, список покупок/оплат, recap, галерея и следующий инвайт должны образовывать один непрерывный loop. Нельзя копировать билетную инфраструктуру до доказательства recurring use.

### 3. Казахстан — mobile/social-first beachhead

DataReportal оценивает интернет-проникновение Казахстана в 92,9% на начало 2025 года, 26,6 млн мобильных подключений и 15,7 млн social-media identities. Это не число покупателей TUSA и не revenue TAM; это верхняя граница доступности mobile-share сценария. [DataReportal: Digital 2025 Kazakhstan](https://datareportal.com/reports/digital-2025-kazakhstan)

**Вывод для TUSA:** первый ростовой механизм — не дорогой app-install acquisition, а WhatsApp/Telegram/Instagram share, QR на площадке и ambassador-led group activation. RU нужен как основной язык; EN нужен для экспатов, партнёрских материалов и международной готовности, но не должен размывать первый локальный сценарий.

## Конкурентная карта

| Категория | Примеры | Сильная сторона | Открытое окно для TUSA |
| --- | --- | --- | --- |
| Party-game packs | Jackbox, AirConsole | Отлаженный stage/controller, узнаваемые режимы | Одна веб-ссылка без установки хоста, тусовка до/во время/после игры, RU-first локальный tone of voice |
| Social event tools | Partiful, Luma, Eventbrite | RSVP, напоминания, guest management, ticketing | Игры как повод прийти и остаться, shared party room, live interaction и recap |
| Single-mode browser games | Gartic/quiz/mafia sites | Низкий порог конкретной игры | Единый профиль, party state, ротация режимов и возвращение всей компании |
| Group chats | Telegram, WhatsApp | Уже есть аудитория и привычка делиться | Не заменять чат; дать ссылку, которая превращает хаос чата в управляемый вечер |

## Приоритетная продуктовая стратегия

### P0 — доказать «вечер не ломается»

1. **Сертифицировать core eight, не выпускать 32 режима как равно готовые.** Для каждой игры нужны реальные host + минимум два controller browser contexts, privacy, reconnect, rematch, mobile portrait/landscape и понятная инструкция RU/EN. Пока доказательства нет — честная метка Beta.
2. **Сделать first-play маршрутом в 90 секунд:** открыть invite → назвать себя → RSVP → зайти в lobby → ready → первая микро-игра. Не требовать регистрацию гостя до первой ценности.
3. **Единая сессия и reconnect:** видимый, но не панический статус сети; snapshot/version recovery; ни одна отправка чата или команда игры не теряется бесшумно.
4. **Мобильный stage/controller QA:** в первую очередь 360–430 px и landscape. Это ключевой канал на входе, а не polish после desktop.

**Метрика выхода:** ≥90% приглашённых открывают lobby без помощи хоста; median time-to-first-laugh <90 секунд; reconnect success ≥95%; lost action rate <1%.

### P1 — построить повторный social loop

1. **Party recap за 30 секунд:** лучшие моменты, 2–4 фото, победители, цитата, CTA «собрать этих же людей снова». Recap должен быть shareable, но не раскрывать приватный адрес или guest list.
2. **Recurring squad:** сохранённая компания, повторный invite, host templates («квартирник», «день рождения», «универ-квиз», «барная ночь»).
3. **RSVP reliability:** capacity, waitlist, plus-one, hidden/visible guest list, reminder schedule и co-host permissions. Это конкурентный минимум, подтверждённый event-инструментами.
4. **Косметика только как социальная награда:** frame, cover, chat effect и badge должны быть видны в комнате, понятны, выключаемы и зарабатываться за реальное действие; не превращать UX в магазин.

**Метрика выхода:** repeat group rate за 30 дней; доля тус с ≥3 участниками; завершённые раунды на тусу; recap share rate; host D30.

### P2 — превратить площадки в дистрибуцию, а не в рекламный инвентарь

1. **Venue Kit:** брендированный QR, режим «экран площадки», staff quick-start, безопасные family/adult profiles, game kill switch и post-event summary.
2. **Organizer console:** список активных тус, attendance/activation, самые запускаемые режимы, moderation queue, export и consent-aware gallery controls.
3. **Пилоты с повторяющимися сообществами:** 5–10 партнёров в Алматы/Астане — бары, университетские клубы, студенческие сообщества, квизы. Выбирать не по охвату, а по частоте событий и готовности делиться данными пилота.
4. **Нативные партнёрские размещения — только вне раунда:** место, промо, nearby purchase; explicit label, frequency cap, zero alcohol/adult targeting в safe profile.

**Метрика выхода:** weekly successful party sessions, WAU hosts, venue repeat booking, activation по партнёру, доля повторных групп.

## Сценарное sizing для первого пилота

Это operational sizing, не прогноз выручки.

| Сценарий | Партнёры | Тус на партнёра в месяц | Среднее участников | Участий в месяц |
| --- | ---: | ---: | ---: | ---: |
| Консервативный pilot | 10 | 2 | 20 | 400 |
| Рабочий beachhead | 25 | 4 | 25 | 2 500 |
| Подтверждённый venue wedge | 50 | 4 | 30 | 6 000 |

Формула: `партнёры × тус на партнёра × среднее участников`. Эти числа — прозрачные операционные допущения, не внешний факт. Их задача — показать, что первые продуктовые решения должны выдерживать не «миллионы MAU», а десятки живых тус в неделю с высоким качеством. Для финансовой модели пока нет подтверждённого local willingness-to-pay, поэтому цену и revenue TAM здесь не оцениваем.

## Монетизация: что делать и чего не делать

1. **Сейчас:** бесплатный guest entry; promo-gated host creation для beta; измерять willingness-to-pay через интервью и пилоты, не через fake checkout.
2. **После product proof:** B2B venue/community subscription или per-successful-event fee; в него входят branded stage, templates, analytics, co-hosts и support SLA.
3. **Позже:** paid host plan для power hosts — advanced recap, larger history, recurring squads, richer templates. Не продавать KOINS как финансовый актив и не связывать их с азартными механиками.
4. **Ещё позже:** commission на реальные билеты/партнёрские предложения только после legal/provider onboarding, signed webhooks и понятного refund flow.

## Что не стоит делать в ближайшие два квартала

- Не раздувать каталог за пределы 32 режимов до их browser-certification.
- Не запускать self-serve payments, white-label и marketplace до повторяемого venue pilot.
- Не строить discovery/feed раньше, чем будет подтверждён спрос у повторяющихся компаний: private invite — базовый режим.
- Не использовать SEO-страницы как doorway-контент: game/help pages должны содержать реальные правила, ограничения, скриншоты и связанные режимы.
- Не заменять Telegram/WhatsApp. TUSA должна быть лучшей ссылкой внутри них.

## 90-дневный порядок проверки гипотез

1. **Недели 1–3:** eight-game certification, first-play usability sessions с 10 компаниями, mobile error logging, two venue dry-runs.
2. **Недели 4–6:** 5 пилотных партнёров, weekly cohort dashboard, host interviews после каждой второй тусовки, recap/rematch experiment.
3. **Недели 7–10:** 10–25 партнёров, venue kit, recurring templates, A/B reminder timing и guest-list visibility.
4. **Недели 11–13:** решить по данным, есть ли готовность платить у venue или host; только после этого проектировать paid entitlement и checkout.

## Неопределённости, которые нужно закрыть данными TUSA

- Реальная частота повторной тусы одной компании и когортный retention хоста.
- Какие 8 игр создают больше завершённых матчей и rematch, а не только запусков.
- Какой контент/profile необходимы для студентов, баров, семей и корпоративных сообществ.
- Влияние RSVP reminder, видимости списка гостей и recap на invite conversion.
- WTP и budget owner: venue, community organizer или consumer host.

## Источники и границы исследования

- Источники конкурентов — их собственные публичные product/help pages; они надёжны для описания функций, но их маркетинговые заявления о масштабе не использовались как независимые рыночные факты.
- [DataReportal: Digital 2025 Kazakhstan](https://datareportal.com/reports/digital-2025-kazakhstan) — доступность digital/mobile канала, не TAM и не прогноз revenue.
- [Newzoo Global Games Market Report 2025](https://newzoo.com/reports/global-games-market-report) — подтверждает, что games market отслеживается по PC/console/mobile, но закрытые детальные оценки не использованы в расчёте.
- Внутренние baseline и ограничения: `docs/IMPLEMENTATION_STATUS_2026-07-19.md`, `docs/DOCUMENTATION_GOVERNANCE_2026-07-19.md`.
