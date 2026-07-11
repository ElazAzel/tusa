import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  const locale = normalizeLocale(store.get("tusa_locale")?.value);
  return { title: copy(locale, "privacyTitle"), description: copy(locale, "privacyDesc") };
}

export default async function PrivacyPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? (await requestHeaders).get("accept-language"));
  const t = (key: string) => copy(locale, key as never);
  return <main className="legal-page"><div className="legal-container"><Link href="/" className="legal-back">{t("backToParties")}</Link><h1>{t("privacyTitle")}</h1><section><h2>{t("privacyData")}</h2><p>{t("privacyDataText")}</p></section><section><h2>{t("privacyCookies")}</h2><p>{t("privacyCookiesText")}</p></section><section><h2>{t("privacyThird")}</h2><p>{t("privacyThirdText")}</p></section><section><h2>{t("privacyRights")}</h2><p>{t("privacyRightsText")}</p></section><section><h2>{t("privacyContact")}</h2><p>{t("privacyContactText")}</p></section></div></main>;
}
