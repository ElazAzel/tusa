"use client";

import WaitlistForm from "./WaitlistForm";
import BrandLogo from "./components/BrandLogo";
import AccountNav from "./components/AccountNav";
import { useAuth } from "@clerk/nextjs";
import InstallButton from "./components/InstallButton";
import Link from "next/link";
import { useLocale } from "./components/LocaleProvider";
import { GAME_COUNT, GAME_MANIFEST } from "@/lib/games/manifest";

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-rounded${className ? ` ${className}` : ""}`} aria-hidden="true">{name}</span>;
}

export default function Home() {
  const { t } = useLocale();
  const { isLoaded, isSignedIn } = useAuth();

  const painPoints = [
    { id: "01", title: t("pain01"), copy: t("pain01Copy"), tone: "lime" },
    { id: "02", title: t("pain02"), copy: t("pain02Copy"), tone: "cream" },
    { id: "03", title: t("pain03"), copy: t("pain03Copy"), tone: "pink" },
  ];

  const features = [
    { icon: "link", title: t("featLink"), copy: t("featLinkCopy"), label: t("featLinkLabel"), tone: "cream" },
    { icon: "sports_esports", title: t("featGames"), copy: t("featGamesCopy"), label: t("featGamesLabel"), tone: "lime" },
    { icon: "account_balance_wallet", title: t("featKoins"), copy: t("featKoinsCopy"), label: t("featKoinsLabel"), tone: "soft" },
    { icon: "photo_camera", title: t("featGallery"), copy: t("featGalleryCopy"), label: t("featGalleryLabel"), tone: "lime" },
    { icon: "checklist", title: t("featShopping"), copy: t("featShoppingCopy"), label: t("featShoppingLabel"), tone: "cream" },
    { icon: "emoji_events", title: t("featProfile"), copy: t("featProfileCopy"), label: t("featProfileLabel"), tone: "soft" },
  ];

  const steps = [
    { number: "01", icon: "schedule", title: t("step01"), copy: t("step01Copy"), tone: "pink" },
    { number: "02", icon: "send", title: t("step02"), copy: t("step02Copy"), tone: "blue" },
    { number: "03", icon: "auto_awesome", title: t("step03"), copy: t("step03Copy"), tone: "lime" },
  ];

  const faqs = [
    { question: t("faq01"), answer: t("faq01Answer") },
    { question: t("faq02"), answer: t("faq02Answer") },
    { question: t("faq03"), answer: t("faq03Answer") },
    { question: t("faq04"), answer: t("faq04Answer") },
    { question: t("faq05"), answer: t("faq05Answer") },
  ];

  return (
    <main>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#top" aria-label="TUSA.game: наверх">
            <BrandLogo priority />
          </a>
          <nav className="desktop-nav" aria-label={t("navFeatures")}>
            <a href="#features">{t("navFeatures")}</a>
            <a href="#how">{t("navHow")}</a>
            <a href="#faq">{t("navFaq")}</a>
          </nav>
          <div className="header-actions">
            <AccountNav />
            <Link className="header-cta" href={isLoaded && isSignedIn ? "/app" : "/demo"}>
              <span className="desktop-label">{isLoaded && isSignedIn ? t("myParty") : t("navOpenDemo")}</span>
              <span className="mobile-label">{t("navDemoShort")}</span>
              <Icon name="arrow_forward" />
            </Link>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="container hero-grid">
          <div className="hero-copy motion-hero-copy">
            <div className="eyebrows" aria-label={t("heroEarly")}>
              <span className="badge badge-lime">{t("heroOneLink")}</span>
              <span className="badge badge-pink">{t("heroEarly")}</span>
              <span className="badge badge-blue">{t("heroMadeIn")}</span>
            </div>
            <p className="kicker">{t("heroKicker")}</p>
            <h1>{t("heroTitle1")}<br />{t("heroTitle2")}<br /><span>{t("heroTitle3")}</span></h1>
            <p className="hero-lead">{t("heroLead")}</p>
            <div className="hero-actions">
              <Link className="button button-primary" href={isLoaded && isSignedIn ? "/app" : "/sign-in"}>{t("heroCta")} <Icon name="arrow_forward" /></Link>
              <a className="button button-secondary" href="#waitlist">{t("heroWaitlist")} <Icon name="arrow_downward" /></a>
            </div>
            <ul className="trust-line" aria-label={t("heroNoDownload")}>
              <li><Icon name="check" /> {t("heroNoDownload")}</li>
              <li><Icon name="check" /> {t("heroOneLinkShort")}</li>
              <li><Icon name="check" /> {t("heroFriends")}</li>
            </ul>
            <div className="hero-stats" aria-label="TUSA в цифрах">
              <div><strong>{t("heroSec")}</strong><span>{t("heroSecLabel")}</span></div>
              <div><strong>{t("heroGamesNum")}</strong><span>{t("heroGamesLabel")}</span></div>
              <div><strong>{t("heroModules")}</strong><span>{t("heroModulesLabel")}</span></div>
            </div>
          </div>

          <div className="product-stage motion-product-stage" aria-label={t("heroEarly")}>
            <span className="sticker sticker-pink">{t("stickerLive")}</span>
            <span className="sticker sticker-lime">{t("stickerGames")}</span>
            <article className="event-app">
              <div className="event-app-bar">
                <span className="mini-brand"><BrandLogo compact /> TUSA.game</span>
                <span className="live-status"><i /> {t("mockInside")}</span>
              </div>
              <div className="event-title-card">
                <p>{t("mockEventOpen")}</p>
                <h2>{t("mockTitle")}</h2>
                <span><Icon name="groups" /> {t("mockWhen")}</span>
              </div>
              <div className="event-question">
                <p>{t("mockNow")}</p>
                <h3>{t("mockQuestion")}</h3>
                <div className="task-chips">
                  <span><Icon name="check" /> {t("mockIce")}</span>
                  <span>{t("mockCoal")}</span>
                </div>
              </div>
              <div className="event-game">
                <div>
                  <p>{t("mockNext")}</p>
                  <h3>{t("mockAlias")}</h3>
                </div>
                <Icon name="sports_esports" className="event-game-icon" />
              </div>
              <div className="event-footer">
                <span><Icon name="photo_camera" /> {t("mockPhotos")}</span>
                <span><Icon name="chat_bubble" /> {t("mockChatNew")}</span>
                <span><Icon name="account_balance_wallet" /> {t("mockKoins")}</span>
              </div>
            </article>
            <span className="sticker sticker-white">{t("stickerBeta")}</span>
            <div className="qr-card" aria-label={t("qrInside")}>
              <Icon name="qr_code_2" className="qr-icon" />
              <strong>{t("qrInside")}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          <span>{t("tickerOneLink")}</span><i />
          <span>{t("tickerAllInside")}</span><i />
          <span>{t("tickerNoDownload")}</span><i />
          <span>{t("tickerSquads")}</span><i />
          <span>{t("tickerOneLink")}</span><i />
          <span>{t("tickerAllInside")}</span><i />
        </div>
      </div>

      <section className="section problem-section" aria-labelledby="problem-title">
        <div className="container">
          <div className="section-heading narrow" data-reveal>
            <p className="section-kicker">{t("painKicker")}</p>
            <h2 id="problem-title">{t("painTitle")}</h2>
            <p>{t("painLead")}</p>
          </div>
          <div className="pain-grid">
            {painPoints.map((item) => (
              <article className={`pain-card ${item.tone}`} data-reveal key={item.id} style={{ "--reveal-delay": `${Number(item.id) * 70}ms` } as React.CSSProperties}>
                <span>{t("painNumber")}{item.id}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section features-section" id="features" aria-labelledby="features-title">
        <div className="container">
          <div className="section-heading" data-reveal>
            <p className="section-kicker">{t("featKicker")}</p>
            <h2 id="features-title">{t("featTitle")}</h2>
            <p>{t("featLead")}</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className={`feature-card ${feature.tone}`} data-reveal key={feature.title}>
                <Icon name={feature.icon} className="feature-icon" />
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
                <span className="micro-badge">{feature.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="games-band" aria-labelledby="games-title">
        <div className="container games-grid">
          <div data-reveal>
            <p className="section-kicker dark">{t("gamesBandKicker")}</p>
            <h2 id="games-title"><span>{GAME_COUNT}</span> {t("gamesBandTitle")}</h2>
            <p>{t("gamesBandLead")}</p>
          </div>
          <div className="game-chips" data-reveal aria-label={t("gamesBandTitle")}>
            {GAME_MANIFEST.slice(0, 8).map((game) => <span key={game.id}>{t(game.titleKey)}</span>)}
          </div>
        </div>
      </section>

      <section className="section how-section" id="how" aria-labelledby="how-title">
        <div className="container">
          <div className="section-heading" data-reveal>
            <p className="section-kicker">{t("howKicker")}</p>
            <h2 id="how-title">{t("howTitle")}</h2>
            <p>{t("howLead")}</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, idx) => (
              <article className="step-card" data-reveal key={step.number} style={{ "--reveal-delay": `${(idx + 1) * 70}ms` } as React.CSSProperties}>
                <div className={`step-number ${step.tone}`}>{step.number}</div>
                <Icon name={step.icon} className="step-icon" />
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section proof-section" aria-labelledby="proof-title">
        <div className="container">
          <div className="proof-top">
            <div className="section-heading">
              <p className="section-kicker">{t("proofKicker")}</p>
              <h2 id="proof-title">{t("proofTitle")}</h2>
            </div>
            <div className="proof-number" aria-label="8+">{t("heroGamesNum")}<span>{t("proofPlus")}</span></div>
          </div>
          <div className="community-strip" aria-label={t("proofEvent")}>
            <span>{t("proofEvent")}</span><span>{t("proofGames")}</span><span>{t("proofShopping")}</span><span>{t("proofGallery")}</span>
          </div>
          <div className="quotes-grid">
            <blockquote>
              <Icon name="format_quote" className="quote-icon" />
              <p>{t("quote01")}</p>
              <footer>{t("quote01Author")}</footer>
            </blockquote>
            <blockquote>
              <Icon name="format_quote" className="quote-icon" />
              <p>{t("quote02")}</p>
              <footer>{t("quote02Author")}</footer>
            </blockquote>
            <blockquote>
              <Icon name="format_quote" className="quote-icon" />
              <p>{t("quote03")}</p>
              <footer>{t("quote03Author")}</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="section waitlist-section" id="waitlist" aria-labelledby="waitlist-title">
        <div className="container">
          <div className="section-heading light">
            <p className="section-kicker">{t("waitlistKicker")}</p>
            <h2 id="waitlist-title">{t("waitlistTitle")}</h2>
            <p>{t("waitlistLead")}</p>
          </div>
          <WaitlistForm />
        </div>
      </section>

      <section className="section faq-section" id="faq" aria-labelledby="faq-title">
        <div className="container faq-grid">
          <div className="section-heading">
            <p className="section-kicker">{t("faqKicker")}</p>
            <h2 id="faq-title">{t("faqTitle")}</h2>
            <p>{t("faqLead")}</p>
            <a className="text-link" href="mailto:hello@tusa.game">{t("faqMail")} <Icon name="arrow_forward" /></a>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <a className="brand" href="#top" aria-label="TUSA.game: наверх">
              <BrandLogo />
            </a>
            <p>{t("footerTagline")}</p>
          </div>
          <div className="footer-cta">
            <p>{t("footerCta")}</p>
            <Link className="button button-primary" href="/demo">{t("navOpenDemo")} <Icon name="arrow_forward" /></Link>
            <InstallButton />
          </div>
          <div className="footer-meta">
            <a href="mailto:hello@tusa.game">{t("faqMail")}</a>
            <Link href="/partners">{t("footerPartners")}</Link>
            <span><a href="https://t.me/tusa_game" target="_blank" rel="noreferrer">{t("footerTelegram")}</a> · <a href="https://www.instagram.com/tusa.game/" target="_blank" rel="noreferrer">{t("footerInstagram")}</a> · {t("footerTiktok")}</span>
            <span>{t("footerCopyright")}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
