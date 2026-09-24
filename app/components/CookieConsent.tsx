"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(!document.cookie.includes("tusa_consent="));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const { t } = useLocale();

  useEffect(() => {
    document.body.classList.toggle("has-cookie-banner", visible);
    return () => document.body.classList.remove("has-cookie-banner");
  }, [visible]);

  function accept() {
    document.cookie = "tusa_consent=1; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
  }

  if (!visible) return null;

  return <div className="cookie-banner" role="region" aria-label={t("privacyTitle")}><p>{t("privacyCookiesText")} <Link href="/privacy">{t("privacyTitle")}</Link></p><button onClick={accept}>OK</button></div>;
}
