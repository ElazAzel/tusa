"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePlatform } from "../PlatformContext";
import { Icon } from "./Icon";
import { useLocale } from "@/app/components/LocaleProvider";

const badgeFamilies = ["Организатор", "Игрок", "Хроникёр", "Казначей", "Душа компании", "Пунктуальный", "Командный", "Исследователь", "Мемолог", "Голос вечера"];
const badgeCatalogue = Array.from({ length: 60 }, (_, index) => ({ id: `badge_${index + 1}`, name: `${badgeFamilies[index % badgeFamilies.length]} · ${Math.floor(index / badgeFamilies.length) + 1}`, threshold: (index + 1) * 120 }));

function leagueFor(xp: number) {
  if (xp >= 3000) return { name: "Neon Legend", next: 5000, icon: "diamond" };
  if (xp >= 1800) return { name: "Platinum Crew", next: 3000, icon: "workspace_premium" };
  if (xp >= 1000) return { name: "Gold Vibe", next: 1800, icon: "military_tech" };
  if (xp >= 500) return { name: "Silver Squad", next: 1000, icon: "shield" };
  return { name: "Fresh Lime", next: 500, icon: "eco" };
}

export function ProfileHub() {
  const { state, event, updateProfile, notify } = usePlatform();
  const { t } = useLocale();
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [editing, setEditing] = useState(false);
  const league = leagueFor(state.profile.xp);
  const progress = Math.min(100, (state.profile.xp / league.next) * 100);

  const unlockedBadgeIds = useMemo(() => new Set(badgeCatalogue.filter((badge) => state.profile.xp >= badge.threshold).map((badge) => badge.id)), [state.profile.xp]);
  const attendance = state.events.filter((item) => item.participants.some((person) => person.id === state.profile.id && person.rsvp === "going")).length;
  const played = state.events.reduce((sum, item) => sum + item.gameHistory.length, 0);
  const photos = state.events.reduce((sum, item) => sum + item.photos.length, 0);

  function saveProfile(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = new FormData(formEvent.currentTarget);
    updateProfile((profile) => ({ ...profile, name: String(form.get("name") || profile.name).trim(), city: String(form.get("city") || profile.city).trim(), bio: String(form.get("bio") || "").trim(), compashka: String(form.get("compashka") || "").trim() }));
    setEditing(false);
    notify(t("profileSavedToast"));
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      notify(t("profileNoPush"));
      return;
    }
    const permission = await Notification.requestPermission();
    notify(permission === "granted" ? t("profilePushGranted") : t("profilePushDenied"));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tusa-game-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
    notify(t("profileDataExported"));
  }

  return (
    <section className="demo-tab-panel profile-panel">
      <div className="profile-hero">
        <div className={`profile-avatar frame-${state.profile.frame}`}>{state.profile.name.slice(0, 2).toUpperCase()}</div>
        <div><span>{t("profileHero")}</span><h2>{state.profile.name}</h2><p>{state.profile.bio}</p><div className="profile-meta"><b><Icon name="location_on" /> {state.profile.city}</b><b><Icon name="groups" /> {state.profile.compashka || t("profileNoCompashka")}</b></div></div>
        <button className="demo-action demo-action--white" onClick={() => setEditing(true)} type="button"><Icon name="edit" /> {t("profileEdit")}</button>
      </div>

      <div className="profile-stats">
        <article><Icon name="auto_awesome" /><strong>{state.profile.xp}</strong><span>{t("profileVibeScore")}</span></article>
        <article><Icon name="local_fire_department" /><strong>{state.profile.streak}</strong><span>{t("profileStreak")}</span></article>
        <article><Icon name="event_available" /><strong>{attendance}</strong><span>{t("profileEvents")}</span></article>
        <article><Icon name="sports_esports" /><strong>{played}</strong><span>{t("profileGames")}</span></article>
        <article><Icon name="photo_camera" /><strong>{photos}</strong><span>{t("profilePhotos")}</span></article>
      </div>

      <div className="profile-grid">
        <section className="league-card">
          <div><span>{t("profileLeague")}</span><h3>{league.name}</h3><p>{t("profileNextLevel")}{Math.max(0, league.next - state.profile.xp)} {t("profileNextXp")}</p></div><Icon name={league.icon} />
          <div className="league-progress"><span style={{ width: `${progress}%` }} /></div>
        </section>
        <section className="frame-card"><div><span>{t("profileFrameTitle")}</span><h3>{t("profileFrameSub")}</h3></div><div>{(["lime", "pink", "blue"] as const).map((frame) => <button aria-label={frame === "lime" ? t("profileFrameLime") : frame === "pink" ? t("profileFramePink") : t("profileFrameBlue")} className={`${frame} ${state.profile.frame === frame ? "active" : ""}`} key={frame} onClick={() => updateProfile((profile) => ({ ...profile, frame }))} type="button"><Icon name="check" /></button>)}</div></section>
      </div>

      <section className="badges-section">
        <div className="profile-section-head"><div><span>{t("profileBadges")}</span><h3>{t("profileBadgesSub")}</h3></div><button onClick={() => setShowAllBadges((value) => !value)} type="button">{showAllBadges ? t("profileCollapse") : t("profileShowAll")}</button></div>
        <div className="badge-grid">{badgeCatalogue.slice(0, showAllBadges ? badgeCatalogue.length : 12).map((badge) => <article className={unlockedBadgeIds.has(badge.id) ? "unlocked" : "locked"} key={badge.id}><Icon name={unlockedBadgeIds.has(badge.id) ? "verified" : "lock"} /><strong>{badge.name}</strong><span>{unlockedBadgeIds.has(badge.id) ? t("profileUnlocked") : `${badge.threshold} ${t("profileLocked")}`}</span></article>)}</div>
      </section>

      <section className="event-history-section">
        <div className="profile-section-head"><div><span>{t("profileHistory")}</span><h3>{t("profileHistorySub")}</h3></div><span>{state.events.length}</span></div>
        <div>{state.events.map((item) => <article className={item.id === event.id ? "active" : ""} key={item.id}><span>{item.date}</span><div><strong>{item.title}</strong><small>{item.venue} · {item.participants.length} {t("profileParticipants")}</small></div><Icon name={item.id === event.id ? "radio_button_checked" : "event"} /></article>)}</div>
      </section>

      <section className="profile-actions-card"><div><span>{t("profileSettings")}</span><h3>{t("profileSettingsSub")}</h3><p>{t("profileSettingsDesc")}</p></div><div><button onClick={() => void enableNotifications()} type="button"><Icon name="notifications_active" /> {t("profileEnablePush")}</button><button onClick={exportData} type="button"><Icon name="download" /> {t("profileExportData")}</button></div></section>

      {editing && (
        <div className="demo-modal-backdrop" role="presentation" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) setEditing(false); }}>
          <section aria-modal="true" className="demo-modal profile-edit-modal" role="dialog"><button className="modal-close" aria-label={t("profileEditClose")} onClick={() => setEditing(false)} type="button"><Icon name="close" /></button><span className="demo-kicker">{t("profileEditTitle")}</span><h2>{t("profileEditSub")}</h2><form onSubmit={saveProfile}><label>{t("profileEditName")}<input defaultValue={state.profile.name} name="name" required /></label><label>{t("profileEditCity")}<input defaultValue={state.profile.city} name="city" /></label><label>{t("profileEditBio")}<textarea defaultValue={state.profile.bio} name="bio" /></label><label>{t("profileEditCompashka")}<input defaultValue={state.profile.compashka} name="compashka" placeholder={t("profileEditCompashkaPlace")} /></label><button className="demo-action demo-action--lime" type="submit"><Icon name="save" /> {t("profileEditSave")}</button></form></section>
        </div>
      )}
    </section>
  );
}
