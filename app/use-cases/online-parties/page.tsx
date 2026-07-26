import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Online Party Games — Play with Friends | TUSA.game",
    description:
      "Host online parties with 32 browser-based game modes. No downloads. Just a link.",
  };
}

export default async function OnlinePartiesPage() {
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

        <h1>Online Party Games — Play with Friends Instantly</h1>

        <section>
          <h2>What Are Online Party Games?</h2>
          <p>
            Online party games are browser-based multiplayer games you play with
            friends over video call, chat, or a shared link. No downloads, no
            installs — everyone joins from their phone or laptop in seconds.
            TUSA.game packs 32 game modes into one party link so you never run out of
            things to play.
          </p>
        </section>

        <section>
          <h2>Games Perfect for Online Parties</h2>
          <p>
            These titles work especially well when players are not in the same
            room — each one is designed so distance doesn&apos;t dim the fun:
          </p>
          <ul>
            <li>
              <strong>Quiplash</strong> — Best answer wins the round. Hilarious
              when friends write inside jokes.
            </li>
            <li>
              <strong>Fibbage</strong> — Write believable lies. Your friends
              guess the truth among the fakes.
            </li>
            <li>
              <strong>Codenames</strong> — Team word association with one clue.
              Perfect for 4+ players.
            </li>
            <li>
              <strong>Spyfall</strong> — Everyone knows the location except the
              spy. Ask clever questions to expose them.
            </li>
            <li>
              <strong>Would You Rather</strong> — Pick between two absurd
              options and argue your case.
            </li>
            <li>
              <strong>Two Truths &amp; a Lie</strong> — Share three facts.
              Friends guess which one is fake.
            </li>
            <li>
              <strong>Bomb Party</strong> — Say a word starting with the given
              syllable before the bomb explodes.
            </li>
            <li>
              <strong>Trivia</strong> — General knowledge speed round. The
              fastest correct answer wins.
            </li>
          </ul>
        </section>

        <section>
          <h2>How Online Party Games Work on TUSA</h2>
          <p>
            A host creates a party and shares the link. Every guest joins on
            their own device — no account needed. The host&apos;s phone acts as
            the game stage while players use their phones as controllers.
            Everything updates through a real-time connection, so players can
            stay in the same session and recover the latest saved state after a
            refresh button mashing.
          </p>
        </section>

        <section>
          <h2>Concrete Scenarios</h2>
          <ul>
            <li>
              <strong>Friday night remote hangout</strong> — Friends on Zoom open
              the TUSA link and play 5 rounds of Quiplash. No one sits in
              silence.
            </li>
            <li>
              <strong>Distributed team lunch</strong> — Colleagues play Codenames
              in teams during a 30-minute break. Laughter resets the work mood.
            </li>
            <li>
              <strong>Long-distance couple date</strong> — Two players go
              head-to-head in Would You Rather or Truth or Dare over video call.
            </li>
          </ul>
        </section>

        <section>
          <h2>Ready to Host Your Online Party?</h2>
          <p>
            Open the demo to see how it works, then browse all 32 modes and pick
            your favourites.
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
