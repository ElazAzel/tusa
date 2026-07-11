"use client";

import { FormEvent, useMemo, useState } from "react";
import { ShoppingItem, usePlatform } from "../PlatformContext";
import { Icon } from "./Icon";
import { useLocale } from "@/app/components/LocaleProvider";

type DraftItem = Omit<ShoppingItem, "id" | "purchased" | "price">;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]/gi, "");
}

export function ShoppingHub() {
  const { event, updateEvent, state, notify, gainXp } = usePlatform();
  const { t } = useLocale();
  const [duplicate, setDuplicate] = useState<{ existing: ShoppingItem; draft: DraftItem } | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<string[]>(() => event.participants.filter((person) => person.rsvp === "going").map((person) => person.id));

  const total = useMemo(() => event.shopping.filter((item) => item.purchased).reduce((sum, item) => sum + item.price, 0), [event.shopping]);
  const completed = event.shopping.filter((item) => item.purchased).length;

  const transfers = useMemo(() => {
    if (!selectedPeople.length || !total) return [];
    const share = total / selectedPeople.length;
    const balances = new Map<string, number>();
    selectedPeople.forEach((id) => balances.set(id, -share));
    event.shopping.filter((item) => item.purchased && item.price > 0).forEach((item) => balances.set(item.buyerId, (balances.get(item.buyerId) ?? 0) + item.price));
    const debtors = [...balances.entries()].filter(([, value]) => value < -1).map(([id, value]) => ({ id, amount: -value }));
    const creditors = [...balances.entries()].filter(([, value]) => value > 1).map(([id, value]) => ({ id, amount: value }));
    const result: Array<{ from: string; to: string; amount: number }> = [];
    let debtorIndex = 0;
    let creditorIndex = 0;
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const amount = Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount);
      result.push({ from: debtors[debtorIndex].id, to: creditors[creditorIndex].id, amount: Math.round(amount) });
      debtors[debtorIndex].amount -= amount;
      creditors[creditorIndex].amount -= amount;
      if (debtors[debtorIndex].amount < 1) debtorIndex += 1;
      if (creditors[creditorIndex].amount < 1) creditorIndex += 1;
    }
    return result;
  }, [event.shopping, selectedPeople, total]);

  function personName(id: string) {
    return event.participants.find((person) => person.id === id)?.name ?? "Участник";
  }

  function commitItem(draft: DraftItem) {
    updateEvent((current) => ({ ...current, shopping: [...current.shopping, { ...draft, id: `shop_${Date.now()}`, purchased: false, price: 0 }] }));
    setDuplicate(null);
    gainXp(3, t("shoppingAddTitle"));
  }

  function addItem(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = new FormData(formEvent.currentTarget);
    const draft: DraftItem = {
      text: String(form.get("text") || "").trim(),
      quantity: Math.max(1, Number(form.get("quantity") || 1)),
      unit: String(form.get("unit") || "шт."),
      buyerId: String(form.get("buyerId") || state.profile.id),
    };
    if (!draft.text) return;
    const existing = event.shopping.find((item) => {
      const a = normalize(item.text);
      const b = normalize(draft.text);
      return a === b || (a.length > 3 && b.length > 3 && (a.includes(b) || b.includes(a)));
    });
    if (existing) {
      setDuplicate({ existing, draft });
      return;
    }
    commitItem(draft);
    formEvent.currentTarget.reset();
  }

  function mergeDuplicate() {
    if (!duplicate) return;
    updateEvent((current) => ({
      ...current,
      shopping: current.shopping.map((item) => item.id === duplicate.existing.id ? { ...item, quantity: item.quantity + duplicate.draft.quantity } : item),
    }));
    setDuplicate(null);
    notify(t("splitMerged"));
  }

  async function copySplit() {
    const text = transfers.length
      ? transfers.map((transfer) => `${personName(transfer.from)} → ${personName(transfer.to)}: ${transfer.amount.toLocaleString("ru-RU")} ₸`).join("\n")
      : `Покупки на ${total.toLocaleString("ru-RU")} ₸. Расчётов пока нет.`;
    try {
      await navigator.clipboard.writeText(`${event.title}\n${text}`);
      notify(t("splitCopied"));
    } catch {
      window.prompt("Скопируй расчёт", text);
    }
  }

  return (
    <section className="demo-tab-panel shopping-panel">
      <div className="demo-panel-title"><div><span>{t("shoppingTitle")}</span><h2>{t("shoppingSub")}</h2></div><span className="demo-chip">{completed}/{event.shopping.length}</span></div>

      <form className="shopping-add-form" onSubmit={addItem}>
        <label><span>{t("shoppingAdd")}</span><input name="text" placeholder={t("shoppingAddPlace")} required /></label>
        <label><span>{t("shoppingQuantity")}</span><input defaultValue="1" min="1" name="quantity" type="number" /></label>
        <label><span>{t("shoppingUnit")}</span><select name="unit"><option>шт.</option><option>пак.</option><option>бут.</option><option>кг</option><option>л</option></select></label>
        <label><span>{t("shoppingBuyer")}</span><select defaultValue={state.profile.id} name="buyerId">{event.participants.filter((person) => person.rsvp !== "pass").map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
        <button type="submit"><Icon name="add" /> {t("shoppingAddBtn")}</button>
      </form>

      {duplicate && (
        <div className="duplicate-warning" role="alert"><Icon name="content_copy" /><div><strong>{t("shoppingDuplicate")}{duplicate.existing.text}{t("shoppingDuplicateEnd")}</strong><span>{t("shoppingMergeOrAdd")}</span></div><button onClick={mergeDuplicate} type="button">{t("shoppingMerge")}</button><button onClick={() => commitItem(duplicate.draft)} type="button">{t("shoppingSeparate")}</button></div>
      )}

      <div className="shopping-list shopping-list--detailed">
        {event.shopping.map((item) => (
          <article className={item.purchased ? "done" : ""} key={item.id}>
            <button aria-label={item.purchased ? `${t("shoppingDone")}${item.text}${t("shoppingDoneEnd")}` : `${t("shoppingMark")}${item.text}${t("shoppingMarkEnd")}`} className="shopping-check" onClick={() => updateEvent((current) => ({ ...current, shopping: current.shopping.map((entry) => entry.id === item.id ? { ...entry, purchased: !entry.purchased } : entry) }))} type="button"><Icon name="check" /></button>
            <div className="shopping-item-main"><strong>{item.text}</strong><span>{item.quantity} {item.unit}</span></div>
            <label><span>{t("shoppingBuyerLabel")}</span><select value={item.buyerId} onChange={(changeEvent) => updateEvent((current) => ({ ...current, shopping: current.shopping.map((entry) => entry.id === item.id ? { ...entry, buyerId: changeEvent.target.value } : entry) }))}>{event.participants.filter((person) => person.rsvp !== "pass").map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
            <label><span>{t("shoppingSum")}</span><input aria-label={`${t("shoppingCost")}${item.text}`} min="0" step="100" type="number" value={item.price || ""} onChange={(changeEvent) => updateEvent((current) => ({ ...current, shopping: current.shopping.map((entry) => entry.id === item.id ? { ...entry, price: Math.max(0, Number(changeEvent.target.value)) } : entry) }))} /></label>
            <button aria-label={`${t("shoppingDelete")}${item.text}`} className="shopping-remove" onClick={() => updateEvent((current) => ({ ...current, shopping: current.shopping.filter((entry) => entry.id !== item.id) }))} type="button"><Icon name="delete" /></button>
          </article>
        ))}
        {!event.shopping.length && <div className="empty-state"><Icon name="shopping_bag" /><strong>{t("shoppingEmpty")}</strong><span>{t("shoppingEmptySub")}</span></div>}
      </div>

      <section className="split-card">
        <div className="split-head"><div><span>{t("shoppingSplit")}</span><h3>{total.toLocaleString("ru-RU")} ₸ {t("splitting")}</h3></div><strong>{selectedPeople.length ? Math.round(total / selectedPeople.length).toLocaleString("ru-RU") : 0} ₸<small>{t("splitPerPerson")}</small></strong></div>
        <p>{t("splitSelect")}</p>
        <div className="split-people scroll-row">{event.participants.filter((person) => person.rsvp === "going").map((person) => <label className={selectedPeople.includes(person.id) ? "selected" : ""} key={person.id}><input checked={selectedPeople.includes(person.id)} onChange={() => setSelectedPeople((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])} type="checkbox" /><span>{person.initials}</span>{person.name}</label>)}</div>
        <div className="transfer-list">
          {transfers.map((transfer) => <article key={`${transfer.from}-${transfer.to}`}><span>{personName(transfer.from)}</span><Icon name="arrow_forward" /><span>{personName(transfer.to)}</span><strong>{transfer.amount.toLocaleString("ru-RU")} ₸</strong></article>)}
          {!transfers.length && <p className="empty-copy">{t("splitNoTransfers")}</p>}
        </div>
        <button className="demo-action demo-action--lime" onClick={copySplit} type="button"><Icon name="content_copy" /> {t("splitCopy")}</button>
      </section>
    </section>
  );
}
