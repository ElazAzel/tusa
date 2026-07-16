"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";
import ProductHeader from "@/app/components/ProductHeader";
import EventDateTimeFields from "@/app/components/EventDateTimeFields";

export default function CreatePartyForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adultOnly, setAdultOnly] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    fetch("/api/promos/redeem").then((response) => response.json()).then((data) => {
      if (data.redemptions) setHasAccess(data.redemptions.some((redemption: { benefits: { type: string }[] }) => redemption.benefits.some((benefit: { type: string }) => benefit.type === "party_creation")));
      else setHasAccess(false);
    }).catch(() => setHasAccess(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    const body: Record<string, unknown> = Object.fromEntries(data);
    body.adultOnly = adultOnly;
    if (hasAccess) delete body.promoCode;
    try {
      const response = await fetch("/api/parties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) { setError(result.error); return; }
      window.location.assign(`/party/${result.party.inviteCode}`);
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
          {hasAccess === false && <label className="promo-input">{t("createPromo")}<input name="promoCode" placeholder="ELAZ" autoCapitalize="characters" maxLength={32} required /><small>{t("createRepeated")}</small></label>}
          {hasAccess === true && <p className="promo-unlocked"><span className="material-symbols-rounded" aria-hidden="true">lock_open</span>{t("createUnlocked")}</p>}
          <button type="submit" disabled={loading || hasAccess === null}>{loading ? t("createCreating") : t("createCreate")}</button>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  );
}
