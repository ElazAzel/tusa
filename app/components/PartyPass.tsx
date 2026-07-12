"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

type PassTier = { tier: number; xpRequired: number; rewards: Array<{ type: string; value: string }> };
type PartyPassSeason = { id: string; name: string; startDate: string; endDate: string; tiers: PassTier[]; active: boolean };
type UserPass = { xp: number; tier: number; seasonId: string };

export default function PartyPass({ partyId }: { partyId: string }) {
  const { locale, t } = useLocale();
  const [season, setSeason] = useState<PartyPassSeason | null>(null);
  const [progress, setProgress] = useState<UserPass>({ xp: 0, tier: 0, seasonId: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pass").then((r) => r.json()).then((data) => {
      setSeason(data.season ?? null);
      setProgress(data.progress ?? { xp: 0, tier: 0, seasonId: "" });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="party-game-board"><p style={{ color: "var(--gray)" }}>Loading...</p></div>;
  if (!season) return <div className="party-game-board"><h3>{t("passTitle")}</h3><p style={{ color: "var(--gray)" }}>{t("partyPassEarnXp")}</p></div>;

  const maxTier = season.tiers.reduce((m, t) => Math.max(m, t.tier), 0);
  const currentTier = season.tiers.filter((t) => progress.xp >= t.xpRequired).length;
  const nextTier = season.tiers.find((t) => progress.xp < t.xpRequired);

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("passSeason")} {season.name}</span>
    <div style={{ margin: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span>{t("passXp")}: {progress.xp}</span>
        <span>{t("passTier")}: {currentTier}/{maxTier}</span>
      </div>
      {nextTier && <div style={{ background: "var(--dark)", borderRadius: 8, padding: 4 }}>
        <div style={{ height: 12, borderRadius: 6, background: "var(--gray)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (progress.xp / nextTier.xpRequired) * 100)}%`, background: "var(--lime)", borderRadius: 6, transition: "width 0.3s" }} />
        </div>
        <p style={{ color: "var(--gray)", fontSize: 12, marginTop: 4 }}>{t("passNextReward")}: {nextTier.rewards.map((r) => r.value).join(", ")}</p>
      </div>}
      {!nextTier && <p style={{ color: "var(--lime)", fontWeight: 700 }}>Max tier unlocked!</p>}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {season.tiers.sort((a, b) => a.tier - b.tier).map((tier) => {
        const unlocked = progress.xp >= tier.xpRequired;
        return <div key={tier.tier} style={{ display: "flex", alignItems: "center", gap: 12, background: unlocked ? "var(--dark)" : "#1a1a1a", borderRadius: 8, padding: 10, opacity: unlocked ? 1 : 0.5 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: unlocked ? "var(--lime)" : "var(--gray)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: unlocked ? "var(--black)" : "var(--white)" }}>{tier.tier}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700 }}>{unlocked ? t("passClaimed") : t("passLocked")}</p>
            <p style={{ color: "var(--gray)", fontSize: 12 }}>{tier.xpRequired} XP — {tier.rewards.map((r) => r.value).join(", ")}</p>
          </div>
          {unlocked && <span className="material-symbols-rounded" style={{ color: "var(--lime)" }}>check_circle</span>}
        </div>;
      })}
    </div>
    <p style={{ color: "var(--gray)", fontSize: 12, marginTop: 12 }}>{t("partyPassEarnXp")}</p>
  </div>;
}
