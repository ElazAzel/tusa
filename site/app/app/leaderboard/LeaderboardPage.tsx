"use client";

import Link from "next/link";
import type { UserProfile } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";

function Icon({ name }: { name: string }) { return <span className="material-symbols-rounded" aria-hidden="true">{name}</span>; }

type LeaderEntry = { userId: string; displayName: string; imageUrl: string; xp: number; gamesPlayed: number };

export default function LeaderboardPage({ profile, leaders }: { profile: UserProfile; leaders: LeaderEntry[] }) {
  const { t } = useLocale();
  return <main className="user-app-page"><header className="user-app-header"><Link href="/app" className="user-app-brand">TUSA<span>.game</span></Link><nav><Link href="/app">{t("dashMy")}</Link><Link href="/app/profile">{t("profile")}</Link></nav></header><div className="leaderboard-page"><h1><Icon name="leaderboard" />{t("leaderboardTitle")}</h1><div className="leaderboard-list">{leaders.map((entry, i) => <div className={`leaderboard-row ${entry.userId === profile.id ? "is-me" : ""}`} key={entry.userId}><span className="leaderboard-rank">#{i + 1}</span><img src={entry.imageUrl || "/brand/tusa-game-icon.png"} alt="" /><span className="leaderboard-name">{entry.displayName}{entry.userId === profile.id && <small> ({t("profile")})</small>}</span><span className="leaderboard-stats"><b>{entry.xp}</b> {t("leaderboardXp")} · {entry.gamesPlayed} {t("leaderboardGames")}</span></div>)}</div></div></main>;
}
