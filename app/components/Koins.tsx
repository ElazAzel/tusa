"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";
import type { KoinsTransaction, PartyBet } from "@/lib/parties";

type RewardStats = Record<string, { count: number; total: number; daily: number; amount: number }>;

const REWARD_KEYS = ["photo", "chat", "game_play", "game_win", "streak", "friend_add"] as const;

export default function Koins({ partyId }: { partyId: string }) {
  const { t } = useLocale();
  const [bets, setBets] = useState<PartyBet[]>([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<KoinsTransaction[]>([]);
  const [stakes, setStakes] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [rewards, setRewards] = useState<RewardStats>({});

  const loadBets = useCallback(() => {
    fetch(`/api/koins?partyId=${partyId}`).then((r) => r.json()).then((data) => {
      if (data.bets) setBets(data.bets);
    }).catch(() => undefined);
  }, [partyId]);

  function loadBalance() {
    fetch(`/api/koins?action=balance`).then((r) => r.json()).then((data) => {
      if (data.balance !== undefined) setBalance(data.balance);
      if (data.transactions) setTransactions(data.transactions);
    }).catch(() => undefined);
  }

  function loadRewards() {
    fetch("/api/rewards").then((r) => r.json()).then((data) => {
      if (data.stats) setRewards(data.stats);
    }).catch(() => undefined);
  }

  useEffect(() => { loadBets(); loadBalance(); loadRewards(); }, [partyId, loadBets]);

  const activeStake = useMemo(() => bets.filter((b) => b.status === "open").flatMap((b) => b.entries).filter((e) => e.userId === "me").reduce((sum, e) => sum + e.stake, 0), [bets]);

  async function createBetAction(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = String(form.get("text") || "").trim();
    const first = String(form.get("first") || "").trim();
    const second = String(form.get("second") || "").trim();
    if (!text || !first || !second || first === second) { setError(t("koinsNeedDiffs")); return; }
    setError("");
    const res = await fetch("/api/koins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", partyId, text, options: [first, second] }) });
    if (res.ok) { loadBets(); e.currentTarget.reset(); } else { const data = await res.json(); setError(data.error || t("createError")); }
  }

  async function joinBetAction(betId: string, option: string) {
    const stake = Math.max(1, Math.round(stakes[betId] || 25));
    if (stake > balance) { setError(t("koinsNotEnough")); return; }
    setError("");
    const res = await fetch("/api/koins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", betId, option, stake }) });
    if (res.ok) { loadBets(); loadBalance(); } else { const data = await res.json(); setError(data.error || t("createError")); }
  }

  return <section className="party-room-panel">
    <div className="koins-balance"><div><span>{t("koinsBalance")}</span><strong>{balance.toLocaleString()} <small>KOINS</small></strong><p>{t("koinsNote")}</p><div className="koins-balance-tags"><b>{activeStake}{t("koinsActive")}</b><b>{bets.filter((b) => b.status === "open").length}{t("koinsOpen")}</b></div></div><span className="material-symbols-rounded koins-icon">toll</span></div>
    {error && <p className="form-error">{error}</p>}

    <div className="demo-panel-title"><div><span>{t("rewardsTitle")}</span><h2>{t("rewardsSub")}</h2></div></div>
    <div className="rewards-grid">
      {REWARD_KEYS.map((key) => {
        const stat = rewards[key];
        const remaining = stat ? stat.daily - stat.count : 0;
        return <div className="reward-card" key={key}>
          <span className="material-symbols-rounded reward-icon">{key === "photo" ? "photo_camera" : key === "chat" ? "chat" : key === "game_play" ? "sports_esports" : key === "game_win" ? "emoji_events" : key === "streak" ? "local_fire_department" : "person_add"}</span>
          <strong>{t(`rewards${key.charAt(0).toUpperCase() + key.slice(1).replace("_", "")}` as never)}</strong>
          <span className="reward-amount">+{stat?.amount ?? 0} KOINS</span>
          <span className="reward-stat">{stat?.count ?? 0}{t("rewardsEarned")} · {remaining > 0 ? `${remaining}${t("rewardsDaily")}` : t("rewardsLimit")}</span>
        </div>;
      })}
    </div>

    <div className="demo-panel-title"><div><span>{t("koinsMini")}</span><h2>{t("koinsSub")}</h2></div><span className="demo-chip">{t("koinsLocal")}</span></div>
    <form className="bet-create-form" onSubmit={createBetAction}><label><span>{t("koinsQuestion")}</span><input name="text" placeholder={t("koinsQuestionPlace")} required /></label><label><span>{t("koinsOutcomeA")}</span><input defaultValue={t("koinsOutcomeA") === "Исход A" ? "Да" : "Yes"} name="first" required /></label><label><span>{t("koinsOutcomeB")}</span><input defaultValue={t("koinsOutcomeB") === "Исход B" ? "Нет" : "No"} name="second" required /></label><button className="demo-action demo-action--lime" type="submit"><span className="material-symbols-rounded">add</span> {t("koinsOpenBet")}</button></form>
    <div className="bets-list bets-list--full">{bets.map((bet) => { const total = bet.entries.reduce((sum, e) => sum + e.stake, 0); return <article className={bet.status} key={bet.id}><div className="bet-copy"><span>{bet.status === "open" ? t("koinsOpenStatus") : bet.status === "settled" ? `${t("koinsSettled")}${bet.winner}` : t("koinsCancelled")}</span><h3>{bet.text}</h3><p>{t("koinsPool")}{total}{t("koinsPoolEnd")}{bet.entries.length}{t("koinsBets")}</p></div>{bet.status === "open" && <div className="bet-interaction"><label>{t("koinsStakeFor")}<input aria-label={`${t("koinsStakeFor")}${bet.text}`} min="1" max={balance} type="number" value={stakes[bet.id] ?? 25} onChange={(e) => setStakes((s) => ({ ...s, [bet.id]: Math.max(1, Number(e.target.value)) }))} /></label><div className="bet-buttons">{bet.options.map((option) => <button className="demo-action demo-action--lime" key={option} onClick={() => joinBetAction(bet.id, option)} type="button">{option}</button>)}</div></div>}</article>; })}</div>
    {transactions.length > 0 && <div className="demo-panel-title" style={{ marginTop: 24 }}><div><span>{t("koinsLedger")}</span><h2>{t("koinsLedgerSub")}</h2></div></div>}
    <div className="bets-list bets-list--full">{transactions.map((tx) => <article className={tx.amount > 0 ? "open" : "settled"} key={tx.id}><div className="bet-copy"><span>{tx.amount > 0 ? "+" : ""}{tx.amount} KOINS</span><h3>{tx.label}</h3></div></article>)}</div>
  </section>;
}
