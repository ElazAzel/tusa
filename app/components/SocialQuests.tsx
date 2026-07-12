"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

const QUEST_LABELS: Record<string, Record<string, string>> = {
  ru: { questHostParty: "Организуй встречу", questDescHostParty: "Создай вечеринку с 4+ участниками", questPlayGames: "Сыграй в 3 игры", questDescPlayGames: "Проведи 3 разные игры за одну встречу", questWinRounds: "Побеждай в играх", questDescWinRounds: "Побеждай в 5 раундах игр", questThankOthers: "Благодари друзей", questDescThankOthers: "Отправь 3 благодарности" },
  en: { questHostParty: "Host a hangout", questDescHostParty: "Create a party with 4+ members", questPlayGames: "Play 3 games", questDescPlayGames: "Run 3 different games in one session", questWinRounds: "Win rounds", questDescWinRounds: "Win 5 game rounds", questThankOthers: "Thank friends", questDescThankOthers: "Send 3 gratitude tips" },
};

export default function SocialQuests({ partyId }: { partyId: string }) {
  const { locale, t } = useLocale();
  const [quests, setQuests] = useState<Array<{ id: string; titleKey: string; descKey: string; icon: string; progress: number; target: number; rewardKoins: number; rewardXp: number; claimed: boolean; completedAt: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const labels = QUEST_LABELS[locale] || QUEST_LABELS.en;

  const load = useCallback(() => {
    fetch(`/api/quests?partyId=${partyId}`).then((r) => r.json()).then((data) => {
      setQuests(data.progress ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [partyId]);

  useEffect(() => { load(); }, [load]);

  const claim = useCallback(async (questId: string) => {
    const res = await fetch("/api/quests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim", questId, partyId }) });
    if (res.ok) load();
  }, [partyId, load]);

  if (loading) return <div className="party-game-board"><p style={{ color: "var(--gray)" }}>Loading...</p></div>;

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("questsTitle")}</span>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
      {quests.length === 0 && <p style={{ color: "var(--gray)" }}>No quests yet</p>}
      {quests.map((q) => {
        const done = q.progress >= q.target;
        return <div key={q.id} style={{ background: "var(--dark)", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="material-symbols-rounded" style={{ color: "var(--lime)" }}>{q.icon}</span>
            <div><p style={{ fontWeight: 700 }}>{labels[q.titleKey] || q.titleKey}</p><p style={{ color: "var(--gray)", fontSize: 12 }}>{labels[q.descKey] || q.descKey}</p></div>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--gray)", overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${Math.min(100, (q.progress / q.target) * 100)}%`, background: done ? "var(--lime)" : "var(--pink)", borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--gray)", fontSize: 12 }}>{q.progress}/{q.target} — {q.rewardKoins} KOINS +{q.rewardXp} XP</span>
            {done && !q.claimed && <button className="demo-action demo-action--lime" onClick={() => claim(q.id)} type="button" style={{ padding: "4px 12px", fontSize: 12 }}>{t("questClaim")}</button>}
            {q.claimed && <span style={{ color: "var(--lime)", fontSize: 12, fontWeight: 700 }}>{t("questClaimed")}</span>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
