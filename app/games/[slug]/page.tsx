import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { copy, normalizeLocale } from "@/lib/i18n";
import { GAME_MANIFEST, formatPlayerRange, getGameBySlug } from "@/lib/games/manifest";
import { gamePageCopy } from "@/lib/games/page-copy";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GAME_MANIFEST.map((game) => ({ slug: game.seo.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
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
  const game = getGameBySlug(slug);
  if (!game) notFound();
  if (slug !== game.seo.slug) permanentRedirect(`/games/${game.seo.slug}`);

  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? requestHeaders.get("accept-language"));
  const ui = gamePageCopy[locale];
  const title = copy(locale, game.titleKey);
  const description = copy(locale, game.descKey);
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
        <ol>{ui.howSteps.map((step) => <li key={step}>{step}</li>)}</ol>
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
