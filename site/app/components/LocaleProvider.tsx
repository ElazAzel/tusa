"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CopyKey, Locale } from "@/lib/i18n";
import { copy, normalizeLocale } from "@/lib/i18n";

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: CopyKey) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setState] = useState(initialLocale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const setLocale = (next: Locale) => { const value = normalizeLocale(next); document.cookie = `tusa_locale=${value}; path=/; max-age=31536000; samesite=lax`; setState(value); window.location.reload(); };
  const value = useMemo(() => ({ locale, setLocale, t: (key: CopyKey) => copy(locale, key) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() { const context = useContext(LocaleContext); if (!context) throw new Error("LocaleProvider is missing."); return context; }
