"use client";

import { useEffect, useState } from "react";
import type { SafetyReport } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";

export default function SafetyAppeals() {
  const { locale } = useLocale();
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/safety/reports").then((response) => response.json()).then((data) => { if (Array.isArray(data.reports)) setReports(data.reports); }).catch(() => undefined);
  }, []);

  async function appeal(reportId: string) {
    const text = details[reportId]?.trim() ?? "";
    if (text.length < 3) return;
    const response = await fetch("/api/safety/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "appeal", reportId, details: text }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(data.error || (locale === "ru" ? "Не удалось отправить апелляцию." : "Appeal failed.")); return; }
    setReports((current) => current.map((report) => report.id === reportId ? data.report : report));
    setNotice(locale === "ru" ? "Апелляция отправлена." : "Appeal submitted.");
  }

  if (!reports.length) return null;
  return <section className="profile-editor-card safety-appeals-card">
    <span className="admin-kicker">SAFETY</span>
    <h2>{locale === "ru" ? "Решения и апелляции" : "Safety decisions and appeals"}</h2>
    <p>{locale === "ru" ? "Если решение модерации касается твоего аккаунта, здесь можно отправить объяснение на пересмотр." : "If a moderation decision affects your account, you can request a review here."}</p>
    {reports.map((report) => <article key={report.id}>
      <strong>{report.reason}</strong><span>{report.status}</span>
      {report.status === "actioned" ? <><textarea value={details[report.id] ?? ""} onChange={(event) => setDetails((current) => ({ ...current, [report.id]: event.target.value }))} maxLength={500} minLength={3} placeholder={locale === "ru" ? "Почему решение стоит пересмотреть?" : "Why should this decision be reviewed?"} /><button type="button" onClick={() => void appeal(report.id)}>{locale === "ru" ? "Подать апелляцию" : "Submit appeal"}</button></> : <small>{locale === "ru" ? "Апелляция уже в очереди." : "Appeal is already in the review queue."}</small>}
    </article>)}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
