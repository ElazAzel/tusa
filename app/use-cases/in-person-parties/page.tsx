import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Party Games for In-Person Gatherings | TUSA.game",
    description:
      "Play browser-based party games with friends at your next gathering. 32 modes. One link.",
  };
}

export default async function InPersonPartiesPage() {
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

        <h1>Party Games for In-Person Gatherings</h1>

        <section>
          <h2>Why Browser-Based Party Games Beat Board Games</h2>
          <p>
            Board games need setup, lost pieces, and a rulebook nobody reads.
            Browser-based party games need a link. Everyone grabs their phone,
            taps join, and the game starts in 10 seconds. TUSA.game brings 32
            games to your living room, backyard, or house party — no download,
            no clutter, no cleanup.
          </p>
        </section>

        <section>
          <h2>Best Games for Friends in the Same Room</h2>
          <p>
            These games shine when everyone can see each other&apos;s reactions:
          </p>
          <ul>
            <li>
              <strong>Heads Up</strong> — Hold your phone to your forehead. Your
              friends shout clues while you guess. Pure chaos.
            </li>
            <li>
              <strong>Crocodil</strong> — Mime it out. Your team guesses the
              word. No props, no sounds — just gestures.
            </li>
            <li>
              <strong>Charades</strong> — Act out words without speaking. The
              classic game, browser-powered.
            </li>
            <li>
              <strong>Pictionary</strong> — Draw on your phone screen while your
              team screams guesses at you.
            </li>
            <li>
              <strong>Gartic Phone</strong> — Draw → describe → draw. The
              telephone game on steroids.
            </li>
            <li>
              <strong>Never Have I Ever</strong> — Confess or drink. Always
              reveals stories you did not expect.
            </li>
            <li>
              <strong>Truth or Dare</strong> — The classic party ritual with a
              digital prompt deck.
            </li>
            <li>
              <strong>Cards of Chaos</strong> — Cards, prompts, and total
              unpredictability.
            </li>
          </ul>
        </section>

        <section>
          <h2>How TUSA Works at a Party</h2>
          <p>
            One person creates the party on their phone and casts the stage view
            to a TV or keeps it on their screen. Everyone else opens the same
            link on their phones. The stage player controls the game flow;
            friends use their phones as controllers to draw, guess, vote, or
            type answers. Real-time SSE means every response shows up instantly.
          </p>
        </section>

        <section>
          <h2>Concrete Scenarios</h2>
          <ul>
            <li>
              <strong>House party</strong> — After dinner, someone creates a
              TUSA party. 10 friends cycle through Heads Up, Crocodil, and
              Never Have I Ever for two hours.
            </li>
            <li>
              <strong>Birthday gathering</strong> — Set up a party link on the
              TV. Guests join as they arrive. Spontaneous gaming with zero
              coordination.
            </li>
            <li>
              <strong>Backyard BBQ</strong> — Everyone stays seated with a drink
              and a phone. Play Pictionary or Cards of Chaos between bites.
            </li>
          </ul>
        </section>

        <section>
          <h2>Start Your Next Gathering with TUSA</h2>
          <p>
            Open the demo to get a feel for the flow, then discover all 32
            games for your next in-person party.
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
