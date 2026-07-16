"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { CosmeticsItem, CosmeticsItemType } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import LocaleToggle from "@/app/components/LocaleToggle";

const types: CosmeticsItemType[] = ["cover", "avatarFrame", "chatEffect", "chatBackground", "nameColor", "badge"];

const typeLabels: Record<CosmeticsItemType, { ru: string; en: string }> = {
  cover: { ru: "Обложка", en: "Cover" },
  avatarFrame: { ru: "Рамка", en: "Frame" },
  chatEffect: { ru: "Эффект чата", en: "Chat effect" },
  chatBackground: { ru: "Фон чата", en: "Chat background" },
  nameColor: { ru: "Цвет имени", en: "Name color" },
  badge: { ru: "Бейдж", en: "Badge" },
};

export default function CosmeticsAdmin({ initialItems, canWrite }: { initialItems: CosmeticsItem[]; canWrite: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [notice, setNotice] = useState("");
  const [editTarget, setEditTarget] = useState<CosmeticsItem | null>(null);
  const [filterType, setFilterType] = useState<CosmeticsItemType | "all">("all");
  const { locale } = useLocale();
  const r = locale === "ru";

  const filtered = filterType === "all" ? items : items.filter((i) => i.type === filterType);

  async function request(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
    const res = await fetch("/api/admin/cosmetics", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed");
    return data;
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNotice("");
    try {
      const data = await request("POST", {
        type: form.get("type"), slug: form.get("slug"),
        nameRu: form.get("nameRu"), nameEn: form.get("nameEn"),
        value: form.get("value"), imageUrl: form.get("imageUrl") || "",
        sortOrder: Number(form.get("sortOrder")) || 0,
      });
      setItems((prev) => [...prev, data.item]);
      event.currentTarget.reset();
      setNotice(r ? "Создано" : "Created");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Error"); }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget) return;
    const form = new FormData(event.currentTarget);
    setNotice("");
    try {
      const data = await request("PATCH", {
        id: editTarget.id,
        type: form.get("type"), slug: form.get("slug"),
        nameRu: form.get("nameRu"), nameEn: form.get("nameEn"),
        value: form.get("value"), imageUrl: form.get("imageUrl") || "",
        sortOrder: Number(form.get("sortOrder")) || 0,
        active: form.get("active") === "true",
      });
      setItems((prev) => prev.map((i) => i.id === editTarget.id ? data.item : i));
      setEditTarget(null);
      setNotice(r ? "Сохранено" : "Saved");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Error"); }
  }

  async function remove(id: string) {
    if (!window.confirm(r ? "Удалить элемент?" : "Delete item?")) return;
    setNotice("");
    try {
      await request("DELETE", { id });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setNotice(r ? "Удалено" : "Deleted");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Error"); }
  }

  return <main className="admin-page">
    <header className="admin-header">
      <Link href="/admin" className="admin-brand">TUSA<span>.game</span></Link>
      <div>
        <LocaleToggle />
        <Link href="/admin/promos" className="admin-text-button">{r ? "Промо" : "Promos"}</Link>
        <span className="admin-kicker">{r ? "каталог косметики" : "cosmetics catalogue"}</span>
      </div>
    </header>
    <section className="admin-hero">
      <div>
        <span className="admin-kicker">{r ? "бейджи, рамки, цвета, обложки" : "badges, frames, colors, covers"}</span>
        <h1>{r ? "Косметика." : "Cosmetics."}</h1>
        <p>{r ? "Управление каталогом предметов косметики. Новые предметы можно добавлять через эту панель." : "Manage the cosmetics catalogue. Add new items through this panel."}</p>
      </div>
    </section>
    <section className="admin-metrics" aria-label="Counts">
      {types.map((type) => (<article key={type}><span>{typeLabels[type][locale]}</span><strong>{items.filter((i) => i.type === type).length}</strong><small>{r ? "шт" : "items"}</small></article>))}
    </section>
    {notice && <p className="admin-notice">{notice}</p>}
    <div className="admin-tabs">
      <button className={filterType === "all" ? "active" : ""} onClick={() => setFilterType("all")}>{r ? "Все" : "All"}</button>
      {types.map((type) => <button key={type} className={filterType === type ? "active" : ""} onClick={() => setFilterType(type)}>{typeLabels[type][locale]}</button>)}
    </div>
    <div className="cosmetics-grid">
      {canWrite && <form className="cosmetics-create-card" onSubmit={create}>
        <span className="admin-kicker">{r ? "новый" : "new"}</span>
        <h2>{r ? "Добавить предмет" : "Add item"}</h2>
        <label>{r ? "Тип" : "Type"}<select name="type" required>{types.map((t) => <option key={t} value={t}>{typeLabels[t][locale]}</option>)}</select></label>
        <label>Slug<input name="slug" required minLength={2} maxLength={64} placeholder="summer_frame" /></label>
        <label>{r ? "Название (RU)" : "Name (RU)"}<input name="nameRu" required /></label>
        <label>{r ? "Название (EN)" : "Name (EN)"}<input name="nameEn" required /></label>
        <label>{r ? "Значение" : "Value"}<input name="value" required placeholder="#ff0000 / neon / sparkle" /></label>
        <label>{r ? "URL картинки" : "Image URL"}<input name="imageUrl" placeholder="/cosmetics/frames/summer.png" /></label>
        <label>{r ? "Порядок" : "Sort order"}<input name="sortOrder" type="number" min="0" defaultValue="0" /></label>
        <button className="admin-button admin-button--lime">{r ? "Создать" : "Create"}</button>
      </form>}
      <div className="cosmetics-list-card">
        <div className="admin-table-head"><div><span className="admin-kicker">{r ? "каталог" : "catalogue"}</span><h2>{filtered.length} {r ? "шт" : "items"}</h2></div></div>
        <div className="cosmetics-list">{filtered.length === 0 ? <p className="empty-state">{r ? "Нет предметов" : "No items"}</p> : filtered.map((item) => <article key={item.id} className="cosmetics-row">
          <div><strong>{item.slug}</strong><span>{typeLabels[item.type][locale]} &middot; {locale === "ru" ? item.nameRu : item.nameEn}</span><em>{item.value}{item.imageUrl ? ` &middot; ${item.imageUrl}` : ""}</em></div>
          <span className={`cosmetics-status ${item.active ? "is-active" : "is-paused"}`}>{item.active ? (r ? "актив." : "active") : (r ? "выкл." : "off")}</span>
          {canWrite && <button className="admin-button admin-button--outline" onClick={() => setEditTarget(item)}>{r ? "Править" : "Edit"}</button>}
          {canWrite && <button className="admin-delete" onClick={() => remove(item.id)}>{r ? "Удалить" : "Delete"}</button>}
        </article>)}</div>
      </div>
    </div>
    {canWrite && editTarget && <div className="admin-modal-backdrop" onClick={() => setEditTarget(null)}><form className="admin-modal" onSubmit={saveEdit} onClick={(e) => e.stopPropagation()}>
      <span className="admin-kicker">{r ? "редактирование" : "editing"}</span>
      <h2>{editTarget.slug}</h2>
      <label>{r ? "Тип" : "Type"}<select name="type" defaultValue={editTarget.type} required>{types.map((t) => <option key={t} value={t}>{typeLabels[t][locale]}</option>)}</select></label>
      <label>Slug<input name="slug" defaultValue={editTarget.slug} required minLength={2} maxLength={64} /></label>
      <label>{r ? "Название (RU)" : "Name (RU)"}<input name="nameRu" defaultValue={editTarget.nameRu} required /></label>
      <label>{r ? "Название (EN)" : "Name (EN)"}<input name="nameEn" defaultValue={editTarget.nameEn} required /></label>
      <label>{r ? "Значение" : "Value"}<input name="value" defaultValue={editTarget.value} required /></label>
      <label>{r ? "URL картинки" : "Image URL"}<input name="imageUrl" defaultValue={editTarget.imageUrl} /></label>
      <label>{r ? "Порядок" : "Sort order"}<input name="sortOrder" type="number" min="0" defaultValue={editTarget.sortOrder} /></label>
      <label>{r ? "Активен" : "Active"}<select name="active" defaultValue={String(editTarget.active)}><option value="true">{r ? "Да" : "Yes"}</option><option value="false">{r ? "Нет" : "No"}</option></select></label>
      <div className="admin-modal-actions"><button type="button" className="admin-button" onClick={() => setEditTarget(null)}>{r ? "Отмена" : "Cancel"}</button><button className="admin-button admin-button--lime">{r ? "Сохранить" : "Save"}</button></div>
    </form></div>}
  </main>;
}
