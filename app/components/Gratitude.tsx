"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

export default function Gratitude({ partyId, actorId, members }: { partyId: string; actorId: string; members: Array<{ id: string; displayName: string; imageUrl?: string }> }) {
  const { t } = useLocale();
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
    else setError(data.error || "Transfer failed.");
  }, [partyId, selectedUser, amount, message, load]);

  if (loading) return <div className="party-game-board"><p style={{ color: "var(--gray)" }}>Loading...</p></div>;

  return <div className="party-feature-surface game-board-enter">
    <span className="game-step">{t("gratitudeTitle")}</span>
    <div style={{ background: "var(--dark)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <h4 style={{ marginBottom: 8 }}>{t("gratitudeSend")}</h4>
      <select className="bs-input" value={selectedUser} onChange={(e) => setToUser(e.target.value)} style={{ width: "100%", marginBottom: 8 }}><option value="" disabled>{recipients.length ? t("gratitudeSend") : t("gratitudeEmpty")}</option>{recipients.map((m) => <option key={m.id} value={m.id}>{m.displayName || m.id.slice(0, 8)}</option>)}</select>
      <input className="bs-input" type="number" min={1} aria-label={t("gratitudeAmount")} max={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder={t("gratitudeAmount")} style={{ width: "100%", marginBottom: 8 }} />
      <input className="bs-input" aria-label={t("gratitudeMessage")} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("gratitudeMessage")} style={{ width: "100%", marginBottom: 8 }} />
      <button className="demo-action demo-action--lime" disabled={!selectedUser || amount < 1} onClick={send} type="button">{sent ? t("gratitudeSent") : t("gratitudeSend")}</button>
    </div>
    {error && <p className="feature-error" role="alert">{error}</p>}
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {tips.length === 0 && <p style={{ color: "var(--gray)", textAlign: "center", padding: 10 }}>{t("gratitudeEmpty")}</p>}
      {tips.map((tip) => <div key={tip.id} style={{ background: "var(--dark)", borderRadius: 8, padding: 8 }}>
        <p style={{ fontWeight: 700 }}>{tip.fromName || tip.fromUser.slice(0, 8)} → {tip.toName || tip.toUser.slice(0, 8)} <span style={{ color: "var(--lime)" }}>+{tip.amount} KOINS</span></p>
        {tip.message && <p style={{ color: "var(--gray)", fontSize: 12 }}>{tip.message}</p>}
      </div>)}
    </div>
  </div>;
}
