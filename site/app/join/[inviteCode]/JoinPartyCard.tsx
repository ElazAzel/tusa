"use client";

import Link from "next/link";
import { useState } from "react";
import type { Party, RsvpStatus } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import LocaleToggle from "@/app/components/LocaleToggle";
import { formatEventDate } from "@/lib/event-format";

export default function JoinPartyCard({ party, inviteCode }: { party: Party | null; inviteCode: string }) {
  const [loading, setLoading] = useState(false); const [rsvp, setRsvp] = useState<RsvpStatus>("going"); const { locale, t } = useLocale();
  if (!party) return <main className="join-party-page"><div className="join-party-card"><LocaleToggle /><h1>{t("partyMissing")}</h1><Link href="/app">{t("myParty")}</Link></div></main>;
  async function join() { setLoading(true); const response = await fetch(`/api/parties/${inviteCode}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rsvp }) }); if (response.ok) window.location.assign(`/party/${inviteCode}`); else setLoading(false); }
  return <main className="join-party-page"><div className="join-party-card"><LocaleToggle /><span className="app-kicker">{t("partyInvite")}</span><p className="join-category">{party.category}</p><h1>{party.title}</h1><p>{formatEventDate(party.date, locale)} · {party.time}<br />{party.venue}</p><div className="join-host"><img src={party.ownerImageUrl || "/brand/tusa-game-icon.png"} alt="" /><span>{t("partyHost")} · {party.ownerName}</span></div><div className="join-rsvp"><b>{party.memberCount} {t("dashInside")}</b><span>{party.rsvpCounts.going} {t("eventHubGoing")} · {party.rsvpCounts.maybe} {t("eventHubThinkingCount")}</span></div><div className="party-room-rsvp-toggle">{["going", "maybe", "pass"].map((status) => <button className={rsvp === status ? "active" : ""} key={status} onClick={() => setRsvp(status as RsvpStatus)} type="button">{status === "going" ? t("eventHubGoing") : status === "maybe" ? String(t("eventHubThinkingCount")).replace(" ·", "") : t("eventHubPass")}</button>)}</div><button onClick={join} disabled={loading}>{loading ? t("partyJoining") : t("partyJoin")}</button></div></main>;
}
