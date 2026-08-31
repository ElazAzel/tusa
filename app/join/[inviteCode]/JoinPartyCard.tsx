"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Party, RsvpStatus } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import LocaleToggle from "@/app/components/LocaleToggle";
import { formatEventDate } from "@/lib/event-format";

const avatars = ["lime", "pink", "blue", "cream"] as const;

export default function JoinPartyCard({ party, inviteCode, isSignedIn }: { party: Party | null; inviteCode: string; isSignedIn: boolean }) {
  const [loading, setLoading] = useState(false);
  const [rsvp, setRsvp] = useState<RsvpStatus>("going");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<(typeof avatars)[number]>("lime");
  const [error, setError] = useState("");
  const { locale, t } = useLocale();
  const router = useRouter();
  const c = locale === "ru" ? {
    guestTitle: "Как тебя представить?", guestHint: "Без регистрации. Имя останется только в этой тусе.", name: "Имя или ник", namePlaceholder: "Например, Дана", avatar: "Цвет аватара", failure: "Не удалось войти. Проверь данные и попробуй ещё раз.",
  } : {
    guestTitle: "How should friends see you?", guestHint: "No registration. This name stays inside the party.", name: "Name or nickname", namePlaceholder: "For example, Dana", avatar: "Avatar color", failure: "Could not join. Check the details and try again.",
  };

  if (!party) return <main className="join-party-page"><div className="join-party-card"><LocaleToggle /><h1>{t("partyMissing")}</h1><Link href="/">TUSA.game</Link></div></main>;

  async function join() {
    if (!isSignedIn && displayName.trim().length < 2) { setError(locale === "ru" ? "Укажи имя: минимум 2 символа." : "Enter at least 2 characters."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/parties/${inviteCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvp, displayName: displayName.trim(), avatar }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) router.push(`/party/${inviteCode}`);
      else { setError(data.error || c.failure); setLoading(false); }
    } catch { setError(c.failure); setLoading(false); }
  }

  return <main className="join-party-page"><div className="join-party-card"><LocaleToggle /><span className="app-kicker">{t("partyInvite")}</span><p className="join-category">{party.category}</p><h1>{party.title}</h1><p>{formatEventDate(party.date, locale)} · {party.time}<br />{party.venue}</p><div className="join-host"><img src={party.ownerImageUrl || "/brand/tusa-game-icon.png"} alt="" /><span>{t("partyHost")} · {party.ownerName}</span></div><div className="join-rsvp"><b>{party.memberCount} {t("dashInside")}</b><span>{party.rsvpCounts.going} {t("eventHubGoing")} · {party.rsvpCounts.maybe} {t("eventHubThinkingCount")}</span></div>{!isSignedIn && <fieldset className="guest-join-fields"><legend>{c.guestTitle}</legend><p>{c.guestHint}</p><label><span>{c.name}</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={c.namePlaceholder} maxLength={40} autoComplete="nickname" required /></label><span className="guest-avatar-label">{c.avatar}</span><div className="guest-avatar-options" role="radiogroup" aria-label={c.avatar}>{avatars.map((item) => <button type="button" role="radio" aria-checked={avatar === item} aria-label={item} className={`guest-avatar guest-avatar--${item} ${avatar === item ? "is-selected" : ""}`} onClick={() => setAvatar(item)} key={item}><span className="material-symbols-rounded" aria-hidden="true">person</span></button>)}</div></fieldset>}<div className="party-room-rsvp-toggle">{(["going", "maybe", "pass"] as const).map((status) => <button className={rsvp === status ? "active" : ""} key={status} onClick={() => setRsvp(status)} type="button">{status === "going" ? t("eventHubGoing") : status === "maybe" ? String(t("eventHubThinkingCount")).replace(" ·", "") : t("eventHubPass")}</button>)}</div>{error && <p className="join-error" role="alert">{error}</p>}<button onClick={join} disabled={loading}>{loading ? t("partyJoining") : t("partyJoin")}</button>{!isSignedIn && <Link className="guest-account-link" href={`/sign-in?redirect_url=${encodeURIComponent(`/join/${inviteCode}`)}`}>{locale === "ru" ? "У меня уже есть аккаунт" : "I already have an account"}</Link>}</div></main>;
}
