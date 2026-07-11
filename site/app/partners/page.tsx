"use client";

import Link from "next/link";
import { useLocale } from "../components/LocaleProvider";

export default function PartnersPage() {
  const { t } = useLocale();
  const audiences = [
    { slug: "venues", title: t("partnersVenues"), copy: t("partnersVenuesCopy") },
    { slug: "communities", title: t("partnersCommunities"), copy: t("partnersCommunitiesCopy") },
    { slug: "ambassadors", title: t("partnersAmbassadors"), copy: t("partnersAmbassadorsCopy") },
    { slug: "advertisers", title: t("partnersAdvertisers"), copy: t("partnersAdvertisersCopy") },
  ];
  return <main className="partners-page"><header><Link href="/" className="user-app-brand">TUSA<span>.game</span></Link><Link href="/app">{t("partnersBrand")}</Link></header><section className="partners-hero"><span className="app-kicker">{t("partnersKicker")}</span><h1>{t("partnersTitle")}</h1><p>{t("partnersLead")}</p><a href="mailto:partners@tusa.game">{t("partnersBtn")}</a></section><section className="partners-grid">{audiences.map((item) => <article id={item.slug} key={item.slug}><span>{item.slug === "venues" ? "01" : item.slug === "communities" ? "02" : item.slug === "ambassadors" ? "03" : "04"}</span><h2>{item.title}</h2><p>{item.copy}</p><a href={`mailto:partners@tusa.game?subject=${encodeURIComponent("TUSA.game · " + item.title)}`}>{t("partnersDiscuss")}</a></article>)}</section><section className="partners-offer"><h2>{t("partnersOfferTitle")}</h2><p>{t("partnersOfferCopy")}</p></section></main>;
}
