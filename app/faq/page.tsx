/*
  CSS classes for this page (add to app/globals.css):
  .faq-page       — additional styling for the FAQ page (e.g. max-width, spacing)
  .faq-question   — <summary> styling: bold, cursor pointer, large touch target
  .faq-answer     — <p> styling: padding, line-height, muted text
*/

import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

const faqItems = [
  {
    ru: { question: "Что такое TUSA.game?", answer: "Браузерная платформа для вечеринок: 32 игровых режима, в которые друзья играют вместе с любых устройств. Ничего скачивать не нужно." },
    en: { question: "What is TUSA.game?", answer: "TUSA.game is a browser-based social gaming platform where friends use 32 party game modes together from any device, with no downloads." },
  },
  {
    ru: { question: "Сколько человек может играть?", answer: "От 2 до 20 с лишним человек в одной тусе. Точное число зависит от режима." },
    en: { question: "How many players can play?", answer: "TUSA.game supports 2 to 20+ players per party, depending on the game mode." },
  },
  {
    ru: { question: "Это бесплатно?", answer: "Да, пока идёт бета, TUSA.game бесплатна. Платные функции могут появиться позже." },
    en: { question: "Is TUSA.game free?", answer: "Yes, TUSA.game is free during beta. Some premium features may be added later." },
  },
  {
    ru: { question: "Друзьям нужно регистрироваться?", answer: "Нет. Друзья заходят по ссылке или QR-коду и просто вводят имя. Аккаунт нужен только тому, кто создаёт тусу." },
    en: { question: "Do my friends need to register?", answer: "No. Friends join via a link or QR code and just enter a name. Only the host needs a free account to create a party." },
  },
  {
    ru: { question: "Можно играть на телевизоре?", answer: "Да. Откройте тусу в браузере на телевизоре или ноутбуке и включите режим экрана, а друзья играют со своих телефонов." },
    en: { question: "Can I play on TV?", answer: "Yes. Open the party in a browser on a TV or laptop and switch to screen mode while friends play from their phones." },
  },
  {
    ru: { question: "Какие есть игры?", answer: "32 режима: Alias, Мафия, Оборотень, Крокодил, Шпион, Импостор, Бункер, Кодовые имена, квизы, Панчлайн, Фейк-факт, Правда или действие и другие." },
    en: { question: "What games are available?", answer: "32 modes including Alias, Mafia Lite, Werewolf, Charades, Spyfall, Impostor, Bunker, Codenames, quizzes, Quiplash, Fibbage, Truth or Dare and more." },
  },
  {
    ru: { question: "Нужно ли скачивать приложение?", answer: "Нет. Всё работает в браузере. Если хочется, TUSA.game можно добавить на главный экран телефона." },
    en: { question: "Does TUSA.game require downloading an app?", answer: "No. Everything runs in the browser. You can add TUSA.game to your home screen if you like." },
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  const locale = normalizeLocale(store.get("tusa_locale")?.value);
  return {
    title: copy(locale, "faqMetaTitle"),
    description: copy(locale, "faqMetaDesc"),
  };
}

export default async function FaqPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(
    store.get("tusa_locale")?.value ??
      (await requestHeaders).get("accept-language"),
  );
  const t = (key: string) => copy(locale, key as never);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((entry) => entry[locale]).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="legal-page faq-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">
          {t("notFoundHome")}
        </Link>
        <h1>{t("faqTitle")}</h1>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {faqItems.map((entry) => entry[locale]).map((item, i) => (
          <details key={i}>
            <summary className="faq-question">{item.question}</summary>
            <p className="faq-answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
