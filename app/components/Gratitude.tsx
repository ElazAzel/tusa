"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

export default function Gratitude({ partyId, members }: { partyId: string; members: Array<{ id: string; displayName: string; imageUrl?: string }> }) {
  const { t } = useLocale();
  const [tips, setTips] = useState<Array<{ id: string; fromUser: string; fromName: string; toUser: string; toName: string; amount: number; message: string; createdAt: string }>>([]);
  const [toUser, setToUser] = useState("");
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`/api/gratitude?partyId=${partyId}`).then((r) => r.json()).then((data) => setTips(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false));
  }, [partyId]);

  useEffect(() => { load(); }, [load]);

  const send = useCallback(async () => {
    if (!toUser || amount < 1) return;
    const res = await fetch("/api/gratitude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId, toUser, amount, message }) });
    if (res.ok) { setSent(true); setMessage(""); setTimeout(() => setSent(false), 2000); load(); }
  }, [partyId, toUser, amount, message, load]);

  if (loading) return <div className="party-game-board"><p style={{ color: "var(--gray)" }}>Loading...</p></div>;

  return <div className="party-game-board game-board-enter">
    <span className="game-step">{t("gratitudeTitle")}</span>
    <div style={{ background: "var(--dark)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <h4 style={{ marginBottom: 8 }}>{t("gratitudeSend")}</h4>
      <select className="bs-input" value={toUser} onChange={(e) => setToUser(e.target.value)} style={{ width: "100%", marginBottom: 8 }}>{members.filter((m) => m.id !== "you").map((m) => <option key={m.id} value={m.id}>{m.displayName || m.id.slice(0, 8)}</option>)}</select>
      <input className="bs-input" type="number" min={1} max={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder={t("gratitudeAmount")} style={{ width: "100%", marginBottom: 8 }} />
      <input className="bs-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("gratitudeMessage")} style={{ width: "100%", marginBottom: 8 }} />
      <button className="demo-action demo-action--lime" disabled={!toUser || amount < 1} onClick={send} type="button">{sent ? t("gratitudeSent") : t("gratitudeSend")}</button>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {tips.length === 0 && <p style={{ color: "var(--gray)", textAlign: "center", padding: 10 }}>{t("gratitudeEmpty")}</p>}
      {tips.map((tip) => <div key={tip.id} style={{ background: "var(--dark)", borderRadius: 8, padding: 8 }}>
        <p style={{ fontWeight: 700 }}>{tip.fromName || tip.fromUser.slice(0, 8)} → {tip.toName || tip.toUser.slice(0, 8)} <span style={{ color: "var(--lime)" }}>+{tip.amount} KOINS</span></p>
        {tip.message && <p style={{ color: "var(--gray)", fontSize: 12 }}>{tip.message}</p>}
      </div>)}
    </div>
  </div>;
}
