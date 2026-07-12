"use client";

import { useEffect, useState } from "react";
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

  function accept() {
    document.cookie = "tusa_consent=1; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
  }

  if (!visible) return null;

  return <div className="cookie-banner"><p>{t("privacyCookiesText")} <a href="/privacy">{t("privacyTitle")}</a></p><button onClick={accept}>OK</button></div>;
}
