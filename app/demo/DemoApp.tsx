"use client";

import Link from "next/link";
import { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import { useLocale } from "../components/LocaleProvider";
import { ChatHub } from "./components/ChatHub";
import { EventHub } from "./components/EventHub";
import { GalleryHub } from "./components/GalleryHub";
import { GamesHub } from "./components/GamesHub";
import { Icon } from "./components/Icon";
import { KoinsHub } from "./components/KoinsHub";
import { ProfileHub } from "./components/ProfileHub";
import { ShoppingHub } from "./components/ShoppingHub";
import { PlatformProvider, Tab, usePlatform } from "./PlatformContext";

export default function DemoApp() {
  return <PlatformProvider><PlatformShell /></PlatformProvider>;
}

function PlatformShell() {
  const { state, event, toast, switchEvent, resetPlatform, notify } = usePlatform();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { t } = useLocale();

  const navItems: Array<{ id: Tab; icon: string; label: string }> = [
    { id: "overview", icon: "home", label: t("demoNavHome") },
    { id: "games", icon: "sports_esports", label: t("demoNavGames") },
    { id: "shopping", icon: "checklist", label: t("demoNavShopping") },
    { id: "gallery", icon: "photo_camera", label: t("demoNavGallery") },
    { id: "chat", icon: "chat_bubble", label: t("demoNavChat") },
    { id: "koins", icon: "toll", label: t("demoNavKoins") },
    { id: "profile", icon: "person", label: t("demoNavProfile") },
  ];

  const unread = event.threads.reduce((sum, thread) => sum + thread.messages.length, 0);
  const inviteUrl = typeof window === "undefined" ? `https://tusa.game/demo?invite=${event.id}` : `${window.location.origin}/demo?invite=${event.id}`;

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
      await navigator.share({ title: event.title, text: t("demoShareText"), url: inviteUrl }).catch(() => undefined);
    } else {
      await copyInvite();
    }
  }

  return (
    <main className="demo-shell">
      <aside className="demo-rail">
        <Link className="demo-logo" href="/" aria-label={t("demoSiteHome")}><BrandLogo priority /><BrandLogo compact className="demo-logo-icon" /></Link>
        <nav className="demo-nav" aria-label={t("demoSections")}>
          {navItems.map((item) => (
            <button aria-current={activeTab === item.id ? "page" : undefined} className={activeTab === item.id ? "active" : ""} key={item.id} onClick={() => setActiveTab(item.id)} type="button">
              <Icon name={item.icon} /><span>{item.label}</span>{item.id === "chat" && <i>{unread}</i>}
            </button>
          ))}
        </nav>
        <button className="demo-reset" onClick={() => { if (window.confirm(t("demoResetConfirm"))) { resetPlatform(); setActiveTab("overview"); } }} type="button"><Icon name="restart_alt" /> {t("demoResetBtn")}</button>
      </aside>

      <section className="demo-workspace">
        <header className="demo-topbar">
          <div className="topbar-event-copy">
            <p>{t("demoLive")}</p>
            <select aria-label={t("demoSelectEvent")} value={event.id} onChange={(changeEvent) => { switchEvent(changeEvent.target.value); setActiveTab("overview"); }}>
              {state.events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          <div className="demo-top-actions">
            <button className="demo-icon-button" onClick={copyInvite} type="button" aria-label={t("demoCopyLinkAria")}><Icon name="content_copy" /></button>
            <button className="demo-action demo-action--lime" onClick={shareInvite} type="button"><Icon name="ios_share" /> {t("demoInvite")}</button>
          </div>
        </header>

        <div className="demo-content" key={activeTab}>
          {activeTab === "overview" && <EventHub openTab={(tab) => setActiveTab(tab)} />}
          {activeTab === "games" && <GamesHub />}
          {activeTab === "shopping" && <ShoppingHub />}
          {activeTab === "gallery" && <GalleryHub />}
          {activeTab === "chat" && <ChatHub />}
          {activeTab === "koins" && <KoinsHub />}
          {activeTab === "profile" && <ProfileHub />}
        </div>
      </section>

      <nav className="demo-mobile-nav" aria-label={t("demoSections")}>
        <div className="demo-mobile-nav-track">
          {navItems.map((item) => (
            <button aria-current={activeTab === item.id ? "page" : undefined} className={activeTab === item.id ? "active" : ""} key={item.id} onClick={() => setActiveTab(item.id)} type="button"><Icon name={item.icon} /><span>{item.label}</span></button>
          ))}
        </div>
      </nav>
      {toast && <div className="demo-toast" role="status"><Icon name="check_circle" /> {toast}</div>}
    </main>
  );
}
