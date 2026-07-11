# TUSA.game bilingual rollout

## Rule

Every user-visible string ships in Russian and English. New features may not add raw text directly inside a component: they must use the locale dictionary or a feature-local `ru/en` copy object.

## Locale behaviour

- `RU` / `EN` is visible in the public navigation and authenticated flows.
- Choice is persisted in the `tusa_locale` cookie for one year and used for server-rendered routes.
- The document `lang` attribute changes with the selection.
- Product data stays language-neutral: titles and user messages are authored by users and are never machine-translated.

## Migration order

1. Foundation: provider, cookie, type-safe common dictionary and switcher.
2. Core journey: landing, sign-in, profile, create hangout, invite, party room.
3. Event modules: shopping, chat, gallery, KOINS and every game UI.
4. Operations: waitlist, administration, partners, analytics and error states.
5. Acceptance: both languages pass browser flows at desktop and mobile widths; no raw fallback copy is visible.

## Content policy

- Do not translate brand names, player-entered names, venue names or user-generated chat.
- Date input stays numeric `DD.MM.YYYY` and time `HH:MM` in both versions for consistency with the visual system.
- Adult/family mode changes both the strings and the available game content; it is not a visual warning only.
