"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Party, PromoBenefit, PromoRedemption, UserProfile } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import ProductHeader from "@/app/components/ProductHeader";
import { soundTap, soundSuccess } from "@/lib/audio";
import CosmeticsCustomizer from "./CosmeticsCustomizer";

const badgeFamilies = ["Организатор", "Игрок", "Хроникёр", "Казначей", "Душа компании", "Пунктуальный", "Командный", "Исследователь", "Мемолог", "Голос вечера"];
const badgeCatalogue = Array.from({ length: 60 }, (_, index) => ({ id: `badge_${index + 1}`, name: `${badgeFamilies[index % badgeFamilies.length]} \u00b7 ${Math.floor(index / badgeFamilies.length) + 1}`, threshold: (index + 1) * 120 }));

const benefitIcons: Record<string, string> = { beta_access: "vpn_key", profile_cover: "wallpaper", avatar_frame: "frame_person", chat_effect: "auto_awesome", chat_background: "format_color_fill", name_color: "palette", badge: "verified", xp_multiplier: "trending_up", party_creation: "add_box" };
const benefitLabels: Record<string, { ru: string; en: string }> = { beta_access: { ru: "Бета-доступ", en: "Beta access" }, profile_cover: { ru: "Обложка", en: "Cover" }, avatar_frame: { ru: "Рамка профиля", en: "Avatar frame" }, chat_effect: { ru: "Эффект чата", en: "Chat effect" }, chat_background: { ru: "Фон чата", en: "Chat background" }, name_color: { ru: "Цвет имени", en: "Name color" }, badge: { ru: "Ачивка", en: "Badge" }, xp_multiplier: { ru: "XP-множитель", en: "XP multiplier" }, party_creation: { ru: "Создание тус", en: "Party creation" } };

const frameStyles: Record<string, { border: string; shadow: string; label: string }> = {
  lime:  { border: "#c9ff05", shadow: "0 0 12px #c9ff05", label: "Lime" },
  pink:  { border: "#ff1791", shadow: "0 0 12px #ff1791", label: "Pink" },
  blue:  { border: "#2196f3", shadow: "0 0 12px #2196f3", label: "Blue" },
  neon:  { border: "#b829ff", shadow: "0 0 12px #b829ff", label: "Neon" },
  none:  { border: "transparent", shadow: "none", label: "None" },
};

function haptic(ms = 10) { try { navigator.vibrate?.(ms); } catch {} soundTap(); }

function leagueFor(xp: number) {
  if (xp >= 3000) return { name: "Neon Legend", next: 5000, icon: "diamond" };
  if (xp >= 1800) return { name: "Platinum Crew", next: 3000, icon: "workspace_premium" };
  if (xp >= 1000) return { name: "Gold Vibe", next: 1800, icon: "military_tech" };
  if (xp >= 500) return { name: "Silver Squad", next: 1000, icon: "shield" };
  return { name: "Fresh Lime", next: 500, icon: "eco" };
}

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-rounded" aria-hidden="true">{name}</span>;
}

export default function ProfileEditor({ profile, parties }: { profile: UserProfile; parties: Party[] }) {
  const [avatarUrl, setAvatarUrl] = useState(profile.imageUrl);
  const [avatarError, setAvatarError] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [gameStats, setGameStats] = useState({ gamesPlayed: 0, totalScore: 0 });
  const [redemptions, setRedemptions] = useState<PromoRedemption[]>([]);
  const { t, locale } = useLocale();
  const unlocked = profile.cosmetics.unlocked;
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [frameSaving, setFrameSaving] = useState("");

  useEffect(() => {
    fetch("/api/user/stats").then((r) => r.json()).then((d) => { if (d.stats) setGameStats(d.stats); }).catch(() => undefined);
    fetch("/api/promos/redeem").then((r) => r.json()).then((d) => { if (d.redemptions) setRedemptions(d.redemptions); }).catch(() => undefined);
  }, []);

  const league = leagueFor(profile.xp);
  const progress = Math.min(100, (profile.xp / league.next) * 100);
  const unlockedBadgeIds = useMemo(() => new Set(badgeCatalogue.filter((b) => profile.xp >= b.threshold).map((b) => b.id)), [profile.xp]);
  const attendance = parties.length;
  const perkName = (b: PromoBenefit) => benefitLabels[b.type]?.[locale] ?? b.type;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    haptic();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (response.ok) { setSaved(true); setError(""); soundSuccess(); setTimeout(() => setSaved(false), 2000); }
    else setError((await response.json()).error);
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setAvatarError("Выбери изображение до 5 МБ."); return; }
    setAvatarError("");
    try { const imageUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }); const response = await fetch("/api/profile", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ displayName:profile.displayName, handle:profile.handle, city:profile.city, bio:profile.bio, imageUrl }) }); if (!response.ok) throw new Error(); setAvatarUrl(imageUrl); }
    catch { setAvatarError("Не получилось загрузить аватар. Попробуй другое изображение."); }
  }

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    haptic();
    setPromoMessage("");
    const response = await fetch("/api/promos/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promo }) });
    const data = await response.json();
    if (response.ok) { setPromoMessage(t("profileRedeeming")); window.setTimeout(() => window.location.reload(), 700); }
    else setPromoMessage(data.error);
  }

  async function enableNotifications() {
    haptic();
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
  }

  function exportData() {
    haptic();
    const blob = new Blob([JSON.stringify({ profile, parties, redemptions }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "tusa-game-data.json"; a.click(); URL.revokeObjectURL(url);
  }

  const badgeGrid = [...badgeCatalogue].slice(0, showAllBadges ? Infinity : 10);

  async function handleCosmeticsSave(cosmetics: Record<string, string>) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: profile.displayName,
        handle: profile.handle,
        city: profile.city,
        bio: profile.bio,
        ...cosmetics,
      }),
    });
    if (res.ok) {
      setShowCustomizer(false);
      window.location.reload();
    } else {
      const err = await res.json();
      throw new Error(err.error || "Failed to save");
    }
  }

  async function selectFrame(frame: string) {
    if (frameSaving || frame === profile.cosmetics.avatarFrame) return;
    haptic();
    setFrameSaving(frame);
    try { await handleCosmeticsSave({ avatarFrame: frame }); }
    catch { setFrameSaving(""); }
  }

  return (
    <main className="profile-editor-page">
      <ProductHeader backHref="/app" backLabel={t("backToParties")} />

      <div className="profile-editor-layout">
        <div>
          {/* ── Hero ── */}
          <div className={`profile-hero profile-cover-${profile.cosmetics.cover}`}>
            <div className={`profile-avatar frame-${profile.cosmetics.avatarFrame}`}>
              {avatarUrl ? <img className="profile-avatar-image" src={avatarUrl} alt="" /> : profile.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span>{t("profileHero")}</span>
              <h2 className={`profile-name-color-${profile.cosmetics.nameColor.startsWith("animated_") ? profile.cosmetics.nameColor : "static"}`} style={profile.cosmetics.nameColor !== "#000000" && !profile.cosmetics.nameColor.startsWith("animated_") ? { color: profile.cosmetics.nameColor } : undefined}>{profile.cosmetics.badge !== "newcomer" && <span className="material-symbols-rounded" style={{ fontSize: 20, color: "var(--lime)", verticalAlign: "middle", marginRight: 4 }}>verified</span>}{profile.displayName}</h2>
              <p>{profile.bio}</p>
              <div className="profile-meta">
                <b><Icon name="location_on" /> {profile.city || "\u2014"}</b>
                <b><Icon name="groups" /> {profile.compashka || t("profileNoCompashka")}</b>
              </div>
            </div>
          </div>

          {/* ── Stats (interactive) ── */}
          <div className="profile-stats">
            {[
              { icon: "auto_awesome", val: profile.xp, label: t("profileVibeScore") },
              { icon: "local_fire_department", val: 0, label: t("profileStreak") },
              { icon: "event_available", val: attendance, label: t("profileEvents") },
              { icon: "sports_esports", val: gameStats.gamesPlayed, label: t("profileGames") },
              { icon: "emoji_events", val: gameStats.totalScore, label: "Score" },
            ].map((s) => (
              <article key={s.label} className="stat-card" onClick={() => haptic()}>
                <Icon name={s.icon} />
                <strong>{s.val}</strong>
                <span>{s.label}</span>
              </article>
            ))}
          </div>

          <div className="profile-grid">
            {/* ── League (pulsing at >80 %) ── */}
            <section className="league-card">
              <div>
                <span>{t("profileLeague")}</span>
                <h3>{league.name}</h3>
                <p>{t("profileNextLevel")}{Math.max(0, league.next - profile.xp)} {t("profileNextXp")}</p>
              </div>
              <Icon name={league.icon} />
              <div className={`league-progress${progress > 80 ? " near-complete" : ""}`}>
                <span style={{ width: `${progress}%` }} />
              </div>
            </section>

            {/* ── Frame picker (visual preview) ── */}
            <section className="frame-card">
              <div>
                <span>{t("profileFrameTitle")}</span>
                <h3>{t("profileFrameSub")}</h3>
              </div>
              <div className="frame-preview-row">
                {(["none", "lime", "pink", "blue", "neon"] as const).map((frame) => {
                  const fs = frameStyles[frame];
                  const active = profile.cosmetics.avatarFrame === frame;
                  const locked = frame !== "none" && !unlocked.includes("avatar_frame");
                  return (
                    <button
                      key={frame}
                      type="button"
                      aria-label={t(frame === "none" ? "profileNoFrame" : `profileFrame${frame.charAt(0).toUpperCase() + frame.slice(1)}` as never)}
                      className={`frame-option ${active ? "active" : ""} ${locked ? "locked" : ""}`}
                      onClick={() => { if (!locked) void selectFrame(frame); }}
                      disabled={locked || Boolean(frameSaving)}
                      style={{
                        borderColor: active ? fs.border : "transparent",
                        boxShadow: active ? fs.shadow : "none",
                      }}
                    >
                      <span className="frame-ring" style={{ borderColor: fs.border }} />
                      <span className="frame-label">{fs.label}</span>
                      {locked && <Icon name="lock" />}
                      {frameSaving === frame && <Icon name="progress_activity" />}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Badges ── */}
          <section className="badge-section">
            <span className="admin-kicker">{t("profileXp")}</span>
            <h2>{t("profileBadgeTitle")}</h2>
            <div className="badge-grid">
              {badgeGrid.map((badge, index) => (
                <article
                  className={`badge-card ${unlockedBadgeIds.has(badge.id) ? "is-unlocked" : "is-locked"}`}
                  key={badge.id}
                  style={{ animationDelay: `${(index % 12) * 40}ms` }}
                >
                  <span className="material-symbols-rounded">
                    {unlockedBadgeIds.has(badge.id) ? "emoji_events" : "lock"}
                  </span>
                  <strong>{badge.name}</strong>
                </article>
              ))}
            </div>
            {badgeCatalogue.length > 10 && (
              <button className="admin-text-button" onClick={() => { haptic(); setShowAllBadges(!showAllBadges); }}>
                {showAllBadges ? "Свернуть" : `Показать все (${badgeCatalogue.length})`}
              </button>
            )}
          </section>

          {/* ── Promo redeem ── */}
          <section className="promo-redeem-card">
            <Icon name="redeem" />
            <h2>{t("profileRewards")}</h2>
            <p>{t("profileCodeText")}</p>
            <form onSubmit={redeem}>
              <input name="code" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="ELAZ" autoCapitalize="characters" maxLength={32} required />
              <button type="submit">{t("profileActivate")}</button>
            </form>
            {promoMessage && <p className="promo-status" role="status">{promoMessage}</p>}
            {redemptions.length > 0 && (
              <div className="profile-perks">
                <span className="perks-title"><Icon name="emoji_events" /> {t("profileMyPerks")}</span>
                {(() => {
                  const all = new Map<string, PromoBenefit>();
                  redemptions.forEach((r) => r.benefits.forEach((b) => all.set(b.type, b)));
                  return [...all.values()];
                })().map((b) => (
                  <span key={b.type} className="perk-chip">
                    <Icon name={benefitIcons[b.type] || "check_circle"} />
                    {perkName(b)}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── Profile editor form ── */}
          <section className="profile-editor-card">
            <form onSubmit={submit}>
              <label className="avatar-upload"><span className={`profile-avatar frame-${profile.cosmetics.avatarFrame}`} style={{ width: 82, height: 82, fontSize: 24 }}>{avatarUrl ? <img className="profile-avatar-image" src={avatarUrl} alt="" /> : profile.displayName.slice(0, 2).toUpperCase()}</span><input accept="image/*" aria-label="Загрузить аватар" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file); }} type="file" /><b>Загрузить аватар</b></label>{avatarError && <p className="form-error">{avatarError}</p>}
              <h1>{t("profileTitle")}</h1>

              <label>{t("profileName")}
                <input name="displayName" defaultValue={profile.displayName} required maxLength={80} />
              </label>
              <label>{t("profileHandle")}
                <input name="handle" defaultValue={profile.handle} required minLength={3} maxLength={24} />
              </label>
              <label>{t("profileCity")}
                <input name="city" defaultValue={profile.city} maxLength={80} />
              </label>
              <label>{t("profileBio")}
                <textarea name="bio" defaultValue={profile.bio} maxLength={300} />
              </label>

              <div className="cosmetic-controls">
                <legend>{t("profileStyle")}</legend>
                <div className="cosmetics-quick-view">
                  <div className="cosmetics-quick-avatars">
                    <div className={`profile-avatar frame-${profile.cosmetics.avatarFrame !== "none" ? profile.cosmetics.avatarFrame : "lime"}`} style={{ width: 60, height: 60, fontSize: 20, borderWidth: 4 }}>
                      {avatarUrl ? <img className="profile-avatar-image" src={avatarUrl} alt="" /> : profile.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="cosmetics-quick-info">
                    <span style={profile.cosmetics.nameColor !== "#000000" ? { color: profile.cosmetics.nameColor, fontWeight: 900 } : { fontWeight: 900 }}>
                      {profile.cosmetics.badge !== "newcomer" && <span className="material-symbols-rounded" style={{ fontSize: 16, color: "var(--lime)", verticalAlign: "middle", marginRight: 3 }}>verified</span>}
                      {profile.displayName}
                    </span>
                    <span className="cosmetics-quick-items">
                      {profile.cosmetics.cover} · {profile.cosmetics.avatarFrame} · {profile.cosmetics.chatEffect} · {profile.cosmetics.chatBackground}
                    </span>
                  </div>
                </div>
                <button type="button" className="admin-button" onClick={() => { soundTap(); setShowCustomizer(true); }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>palette</span>
                  {t("profileCustomize")}
                </button>
              </div>

              <button type="submit" disabled={saved} className={saved ? "saved-transition" : ""}>
                {saved ? t("profileSaved") : t("profileSave")}
              </button>
              {error && <p className="form-error">{error}</p>}
            </form>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <div>
          <section className="promo-redeem-card">
            <Icon name="notifications" />
            <h2>{t("profileSettings")}</h2>
            <p>{t("profileSettingsDesc")}</p>
            <button onClick={enableNotifications}>{t("profileEnablePush")}</button>
            <button onClick={exportData} className="export-link">{t("profileExportData")}</button>
          </section>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav">
        <Link href="/app" onClick={() => haptic()}>
          <Icon name="home" /><span>Home</span>
        </Link>
        <Link href="/app/friends" onClick={() => haptic()}>
          <Icon name="group" /><span>Friends</span>
        </Link>
        <Link href="/app/leaderboard" onClick={() => haptic()}>
          <Icon name="leaderboard" /><span>Top</span>
        </Link>
        <Link href="/app/profile" className="active" onClick={() => haptic()}>
          <Icon name="person" /><span>Profile</span>
        </Link>
      </nav>

      {showCustomizer && (
        <CosmeticsCustomizer
          profileCosmetics={profile.cosmetics}
          onSave={handleCosmeticsSave}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </main>
  );
}
