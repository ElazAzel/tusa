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
    question: "What is TUSA.game?",
    answer:
      "TUSA.game is a browser-based social gaming platform where friends play 28 multiplayer party games together from any device — no downloads needed.",
  },
  {
    question: "How many players can play?",
    answer:
      "TUSA.game supports 2 to 20+ players per party, depending on the game mode.",
  },
  {
    question: "Is TUSA.game free?",
    answer:
      "Yes, TUSA.game is currently free during beta. Some premium features may be added later.",
  },
  {
    question: "Do my friends need to register?",
    answer:
      "Your friends join via a link — no registration required on their end. The host needs a free account to create a party.",
  },
  {
    question: "Can I play on TV?",
    answer:
      "Yes — TUSA.game works on any device with a browser. Project it on TV while friends join from their phones.",
  },
  {
    question: "What games are available?",
    answer:
      "TUSA.game has 28 games including Alias, Crocodil, Werewolf, Codenames, Quiplash, Fibbage, Trivia, Bomb Party, and many more.",
  },
  {
    question: "Does TUSA.game require downloading an app?",
    answer:
      "No. Everything runs in the browser — no app store, no installation, no updates.",
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
    mainEntity: faqItems.map((item) => ({
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
          {t("backToParties")}
        </Link>
        <h1>{t("faqTitle")}</h1>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {faqItems.map((item, i) => (
          <details key={i}>
            <summary className="faq-question">{item.question}</summary>
            <p className="faq-answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
