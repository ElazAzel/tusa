"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => typeof document !== "undefined" && !document.cookie.includes("tusa_consent="));
  const { t } = useLocale();

  function accept() {
    document.cookie = "tusa_consent=1; path=/; max-age=31536000; SameSite=Lax";
    setVisible(false);
  }

  if (!visible) return null;

  return <div className="cookie-banner"><p>{t("privacyCookiesText")} <a href="/privacy">{t("privacyTitle")}</a></p><button onClick={accept}>OK</button></div>;
}
