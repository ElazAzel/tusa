"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]/gi, "");
}

type ShoppingMember = { clerkUserId: string; displayName: string };

export default function ShoppingList({ partyId, members = [], canManage = false }: { partyId: string; members?: ShoppingMember[]; canManage?: boolean }) {
  const { t } = useLocale();
  const [items, setItems] = useState<Array<{ id: string; text: string; quantity: number; unit: string; buyerId: string; buyerName: string; price: number; purchased: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadItems = useCallback(() => {
    fetch(`/api/shopping?partyId=${partyId}`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Shopping list error.");
      setItems(Array.isArray(data.items) ? data.items : []);
      setError("");
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Shopping list error.")).finally(() => setLoading(false));
  }, [partyId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const text = String(form.get("text") || "").trim();
    const quantity = Math.max(1, Number(form.get("quantity") || 1));
    const unit = String(form.get("unit") || "шт.");
    if (!text) return;
    const existing = items.find((item) => {
      const a = normalize(item.text); const b = normalize(text);
      return a === b || (a.length > 3 && b.length > 3 && (a.includes(b) || b.includes(a)));
    });
    if (existing) {
      fetch("/api/shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", itemId: existing.id, updates: { quantity: existing.quantity + quantity } }) })
        .then(() => { loadItems(); formElement.reset(); });
      return;
    }
    fetch("/api/shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", partyId, text, quantity, unit }) })
      .then(() => { loadItems(); formElement.reset(); });
  }

  function toggle(itemId: string, purchased: boolean) {
    fetch("/api/shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", itemId, updates: { purchased: !purchased } }) })
      .then(loadItems);
  }

  function setPrice(itemId: string, price: number) {
    fetch("/api/shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", itemId, updates: { price: Math.max(0, price) } }) });
  }

  function assignBuyer(itemId: string, buyerId: string) {
    fetch("/api/shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", itemId, updates: { buyerId } }) }).then(loadItems);
  }

  function remove(itemId: string) {
    fetch("/api/shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", itemId }) })
      .then(loadItems);
  }

  const total = useMemo(() => items.filter((item) => item.purchased).reduce((sum, item) => sum + item.price, 0), [items]);
  const completed = items.filter((item) => item.purchased).length;

  if (loading) return <section className="party-room-panel"><p>{t("roomChatEmpty")}</p></section>;

  return <section className="party-room-panel">
    <div className="demo-panel-title"><div><span>{t("shoppingTitle")}</span><h2>{t("shoppingSub")}</h2></div><span className="demo-chip">{completed}/{items.length}</span></div>
    <form className="shopping-add-form" onSubmit={addItem}>
      <label><span>{t("shoppingAdd")}</span><input name="text" placeholder={t("shoppingAddPlace")} required /></label>
      <label><span>{t("shoppingQuantity")}</span><input defaultValue="1" min="1" name="quantity" type="number" /></label>
      <label className="brand-select"><span>{t("shoppingUnit")}</span><select name="unit"><option>шт.</option><option>пак.</option><option>бут.</option><option>кг</option><option>л</option></select></label>
      <button type="submit"><span className="material-symbols-rounded">add</span> {t("shoppingAddBtn")}</button>
    </form>
    {error && <p className="feature-error" role="alert">{error}</p>}
    <div className="shopping-list shopping-list--detailed">
      {items.map((item) => (
        <article className={item.purchased ? "done" : ""} key={item.id}>
          <button className="shopping-check" onClick={() => toggle(item.id, item.purchased)} type="button">
            <span className="material-symbols-rounded">check</span>
          </button>
          <div className="shopping-item-main"><strong>{item.text}</strong><span>{item.quantity} {item.unit}</span></div>
          <div className="shopping-buyer"><span className="shopping-buyer-label">{t("shoppingBuyer")}</span>
            {canManage ? <select aria-label={t("shoppingBuyer")} value={item.buyerId} onChange={(event) => assignBuyer(item.id, event.target.value)}>{members.map((member) => <option key={member.clerkUserId} value={member.clerkUserId}>{member.displayName}</option>)}</select> : <strong>{item.buyerName}</strong>}
          </div>
          <label><span>{t("shoppingSum")}</span>
            <input aria-label={t("shoppingCost")} min="0" step="100" type="number" defaultValue={item.price || ""} onBlur={(e) => setPrice(item.id, Number(e.target.value))} />
          </label>
          <button className="shopping-remove" onClick={() => remove(item.id)} type="button"><span className="material-symbols-rounded">delete</span></button>
        </article>
      ))}
      {!items.length && <div className="empty-state"><span className="material-symbols-rounded">shopping_bag</span><strong>{t("shoppingEmpty")}</strong><span>{t("shoppingEmptySub")}</span></div>}
    </div>
    {total > 0 && <section className="split-card"><div className="split-head"><div><span>{t("shoppingSplit")}</span><h3>{total.toLocaleString("ru-RU")} ₸</h3></div></div></section>}
  </section>;
}
