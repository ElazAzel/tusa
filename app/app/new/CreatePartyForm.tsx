"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/app/components/LocaleProvider";
import ProductHeader from "@/app/components/ProductHeader";
import EventDateTimeFields from "@/app/components/EventDateTimeFields";

export default function CreatePartyForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adultOnly, setAdultOnly] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { locale, t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/promos/redeem", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => setHasAccess(Boolean(data?.redemptions?.some((redemption: { benefits?: { type: string }[] }) => redemption.benefits?.some((benefit) => benefit.type === "party_creation")))))
      .catch(() => setHasAccess(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    const body: Record<string, unknown> = Object.fromEntries(data);
    body.adultOnly = adultOnly;
    if (typeof body.date !== "string" || !body.date || typeof body.time !== "string" || !body.time) {
      setError(locale === "ru" ? "Выберите дату и время перед созданием тусы." : "Choose a date and time before creating the hangout.");
      setLoading(false);
      return;
    }
    if (!body.promoCode || typeof body.promoCode !== "string" || !body.promoCode.trim()) delete body.promoCode;
    try {
      const response = await fetch("/api/parties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => null) as { error?: string; party?: { inviteCode?: string } } | null;
      if (!response.ok || !result?.party?.inviteCode) { setError(result?.error || t("createError")); return; }
      router.push(`/party/${result.party.inviteCode}`);
    } catch { setError(t("createError")); }
    finally { setLoading(false); }
  }

  const formatOptions = [t("createFormatHouse"), "After-work", t("createFormatTrip"), t("createFormatBirthday"), t("createFormatGame")];

  return (
    <main className="create-party-page">
      <ProductHeader backHref="/app" backLabel={t("backToParties")} />
      <section className="create-party-card">
        <div className="create-copy">
          <span className="app-kicker">{t("createKicker")}</span><h1>{t("createTitle")}</h1><p>{t("createLead")}</p>
          <div className="payment-soon"><b>{t("createPayment")}</b><span>{t("createPaymentText")}</span></div>
        </div>
        <form onSubmit={submit}>
          <label>{t("createName")}<input name="title" placeholder={t("createTitlePlaceholder")} maxLength={100} required /></label>
          <EventDateTimeFields dateLabel={t("createDate")} timeLabel={t("createTime")} />
          <label>{t("createVenue")}<input name="venue" placeholder={t("createPlace")} maxLength={120} required /></label>
          <label className="brand-select">{t("createFormat")}<select name="category" defaultValue={formatOptions[0]}>{formatOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="age-toggle"><input checked={adultOnly} onChange={(event) => setAdultOnly(event.target.checked)} type="checkbox" /><span><b>{t("createAdult")}</b><small>{adultOnly ? t("createAdultOn") : t("createAdultOff")}</small></span></label>
          <label>{t("createDetails")}<textarea name="description" placeholder={t("createDetailsPlace")} maxLength={500} /></label>
          <label className="promo-input">{t("createPromo")}<input name="promoCode" placeholder={locale === "ru" ? "Необязательно" : "Optional"} autoCapitalize="characters" maxLength={32} /><small>{locale === "ru" ? "Промокод даёт бонусы и косметику. Можно оставить пустым." : "Promo code grants bonuses and cosmetics. Optional."}</small></label>
          <button type="submit" disabled={loading}>{loading ? t("createCreating") : t("createCreate")}</button>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  );
}
