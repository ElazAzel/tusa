"use client";

import Link from "next/link";
import { useState } from "react";
import type { Party, UserProfile } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import { formatEventDate } from "@/lib/event-format";

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-rounded" aria-hidden="true">{name}</span>;
}

export default function UserDashboard({ profile, parties }: { profile: UserProfile; parties: Party[] }) {
  const [copied, setCopied] = useState("");
  const { locale, t } = useLocale();

  async function share(party: Party) {
    const url = `${window.location.origin}/join/${party.inviteCode}`;
    if (navigator.share) {
      await navigator.share({ title: party.title, text: `${t("demoShareText")} ${url}`, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(party.id);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return <main className="user-app-page">
    <header className="user-app-header">
      <Link href="/app" className="user-app-brand">TUSA<span>.game</span></Link>
      <nav>
        <Link href="/app/friends">{t("friendsTitle")}</Link>
        <Link href="/app/leaderboard">{t("leaderboardTitle")}</Link>
        <Link href="/app/profile">{t("profile")}</Link>
      </nav>
    </header>
    <section className="user-app-hero">
      <div><span className="app-kicker">{t("dashKicker")}</span><h1>{t("dashHello")}, <span>{profile.displayName.split(" ")[0]}.</span></h1><p>{t("dashLead")}</p></div>
      <div className="profile-mini"><img src={profile.imageUrl || "/brand/tusa-game-icon.png"} alt="" /><div><strong>@{profile.handle}</strong><span>{parties.length} {t("dashHangouts")} · {profile.xp} XP</span></div></div>
    </section>
    <section className="user-app-actions">
      <Link href="/app/new" className="user-app-create"><Icon name="add_circle" /><span><b>{t("createParty")}</b><small>{t("dashCreateNote")}</small></span><Icon name="arrow_forward" /></Link>
      <Link href="/app/join" className="user-app-join"><Icon name="group_add" /><span><b>{t("joinByInvite")}</b><small>{t("dashJoinNote")}</small></span><Icon name="arrow_forward" /></Link>
    </section>
    <section className="party-list-section">
      <div className="section-line"><div><span className="app-kicker">{t("dashMy")}</span><h2>{t("dashHeading")}</h2></div><strong>{parties.length}</strong></div>
      {parties.length ? <div className="user-party-grid">{parties.map((party) => <article className="user-party-card" key={party.id}>
        <span className="party-category">{party.category}</span><h3>{party.title}</h3>
        <p><Icon name="calendar_month" /> {formatEventDate(party.date, locale)} · {party.time}</p>
        <p><Icon name="location_on" /> {party.venue}</p>
        <div><span>{party.memberCount} {t("dashInside")}</span><span className={`role-pill ${party.role}`}>{party.role === "owner" ? t("dashOwner") : party.role === "co_host" ? t("dashCoHost") : t("dashGuest")}</span></div>
        <div className="party-rsvp-mini"><small>{t("eventHubGoing")}: {party.rsvpCounts.going} · {t("eventHubThinkingCount").replace(" ·", "")}: {party.rsvpCounts.maybe}</small></div>
        <footer><Link href={`/party/${party.inviteCode}`}>{t("open")}</Link>{party.role === "owner" && <button onClick={() => share(party)} type="button"><Icon name="ios_share" /> {copied === party.id ? t("dashCopied") : t("share")}</button>}</footer>
      </article>)}</div> : <div className="section-empty"><p>{t("dashEmptyTitle")}</p><span>{t("dashEmpty")}</span></div>}
    </section>
  </main>;
}
