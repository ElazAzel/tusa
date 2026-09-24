import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SEO_GUIDES } from "@/lib/seo-guides";
import { SEO_CONTENT } from "@/lib/seo-content";

export function generateStaticParams() {
  return ["ru", "en"].flatMap((locale) =>
    SEO_GUIDES.map(([slug]) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const content = SEO_CONTENT[slug]?.[locale as "ru" | "en"];
  if (!content) return {};

  return {
    title: `${content.title} · TUSA.game`,
    description: content.description,
    alternates: {
      canonical: `/${locale}/guides/${slug}`,
      languages: {
        ru: `/ru/guides/${slug}`,
        en: `/en/guides/${slug}`,
      },
    },
  };
}

export default async function Guide({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const content = SEO_CONTENT[slug]?.[locale as "ru" | "en"];
  if (!content) notFound();

  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <main className="legal-page">
      <article className="legal-container">
        <span className="app-kicker">{content.kicker}</span>
        <h1>{content.h1}</h1>
        <p className="guide-intro">{content.intro}</p>
        <p>{content.body}</p>

        <h2>{content.stepsTitle}</h2>
        <ol>
          {content.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>

        <h2>{content.gamesTitle}</h2>
        <div className="guide-games">
          {content.games.map((game, index) => (
            <div className="guide-game" key={index}>
              <h3>{game.name}</h3>
              <p>{game.desc}</p>
            </div>
          ))}
        </div>

        <h2>FAQ</h2>
        {content.faqs.map((faq, index) => (
          <section className="guide-faq" key={index}>
            <h3>{faq.q}</h3>
            <p>{faq.a}</p>
          </section>
        ))}

        <Link className="demo-action demo-action--lime guide-cta" href={`/sign-up?ref=guide-${slug}`}>
          {locale === "en" ? "Create a party" : "Создать тусу"}
        </Link>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
      />
    </main>
  );
}

