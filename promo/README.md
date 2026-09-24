# TUSA.game promo

Два вертикальных ролика 1080×1920, 30 fps, собраны на [Remotion](https://www.remotion.dev/).

| Композиция | Длительность | Задача |
|---|---|---|
| `TusaSales` | 29 с | Продающий: боль «пять чатов» → одна ссылка → цифры → CTA «Собрать тусу» |
| `TusaFeatures` | 48,7 с | Функционал: ивент, приглашение и QR, чат, покупки и сплит, 32 режима, экран + пульты, галерея, KOINS и профиль |

Все цифры в роликах взяты из продукта и лендинга: 30 секунд до ивента, 32 режима в бете, 7 модулей, бета бесплатна, RU/EN, без скачивания. Имена, суммы и сообщения внутри интерфейсов демонстрационные.

## Запуск

```bash
cd promo
npm install
npm run studio            # превью и правки в браузере
npm run render            # out/tusa-sales.mp4 и out/tusa-features.mp4
```

Если Remotion не может скачать Chrome Headless Shell, укажи свой браузер:

```bash
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render
```

Шрифты (Unbounded, Inter, Material Symbols) лежат в npm-пакетах и подключаются локально, сеть при рендере не нужна.

## Структура

- `src/theme.ts`: цвета и шрифты бренда из `app/globals.css`
- `src/ui.tsx`: neo-brutal карточки, стикеры, телефон, кинетический текст, тикер
- `src/Sales.tsx`: продающий ролик
- `src/Features.tsx`: ролик про функционал
- `public/`: логотипы из `public/brand`

Звука в роликах нет. Музыку и озвучку добавляй в монтажке или через `<Audio>` из `remotion` с лицензированным треком.
