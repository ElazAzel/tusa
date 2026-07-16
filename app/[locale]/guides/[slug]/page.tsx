import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SEO_GUIDES } from "@/lib/seo-guides";
import { SEO_CONTENT } from "@/lib/seo-content";
import RedirectManager from "./RedirectManager";

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
    title: `${content.title} — TUSA.game`,
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
      <RedirectManager slug={slug} locale={locale} />
      <article>
        <span className="app-kicker">{content.kicker}</span>
        <h1>{content.h1}</h1>
        <p style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{content.intro}</p>
        <p>{content.body}</p>

        <h2>{content.stepsTitle}</h2>
        <ol>
          {content.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>

        <h2>{content.gamesTitle}</h2>
        <div style={{ display: "grid", gap: "15px", margin: "20px 0" }}>
          {content.games.map((game, index) => (
            <div
              key={index}
              style={{
                border: "var(--line, 3px solid #000)",
                boxShadow: "var(--shadow, 6px 6px 0 #000)",
                backgroundColor: "var(--cream, #f7f7f2)",
                color: "var(--black, #000)",
                padding: "15px",
              }}
            >
              <h3 style={{ margin: "0 0 5px 0", fontSize: "1.2rem", fontWeight: 800 }}>
                {game.name}
              </h3>
              <p style={{ margin: 0, fontSize: "0.95rem" }}>{game.desc}</p>
            </div>
          ))}
        </div>

        <h2>FAQ</h2>
        {content.faqs.map((faq, index) => (
          <section key={index} style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{faq.q}</h3>
            <p>{faq.a}</p>
          </section>
        ))}

        <Link className="demo-action demo-action--lime" href="/">
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

