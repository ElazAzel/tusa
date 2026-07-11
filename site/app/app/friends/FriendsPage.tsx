"use client";

import Link from "next/link";
import { useState } from "react";
import type { UserProfile, FriendConnection } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";

function Icon({ name }: { name: string }) { return <span className="material-symbols-rounded" aria-hidden="true">{name}</span>; }
function haptic(ms = 10) { try { navigator.vibrate?.(ms); } catch {} }

export default function FriendsPage({ profile, friends: initialFriends, requests: initialRequests }: { profile: UserProfile; friends: FriendConnection[]; requests: FriendConnection[] }) {
  const { t } = useLocale();
  const [friends, setFriends] = useState(initialFriends);
  const [requests, setRequests] = useState(initialRequests);
  const [handle, setHandle] = useState("");
  const [error, setError] = useState("");

  async function addFriend() {
    if (!handle.trim()) return;
    haptic(15);
    setError("");
    try {
      const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", targetId: handle.trim() }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); return; }
      setHandle("");
    } catch { setError("Network error"); }
  }

  async function respond(requesterId: string, accept: boolean) {
    haptic(15);
    const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "respond", requesterId, accept }) });
    if (res.ok) {
      setRequests((r) => r.filter((req) => req.requesterId !== requesterId));
      if (accept) window.location.reload();
    }
  }

  async function remove(friendId: string) {
    haptic(15);
    const res = await fetch("/api/friends", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendId }) });
    if (res.ok) setFriends((f) => f.filter((fr) => fr.requesterId !== friendId && fr.targetId !== friendId));
  }

  return <main className="user-app-page">
    <header className="user-app-header">
      <Link href="/app" className="user-app-brand">TUSA<span>.game</span></Link>
      <nav>
        <Link href="/app">{t("dashMy")}</Link>
        <Link href="/app/leaderboard">{t("leaderboardTitle")}</Link>
        <Link href="/app/profile">{t("profile")}</Link>
      </nav>
    </header>
    <div className="friends-page">
      <h1>{t("friendsTitle")}</h1>
      <div className="friend-add-form">
        <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={t("friendsAddPlace")} />
        <button onClick={addFriend}><Icon name="person_add" />{t("friendsAdd")}</button>
      </div>
      {error && <p className="error-msg">{error}</p>}
      {requests.length > 0 && <section>
        <h2>{t("friendsRequests")} ({requests.length})</h2>
        <div className="friend-list">
          {requests.map((req) => <div className="friend-card" key={req.requesterId}>
            <img src={req.imageUrl || "/brand/tusa-game-icon.png"} alt="" />
            <span>{req.displayName}</span>
            <span className="friend-handle">@{req.requesterId}</span>
            <div className="friend-actions">
              <button className="btn-primary" onClick={() => respond(req.requesterId, true)}>{t("friendsAccept")}</button>
              <button className="btn-secondary" onClick={() => respond(req.requesterId, false)}>{t("friendsDecline")}</button>
            </div>
          </div>)}
        </div>
      </section>}
      <section>
        <h2>{t("friendsTitle")} ({friends.length})</h2>
        {friends.length === 0 ? <p className="empty-state">{t("friendsEmpty")}</p> : <div className="friend-list">
          {friends.map((fr) => <div className="friend-card" key={`${fr.requesterId}-${fr.targetId}`}>
            <img src={fr.imageUrl || "/brand/tusa-game-icon.png"} alt="" />
            <span>{fr.displayName}</span>
            <span className="friend-handle">@{fr.requesterId === profile.id ? fr.targetId : fr.requesterId}</span>
            <button className="btn-danger" onClick={() => remove(fr.requesterId === profile.id ? fr.targetId : fr.requesterId)}>{t("friendsRemove")}</button>
          </div>)}
        </div>}
      </section>
    </div>
    <nav className="mobile-bottom-nav">
      <Link href="/app"><Icon name="home" /><span>Home</span></Link>
      <Link href="/app/friends" className="active"><Icon name="group" /><span>{t("friendsTitle")}</span></Link>
      <Link href="/app/leaderboard"><Icon name="leaderboard" /><span>{t("leaderboardTitle")}</span></Link>
      <Link href="/app/profile"><Icon name="person" /><span>{t("profile")}</span></Link>
    </nav>
  </main>;
}
