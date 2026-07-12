"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

export default function DailyChallenge({ partyId }: { partyId: string }) {
  const { locale, t } = useLocale();
  const [challenge, setChallenge] = useState<{ id: string; game: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ userId: string; displayName: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    fetch("/api/daily?game=trivia").then((r) => r.json()).then((data) => {
      setChallenge(data.challenge ?? null);
      if (data.challenge?.id) fetch(`/api/daily?leaderboard=${data.challenge.id}`).then((r) => r.json()).then((lb) => setLeaderboard(Array.isArray(lb) ? lb : [])).catch(() => {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const play = useCallback(async () => {
    if (!challenge) return;
    const score = Math.floor(Math.random() * 100);
    const res = await fetch("/api/daily", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: challenge.id, score }) });
    if (res.ok) { setPlayed(true); const data = await res.json(); if (data.leaderboard) setLeaderboard(data.leaderboard); }
  }, [challenge]);

  if (loading) return <div className="party-game-board"><p style={{ color: "var(--gray)" }}>Loading...</p></div>;

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("dailyTitle")}</span>
    {challenge && <p style={{ margin: "8px 0" }}>{t("dailyPlay")}: <strong>{challenge.game}</strong></p>}
    {!played && <button className="demo-action demo-action--lime" onClick={play} type="button">{t("dailyPlay")}</button>}
    {played && <p style={{ color: "var(--lime)" }}>{t("dailyPlayed")}!</p>}
    {leaderboard.length > 0 && <div style={{ marginTop: 12 }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>{t("dailyLeaderboard")}</p>
      {leaderboard.map((e, i) => <div key={e.userId} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--dark)" }}>
        <span>#{i + 1} {e.displayName || e.userId.slice(0, 8)}</span>
        <span style={{ color: "var(--lime)" }}>{e.score}</span>
      </div>)}
    </div>}
  </div>;
}
