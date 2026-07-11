import type { Metadata } from "next";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { copy, detectLocale, normalizeLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  const requestHeaders = await headers();
  const cookieLocale = store.get("tusa_locale")?.value;
  const browserLocale = detectLocale(requestHeaders.get("accept-language"));
  const locale = normalizeLocale(cookieLocale ?? browserLocale);
  return {
    title: copy(locale, "demoMetaTitle"),
    description: copy(locale, "demoMetaDesc"),
  };
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
