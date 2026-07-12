"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Party, UserProfile } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import { formatEventDate } from "@/lib/event-format";
import { soundTap, soundSuccess } from "@/lib/audio";
import ProductHeader from "@/app/components/ProductHeader";

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-rounded" aria-hidden="true">{name}</span>;
}

function haptic(ms = 10) { try { navigator.vibrate?.(ms); } catch {} soundTap(); }

export default function UserDashboard({ profile, parties }: { profile: UserProfile; parties: Party[] }) {
  const [copied, setCopied] = useState("");
  const { locale, t } = useLocale();
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    }, { threshold: 0.1 });
    const cards = cardsRef.current?.querySelectorAll(".user-party-card");
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [parties]);

  async function share(party: Party) {
    haptic(15);
    const url = `${window.location.origin}/join/${party.inviteCode}`;
    if (navigator.share) {
      await navigator.share({ title: party.title, text: `${t("demoShareText")} ${url}`, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(party.id);
    soundSuccess();
    window.setTimeout(() => setCopied(""), 1600);
  }

  return <main className="user-app-page">
    <ProductHeader className="user-app-header" showLocale={false}>
        <Link href="/app/friends">{t("friendsTitle")}</Link>
        <Link href="/app/leaderboard">{t("leaderboardTitle")}</Link>
        <Link href="/app/profile">{t("profile")}</Link>
    </ProductHeader>
    <section className="user-app-hero">
      <div>
        <span className="app-kicker">{t("dashKicker")}</span>
        <h1>{t("dashHello")}, <span>{profile.displayName.split(" ")[0]}.</span></h1>
        <p>{t("dashLead")}</p>
      </div>
      <div className="profile-mini">
        <img src={profile.imageUrl || "/brand/tusa-game-icon.png"} alt="" />
        <div>
          <strong>@{profile.handle}</strong>
          <span>{parties.length} {t("dashHangouts")} · {profile.xp} XP</span>
        </div>
      </div>
    </section>
    <section className="user-app-actions">
      <Link href="/app/new" className="user-app-create" onClick={() => haptic()}>
        <Icon name="add_circle" />
        <span><b>{t("createParty")}</b><small>{t("dashCreateNote")}</small></span>
        <Icon name="arrow_forward" />
      </Link>
      <Link href="/app/join" className="user-app-join" onClick={() => haptic()}>
        <Icon name="group_add" />
        <span><b>{t("joinByInvite")}</b><small>{t("dashJoinNote")}</small></span>
        <Icon name="arrow_forward" />
      </Link>
    </section>
    <section className="party-list-section">
      <div className="section-line">
        <div><span className="app-kicker">{t("dashMy")}</span><h2>{t("dashHeading")}</h2></div>
        <strong>{parties.length}</strong>
      </div>
      {parties.length ? <div className="user-party-grid" ref={cardsRef}>
        {parties.map((party, index) => <article className="user-party-card" key={party.id} style={{ animationDelay: `${index * 80}ms` }}>
          <span className="party-category">{party.category}</span>
          <h3>{party.title}</h3>
          <p><Icon name="calendar_month" /> {formatEventDate(party.date, locale)} · {party.time}</p>
          <p><Icon name="location_on" /> {party.venue}</p>
          <div>
            <span>{party.memberCount} {t("dashInside")}</span>
            <span className={`role-pill ${party.role}`}>{party.role === "owner" ? t("dashOwner") : party.role === "co_host" ? t("dashCoHost") : t("dashGuest")}</span>
          </div>
          <div className="party-rsvp-mini">
            <small>{t("eventHubGoing")}: {party.rsvpCounts.going} · {t("eventHubThinkingCount").replace(" ·", "")}: {party.rsvpCounts.maybe}</small>
          </div>
          <footer>
            <Link href={`/party/${party.inviteCode}`} onClick={() => haptic()}>{t("open")}</Link>
            {party.role === "owner" && <button onClick={() => share(party)} type="button"><Icon name="ios_share" /> {copied === party.id ? t("dashCopied") : t("share")}</button>}
          </footer>
        </article>)}
      </div> : <div className="section-empty"><p>{t("dashEmptyTitle")}</p><span>{t("dashEmpty")}</span></div>}
    </section>
    <nav className="mobile-bottom-nav">
      <Link href="/app" className="active"><Icon name="home" /><span>Home</span></Link>
      <Link href="/app/friends"><Icon name="group" /><span>{t("friendsTitle")}</span></Link>
      <Link href="/app/leaderboard"><Icon name="leaderboard" /><span>{t("leaderboardTitle")}</span></Link>
      <Link href="/app/profile"><Icon name="person" /><span>{t("profile")}</span></Link>
    </nav>
  </main>;
}
