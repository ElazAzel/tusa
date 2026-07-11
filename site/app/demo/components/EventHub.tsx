"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { eventRoles, EventRole, rsvpLabels, RsvpStatus, usePlatform } from "../PlatformContext";
import { Icon } from "./Icon";
import { useLocale } from "@/app/components/LocaleProvider";

type EventHubProps = { openTab: (tab: "games" | "shopping" | "chat" | "gallery") => void };

export function EventHub({ openTab }: EventHubProps) {
  const { state, event, updateEvent, createEvent, duplicateEvent, deleteEvent, notify, gainXp } = usePlatform();
  const { t } = useLocale();
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrSrc, setQrSrc] = useState("");
  const [note, setNote] = useState("");
  const [blast, setBlast] = useState("");
  const [guestName, setGuestName] = useState("");

  const categories = [
    ["house_party", t("eventHubCategoryHouse")],
    ["trip", t("eventHubCategoryTrip")],
    ["boardgames", t("eventHubCategoryBoard")],
    ["sport", t("eventHubCategorySport")],
    ["barbecue", t("eventHubCategoryBbq")],
    ["other", t("eventHubCategoryOther")],
  ];

  const inviteUrl = typeof window === "undefined" ? `https://tusa.game/demo?invite=${event.id}` : `${window.location.origin}/demo?invite=${event.id}`;

  useEffect(() => {
    QRCode.toDataURL(inviteUrl, { width: 360, margin: 2, color: { dark: "#000000", light: "#c9ff05" } })
      .then(setQrSrc)
      .catch(() => setQrSrc(""));
  }, [inviteUrl]);

  const self = event.participants.find((person) => person.id === state.profile.id);
  const going = event.participants.filter((person) => person.rsvp === "going");
  const maybe = event.participants.filter((person) => person.rsvp === "maybe");
  const completed = event.shopping.filter((item) => item.purchased).length;
  const pinnedNotes = useMemo(() => [...event.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned)), [event.notes]);

  function setRsvp(status: RsvpStatus) {
    if (status === "going" && self?.rsvp !== "going" && going.length >= event.capacity) {
      notify(t("demoLimitReached"));
      status = "maybe";
    }
    updateEvent((current) => ({
      ...current,
      participants: current.participants.map((person) => person.id === state.profile.id ? { ...person, rsvp: status } : person),
    }));
    gainXp(5, `${t("demoRsvpGain")}${rsvpLabels[status]}`);
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      notify(t("demoCopyLink"));
    } catch {
      window.prompt(t("demoCopyEvent"), inviteUrl);
    }
  }

  async function shareInvite() {
    if (navigator.share) {
      await navigator.share({ title: event.title, text: t("demoShareEvent"), url: inviteUrl }).catch(() => undefined);
      return;
    }
    await copyInvite();
  }

  async function sendNotification(text: string) {
    if (!("Notification" in window)) {
      notify(t("demoNoNotification"));
      return;
    }
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") {
      notify(t("demoNotificationOff"));
      return;
    }
    let registration: ServiceWorkerRegistration | null = null;
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 900)),
      ]).catch(() => null);
    }
    if (registration) await registration.showNotification(`TUSA.game · ${event.title}`, { body: text, icon: "/brand/tusa-game-icon.png" });
    else new Notification(`TUSA.game · ${event.title}`, { body: text, icon: "/brand/tusa-game-icon.png" });
    notify(t("demoNotificationSent"));
  }

  function addNote(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!note.trim()) return;
    updateEvent((current) => ({ ...current, notes: [...current.notes, { id: `note_${Date.now()}`, text: note.trim(), pinned: false }] }));
    setNote("");
    gainXp(3, t("demoNoteAdded"));
  }

  function sendBlast(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!blast.trim()) return;
    const createdAt = new Date().toISOString();
    updateEvent((current) => ({
      ...current,
      blasts: [{ id: `blast_${Date.now()}`, text: blast.trim(), createdAt }, ...current.blasts],
      threads: current.threads.map((thread, index) => index === 0 ? {
        ...thread,
        messages: [...thread.messages, { id: `msg_${Date.now()}`, authorId: state.profile.id, author: state.profile.name, text: `📣 ${blast.trim()}`, createdAt, reactions: {}, pinned: true }],
      } : thread),
    }));
    void sendNotification(blast.trim());
    setBlast("");
    gainXp(10, t("demoBlastSent"));
  }

  function addGuest(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!guestName.trim()) return;
    updateEvent((current) => ({
      ...current,
      participants: [...current.participants, {
        id: `guest_${Date.now()}`,
        name: guestName.trim(),
        initials: guestName.trim().slice(0, 2).toUpperCase(),
        rsvp: "maybe",
        role: "guest",
      }],
    }));
    setGuestName("");
    notify(t("demoGuestAdded"));
  }

  function createFromForm(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = new FormData(formEvent.currentTarget);
    createEvent({
      title: String(form.get("title") || t("eventHubCreateSub")),
      description: String(form.get("description") || ""),
      category: String(form.get("category") || "other"),
      date: String(form.get("date") || "2026-07-17"),
      time: String(form.get("time") || "20:00"),
      venue: String(form.get("venue") || "Место уточним"),
      capacity: Number(form.get("capacity") || 12),
      privacy: form.get("privacy") === "unlisted" ? "unlisted" : "private",
      vibeTags: String(form.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 10),
    });
    setShowCreate(false);
  }

  return (
    <div className="demo-overview">
      <section className="demo-hero-card">
        <div>
          <span className="demo-kicker">{categories.find(([value]) => value === event.category)?.[1] ?? "ТУСА"} · {event.privacy === "private" ? t("eventHubSelf") : t("eventHubLink")}</span>
          <h2>{event.title}</h2>
          <p><Icon name="calendar_month" /> {event.date} · {event.time}</p>
          <p><Icon name="location_on" /> {event.venue}</p>
          <div className="event-rsvp" aria-label="Моё участие">
            {(["going", "maybe", "pass"] as RsvpStatus[]).map((status) => (
              <button className={self?.rsvp === status ? "active" : ""} key={status} onClick={() => setRsvp(status)} type="button">{rsvpLabels[status]}</button>
            ))}
          </div>
          <div className="demo-hero-actions">
            <button className="demo-action demo-action--dark" onClick={() => openTab("chat")} type="button"><Icon name="chat_bubble" /> {t("eventHubToChat")}</button>
            <button className="demo-action demo-action--white" onClick={shareInvite} type="button"><Icon name="ios_share" /> {t("eventHubShare")}</button>
          </div>
        </div>
        <div className="demo-hero-stamp"><strong>{going.length}</strong><span>{t("eventHubGoing")}</span></div>
      </section>

      <div className="event-toolbar scroll-row" aria-label="Действия с ивентом">
        <button onClick={() => setShowCreate(true)} type="button"><Icon name="add_circle" /> {t("eventHubNew")}</button>
        <button onClick={() => setShowSettings((value) => !value)} type="button"><Icon name="tune" /> {t("eventHubSettings")}</button>
        <button onClick={duplicateEvent} type="button"><Icon name="content_copy" /> {t("eventHubDuplicate")}</button>
        <button onClick={() => setShowQr(true)} type="button"><Icon name="qr_code_2" /> {t("eventHubQr")}</button>
        <button onClick={() => void sendNotification(`Напоминание: ${event.title} начнётся ${event.date} в ${event.time}`)} type="button"><Icon name="notifications_active" /> {t("eventHubRemind")}</button>
        <button className="danger" onClick={() => { if (window.confirm(`${t("demoConfirmDelete")}${event.title}${t("demoConfirmDeleteEnd")}`)) deleteEvent(); }} type="button"><Icon name="delete" /> {t("eventHubDelete")}</button>
      </div>

      {showSettings && (
        <section className="demo-card demo-card--settings event-settings-panel">
          <div className="demo-card-head"><div><span>{t("eventHubSettingsTitle")}</span><h3>{t("eventHubSettingsSub")}</h3></div><Icon name="tune" /></div>
          <div className="settings-grid">
            <label>{t("eventHubName")}<input value={event.title} onChange={(changeEvent) => updateEvent((current) => ({ ...current, title: changeEvent.target.value }))} /></label>
            <label>{t("eventHubCategory")}<select value={event.category} onChange={(changeEvent) => updateEvent((current) => ({ ...current, category: changeEvent.target.value }))}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>{t("eventHubDate")}<input type="date" value={event.date} onChange={(changeEvent) => updateEvent((current) => ({ ...current, date: changeEvent.target.value }))} /></label>
            <label>{t("eventHubTime")}<input type="time" value={event.time} onChange={(changeEvent) => updateEvent((current) => ({ ...current, time: changeEvent.target.value }))} /></label>
            <label>{t("eventHubVenue")}<input value={event.venue} onChange={(changeEvent) => updateEvent((current) => ({ ...current, venue: changeEvent.target.value }))} /></label>
            <label>{t("eventHubLimit")}<input min="2" max="50" type="number" value={event.capacity} onChange={(changeEvent) => updateEvent((current) => ({ ...current, capacity: Number(changeEvent.target.value) }))} /></label>
            <label className="settings-wide">{t("eventHubDesc")}<textarea value={event.description} onChange={(changeEvent) => updateEvent((current) => ({ ...current, description: changeEvent.target.value }))} /></label>
          </div>
        </section>
      )}

      <div className="demo-overview-grid event-overview-grid">
        <section className="demo-card demo-card--people event-participants-card">
          <div className="demo-card-head"><div><span>КОМПАНИЯ</span><h3>{going.length}{t("eventHubGoingCount")}{maybe.length}{t("eventHubThinkingCount")}</h3></div><Icon name="groups" /></div>
          <div className="participant-list">
            {event.participants.map((person) => (
              <div className="participant-row" key={person.id}>
                <span className={`participant-avatar ${person.rsvp}`}>{person.initials}</span>
                <div><strong>{person.id === state.profile.id ? `${person.name}${t("eventHubYou")}` : person.name}</strong><small>{rsvpLabels[person.rsvp]}</small></div>
                <select aria-label={`${t("eventHubRole")}${person.name}`} value={person.role} onChange={(changeEvent) => updateEvent((current) => ({ ...current, participants: current.participants.map((item) => item.id === person.id ? { ...item, role: changeEvent.target.value as EventRole } : item) }))}>
                  {eventRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
                {person.id !== state.profile.id && <button aria-label={`${t("eventHubDeletePerson")}${person.name}`} onClick={() => updateEvent((current) => ({ ...current, participants: current.participants.filter((item) => item.id !== person.id) }))} type="button"><Icon name="close" /></button>}
              </div>
            ))}
          </div>
          <form className="compact-form" onSubmit={addGuest}><input aria-label="Имя гостя" placeholder={t("eventHubGuestPlace")} value={guestName} onChange={(changeEvent) => setGuestName(changeEvent.target.value)} /><button type="submit"><Icon name="person_add" /></button></form>
          <button className="demo-text-button" onClick={copyInvite} type="button">{t("eventHubCopyInvite")} <Icon name="arrow_forward" /></button>
        </section>

        <section className="demo-card demo-card--next">
          <div className="demo-card-head"><div><span>ИГРЫ</span><h3>{t("eventHubGamesReady")}</h3></div><Icon name="sports_esports" /></div>
          <p>{t("eventHubGamesDesc")}</p>
          <button className="demo-text-button" onClick={() => openTab("games")} type="button">{t("eventHubPickGame")} <Icon name="arrow_forward" /></button>
        </section>

        <section className="demo-card demo-card--shopping">
          <div className="demo-card-head"><div><span>ПОКУПКИ</span><h3>{completed}/{event.shopping.length}{t("eventHubShoppingReady")}</h3></div><Icon name="checklist" /></div>
          <div className="demo-progress"><span style={{ width: event.shopping.length ? `${(completed / event.shopping.length) * 100}%` : "0%" }} /></div>
          <button className="demo-text-button" onClick={() => openTab("shopping")} type="button">{t("eventHubShoppingBtn")} <Icon name="arrow_forward" /></button>
        </section>

        <section className="demo-card event-notes-card">
          <div className="demo-card-head"><div><span>ЗАМЕТКИ</span><h3>{t("eventHubNotesSub")}</h3></div><Icon name="push_pin" /></div>
          <div className="event-notes-list">
            {pinnedNotes.map((item) => <article key={item.id}><button aria-label={item.pinned ? t("eventHubUnpin") : t("eventHubPin")} onClick={() => updateEvent((current) => ({ ...current, notes: current.notes.map((entry) => entry.id === item.id ? { ...entry, pinned: !entry.pinned } : entry) }))} type="button"><Icon name={item.pinned ? "keep" : "keep_off"} /></button><p>{item.text}</p><button aria-label={t("eventHubDeleteNote")} onClick={() => updateEvent((current) => ({ ...current, notes: current.notes.filter((entry) => entry.id !== item.id) }))} type="button"><Icon name="close" /></button></article>)}
            {!event.notes.length && <p className="empty-copy">{t("eventHubNotesEmpty")}</p>}
          </div>
          <form className="compact-form" onSubmit={addNote}><input aria-label={t("eventHubNewNote")} placeholder={t("eventHubNotePlace")} value={note} onChange={(changeEvent) => setNote(changeEvent.target.value)} /><button type="submit"><Icon name="add" /></button></form>
        </section>

        <section className="demo-card event-blast-card">
          <div className="demo-card-head"><div><span>BLAST</span><h3>{t("eventHubBlastSub")}</h3></div><Icon name="campaign" /></div>
          <p>{t("eventHubBlastDesc")}</p>
          <form className="compact-form" onSubmit={sendBlast}><input aria-label={t("eventHubBlastText")} placeholder={t("eventHubBlastPlace")} value={blast} onChange={(changeEvent) => setBlast(changeEvent.target.value)} /><button type="submit"><Icon name="send" /></button></form>
          {event.blasts[0] && <small className="last-blast">{t("eventHubBlastLast")}{event.blasts[0].text}</small>}
        </section>
      </div>

      {showQr && (
        <div className="demo-modal-backdrop" role="presentation" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) setShowQr(false); }}>
          <section aria-modal="true" className="demo-modal qr-modal" role="dialog">
            <button className="modal-close" aria-label={t("eventHubCloseQr")} onClick={() => setShowQr(false)} type="button"><Icon name="close" /></button>
            <span className="demo-kicker">{t("eventHubQrTitle")}</span><h2>{t("eventHubQrSub")}</h2>
            {qrSrc && <Image alt={`QR-код приглашения на ${event.title}`} height={360} src={qrSrc} unoptimized width={360} />}
            <button className="demo-action demo-action--lime" onClick={copyInvite} type="button"><Icon name="content_copy" /> {t("eventHubQrCopy")}</button>
          </section>
        </div>
      )}

      {showCreate && (
        <div className="demo-modal-backdrop" role="presentation" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) setShowCreate(false); }}>
          <section aria-modal="true" className="demo-modal create-event-modal" role="dialog">
            <button className="modal-close" aria-label={t("eventHubCloseCreate")} onClick={() => setShowCreate(false)} type="button"><Icon name="close" /></button>
            <span className="demo-kicker">{t("eventHubCreateTitle")}</span><h2>{t("eventHubCreateSub")}</h2>
            <form onSubmit={createFromForm}>
              <label>{t("eventHubCreateName")}<input minLength={3} name="title" placeholder={t("eventHubCreateNamePlace")} required /></label>
              <label>{t("eventHubCreateDesc")}<textarea name="description" placeholder={t("eventHubCreateDescPlace")} /></label>
              <div className="modal-form-grid">
                <label>{t("eventHubCreateCategory")}<select name="category">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>{t("eventHubCreateLimit")}<input defaultValue="12" max="50" min="2" name="capacity" type="number" /></label>
                <label>{t("eventHubCreateDate")}<input name="date" required type="date" /></label>
                <label>{t("eventHubCreateTime")}<input defaultValue="20:00" name="time" required type="time" /></label>
              </div>
              <label>{t("eventHubCreateVenue")}<input name="venue" placeholder={t("eventHubCreateVenuePlace")} /></label>
              <label>{t("eventHubCreateTags")}<input name="tags" placeholder={t("eventHubCreateTagsPlace")} /></label>
              <label>{t("eventHubCreatePrivacy")}<select name="privacy"><option value="private">{t("eventHubPrivate")}</option><option value="unlisted">{t("eventHubUnlisted")}</option></select></label>
              <button className="demo-action demo-action--lime" type="submit"><Icon name="celebration" /> {t("eventHubCreateBtn")}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
