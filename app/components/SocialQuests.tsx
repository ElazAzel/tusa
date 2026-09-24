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
  const [error, setError] = useState("");
  const labels = QUEST_LABELS[locale] || QUEST_LABELS.en;

  const load = useCallback(() => {
    fetch(`/api/quests?partyId=${partyId}`).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not load quests.");
      setQuests(Array.isArray(data.progress) ? data.progress : []);
      setError("");
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load quests.")).finally(() => setLoading(false));
  }, [partyId]);

  useEffect(() => { load(); }, [load]);

  const claim = useCallback(async (questId: string) => {
    const res = await fetch("/api/quests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "claim", questId, partyId }) });
    if (res.ok) load();
  }, [partyId, load]);

  if (loading) return <div className="party-game-board"><p style={{ color: "var(--gray)" }}>Loading...</p></div>;

  return <div className="party-feature-surface game-board-enter">
    <span className="game-step">{t("questsTitle")}</span>
    {error && <p className="feature-error" role="alert">{error}</p>}
    <div className="party-feature-list">
      {!error && quests.length === 0 && <div className="party-feature-empty"><span className="material-symbols-rounded">task_alt</span><strong>{locale === "ru" ? "Задания появятся после следующего действия в тусе" : "Quests will appear after your next party action"}</strong></div>}
      {quests.map((q) => {
        const done = q.progress >= q.target;
        return <div className="quest-card" key={q.id}>
          <div className="quest-head">
            <span className="material-symbols-rounded" aria-hidden="true">{q.icon}</span>
            <div><p className="quest-title">{labels[q.titleKey] || q.titleKey}</p><p className="quest-desc">{labels[q.descKey] || q.descKey}</p></div>
          </div>
          <div className="quest-progress"><span className={done ? "is-done" : ""} style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} /></div>
          <div className="quest-foot">
            <span>{q.progress}/{q.target} · +{q.rewardKoins} KOINS · +{q.rewardXp} XP</span>
            {done && !q.claimed && <button className="demo-action demo-action--lime" onClick={() => claim(q.id)} type="button">{t("questClaim")}</button>}
            {q.claimed && <b>{t("questClaimed")}</b>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
