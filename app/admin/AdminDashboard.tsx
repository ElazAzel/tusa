"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useLocale } from "@/app/components/LocaleProvider";
import type { WaitlistApplication, WaitlistStats, WaitlistStatus } from "@/lib/waitlist";
import type { AdminAccess } from "@/lib/admin-auth";

type AdminUser = { id: string; displayName: string; handle: string; city: string; xp: number; partyCount: number; updatedAt: string };
type AdminParty = { id: string; title: string; date: string; venue: string; ownerName: string; memberCount: number; createdAt: string };

type Props = { access: AdminAccess; initialApplications: WaitlistApplication[]; initialStats: WaitlistStats; initialUsers: AdminUser[]; initialParties: AdminParty[] };

export default function AdminDashboard({ access, initialApplications, initialStats, initialUsers, initialParties }: Props) {
  const firstTab = access.permissions.includes("waitlist_read") ? "waitlist" : access.permissions.includes("users_read") ? "users" : "parties";
  const [tab, setTab] = useState<"waitlist" | "users" | "parties">(firstTab);
  const [applications, setApplications] = useState(initialApplications);
  const [stats, setStats] = useState(initialStats);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WaitlistStatus>("all");
  const [betaOnly, setBetaOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [baseline, setBaseline] = useState(String(initialStats.baseline));
  const [capacity, setCapacity] = useState(String(initialStats.capacity));
  const { t, locale } = useLocale();
  const { signOut } = useClerk();
  const can = (permission: AdminAccess["permissions"][number]) => access.permissions.includes(permission);

  const labels: Record<WaitlistStatus, string> = { new: t("adminStatusNew"), shortlisted: t("adminStatusShortlisted"), invited: t("adminStatusInvited"), rejected: t("adminStatusRejected") };

  const visibleApplications = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applications.filter((item) => {
      const matchesQuery = !normalized || [item.name, item.city, item.contact, item.notes].join(" ").toLowerCase().includes(normalized);
      return matchesQuery && (statusFilter === "all" || item.status === statusFilter) && (!betaOnly || item.beta);
    });
  }, [applications, betaOnly, query, statusFilter]);

  function replaceApplication(next: WaitlistApplication) { setApplications((items) => items.map((item) => item.id === next.id ? next : item)); }

  async function updateApplication(id: string, update: Partial<Pick<WaitlistApplication, "status" | "notes">>) {
    setBusy(id); setMessage("");
    try {
      const response = await fetch("/api/admin/waitlist", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...update }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      replaceApplication(data.application); setStats(data.stats); setMessage(t("adminUpdated"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("adminSaveError")); }
    finally { setBusy(null); }
  }

  async function removeApplication(id: string) {
    if (!window.confirm(t("adminDeleteConfirm"))) return;
    setBusy(id);
    try {
      const response = await fetch("/api/admin/waitlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setApplications((items) => items.filter((item) => item.id !== id)); setStats(data.stats); setMessage(t("adminDeleted"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("adminDeleteError")); }
    finally { setBusy(null); }
  }

  async function saveSettings() {
    setBusy("settings");
    try {
      const response = await fetch("/api/admin/waitlist/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ capacity: Number(capacity), baseline: Number(baseline) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStats(data.stats); setBaseline(String(data.stats.baseline)); setCapacity(String(data.stats.capacity)); setMessage(t("adminSettingsUpdated"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("adminSettingsError")); }
    finally { setBusy(null); }
  }

  async function refresh() {
    setBusy("refresh");
    try {
      const response = await fetch("/api/admin/waitlist", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setApplications(data.applications); setStats(data.stats); setMessage(t("adminRegistryUpdated"));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("adminRegistryError")); }
    finally { setBusy(null); }
  }

  async function logout() { if (access.source === "member") { await signOut({ redirectUrl: "/admin/login" }); return; } await fetch("/api/admin/auth", { method: "DELETE" }); window.location.assign("/admin/login"); }

  return <main className="admin-page">
    <header className="admin-header">
      <Link href="/" className="admin-brand">TUSA<span>.game</span></Link>
      <div className="admin-nav">
        {can("promos_read") && <Link href="/admin/promos" className="admin-text-button">{t("adminPromoNav")}</Link>}
        {can("promos_read") && <Link href="/admin/cosmetics" className="admin-text-button">{locale === "ru" ? "Косметика" : "Cosmetics"}</Link>}
        {can("waitlist_read") && <button className="admin-text-button" onClick={() => setTab("waitlist")}>{t("adminWaitlist")}</button>}
        {can("users_read") && <button className="admin-text-button" onClick={() => setTab("users")}>{t("adminTabUsers")}</button>}
        {can("parties_read") && <button className="admin-text-button" onClick={() => setTab("parties")}>{t("adminTabParties")}</button>}
        {can("team_read") && <Link href="/admin/team" className="admin-text-button">{locale === "ru" ? "Команда" : "Team"}</Link>}
        <span className="admin-role-chip">{access.displayName} · {access.role}</span>
        <button className="admin-text-button" onClick={logout}>{t("adminLogout")}</button>
      </div>
    </header>

    {tab === "waitlist" && can("waitlist_read") && <>
      <section className="admin-hero">
        <div><span className="admin-kicker">{t("adminWaitlist")}</span><h1>{t("adminTitle")}</h1><p>{t("adminLead")}</p></div>
        <div className="admin-capacity-card"><span>{t("adminCapacity")}</span><strong>{stats.total}<small> / {stats.capacity}</small></strong><i><b style={{ width: `${Math.min(100, stats.total / stats.capacity * 100)}%` }} /></i><p>{t("adminRemaining")}{stats.remaining}</p></div>
      </section>
      <section className="admin-metrics" aria-label={t("adminWaitlist")}>
        <article><span>{t("adminBaseline")}</span><strong>{stats.baseline}</strong><small>{t("adminBeforeLaunch")}</small></article>
        <article><span>{t("adminNewApps")}</span><strong>{stats.applications}</strong><small>{stats.statuses.new} {t("adminWaiting")}</small></article>
        <article><span>{t("adminBeta")}</span><strong>{stats.betaApplicants}</strong><small>{t("adminWantEarly")}</small></article>
        <article><span>{t("adminInvited")}</span><strong>{stats.statuses.invited}</strong><small>{t("adminGotAccess")}</small></article>
      </section>
      {can("waitlist_write") && <section className="admin-settings-card">
        <div><span className="admin-kicker">{t("adminWaveSettings")}</span><h2>{t("adminWaveTitle")}</h2></div>
        <label>{t("adminLimit")} <input value={capacity} onChange={(e) => setCapacity(e.target.value)} inputMode="numeric" /></label>
        <label>{t("adminAlreadyIn")} <input value={baseline} onChange={(e) => setBaseline(e.target.value)} inputMode="numeric" /></label>
        <button className="admin-button admin-button--lime" onClick={saveSettings} disabled={busy === "settings"}>{busy === "settings" ? t("adminSaving") : t("adminSave")}</button>
      </section>}
      <section className="admin-toolbar">
        <div className="admin-filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("adminSearch")} aria-label={t("adminSearch")} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | WaitlistStatus)} aria-label={t("adminAllStatuses")}><option value="all">{t("adminAllStatuses")}</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="admin-check"><input checked={betaOnly} onChange={(e) => setBetaOnly(e.target.checked)} type="checkbox" /> {t("adminOnlyBeta")}</label></div>
        <div className="admin-toolbar-actions"><button className="admin-button" onClick={refresh} disabled={busy === "refresh"}>{busy === "refresh" ? t("adminRefreshing") : t("adminRefresh")}</button><a className="admin-button admin-button--dark" href="/api/admin/waitlist/export">{t("adminCsv")}</a></div>
      </section>
      {message && <p className="admin-notice" role="status">{message}</p>}
      <section className="admin-table-card">
        <div className="admin-table-head"><div><span className="admin-kicker">{t("adminRegistry")}</span><h2>{visibleApplications.length}{t("adminFrom")}{applications.length}</h2></div><p>{t("adminContactsHidden")}</p></div>
        <div className="admin-application-list">
          {visibleApplications.length === 0 && <p className="admin-empty">{t("adminEmpty")}</p>}
          {visibleApplications.map((item) => <article className="admin-application" key={item.id}>
            <div className="admin-person"><strong>{item.name}</strong><span>{item.city} · {new Intl.DateTimeFormat("ru-KZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Almaty" }).format(new Date(item.submittedAt))}</span>{item.beta && <b>Бета</b>}</div>
            <a href={item.contact.includes("@") ? `mailto:${item.contact}` : `https://wa.me/${item.contact.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="admin-contact">{item.contact}</a>
            <select className={`admin-status admin-status--${item.status}`} value={item.status} onChange={(e) => updateApplication(item.id, { status: e.target.value as WaitlistStatus })} disabled={busy === item.id || !can("waitlist_write")} aria-label={`${t("adminStatusNew")} ${item.name}`}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <textarea defaultValue={item.notes} readOnly={!can("waitlist_write")} onBlur={(e) => { if (can("waitlist_write") && e.target.value !== item.notes) updateApplication(item.id, { notes: e.target.value }); }} placeholder={t("adminNotePlace")} maxLength={2000} aria-label={`${t("adminNotePlace")} ${item.name}`} />
            {can("waitlist_write") && <button className="admin-delete" onClick={() => removeApplication(item.id)} disabled={busy === item.id} aria-label={`${t("adminDelete")} ${item.name}`}>{t("adminDelete")}</button>}
          </article>)}
        </div>
      </section>
    </>}

    {tab === "users" && can("users_read") && <section className="admin-table-card" style={{ marginTop: 24 }}>
      <div className="admin-table-head"><div><span className="admin-kicker">{t("adminTabUsers")}</span><h2>{initialUsers.length} {t("adminUsersRegistered")}</h2></div></div>
      <div className="admin-application-list">{initialUsers.map((user) => <article className="admin-application" key={user.id}>
        <div className="admin-person"><strong>{user.displayName}</strong><span>@{user.handle} · {user.city || "—"}</span></div>
        <span className="admin-contact">{user.id.slice(0, 12)}…</span>
        <span><b>{user.xp} XP</b> · {user.partyCount} parties</span>
      </article>)}</div>
    </section>}

    {tab === "parties" && can("parties_read") && <section className="admin-table-card" style={{ marginTop: 24 }}>
      <div className="admin-table-head"><div><span className="admin-kicker">{t("adminTabParties")}</span><h2>{initialParties.length} {t("adminPartiesTotal")}</h2></div></div>
      <div className="admin-application-list">{initialParties.map((party) => <article className="admin-application" key={party.id}>
        <div className="admin-person"><strong>{party.title}</strong><span>{party.date} · {party.venue}</span></div>
        <span className="admin-contact">{party.ownerName}</span>
        <span>{party.memberCount} members</span>
      </article>)}</div>
    </section>}
  </main>;
}
