"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserProfile, FriendConnection, FriendList } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";

function Icon({ name }: { name: string }) { return <span className="material-symbols-rounded" aria-hidden="true">{name}</span>; }
function haptic(ms = 10) { try { navigator.vibrate?.(ms); } catch {} }

export default function FriendsPage({ profile, friends: initialFriends, requests: initialRequests }: { profile: UserProfile; friends: FriendConnection[]; requests: FriendConnection[] }) {
  const { t, locale } = useLocale();
  const [friends, setFriends] = useState(initialFriends);
  const [requests, setRequests] = useState(initialRequests);
  const [handle, setHandle] = useState("");
  const [error, setError] = useState("");
  const [lists, setLists] = useState<FriendList[]>([]);
  const [newListName, setNewListName] = useState("");
  const [activeList, setActiveList] = useState<string | null>(null);

  useEffect(() => { fetch("/api/friend-lists").then((r) => r.json()).then((d) => { if (d.lists) setLists(d.lists); }).catch(() => undefined); }, []);

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

  async function createList() {
    if (!newListName.trim()) return;
    haptic(15);
    const res = await fetch("/api/friend-lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newListName.trim() }) });
    if (res.ok) {
      const data = await res.json();
      if (data.list) setLists((prev) => [...prev, data.list]);
      setNewListName("");
    }
  }

  async function deleteList(listId: string) {
    haptic(15);
    await fetch("/api/friend-lists", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listId }) });
    setLists((prev) => prev.filter((l) => l.id !== listId));
    if (activeList === listId) setActiveList(null);
  }

  async function toggleFriendInList(friendId: string, listId: string, inList: boolean) {
    haptic(15);
    const action = inList ? "remove" : "add";
    const res = await fetch("/api/friend-lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, listId, friendId }) });
    if (res.ok) {
      setLists((prev) => prev.map((l) => l.id === listId ? { ...l, members: inList ? l.members.filter((m) => m !== friendId) : [...l.members, friendId] } : l));
    }
  }

  const friendId = (fr: FriendConnection) => fr.requesterId === profile.id ? fr.targetId : fr.requesterId;
  const friendHandle = (fr: FriendConnection) => fr.requesterId === profile.id ? fr.targetId : fr.requesterId;
  const friendName = (fr: FriendConnection) => fr.displayName;

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
            <div className="friend-info">
              <strong>{req.displayName}</strong>
              <span className="friend-handle">@{req.handle}</span>
            </div>
            <div className="friend-actions">
              <button className="btn-primary" onClick={() => respond(req.requesterId, true)}>{t("friendsAccept")}</button>
              <button className="btn-secondary" onClick={() => respond(req.requesterId, false)}>{t("friendsDecline")}</button>
            </div>
          </div>)}
        </div>
      </section>}

      <section className="friend-lists-section">
        <h2>{t("friendsLists")}</h2>
        <div className="friend-list-create">
          <input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder={t("friendsListPlace")} maxLength={80} />
          <button onClick={createList}><Icon name="playlist_add" />{t("friendsListCreate")}</button>
        </div>
        {lists.length > 0 && <div className="friend-lists-tabs">{lists.map((list) => (
          <button key={list.id} className={`friend-list-tab ${activeList === list.id ? "active" : ""}`} onClick={() => setActiveList(activeList === list.id ? null : list.id)}>
            <Icon name="list" /><span>{list.name} ({list.members.length})</span>
            <span className="list-delete" onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}>&times;</span>
          </button>
        ))}</div>}
        {activeList && <div className="friend-list-members">{friends.filter((fr) => (fr.requesterId === profile.id ? fr.targetId : fr.requesterId) && (activeList ? lists.find((l) => l.id === activeList)?.members.includes(fr.requesterId === profile.id ? fr.targetId : fr.requesterId) : false)).length === 0 && <p className="empty-state">{t("friendsListEmpty")}</p>}
          {friends.filter((fr) => lists.find((l) => l.id === activeList)?.members.includes(friendId(fr))).map((fr) => <div className="friend-card" key={`member-${friendId(fr)}`}>
            <img src={fr.imageUrl || "/brand/tusa-game-icon.png"} alt="" />
            <div className="friend-info">
              <strong>{friendName(fr)}</strong>
              <span className="friend-handle">@{friendHandle(fr)}</span>
            </div>
            <button className="btn-danger" onClick={() => toggleFriendInList(friendId(fr), activeList, true)}>{t("friendsRemove")}</button>
          </div>)}
        </div>}
      </section>

      <section>
        <h2>{t("friendsTitle")} ({friends.length})</h2>
        {friends.length === 0 ? <p className="empty-state">{t("friendsEmpty")}</p> : <div className="friend-list">
          {friends.map((fr) => <div className="friend-card" key={`${fr.requesterId}-${fr.targetId}`}>
            <img src={fr.imageUrl || "/brand/tusa-game-icon.png"} alt="" />
            <div className="friend-info">
              <strong>{friendName(fr)}</strong>
              <span className="friend-handle">@{friendHandle(fr)}</span>
            </div>
            <div className="friend-actions">
              {lists.length > 0 && <div className="friend-list-picker">{lists.map((list) => (
                <label key={list.id} className="friend-list-check">
                  <input type="checkbox" checked={list.members.includes(friendId(fr))} onChange={() => toggleFriendInList(friendId(fr), list.id, list.members.includes(friendId(fr)))} />
                  <span>{list.name}</span>
                </label>
              ))}</div>}
              <button className="btn-danger" onClick={() => remove(friendId(fr))}>{t("friendsRemove")}</button>
            </div>
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
