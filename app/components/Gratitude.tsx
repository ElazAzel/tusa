"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

export default function Gratitude({ partyId, actorId, members }: { partyId: string; actorId: string; members: Array<{ id: string; displayName: string; imageUrl?: string }> }) {
  const { t, locale } = useLocale();
  const [tips, setTips] = useState<Array<{ id: string; fromUser: string; fromName: string; toUser: string; toName: string; amount: number; message: string; createdAt: string }>>([]);
  const [toUser, setToUser] = useState("");
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const recipients = useMemo(() => members.filter((member) => member.id !== actorId), [actorId, members]);
  const selectedUser = toUser || recipients[0]?.id || "";

  const load = useCallback(() => {
    fetch(`/api/gratitude?partyId=${partyId}`).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not load gratitude.");
      setTips(Array.isArray(data.tips) ? data.tips : []);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load gratitude.")).finally(() => setLoading(false));
  }, [partyId]);

  useEffect(() => { load(); }, [load]);

  const send = useCallback(async () => {
    if (!selectedUser || amount < 1) return;
    setError("");
    const res = await fetch("/api/gratitude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId, toUser: selectedUser, amount, message }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setSent(true); setMessage(""); setTimeout(() => setSent(false), 2000); load(); }
    else setError(data.error || (locale === "ru" ? "Не удалось отправить KOINS." : "Transfer failed."));
  }, [partyId, selectedUser, amount, message, load, locale]);

  if (loading) return <div className="party-game-board"><p className="gratitude-empty">{locale === "ru" ? "Загружаем…" : "Loading…"}</p></div>;

  return <div className="party-feature-surface game-board-enter">
    <span className="game-step">{t("gratitudeTitle")}</span>
    <div className="gratitude-form">
      <h4>{t("gratitudeSend")}</h4>
      <label>{locale === "ru" ? "Кому" : "To"}<select className="bs-input" value={selectedUser} onChange={(e) => setToUser(e.target.value)}><option value="" disabled>{recipients.length ? t("gratitudeSend") : t("gratitudeEmpty")}</option>{recipients.map((m) => <option key={m.id} value={m.id}>{m.displayName || m.id.slice(0, 8)}</option>)}</select></label>
      <label>{t("gratitudeAmount")}, KOINS<input className="bs-input" type="number" min={1} max={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
      <label>{t("gratitudeMessage")}<input className="bs-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={locale === "ru" ? "За что спасибо?" : "What for?"} maxLength={140} /></label>
      <button className="demo-action demo-action--lime" disabled={!selectedUser || amount < 1} onClick={send} type="button">{sent ? t("gratitudeSent") : t("gratitudeSend")}</button>
    </div>
    {error && <p className="feature-error" role="alert">{error}</p>}
    <div className="gratitude-list">
      {tips.length === 0 && <p className="gratitude-empty">{t("gratitudeEmpty")}</p>}
      {tips.map((tip) => <div className="gratitude-item" key={tip.id}>
        <p><b>{tip.fromName || tip.fromUser.slice(0, 8)} → {tip.toName || tip.toUser.slice(0, 8)}</b> <span className="gratitude-amount">+{tip.amount} KOINS</span></p>
        {tip.message && <p className="gratitude-message">{tip.message}</p>}
      </div>)}
    </div>
  </div>;
}
