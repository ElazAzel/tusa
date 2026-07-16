"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { CosmeticsItem, PromoBenefit, PromoCode } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import LocaleToggle from "@/app/components/LocaleToggle";

type Stats = { users: number; parties: number; joins: number; redemptions: number };
const typeToCosmetic: Record<string, string> = { profile_cover: "cover", avatar_frame: "avatarFrame", chat_effect: "chatEffect", chat_background: "chatBackground", name_color: "nameColor", badge: "badge" };

export default function PromoConsole({ initialPromos, initialStats, canWrite }: { initialPromos: PromoCode[]; initialStats: Stats; canWrite: boolean }) {
  const [promos, setPromos] = useState(initialPromos);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [editTarget, setEditTarget] = useState<PromoCode | null>(null);
  const [cosmetics, setCosmetics] = useState<CosmeticsItem[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, string>>({});
  const { locale } = useLocale();
  const r = locale === "ru";

  useEffect(() => {
    fetch("/api/admin/cosmetics").then((r) => r.json()).then((d) => { if (d.items) setCosmetics(d.items); }).catch(() => undefined);
  }, []);

  const c = r
    ? { queue: "Очередь", kicker: "награды, доступ и лимиты", title: <>Промо<br /><span>команда.</span></>, lead: "Коды могут быть одноразовыми или многоразовыми, иметь срок и выдавать набор вещей для профиля.", profiles: "профили", parties: "создано тус", joins: "входов по инвайту", redemptions: "активаций", accounts: "аккаунтов в TUSA.game", through: "через промодоступ", guest: "гостевых присоединений", used: "использовано промокодов", new: "новый доступ", createTitle: "Выпустить код", code: "Промокод", mode: "Режим", single: "Одноразовый", multi: "Многоразовый", limit: "Лимит активаций", expiry: "Срок действия", benefits: "Что выдаёт", create: "Создать промокод", creating: "Создаём\u2026", all: "все коды", system: "в системе", note: "Код с активациями нельзя удалить \u2014 только остановить.", active: "активен", paused: "на паузе", once: "один раз", many: "много раз", until: "до", access: "только доступ", pause: "Пауза", enable: "Включить", remove: "Удалить", created: "создан.", activated: "Код активирован.", deactivated: "Код поставлен на паузу.", deleted: "Код удалён.", removeConfirm: "Удалить промокод" }
    : { queue: "Waitlist", kicker: "rewards, access and limits", title: <>Promo<br /><span>control.</span></>, lead: "Codes can be one-time or reusable, have an expiry date, and grant a set of profile items.", profiles: "profiles", parties: "hangouts created", joins: "invite joins", redemptions: "activations", accounts: "accounts in TUSA.game", through: "via promo access", guest: "guest joins", used: "promo codes used", new: "new access", createTitle: "Issue a code", code: "Promo code", mode: "Mode", single: "One-time", multi: "Reusable", limit: "Activation limit", expiry: "Expiry date", benefits: "What it gives", create: "Create promo code", creating: "Creating\u2026", all: "all codes", system: "in the system", note: "A code with activations cannot be deleted \u2014 pause it instead.", active: "active", paused: "paused", once: "one time", many: "many uses", until: "until", access: "access only", pause: "Pause", enable: "Enable", remove: "Remove", created: "created.", activated: "Code activated.", deactivated: "Code paused.", deleted: "Code removed.", removeConfirm: "Delete promo code" };

  const benefitLabels: Record<PromoBenefit["type"], string> = r
    ? { beta_access: "бета-доступ", profile_cover: "обложка", avatar_frame: "рамка", chat_effect: "эффект чата", chat_background: "фон чата", name_color: "цвет имени", badge: "ачивка", xp_multiplier: "XP-модификатор", party_creation: "создание тусы" }
    : { beta_access: "beta access", profile_cover: "profile cover", avatar_frame: "avatar frame", chat_effect: "chat effect", chat_background: "chat background", name_color: "name color", badge: "badge", xp_multiplier: "XP modifier", party_creation: "create hangout" };

  function getCosmeticByType(type: string): CosmeticsItem[] {
    const ct = typeToCosmetic[type];
    if (!ct) return [];
    return cosmetics.filter((c) => c.type === ct && c.active);
  }

  function computeBenefits(form: FormData): PromoBenefit[] {
    const selected = Array.from(form.getAll("benefits"));
    return selected.map((type) => {
      const key = `benefit_value_${type}`;
      const value = form.get(key) as string | null;
      return { type: String(type) as PromoBenefit["type"], value: value || undefined };
    });
  }

  async function request(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
    const response = await fetch("/api/admin/promos", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Save failed.");
    return data;
  }

  async function createPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const benefits = computeBenefits(form);
    setBusy("create");
    setNotice("");
    try {
      const data = await request("POST", { code: form.get("code"), mode: form.get("mode"), maxRedemptions: form.get("maxRedemptions") || null, expiresAt: form.get("expiresAt") || null, benefits });
      setPromos((items) => [data.promo, ...items]);
      event.currentTarget.reset();
      setNotice(`${c.code} ${data.promo.code} ${c.created}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Create failed."); } finally { setBusy(""); }
  }

  async function toggle(promo: PromoCode) {
    setBusy(promo.id);
    setNotice("");
    try {
      const data = await request("PATCH", { id: promo.id, status: promo.status === "active" ? "paused" : "active" });
      setPromos((items) => items.map((item) => item.id === promo.id ? data.promo : item));
      setNotice(data.promo.status === "active" ? c.activated : c.deactivated);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Update failed."); } finally { setBusy(""); }
  }

  async function remove(promo: PromoCode) {
    if (!window.confirm(`${c.removeConfirm} ${promo.code}?`)) return;
    setBusy(promo.id);
    setNotice("");
    try {
      await request("DELETE", { id: promo.id });
      setPromos((items) => items.filter((item) => item.id !== promo.id));
      setNotice(c.deleted);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Delete failed."); } finally { setBusy(""); }
  }

  async function editPromo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget) return;
    const form = new FormData(event.currentTarget);
    const benefits = computeBenefits(form);
    setBusy(editTarget.id);
    setNotice("");
    try {
      const data = await request("PATCH", { id: editTarget.id, code: form.get("code"), status: form.get("status"), mode: form.get("mode"), maxRedemptions: form.get("maxRedemptions") || null, expiresAt: form.get("expiresAt") || null, benefits });
      setPromos((items) => items.map((item) => item.id === editTarget.id ? data.promo : item));
      setEditTarget(null);
      setNotice(`${c.code} ${data.promo.code} ${c.activated}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Update failed."); } finally { setBusy(""); }
  }

  return <main className="admin-page promo-admin-page">
    <header className="admin-header">
      <Link href="/admin" className="admin-brand">TUSA<span>.game</span></Link>
      <div>
        <LocaleToggle />
        <Link href="/admin" className="admin-text-button">{c.queue}</Link>
        <Link href="/admin/cosmetics" className="admin-text-button">{r ? "Косметика" : "Cosmetics"}</Link>
        <span className="admin-kicker">promo control room</span>
      </div>
    </header>
    <section className="admin-hero promo-admin-hero">
      <div>
        <span className="admin-kicker">{c.kicker}</span>
        <h1>{c.title}</h1>
        <p>{c.lead}</p>
      </div>
    </section>
    <section className="admin-metrics" aria-label="Product metrics">
      <article><span>{c.profiles}</span><strong>{initialStats.users}</strong><small>{c.accounts}</small></article>
      <article><span>{c.parties}</span><strong>{initialStats.parties}</strong><small>{c.through}</small></article>
      <article><span>{c.joins}</span><strong>{initialStats.joins}</strong><small>{c.guest}</small></article>
      <article><span>{c.redemptions}</span><strong>{initialStats.redemptions}</strong><small>{c.used}</small></article>
    </section>
    <section className="promo-console-grid">
      {canWrite ? <form className="promo-create-card" onSubmit={createPromo}>
        <span className="admin-kicker">{c.new}</span>
        <h2>{c.createTitle}</h2>
        <label>{c.code}<input name="code" required minLength={3} maxLength={32} placeholder="SUMMER26" autoCapitalize="characters" /></label>
        <label>{c.mode}<select name="mode" defaultValue="single"><option value="single">{c.single}</option><option value="multi">{c.multi}</option></select></label>
        <label>{c.limit}<input name="maxRedemptions" type="number" min="1" inputMode="numeric" placeholder={c.multi} /></label>
        <label>{c.expiry}<input name="expiresAt" type="date" /></label>
        <fieldset className="promo-benefits">
          <legend>{c.benefits}</legend>
          {Object.entries(benefitLabels).map(([type, label]) => {
            const items = getCosmeticByType(type);
            return <div key={type} className="promo-benefit-row">
              <label><input name="benefits" value={type} type="checkbox" onChange={(e) => { if (!e.target.checked) setSelectedTypes((p) => { const n = { ...p }; delete n[type]; return n; }); else setSelectedTypes((p) => ({ ...p, [type]: "" })); }} />{label}</label>
              {items.length > 0 && <select name={`benefit_value_${type}`} className="promo-benefit-item-select" disabled={!selectedTypes[type] && selectedTypes[type] !== ""} onChange={(e) => setSelectedTypes((p) => ({ ...p, [type]: e.target.value }))}>
                <option value="">{r ? "\u2014 выбрать \u2014" : "\u2014 select \u2014"}</option>
                {items.map((item) => <option key={item.id} value={item.value}>{r ? item.nameRu : item.nameEn} ({item.slug})</option>)}
              </select>}
            </div>;
          })}
        </fieldset>
        <button className="admin-button admin-button--lime" disabled={busy === "create"}>{busy === "create" ? c.creating : c.create}</button>
      </form> : <aside className="promo-create-card"><span className="admin-kicker">read only</span><h2>{r ? "Просмотр" : "View only"}</h2><p>{r ? "Ваша роль не позволяет изменять промокоды." : "This role cannot change promo codes."}</p></aside>}
      <section className="promo-list-card">
        <div className="admin-table-head"><div><span className="admin-kicker">{c.all}</span><h2>{promos.length} {c.system}</h2></div><p>{c.note}</p></div>
        {notice && <p className="admin-notice">{notice}</p>}
        <div className="promo-list">{promos.map((promo) => <article key={promo.id} className="promo-row">
          <div>
            <strong>{promo.code}</strong>
            <span>{promo.status === "active" ? c.active : c.paused} &middot; {promo.mode === "single" ? c.once : c.many}{promo.expiresAt ? ` &middot; ${c.until} ${new Intl.DateTimeFormat(locale === "ru" ? "ru-KZ" : "en-US", { dateStyle: "short" }).format(new Date(promo.expiresAt))}` : ""}</span>
            <em className="promo-benefit-tags">{promo.benefits.map((benefit) => {
              const label = benefitLabels[benefit.type];
              const val = benefit.value ? ` (${benefit.value})` : "";
              return <span key={benefit.type} className="promo-tag">{label}{val}</span>;
            }) || c.access}</em>
          </div>
          <b>{promo.usesCount} / {promo.maxRedemptions ?? "?"}</b>
          {canWrite && <>
            <button className="admin-button admin-button--outline" onClick={() => setEditTarget(promo)} disabled={busy === promo.id}>{r ? "Править" : "Edit"}</button>
            <button className="admin-button" onClick={() => toggle(promo)} disabled={busy === promo.id}>{promo.status === "active" ? c.pause : c.enable}</button>
            <button className="admin-delete" onClick={() => remove(promo)} disabled={busy === promo.id || promo.usesCount > 0}>{c.remove}</button>
          </>}
        </article>)}</div>
      </section>
    </section>
    {editTarget && <div className="admin-modal-backdrop" onClick={() => setEditTarget(null)}>
      <form className="admin-modal promo-edit-modal" onSubmit={editPromo} onClick={(e) => e.stopPropagation()}>
        <span className="admin-kicker">{r ? "редактирование" : "editing"}</span>
        <h2>{editTarget.code}</h2>
        <label>{c.code}<input name="code" defaultValue={editTarget.code} required minLength={3} maxLength={32} autoCapitalize="characters" /></label>
        <label>{r ? "Статус" : "Status"}<select name="status" defaultValue={editTarget.status}><option value="active">{c.active}</option><option value="paused">{c.paused}</option></select></label>
        <label>{c.mode}<select name="mode" defaultValue={editTarget.mode}><option value="single">{c.single}</option><option value="multi">{c.multi}</option></select></label>
        <label>{c.limit}<input name="maxRedemptions" type="number" min="1" defaultValue={editTarget.maxRedemptions ?? ""} inputMode="numeric" /></label>
        <label>{c.expiry}<input name="expiresAt" type="date" defaultValue={editTarget.expiresAt ? editTarget.expiresAt.split("T")[0] : ""} /></label>
        <fieldset className="promo-benefits">
          <legend>{c.benefits}</legend>
          {Object.entries(benefitLabels).map(([type, label]) => {
            const existing = editTarget.benefits.find((b) => b.type === type);
            const items = getCosmeticByType(type);
            return <div key={type} className="promo-benefit-row">
              <label><input name="benefits" value={type} type="checkbox" defaultChecked={!!existing} />{label}</label>
              {items.length > 0 && <select name={`benefit_value_${type}`} className="promo-benefit-item-select" defaultValue={existing?.value as string || ""}>
                <option value="">{r ? "\u2014 выбрать \u2014" : "\u2014 select \u2014"}</option>
                {items.map((item) => <option key={item.id} value={item.value}>{r ? item.nameRu : item.nameEn} ({item.slug})</option>)}
              </select>}
            </div>;
          })}
        </fieldset>
        <div className="admin-modal-actions">
          <button type="button" className="admin-button" onClick={() => setEditTarget(null)}>{r ? "Отмена" : "Cancel"}</button>
          <button className="admin-button admin-button--lime" disabled={busy === editTarget.id}>{busy === editTarget.id ? c.creating : r ? "Сохранить" : "Save"}</button>
        </div>
      </form>
    </div>}
  </main>;
}
