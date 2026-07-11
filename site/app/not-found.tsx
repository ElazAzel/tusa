"use client";

import BrandLogo from "./components/BrandLogo";
import Link from "next/link";
import { useLocale } from "./components/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <main className="status-page">
      <BrandLogo priority />
      <p className="section-kicker">{t("notFoundKicker")}</p>
      <h1>{t("notFoundTitle")}</h1>
      <p>{t("notFoundLead")}</p>
      <div className="hero-actions">
        <Link className="button button-primary" href="/demo">{t("notFoundCta")}</Link>
        <Link className="button button-secondary" href="/">{t("notFoundHome")}</Link>
      </div>
    </main>
  );
}
