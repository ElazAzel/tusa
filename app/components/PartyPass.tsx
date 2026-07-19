"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

type PassTier = { tier: number; xpRequired: number; rewards: Array<{ type: string; value: string }> };
type PartyPassSeason = { id: string; name: string; startDate: string; endDate: string; tiers: PassTier[]; active: boolean };
type UserPass = { xp: number; tier: number; seasonId: string };

export default function PartyPass() {
  const { t, locale } = useLocale();
  const [season, setSeason] = useState<PartyPassSeason | null>(null);
  const [progress, setProgress] = useState<UserPass>({ xp: 0, tier: 0, seasonId: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pass").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load Party Pass.");
      setSeason(data.season ?? null);
      setProgress(data.progress ?? { xp: 0, tier: 0, seasonId: "" });
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load Party Pass.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="party-feature-surface"><p className="party-feature-loading">Loading...</p></div>;
  if (error) return <div className="party-feature-surface"><span className="game-step">{t("passTitle")}</span><p className="feature-error" role="alert">{error}</p></div>;
  if (!season) return <div className="party-feature-surface"><span className="game-step">{t("passTitle")}</span><div className="party-feature-empty"><span className="material-symbols-rounded">event_busy</span><strong>{locale === "ru" ? "Новый сезон скоро начнётся" : "A new season is coming soon"}</strong><p>{t("partyPassEarnXp")}</p></div></div>;

  const tiers = [...season.tiers].sort((a, b) => a.tier - b.tier);
  const maxTier = tiers.at(-1)?.tier ?? 0;
  const currentTier = tiers.filter((tier) => progress.xp >= tier.xpRequired).length;
  const nextTier = tiers.find((tier) => progress.xp < tier.xpRequired);
  const previousRequirement = tiers.filter((tier) => progress.xp >= tier.xpRequired).at(-1)?.xpRequired ?? 0;
  const nextRequirement = nextTier?.xpRequired ?? previousRequirement;
  const progressPercent = nextTier ? Math.min(100, ((progress.xp - previousRequirement) / Math.max(1, nextRequirement - previousRequirement)) * 100) : 100;

  return <div className="party-feature-surface party-pass-surface game-board-enter">
    <header className="party-pass-head">
      <div><span className="game-step">{t("passSeason")}</span><h3>{season.name}</h3><p>{t("partyPassEarnXp")}</p></div>
      <strong>{currentTier}/{maxTier}</strong>
    </header>
    <div className="party-pass-progress" aria-label={`${progress.xp} XP`}><span style={{ width: `${progressPercent}%` }} /></div>
    <div className="party-pass-meta"><b>{progress.xp} XP</b><span>{nextTier ? `${nextTier.xpRequired - progress.xp} XP` : locale === "ru" ? "Максимальный уровень" : "Max tier"}</span></div>
    <div className="party-pass-tiers">
      {tiers.map((tier) => {
        const unlocked = progress.xp >= tier.xpRequired;
        return <article className={unlocked ? "is-unlocked" : ""} key={tier.tier}>
          <span>{tier.tier}</span>
          <div><strong>{tier.rewards.map((reward) => reward.value).join(", ")}</strong><small>{tier.xpRequired} XP</small></div>
          <span className="material-symbols-rounded">{unlocked ? "check_circle" : "lock"}</span>
        </article>;
      })}
    </div>
  </div>;
}
