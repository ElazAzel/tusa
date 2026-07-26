import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title:
      "Remote Team Building Games — Icebreakers for Virtual Teams | TUSA.game",
    description:
      "Fun icebreaker games for remote teams. No downloads needed — works on any device.",
  };
}

export default async function RemoteTeamsPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(
    store.get("tusa_locale")?.value ??
      (await requestHeaders).get("accept-language"),
  );
  const t = (key: string) => copy(locale, key as never);
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">
          {t("backToParties")}
        </Link>

        <h1>Remote Team Building Games — Icebreakers for Virtual Teams</h1>

        <section>
          <h2>Why Remote Teams Need Icebreaker Games</h2>
          <p>
            When your team is scattered across time zones, casual water-cooler
            conversation disappears. Structured icebreaker games fill that gap:
            they warm up meetings, surface personality, and build trust — all
            through a browser. TUSA.game gives you 32 game modes designed to get
            people talking without awkward silence.
          </p>
        </section>

        <section>
          <h2>Best Icebreaker Games for Remote Teams</h2>
          <p>
            These games are short, inclusive, and need zero preparation from
            participants:
          </p>
          <ul>
            <li>
              <strong>Two Truths &amp; a Lie</strong> — Each person shares three
              statements. The team votes on the lie. Reveals surprising facts
              about colleagues.
            </li>
            <li>
              <strong>Would You Rather</strong> — Quick-fire dilemmas. Great as a
              5-minute meeting opener.
            </li>
            <li>
              <strong>Blank Slate</strong> — Everyone writes a word that
              completes a phrase. Score points when you match.
            </li>
            <li>
              <strong>Kiss / Marry / Kill</strong> — Pick three things and
              explain why. Always sparks debate.
            </li>
            <li>
              <strong>Brain Burst</strong> — Kahoot-style trivia with a timer.
              Use company-themed questions for extra relevance.
            </li>
            <li>
              <strong>Wheel of Fate</strong> — Spin the wheel to pick who
              answers the next question. Random and fair.
            </li>
          </ul>
        </section>

        <section>
          <h2>How TUSA Works for Distributed Teams</h2>
          <p>
            No employee needs to install software or create an account. The
            facilitator shares a single link; everyone opens it on their phone
            or laptop. The facilitator&apos;s screen becomes the stage and
            everyone else&apos;s device becomes a controller. A real-time connection
            keeps the action synced across cities and continents.
          </p>
        </section>

        <section>
          <h2>Concrete Scenarios</h2>
          <ul>
            <li>
              <strong>Weekly stand-up warmer</strong> — Start the Monday call
              with one round of Would You Rather. It takes 3 minutes and shifts
              energy from mute to engaged.
            </li>
            <li>
              <strong>Virtual offsite</strong> — A 45-minute team block: play
              Blank Slate, Two Truths &amp; a Lie, and Brain Burst back to back.
            </li>
            <li>
              <strong>Cross-team mixer</strong> — Two departments join the same
              party link. Kiss / Marry / Kill breaks departmental silos with
              laughter.
            </li>
          </ul>
        </section>

        <section>
          <h2>Run Your First Remote Icebreaker</h2>
          <p>
            Open the demo to see the flow, then explore all 32 modes to find
            your team&apos;s favourites.
          </p>
          <p>
            <Link href="/demo">Try the demo →</Link>{" "}
            <Link href="/games">Browse all games →</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
