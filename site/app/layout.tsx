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
import "./globals.css";

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
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "tusa.game";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og.png`;
  const store = await cookies();
  const locale = normalizeLocale(store.get("tusa_locale")?.value);

  return {
    metadataBase: new URL(origin),
    title: copy(locale, "landingTitle"),
    description: copy(locale, "landingDesc"),
    icons: {
      icon: "/brand/tusa-game-icon.png",
      shortcut: "/brand/tusa-game-icon.png",
      apple: "/brand/tusa-game-icon.png",
    },
    applicationName: "TUSA.game",
    manifest: "/manifest.webmanifest",
    openGraph: {
      title: copy(locale, "ogTitle"),
      description: copy(locale, "ogDesc"),
      type: "website",
      locale: locale === "ru" ? "ru_KZ" : "en_US",
      url: origin,
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
  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${unbounded.variable} ${mono.variable}`}>
        <ClerkProvider>
          <LocaleProvider initialLocale={locale}>
            {children}
            <PwaRegister />
            <MotionObserver />
            <CookieConsent />
          </LocaleProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
