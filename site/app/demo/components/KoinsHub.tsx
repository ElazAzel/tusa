"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bet, usePlatform } from "../PlatformContext";
import { Icon } from "./Icon";
import { useLocale } from "@/app/components/LocaleProvider";

function poolFor(bet: Bet, option: string) {
  return bet.entries.filter((entry) => entry.option === option).reduce((sum, entry) => sum + entry.stake, 0);
}

export function KoinsHub() {
  const { event, updateEvent, state, updateProfile, notify, gainXp } = usePlatform();
  const { t } = useLocale();
  const [stakes, setStakes] = useState<Record<string, number>>({});

  const activeStake = useMemo(() => event.bets.filter((bet) => bet.status === "open").flatMap((bet) => bet.entries).filter((entry) => entry.userId === state.profile.id).reduce((sum, entry) => sum + entry.stake, 0), [event.bets, state.profile.id]);

  function addTransaction(amount: number, label: string) {
    updateProfile((profile) => ({
      ...profile,
      koins: profile.koins + amount,
      koinsTransactions: [{ id: `txn_${Date.now()}_${Math.random()}`, amount, label, createdAt: new Date().toISOString() }, ...profile.koinsTransactions].slice(0, 80),
    }));
  }

  function createBet(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = new FormData(formEvent.currentTarget);
    const text = String(form.get("text") || "").trim();
    const first = String(form.get("first") || "Да").trim();
    const second = String(form.get("second") || "Нет").trim();
    if (!text || !first || !second || first === second) {
      notify(t("koinsNeedDiffs"));
      return;
    }
    updateEvent((current) => ({ ...current, bets: [{ id: `bet_${Date.now()}`, text, options: [first, second], status: "open", entries: [], createdAt: new Date().toISOString() }, ...current.bets] }));
    formEvent.currentTarget.reset();
    gainXp(5, t("koinsNewBet"));
  }

  function joinBet(bet: Bet, option: string) {
    const stake = Math.max(1, Math.round(stakes[bet.id] || 25));
    if (bet.entries.some((entry) => entry.userId === state.profile.id)) {
      notify(t("koinsAlreadyBet"));
      return;
    }
    if (stake > state.profile.koins) {
      notify(t("koinsNotEnough"));
      return;
    }
    updateEvent((current) => ({ ...current, bets: current.bets.map((entry) => entry.id === bet.id ? { ...entry, entries: [...entry.entries, { userId: state.profile.id, option, stake }] } : entry) }));
    addTransaction(-stake, `Ставка: ${bet.text} · ${option}`);
    notify(`${stake}${t("koinsPlaced")}${option}${t("koinsPlacedEnd")}`);
  }

  function settleBet(bet: Bet, winner: string) {
    const totalPool = bet.entries.reduce((sum, entry) => sum + entry.stake, 0);
    const winnerPool = poolFor(bet, winner);
    const myEntry = bet.entries.find((entry) => entry.userId === state.profile.id);
    const payout = myEntry?.option === winner && winnerPool > 0 ? Math.round(myEntry.stake * (totalPool / winnerPool)) : 0;
    updateEvent((current) => ({ ...current, bets: current.bets.map((entry) => entry.id === bet.id ? { ...entry, status: "settled", winner } : entry) }));
    if (payout) addTransaction(payout, `Выигрыш: ${bet.text}`);
    gainXp(8, `${t("koinsBetSettled")}${winner}`);
  }

  function cancelBet(bet: Bet) {
    const myStake = bet.entries.find((entry) => entry.userId === state.profile.id)?.stake ?? 0;
    updateEvent((current) => ({ ...current, bets: current.bets.map((entry) => entry.id === bet.id ? { ...entry, status: "cancelled" } : entry) }));
    if (myStake) addTransaction(myStake, `Возврат: ${bet.text}`);
    notify(t("koinsBetCancelled"));
  }

  return (
    <section className="demo-tab-panel koins-panel">
      <div className="koins-balance"><div><span>{t("koinsBalance")}</span><strong>{state.profile.koins.toLocaleString("ru-RU")} <small>KOINS</small></strong><p>{t("koinsNote")}</p><div className="koins-balance-tags"><b>{activeStake}{t("koinsActive")}</b><b>{event.bets.filter((bet) => bet.status === "open").length}{t("koinsOpen")}</b></div></div><Icon name="toll" /></div>

      <div className="demo-panel-title"><div><span>{t("koinsMini")}</span><h2>{t("koinsSub")}</h2></div><span className="demo-chip">{t("koinsLocal")}</span></div>
      <form className="bet-create-form" onSubmit={createBet}>
        <label><span>{t("koinsQuestion")}</span><input name="text" placeholder={t("koinsQuestionPlace")} required /></label>
        <label><span>{t("koinsOutcomeA")}</span><input defaultValue="Да" name="first" required /></label>
        <label><span>{t("koinsOutcomeB")}</span><input defaultValue="Нет" name="second" required /></label>
        <button type="submit"><Icon name="add" /> {t("koinsOpenBet")}</button>
      </form>

      <div className="bets-list bets-list--full">
        {event.bets.map((bet) => {
          const total = bet.entries.reduce((sum, entry) => sum + entry.stake, 0);
          const myEntry = bet.entries.find((entry) => entry.userId === state.profile.id);
          return (
            <article className={bet.status} key={bet.id}>
              <div className="bet-copy"><span>{bet.status === "open" ? t("koinsOpenStatus") : bet.status === "settled" ? `${t("koinsSettled")}${bet.winner}` : t("koinsCancelled")}</span><h3>{bet.text}</h3><p>{t("koinsPool")}{total}{t("koinsPoolEnd")}{bet.entries.length}{t("koinsBets")}</p>{myEntry && <b>{t("koinsYourBet")}{myEntry.stake}{t("koinsOn")}{myEntry.option}{t("koinsOnEnd")}</b>}</div>
              {bet.status === "open" && (
                <div className="bet-interaction">
                  <label>{t("koinsStakeFor")}<input aria-label={`${t("koinsStakeFor")}${bet.text}`} min="1" max={state.profile.koins} type="number" value={stakes[bet.id] ?? 25} onChange={(changeEvent) => setStakes((current) => ({ ...current, [bet.id]: Math.max(1, Number(changeEvent.target.value)) }))} /></label>
                  <div className="bet-options">{bet.options.map((option) => { const optionPool = poolFor(bet, option); const odds = optionPool ? Math.max(1, total / optionPool) : 2; return <button disabled={Boolean(myEntry)} key={option} onClick={() => joinBet(bet, option)} type="button"><strong>{option}</strong><span>{optionPool} в пуле · x{odds.toFixed(1)}</span></button>; })}</div>
                  <div className="bet-settle"><span>{t("koinsSettleResult")}</span>{bet.options.map((option) => <button key={option} onClick={() => settleBet(bet, option)} type="button"><Icon name="gavel" /> {option}</button>)}<button className="cancel" onClick={() => cancelBet(bet)} type="button">{t("koinsCancel")}</button></div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <section className="koins-ledger">
        <div><span>{t("koinsLedger")}</span><h3>{t("koinsLedgerSub")}</h3></div>
        <div>{state.profile.koinsTransactions.map((transaction) => <article key={transaction.id}><Icon name={transaction.amount >= 0 ? "south_west" : "north_east"} /><span><strong>{transaction.label}</strong><time>{new Date(transaction.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time></span><b className={transaction.amount >= 0 ? "positive" : "negative"}>{transaction.amount > 0 ? "+" : ""}{transaction.amount}</b></article>)}</div>
      </section>
    </section>
  );
}
