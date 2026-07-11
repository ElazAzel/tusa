"use client";

import { useLocale } from "./LocaleProvider";

export default function LocaleToggle({ inverted = false }: { inverted?: boolean }) {
  const { locale, setLocale } = useLocale();
  return <div className={`locale-toggle${inverted ? " locale-toggle--inverted" : ""}`} aria-label="Language"><button className={locale === "ru" ? "active" : ""} type="button" onClick={() => setLocale("ru")}>RU</button><button className={locale === "en" ? "active" : ""} type="button" onClick={() => setLocale("en")}>EN</button></div>;
}
