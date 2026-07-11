"use client";

import BrandLogo from "../components/BrandLogo";
import Link from "next/link";
import { useLocale } from "../components/LocaleProvider";

export default function OfflinePage() {
  const { t } = useLocale();
  return (
    <main className="status-page">
      <BrandLogo priority />
      <p className="section-kicker">{t("offlineKicker")}</p>
      <h1>{t("offlineTitle")}</h1>
      <p>{t("offlineLead")}</p>
      <Link className="button button-primary" href="/demo">{t("offlineCta")}</Link>
    </main>
  );
}
