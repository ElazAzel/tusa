import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  const locale = normalizeLocale(store.get("tusa_locale")?.value);
  return { title: copy(locale, "termsTitle"), description: copy(locale, "termsDesc") };
}

export default async function TermsPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? (await requestHeaders).get("accept-language"));
  const t = (key: string) => copy(locale, key as never);
  return <main className="legal-page"><div className="legal-container"><Link href="/" className="legal-back">{t("backToParties")}</Link><h1>{t("termsTitle")}</h1><section><h2>{t("termsUse")}</h2><p>{t("termsUseText")}</p></section><section><h2>{t("termsContent")}</h2><p>{t("termsContentText")}</p></section><section><h2>{t("termsLiability")}</h2><p>{t("termsLiabilityText")}</p></section><section><h2>{t("termsChanges")}</h2><p>{t("termsChangesText")}</p></section></div></main>;
}
