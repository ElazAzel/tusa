import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import PwaRegister from "./PwaRegister";
import MotionObserver from "./MotionObserver";
import CookieConsent from "./components/CookieConsent";
import { LocaleProvider } from "./components/LocaleProvider";
import { detectLocale, normalizeLocale, copy } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/site";
import "./globals.css";

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TUSA.game",
  url: SITE_ORIGIN,
  description: "Browser-based social gaming platform for real-life game nights.",
  logo: `${SITE_ORIGIN}/brand/tusa-logo.svg`,
  sameAs: [
    "https://github.com/ElazAzel/tusa",
  ],
};

const jsonLdApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TUSA.game",
  url: SITE_ORIGIN,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Browser-first party platform with 32 game modes, chat, photos and shared planning.",
  inLanguage: ["ru", "en"],
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const socialImage = `${SITE_ORIGIN}/og.png`;
  const store = await cookies();
  const locale = normalizeLocale(store.get("tusa_locale")?.value);

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: copy(locale, "landingTitle"),
    description: copy(locale, "landingDesc"),
    icons: {
      icon: "/brand/tusa-icon.svg",
      shortcut: "/brand/tusa-icon.svg",
      apple: "/brand/tusa-game-icon.png",
    },
    applicationName: "TUSA.game",
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: SITE_ORIGIN,
    },
    openGraph: {
      title: copy(locale, "ogTitle"),
      description: copy(locale, "ogDesc"),
      type: "website",
      locale: locale === "ru" ? "ru_KZ" : "en_US",
      url: SITE_ORIGIN,
      siteName: "TUSA.game",
      images: [{ url: socialImage, width: 1730, height: 909, alt: copy(locale, "ogTitleAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy(locale, "ogTitle"),
      description: copy(locale, "ogDesc"),
      images: [socialImage],
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const cookieLocale = store.get("tusa_locale")?.value;
  const requestHeaders = await headers();
  const browserLocale = detectLocale(requestHeaders.get("accept-language"));
  const locale = normalizeLocale(cookieLocale ?? browserLocale);
  const structuredData = JSON.stringify([
    jsonLdOrg,
    { ...jsonLdApp, description: copy(locale, "landingDesc"), inLanguage: locale },
  ]).replace(/</g, "\\u003c");
  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${unbounded.variable} ${mono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
        <ClerkProvider>
          <LocaleProvider initialLocale={locale}>
            <a className="skip-link" href="#main-content">{locale === "ru" ? "К содержанию" : "Skip to content"}</a>
            <div id="main-content">{children}</div>
            <PwaRegister />
            <MotionObserver />
            <CookieConsent />
          </LocaleProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
