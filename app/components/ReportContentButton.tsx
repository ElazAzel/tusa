"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

type Props = {
  partyId: string;
  targetType: "chat_message" | "gallery_photo" | "user";
  targetId: string;
  targetUserId?: string;
  onBlocked?: (userId: string) => void;
};

export default function ReportContentButton({ partyId, targetType, targetId, targetUserId, onBlocked }: Props) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/safety/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", partyId, targetType, targetId, reason: data.get("reason"), details: data.get("details") }) });
    setStatus(response.ok ? (locale === "ru" ? "Жалоба отправлена" : "Report sent") : (locale === "ru" ? "Не удалось отправить" : "Report failed"));
    if (response.ok) window.setTimeout(() => setOpen(false), 700);
  }

  async function block() {
    if (!targetUserId) return;
    const response = await fetch("/api/safety/blocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockedUserId: targetUserId, blocked: true }) });
    if (response.ok) {
      onBlocked?.(targetUserId);
      setOpen(false);
    }
  }

  return <div className="report-control">
    <button aria-expanded={open} aria-label={locale === "ru" ? "Безопасность" : "Safety"} className="report-trigger" onClick={() => setOpen((value) => !value)} type="button"><span className="material-symbols-rounded">flag</span></button>
    {open && <form className="report-popover" onSubmit={submit}>
      <strong>{locale === "ru" ? "Что случилось?" : "What happened?"}</strong>
      <select aria-label={locale === "ru" ? "Причина жалобы" : "Report reason"} defaultValue="harassment" name="reason"><option value="spam">Spam</option><option value="harassment">{locale === "ru" ? "Травля" : "Harassment"}</option><option value="hate">{locale === "ru" ? "Ненависть" : "Hate"}</option><option value="sexual">{locale === "ru" ? "Сексуальный контент" : "Sexual content"}</option><option value="violence">{locale === "ru" ? "Насилие" : "Violence"}</option><option value="privacy">{locale === "ru" ? "Приватность" : "Privacy"}</option><option value="other">{locale === "ru" ? "Другое" : "Other"}</option></select>
      <textarea aria-label={locale === "ru" ? "Опиши проблему" : "Describe the problem"} maxLength={500} name="details" placeholder={locale === "ru" ? "Коротко опиши проблему" : "Briefly describe the problem"} />
      <div><button type="submit">{locale === "ru" ? "Отправить" : "Send"}</button>{targetUserId && <button onClick={() => void block()} type="button">{locale === "ru" ? "Скрыть автора" : "Hide author"}</button>}</div>
      {status && <small role="status">{status}</small>}
    </form>}
  </div>;
}
