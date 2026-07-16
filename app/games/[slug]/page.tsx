import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { copy, normalizeLocale } from "@/lib/i18n";
import { GAME_MANIFEST, formatPlayerRange, getGameBySlug } from "@/lib/games/manifest";
import { gamePageCopy } from "@/lib/games/page-copy";
import { GAME_RULES } from "@/lib/games/rules";
import { SEO_PROGRAMMATIC, PROGRAMMATIC_SLUGS } from "@/lib/seo-programmatic";
import RedirectManager from "@/app/[locale]/guides/[slug]/RedirectManager";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  const gameSlugs = GAME_MANIFEST.map((game) => ({ slug: game.seo.slug }));
  const programmaticSlugs = PROGRAMMATIC_SLUGS.map((slug) => ({ slug }));
  return [...gameSlugs, ...programmaticSlugs];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const progContent = SEO_PROGRAMMATIC[slug];
  if (progContent) {
    const store = await cookies();
    const locale = normalizeLocale(store.get("tusa_locale")?.value) as "ru" | "en";
    const content = progContent[locale];
    return {
      title: `${content.title} — TUSA.game`,
      description: content.description,
      alternates: { canonical: `/games/${slug}` },
    };
  }

  const game = getGameBySlug(slug);
  if (!game) return {};
  const store = await cookies();
  const locale = normalizeLocale(store.get("tusa_locale")?.value);
  const title = copy(locale, game.titleKey);
  const description = copy(locale, game.descKey);
  return {
    title: `${title} — TUSA.game`,
    description,
    alternates: { canonical: `/games/${game.seo.slug}` },
    openGraph: { title: `${title} — TUSA.game`, description, type: "website", url: `/games/${game.seo.slug}` },
  };
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;

  const progContent = SEO_PROGRAMMATIC[slug];
  if (progContent) {
    const store = await cookies();
    const requestHeaders = await headers();
    const locale = normalizeLocale(
      store.get("tusa_locale")?.value ?? requestHeaders.get("accept-language")
    ) as "ru" | "en";
    const content = progContent[locale];

    const jsonLd = {
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
      </main>
    );
  }

  const game = getGameBySlug(slug);
  if (!game) notFound();
  if (slug !== game.seo.slug) permanentRedirect(`/games/${game.seo.slug}`);

  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? requestHeaders.get("accept-language"));
  const ui = gamePageCopy[locale];
  const title = copy(locale, game.titleKey);
  const description = copy(locale, game.descKey);
  const rules = GAME_RULES[locale][game.id];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: title,
    description,
    url: `https://tusa.game/games/${game.seo.slug}`,
    gamePlatform: "Web browser",
    numberOfPlayers: { "@type": "QuantitativeValue", minValue: game.minPlayers, maxValue: game.maxPlayers },
    inLanguage: game.supportedLocales,
    applicationCategory: "GameApplication",
    isFamilyFriendly: game.ageRating !== "adult",
  };

  return (
    <main className={`game-detail game-detail--${game.tone}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link className="legal-back" href="/games">{ui.back}</Link>
      <section className="game-detail-hero">
        <p className="section-kicker">{ui.kicker}</p>
        <h1>{title}</h1>
        <p className="game-detail-lead">{description}</p>
        <dl className="game-facts">
          <div><dt>{ui.players}</dt><dd>{formatPlayerRange(game)}</dd></div>
          <div><dt>{ui.duration}</dt><dd>{game.seo.durationMinutes} {ui.minutes}</dd></div>
          <div><dt>{ui.age}</dt><dd>{game.ageRating === "adult" ? "18+" : game.ageRating === "teen" ? "12+" : "6+"}</dd></div>
          <div><dt>{ui.equipment}</dt><dd>{game.seo.equipment === "phones_and_stage" ? ui.phonesAndStage : ui.phones}</dd></div>
        </dl>
      </section>
      <section className="game-detail-section">
        <h2>{ui.howTitle}</h2>
        <p>{rules.overview}</p>
        <ol>{rules.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <h3>{locale === "ru" ? "Общие правила" : "General rules"}</h3>
        <ul>{rules.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
      </section>
      <section className="game-detail-section game-detail-note">
        <h2>{ui.faqTitle}</h2>
        <p>{ui.beta}</p>
        <p>{ui.safe}</p>
      </section>
      <Link className="button button-primary" href="/sign-in?redirect_url=%2Fapp%2Fnew">{ui.cta} <span aria-hidden="true">→</span></Link>
    </main>
  );
}

