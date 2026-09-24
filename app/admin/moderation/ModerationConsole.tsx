"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SafetyReport } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";

export default function ModerationConsole({ initialReports, canModerate }: { initialReports: SafetyReport[]; canModerate: boolean }) {
  const { locale } = useLocale();
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState("queue");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const visible = useMemo(() => filter === "queue" ? reports.filter((report) => ["open", "appealed", "reviewing"].includes(report.status)) : reports.filter((report) => report.status === filter), [filter, reports]);

  async function act(reportId: string, action: "review" | "dismiss" | "remove_content" | "warn" | "suspend" | "restore") {
    setBusy(reportId);
    setNotice("");
    const response = await fetch("/api/admin/moderation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId, action, note: "Handled in moderation console" }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.report) setReports((current) => current.map((report) => report.id === reportId ? data.report : report));
    else setNotice(data.error || "Moderation action failed");
    setBusy("");
  }

  return <main className="admin-page moderation-page">
    <header className="admin-header"><Link href="/admin" className="admin-brand">TUSA<span>.game</span></Link><div className="admin-nav"><Link href="/admin">{locale === "ru" ? "Панель" : "Dashboard"}</Link></div></header>
    <section className="admin-hero"><div><span className="admin-kicker">SAFETY · LIVE QUEUE</span><h1>{locale === "ru" ? "Модерация" : "Moderation"}</h1><p>{locale === "ru" ? "Жалобы, решения и апелляции в одном журнале." : "Reports, decisions and appeals in one audit trail."}</p></div><div className="admin-capacity-card"><span>{locale === "ru" ? "В очереди" : "Queue"}</span><strong>{reports.filter((report) => ["open", "appealed", "reviewing"].includes(report.status)).length}</strong></div></section>
    <div className="moderation-filters" role="tablist">{["queue", "actioned", "dismissed"].map((status) => <button aria-selected={filter === status} className={filter === status ? "active" : ""} key={status} onClick={() => setFilter(status)} role="tab" type="button">{status}</button>)}</div>
    {notice && <p className="admin-notice" role="alert">{notice}</p>}
    <section className="moderation-list">{visible.length ? visible.map((report) => <article className="moderation-card" key={report.id}>
      <div><span className={`moderation-status moderation-status--${report.status}`}>{report.status}</span><strong>{report.reason}</strong><small>{report.targetType} · {report.targetId.slice(0, 16)}</small></div>
      <p>{report.details || (locale === "ru" ? "Без комментария" : "No additional details")}</p>
      <dl><div><dt>{locale === "ru" ? "Комната" : "Party"}</dt><dd>{report.partyId.slice(0, 12)}</dd></div><div><dt>{locale === "ru" ? "Создана" : "Created"}</dt><dd>{new Date(report.createdAt).toLocaleString()}</dd></div></dl>
      {canModerate && <div className="moderation-actions"><button disabled={busy === report.id} onClick={() => void act(report.id, "review")} type="button">{locale === "ru" ? "В работу" : "Review"}</button><button disabled={busy === report.id} onClick={() => void act(report.id, "warn")} type="button">{locale === "ru" ? "Предупредить" : "Warn"}</button><button disabled={busy === report.id} onClick={() => void act(report.id, "suspend")} type="button">{locale === "ru" ? "Заблокировать" : "Suspend"}</button><button disabled={busy === report.id} onClick={() => void act(report.id, "restore")} type="button">{locale === "ru" ? "Снять блокировку" : "Restore"}</button><button disabled={busy === report.id} onClick={() => void act(report.id, "remove_content")} type="button">{locale === "ru" ? "Удалить контент" : "Remove content"}</button><button disabled={busy === report.id} onClick={() => void act(report.id, "dismiss")} type="button">{locale === "ru" ? "Отклонить" : "Dismiss"}</button></div>}
    </article>) : <p className="admin-empty">{locale === "ru" ? "Очередь пуста." : "Queue is empty."}</p>}</section>
  </main>;
}
