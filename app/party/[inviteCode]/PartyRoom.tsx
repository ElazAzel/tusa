"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { Party, PartyRole, RsvpStatus, GameSession, ChatMessage, GameScore } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import LocaleToggle from "@/app/components/LocaleToggle";
import { useLiveStream } from "@/app/components/useLiveStream";
import { useGameRole } from "@/app/components/useGameRole";
import AliasGame from "@/app/components/games/AliasGame";
import MafiaGame from "@/app/components/games/MafiaGame";
import TruthOrDare from "@/app/components/games/TruthOrDare";
import NeverHaveIEver from "@/app/components/games/NeverHaveIEver";
import BeerPong from "@/app/components/games/BeerPong";
import QuizBattle from "@/app/components/games/QuizBattle";
import RandomPair from "@/app/components/games/RandomPair";
import UnoTracker from "@/app/components/games/UnoTracker";
import WouldYouRather from "@/app/components/games/WouldYouRather";
import TwoTruths from "@/app/components/games/TwoTruths";
import KissMarryKill from "@/app/components/games/KissMarryKill";
import BlankSlate from "@/app/components/games/BlankSlate";
import BombParty from "@/app/components/games/BombParty";
import Wheel from "@/app/components/games/Wheel";
import BrainBurst from "@/app/components/games/BrainBurst";
import TriviaGame from "@/app/components/games/Trivia";
import ImpostorGame from "@/app/components/games/Impostor";
import SpyfallGame from "@/app/components/games/Spyfall";
import CodenamesGame from "@/app/components/games/Codenames";
import WavelengthGame from "@/app/components/games/Wavelength";
import QuiplashGame from "@/app/components/games/Quiplash";
import FibbageGame from "@/app/components/games/Fibbage";
import HeadsUpGame from "@/app/components/games/HeadsUp";
import GuessSongGame from "@/app/components/games/GuessSong";
import CharadesGame from "@/app/components/games/Charades";
import CrocodilGame from "@/app/components/games/Crocodil";
import WerewolfGame from "@/app/components/games/Werewolf";
import BunkerGame from "@/app/components/games/Bunker";
import ShoppingList from "@/app/components/ShoppingList";
import Gallery from "@/app/components/Gallery";
import Koins from "@/app/components/Koins";
import VoiceRecorder from "@/app/components/chat/VoiceRecorder";
import StickerPicker from "@/app/components/chat/StickerPicker";
import EmojiPicker from "@/app/components/chat/EmojiPicker";
import { tusaStickers } from "@/app/components/chat/stickers";
import { eventDateInputValue, formatEventDate } from "@/lib/event-format";
import { soundChat, soundTap, soundReward } from "@/lib/audio";

type GameId = "alias" | "mafia" | "truth" | "never" | "beer" | "quiz" | "pairs" | "uno" | "wouldRather" | "twoTruths" | "kissMarry" | "blankSlate" | "bombParty" | "wheel" | "brainBurst" | "trivia" | "impostor" | "spyfall" | "codenames" | "wavelength" | "quiplash" | "fibbage" | "headsup" | "guessSong" | "charades" | "crocodil" | "werewolf" | "bunker";

type TitleKey = "gamesAliasTitle" | "gamesMafiaTitle" | "gamesTruthTitle" | "gamesNeverTitle" | "gamesBeerTitle" | "gamesQuizTitle" | "gamesPairsTitle" | "gamesUnoTitle" | "gamesWouldRatherTitle" | "gamesTwoTruthsTitle" | "gamesKissMarryTitle" | "gamesBlankSlateTitle" | "gamesBombPartyTitle" | "gamesWheelTitle" | "gamesBrainBurstTitle" | "gamesTriviaTitle" | "gamesImpostorTitle" | "gamesSpyfallTitle" | "gamesCodenamesTitle" | "gamesWavelengthTitle" | "gamesQuiplashTitle" | "gamesFibbageTitle" | "gamesHeadsUpTitle" | "gamesGuessSongTitle" | "gamesCharadesTitle" | "gamesCrocodilTitle" | "gamesWerewolfTitle" | "gamesBunkerTitle";
type DescKey = "gamesAliasDesc" | "gamesMafiaDesc" | "gamesTruthDesc" | "gamesNeverDesc" | "gamesBeerDesc" | "gamesQuizDesc" | "gamesPairsDesc" | "gamesUnoDesc" | "gamesWouldRatherDesc" | "gamesTwoTruthsDesc" | "gamesKissMarryDesc" | "gamesBlankSlateDesc" | "gamesBombPartyDesc" | "gamesWheelDesc" | "gamesBrainBurstDesc" | "gamesTriviaDesc" | "gamesImpostorDesc" | "gamesSpyfallDesc" | "gamesCodenamesDesc" | "gamesWavelengthDesc" | "gamesQuiplashDesc" | "gamesFibbageDesc" | "gamesHeadsUpDesc" | "gamesGuessSongDesc" | "gamesCharadesDesc" | "gamesCrocodilDesc" | "gamesWerewolfDesc" | "gamesBunkerDesc";
const gameCatalogue: Array<{ id: GameId; titleKey: TitleKey; descKey: DescKey; icon: string; players: string; tone: string }> = [
  { id: "alias", titleKey: "gamesAliasTitle", descKey: "gamesAliasDesc", icon: "record_voice_over", players: "4+", tone: "lime" },
  { id: "mafia", titleKey: "gamesMafiaTitle", descKey: "gamesMafiaDesc", icon: "mystery", players: "5+", tone: "pink" },
  { id: "truth", titleKey: "gamesTruthTitle", descKey: "gamesTruthDesc", icon: "casino", players: "2+", tone: "blue" },
  { id: "never", titleKey: "gamesNeverTitle", descKey: "gamesNeverDesc", icon: "front_hand", players: "3+", tone: "cream" },
  { id: "beer", titleKey: "gamesBeerTitle", descKey: "gamesBeerDesc", icon: "sports_bar", players: "2+", tone: "pink" },
  { id: "quiz", titleKey: "gamesQuizTitle", descKey: "gamesQuizDesc", icon: "quiz", players: "2+", tone: "lime" },
  { id: "pairs", titleKey: "gamesPairsTitle", descKey: "gamesPairsDesc", icon: "shuffle", players: "4+", tone: "blue" },
  { id: "uno", titleKey: "gamesUnoTitle", descKey: "gamesUnoDesc", icon: "style", players: "2+", tone: "cream" },
  { id: "werewolf", titleKey: "gamesWerewolfTitle", descKey: "gamesWerewolfDesc", icon: "bug_report", players: "4+", tone: "pink" },
  { id: "codenames", titleKey: "gamesCodenamesTitle", descKey: "gamesCodenamesDesc", icon: "vpn_key", players: "4+", tone: "blue" },
  { id: "spyfall", titleKey: "gamesSpyfallTitle", descKey: "gamesSpyfallDesc", icon: "visibility", players: "4+", tone: "lime" },
  { id: "impostor", titleKey: "gamesImpostorTitle", descKey: "gamesImpostorDesc", icon: "person_off", players: "4+", tone: "cream" },
  { id: "crocodil", titleKey: "gamesCrocodilTitle", descKey: "gamesCrocodilDesc", icon: "theater_comedy", players: "4+", tone: "lime" },
  { id: "headsup", titleKey: "gamesHeadsUpTitle", descKey: "gamesHeadsUpDesc", icon: "cell_tower", players: "2+", tone: "blue" },
  { id: "quiplash", titleKey: "gamesQuiplashTitle", descKey: "gamesQuiplashDesc", icon: "emoji_emotions", players: "3+", tone: "pink" },
  { id: "fibbage", titleKey: "gamesFibbageTitle", descKey: "gamesFibbageDesc", icon: "psychology", players: "3+", tone: "cream" },
  { id: "wouldRather", titleKey: "gamesWouldRatherTitle", descKey: "gamesWouldRatherDesc", icon: "compare", players: "2+", tone: "lime" },
  { id: "twoTruths", titleKey: "gamesTwoTruthsTitle", descKey: "gamesTwoTruthsDesc", icon: "fact_check", players: "3+", tone: "blue" },
  { id: "blankSlate", titleKey: "gamesBlankSlateTitle", descKey: "gamesBlankSlateDesc", icon: "edit_note", players: "3+", tone: "cream" },
  { id: "wavelength", titleKey: "gamesWavelengthTitle", descKey: "gamesWavelengthDesc", icon: "tune", players: "4+", tone: "pink" },
  { id: "brainBurst", titleKey: "gamesBrainBurstTitle", descKey: "gamesBrainBurstDesc", icon: "bolt", players: "2+", tone: "lime" },
  { id: "guessSong", titleKey: "gamesGuessSongTitle", descKey: "gamesGuessSongDesc", icon: "music_note", players: "2+", tone: "blue" },
  { id: "bombParty", titleKey: "gamesBombPartyTitle", descKey: "gamesBombPartyDesc", icon: "local_fire_department", players: "2+", tone: "pink" },
  { id: "bunker", titleKey: "gamesBunkerTitle", descKey: "gamesBunkerDesc", icon: "shield", players: "5+", tone: "cream" },
  { id: "wheel", titleKey: "gamesWheelTitle", descKey: "gamesWheelDesc", icon: "casino", players: "2+", tone: "lime" },
  { id: "kissMarry", titleKey: "gamesKissMarryTitle", descKey: "gamesKissMarryDesc", icon: "favorite", players: "3+", tone: "pink" },
  { id: "charades", titleKey: "gamesCharadesTitle", descKey: "gamesCharadesDesc", icon: "theater_comedy", players: "4+", tone: "blue" },
  { id: "trivia", titleKey: "gamesTriviaTitle", descKey: "gamesTriviaDesc", icon: "school", players: "2+", tone: "cream" },
];

export default function PartyRoom({ party }: { party: Party }) {
  const [tab, setTab] = useState<"space" | "games" | "chat" | "shop" | "gallery" | "koins">("space");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [rsvp, setRsvp] = useState(party.myRsvp || "going");
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [gameSession, setGameSession] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [members, setMembers] = useState<Array<{ clerkUserId: string; displayName: string; role: PartyRole; rsvpStatus: RsvpStatus }>>([]);
  const [activeSessions, setActiveSessions] = useState<(GameSession & { participants: string[] })[]>([]);
  const [paymentAssignee, setPaymentAssignee] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [rsvpFilter, setRsvpFilter] = useState<"all" | RsvpStatus>("all");
  const [gameResults, setGameResults] = useState<{ scores: GameScore[]; gameTitle: string } | null>(null);
  const [rsvpCounts, setRsvpCounts] = useState(party.rsvpCounts);
  const { user } = useUser();
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatStreamRef = useRef<HTMLDivElement>(null);
  const { locale, t } = useLocale();
  const isOwner = party.role === "owner";
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${party.inviteCode}` : "";
  const filteredMembers = rsvpFilter === "all" ? members : members.filter((m) => m.rsvpStatus === rsvpFilter);
  const activeSession = activeSessions.find((s) => s.id === gameSession);
  const gameRole = useGameRole(activeSession?.participants ?? [], user?.id);

  const liveChat = useLiveStream<Record<string, unknown>>(`chat:${party.id}`);
  const liveParty = useLiveStream<Record<string, unknown>>(`party:${party.id}`);

  useEffect(() => {
    liveChat.events.forEach((raw) => {
      if (raw.type === "reaction" && raw.messageId) {
        setChatMessages((prev) => prev.map((m) => m.id === raw.messageId ? { ...m, reactions: raw.reactions as Record<string, string[]> } : m));
      }
    });
  }, [liveChat.events]);

  const allChatMessages = useMemo(() => {
    const existing = new Set(chatMessages.map((msg) => msg.id));
    const liveFiltered = liveChat.events.filter((raw) => {
      if (raw.type === "reaction") return false;
      return raw.id && !existing.has(raw.id as string);
    }).map((raw) => raw as unknown as ChatMessage);
    return [...chatMessages, ...liveFiltered];
  }, [chatMessages, liveChat.events]);

  useEffect(() => {
    let cancelled = false;
    async function loadChat(retries = 3) {
      for (let i = 0; i < retries; i++) {
        try {
          const r = await fetch(`/api/chat?partyId=${party.id}`);
          if (!r.ok) { await new Promise((res) => setTimeout(res, 1000 * (i + 1))); continue; }
          const data = await r.json();
          if (!cancelled && data.messages) setChatMessages(data.messages as ChatMessage[]);
          return;
        } catch { if (i < retries - 1) await new Promise((res) => setTimeout(res, 1000 * (i + 1))); }
      }
    }
    loadChat();
    return () => { cancelled = true; };
  }, [party.id]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [allChatMessages.length]);

  function send() {
    const text = message.trim();
    if (!text) return;
    soundChat();
    fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId: party.id, text }) })
      .then(() => setMessage("")).catch(() => undefined);
  }

  function sendVoice(blob: Blob) {
    const reader = new FileReader();
    reader.onload = () => {
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: party.id, text: "", type: "voice", voiceUrl: reader.result as string }),
      }).catch(() => undefined);
    };
    reader.readAsDataURL(blob);
    setShowVoice(false);
  }

  function sendSticker(stickerId: string) {
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId: party.id, text: "", type: "sticker", stickerId }),
    }).catch(() => undefined);
  }

  function react(messageId: string, emoji: string) {
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "react", partyId: party.id, messageId, emoji }),
    }).catch(() => undefined);
  }
  useEffect(() => { fetch(`/api/parties/${party.inviteCode}/members`).then((r) => r.json()).then((data) => { if (data.members) setMembers(data.members); }).catch(() => undefined); }, [party.inviteCode]);

  useEffect(() => {
    fetch(`/api/games?partyId=${party.id}`).then((r) => r.json()).then((data) => {
      if (data.sessions) setActiveSessions(data.sessions);
    }).catch(() => undefined);
  }, [party.id]);

  useEffect(() => {
    liveParty.events.forEach((ev) => {
      if (ev.type === "session:created" && ev.session) {
        const s = ev.session as GameSession & { participants: string[] };
        setActiveSessions((prev) => [s, ...prev.filter((p) => p.id !== s.id)]);
      }
      if (ev.type === "session:updated" && ev.session) {
        const s = ev.session as GameSession & { participants: string[] };
        setActiveSessions((prev) => prev.map((p) => p.id === s.id ? s : p));
      }
      if (ev.type === "session:completed" && ev.sessionId) {
        setActiveSessions((prev) => prev.filter((p) => p.id !== ev.sessionId));
      }
    });
  }, [liveParty.events]);

  useEffect(() => {
    fetch(`/api/games/payment?partyId=${party.id}`).then((r) => r.json()).then((data) => {
      if (data.paidBy) setPaymentAssignee(data.paidBy);
    }).catch(() => undefined);
  }, [party.id]);

  function launchGame(game: GameId) {
    setSelectedGame(game);
    fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", partyId: party.id, game }) })
      .then((r) => r.json()).then((data) => {
        if (data.session) {
          setGameSession(data.session.id);
          setActiveSessions((prev) => [data.session, ...prev.filter((s) => s.id !== data.session.id)]);
        }
      }).catch(() => undefined);
  }

  function joinSession(sessionId: string, game: string) {
    setSelectedGame(game as GameId);
    setGameSession(sessionId);
    fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", sessionId }) })
      .then((r) => r.json()).then((data) => {
        if (data.session) {
          setActiveSessions((prev) => prev.map((s) => s.id === sessionId ? data.session : s));
        }
      }).catch(() => undefined);
  }

  function saveGameScore(score: number) {
    if (!gameSession || !selectedGame) return;
    const game = gameCatalogue.find((g) => g.id === selectedGame);
    fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "score", sessionId: gameSession, score, metadata: { game: selectedGame } }) })
      .then((r) => r.json()).then((data) => {
        if (data.scores) setGameResults({ scores: data.scores as GameScore[], gameTitle: game ? t(game.titleKey) : "" });
      }).catch(() => undefined);
  }

  function closeGameResults() {
    setGameResults(null);
    setGameSession(null);
    setSelectedGame(null);
  }

  function backToCatalogue() {
    if (gameSession) {
      fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave", sessionId: gameSession }) }).catch(() => undefined);
    }
    setSelectedGame(null);
    setGameSession(null);
  }

  async function toggleRole(targetUserId: string, newRole: "co_host" | "guest") {
    await fetch(`/api/parties/${party.inviteCode}/members`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId, role: newRole }) });
    fetch(`/api/parties/${party.inviteCode}/members`).then((r) => r.json()).then((data) => { if (data.members) setMembers(data.members); });
  }

  async function assignPayment(targetUserId: string) {
    setPaymentLoading(true);
    try {
      await fetch("/api/games/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId: party.id, targetUserId }) });
      setPaymentAssignee(targetUserId);
    } catch { /* ignore */ }
    setPaymentLoading(false);
  }

  async function updateRsvp(status: RsvpStatus) { setRsvp(status); try { const res = await fetch(`/api/parties/${party.inviteCode}/rsvp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rsvp: status }) }); if (res.ok) { const data = await res.json(); if (data.party) setRsvpCounts(data.party.rsvpCounts); } } catch { /* ignore */ } }
  async function deleteParty() { if (!confirm(t("roomDeleteConfirm"))) return; await fetch("/api/parties", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: party.id }) }); router.push("/app"); }
  async function saveEdit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); await fetch("/api/parties", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, id: party.id }) }); setEditing(false); router.refresh(); }
  async function generateQr() {
    try { const QRCode = (await import("qrcode")); const url = await QRCode.toDataURL(inviteUrl, { width: 320, margin: 2, color: { dark: "#000000", light: "#ffffff" } }); setQrUrl(url); }
    catch { setError(t("createError")); }
  }

  function renderGame() {
    const game = gameCatalogue.find((g) => g.id === selectedGame);
    const props = { partyId: party.id, sessionId: gameSession, onSave: saveGameScore, role: gameRole };
    const board = selectedGame === "alias" ? <AliasGame {...props} /> :
      selectedGame === "mafia" ? <MafiaGame {...props} /> :
      selectedGame === "truth" ? <TruthOrDare {...props} /> :
      selectedGame === "never" ? <NeverHaveIEver {...props} /> :
      selectedGame === "beer" ? <BeerPong {...props} /> :
      selectedGame === "quiz" ? <QuizBattle {...props} /> :
      selectedGame === "pairs" ? <RandomPair {...props} /> :
      selectedGame === "uno" ? <UnoTracker {...props} /> :
      selectedGame === "wouldRather" ? <WouldYouRather {...props} /> :
      selectedGame === "twoTruths" ? <TwoTruths {...props} /> :
      selectedGame === "kissMarry" ? <KissMarryKill {...props} /> :
      selectedGame === "blankSlate" ? <BlankSlate {...props} /> :
      selectedGame === "bombParty" ? <BombParty {...props} /> :
      selectedGame === "wheel" ? <Wheel {...props} /> :
      selectedGame === "brainBurst" ? <BrainBurst {...props} /> :
      selectedGame === "trivia" ? <TriviaGame {...props} /> :
      selectedGame === "impostor" ? <ImpostorGame {...props} /> :
      selectedGame === "spyfall" ? <SpyfallGame {...props} /> :
      selectedGame === "codenames" ? <CodenamesGame {...props} /> :
      selectedGame === "wavelength" ? <WavelengthGame {...props} /> :
      selectedGame === "quiplash" ? <QuiplashGame {...props} /> :
      selectedGame === "fibbage" ? <FibbageGame {...props} /> :
      selectedGame === "headsup" ? <HeadsUpGame {...props} /> :
      selectedGame === "guessSong" ? <GuessSongGame {...props} /> :
      selectedGame === "charades" ? <CharadesGame {...props} /> :
      selectedGame === "crocodil" ? <CrocodilGame {...props} /> :
      selectedGame === "werewolf" ? <WerewolfGame {...props} /> :
      selectedGame === "bunker" ? <BunkerGame {...props} /> : null;
    return <section className="party-room-panel"><div className="active-game-head"><button onClick={backToCatalogue} type="button"><span className="material-symbols-rounded">arrow_back</span> {t("gamesBack")}</button><div><span>{t("gamesMode")}</span><h2>{game ? t(game.titleKey) : ""}</h2></div><span className="demo-chip">{game?.players}{t("gamesPlayers")}</span></div>{board}</section>;
  }

  return <main className={`party-room ${party.adultOnly ? "party-room--adult" : "party-room--family"}`}>
    <header className="party-room-header">
      <Link href="/app">{t("backToParties")}</Link>
      <strong>{party.title}</strong>
      <div><LocaleToggle /><span>{party.memberCount} {t("roomInside")}</span></div>
    </header>

    <section className="party-room-hero">
      <span>{party.adultOnly ? t("roomAdult") : t("roomFamily")}</span>
      <h1>{party.title}</h1>
      <p>{formatEventDate(party.date, locale)} · {party.time} · {party.venue}</p>
      <div className="party-room-rsvp">
        <b>{t("eventHubGoing")}: {rsvpCounts.going}</b>
        <b>{t("eventHubThinkingCount")}: {rsvpCounts.maybe}</b>
      </div>
      <div className="party-room-rsvp-toggle">
        {["going", "maybe", "pass"].map((status) => (
          <button className={rsvp === status ? "active" : ""} key={status} onClick={() => updateRsvp(status as RsvpStatus)} type="button">
            {status === "going" ? t("eventHubGoing") : status === "maybe" ? t("eventHubThinkingCount") : t("eventHubPass")}
          </button>
        ))}
      </div>
      <div>
        <button onClick={() => setTab("space")} className={tab === "space" ? "active" : ""} type="button"><span className="material-symbols-rounded">home</span>{t("roomSpace")}</button>
        <button onClick={() => setTab("games")} className={tab === "games" ? "active" : ""} type="button"><span className="material-symbols-rounded">sports_esports</span>{t("roomGames")}</button>
        <button onClick={() => setTab("chat")} className={tab === "chat" ? "active" : ""} type="button"><span className="material-symbols-rounded">chat</span>{t("roomChat")}</button>
        <button onClick={() => setTab("shop")} className={tab === "shop" ? "active" : ""} type="button"><span className="material-symbols-rounded">shopping_cart</span>{t("shoppingSub")}</button>
        <button onClick={() => setTab("gallery")} className={tab === "gallery" ? "active" : ""} type="button"><span className="material-symbols-rounded">photo_library</span>{t("gallerySub")}</button>
        <button onClick={() => setTab("koins")} className={tab === "koins" ? "active" : ""} type="button"><span className="material-symbols-rounded">paid</span>{t("demoNavKoins")}</button>
      </div>
    </section>

    {tab === "space" && <section className="party-room-panel">
      <div className="party-room-actions">
        <h2>{t("roomHero")}</h2>
        <p>{party.description || t("roomDetail")}</p>
        <Link href={`/join/${party.inviteCode}`} className="party-action-btn"><span className="material-symbols-rounded">share</span> {t("roomInvite")}</Link>
        <button className="party-action-btn" onClick={() => setTab("games")} type="button"><span className="material-symbols-rounded">grid_view</span> {t("roomTools")}</button>
        {isOwner && <>
          <button className="party-action-btn" onClick={() => setEditing(true)} type="button"><span className="material-symbols-rounded">edit</span> {t("eventHubSettings")}</button>
          <button className="party-action-btn party-action-btn--danger" onClick={deleteParty} type="button"><span className="material-symbols-rounded">delete</span> {t("eventHubDelete")}</button>
        </>}
        <button className="party-action-btn party-action-btn--qr" onClick={() => { if (qrUrl) setQrUrl(""); else generateQr(); }} type="button"><span className="material-symbols-rounded">qr_code</span> {t("eventHubQr")}</button>
      </div>
      {qrUrl && <div className="party-room-qr"><div className="party-room-qr__top"><span>{t("roomInvite")}</span><b>TUSA.game</b></div><div className="party-room-qr__code"><img src={qrUrl} alt={t("eventHubQr")} /></div><p>{party.title}</p><button onClick={() => navigator.clipboard.writeText(inviteUrl)} type="button"><span className="material-symbols-rounded">content_copy</span> {t("eventHubQrCopy")}</button></div>}
      {error && <p className="form-error">{error}</p>}
      <div className="party-members">
        <h3>{t("roomInside")} ({filteredMembers.length})</h3>
        <div className="rsvp-filter-tabs">
          {(["all", "going", "maybe", "pass"] as const).map((filter) => (
            <button key={filter} className={rsvpFilter === filter ? "active" : ""} onClick={() => setRsvpFilter(filter)} type="button">
              {filter === "all" ? t("roomInside") : filter === "going" ? t("eventHubGoing") : filter === "maybe" ? t("eventHubThinkingCount") : t("eventHubPass")}
              {filter !== "all" && <span> ({members.filter((m) => m.rsvpStatus === filter).length})</span>}
            </button>
          ))}
        </div>
        <div className="party-member-grid">{filteredMembers.map((m) => <div key={m.clerkUserId} className={`party-member-card ${m.role === "owner" ? "is-owner" : m.role === "co_host" ? "is-cohost" : ""}`}><span className="party-member-role">{m.role === "owner" ? "👑" : m.role === "co_host" ? "⭐" : ""}</span><strong>{m.displayName}</strong><span className="party-member-status">{m.rsvpStatus === "going" ? t("eventHubGoing") : m.rsvpStatus === "maybe" ? t("eventHubThinkingCount") : t("eventHubPass")}</span>{isOwner && m.role !== "owner" && <button className="party-action-btn" onClick={() => toggleRole(m.clerkUserId, m.role === "co_host" ? "guest" : "co_host")} type="button">{m.role === "co_host" ? t("roomRemoveCoHost") : t("roomCoHost")}</button>}</div>)}</div>
      </div>
    </section>}

    {tab === "games" && (selectedGame ? renderGame() : <section className="party-room-panel">
      <div className="demo-panel-title"><div><span>{t("gamesCatalogue")}</span><h2>{t("gamesTitle")}</h2></div><span className="demo-chip">{t("gamesCatalogue").split(" ")[0]?.replace(/\D/g, "") || "28"}{t("gamesSessions")}</span></div>

      <div className="game-catalogue-grid">
        {gameCatalogue.map((game) => {
          const existingSession = activeSessions.find((s) => s.game === game.id);
          return <article className={`game-launch-card ${game.tone}`} key={game.id}>
            <span className="material-symbols-rounded">{game.icon}</span>
            <span className="game-player-count">{game.players}</span>
            <h3>{t(game.titleKey)}</h3>
            <p>{t(game.descKey)}</p>
            <div className="game-card-actions">
              <button className="game-launch-btn" onClick={() => launchGame(game.id)} type="button">{t("gamesLaunch")} <span className="material-symbols-rounded">arrow_forward</span></button>
              {existingSession && <button className="game-join-btn" onClick={() => joinSession(existingSession.id, game.id)} type="button">
                <span className="material-symbols-rounded">login</span> {t("gameJoinSession")}
              </button>}
            </div>
          </article>;
        })}
      </div>

      {isOwner && <div className="payment-delegation-block">
        <h3>{t("gamePaymentAssign")}</h3>
        <div className="payment-assignee-grid">
          {members.filter((m) => m.rsvpStatus === "going").map((m) => (
            <button key={m.clerkUserId} className={`payment-assignee-btn ${paymentAssignee === m.clerkUserId ? "is-active" : ""}`} onClick={() => assignPayment(m.clerkUserId)} disabled={paymentLoading} type="button">
              <span className="material-symbols-rounded">{m.role === "owner" ? "person" : "person_add"}</span>
              <strong>{m.displayName}</strong>
              <span>{m.clerkUserId === party.ownerId ? t("gamePaymentHost") : ""}</span>
            </button>
          ))}
        </div>
      </div>}
    </section>)}
    {gameResults && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) closeGameResults(); }}><section aria-modal="true" className="demo-modal game-results-modal" role="dialog"><span className="demo-kicker">{t("gamesResults")}</span><h2>{gameResults.gameTitle}</h2><div className="game-results-list">{gameResults.scores.map((s, i) => <div className={`game-result-row ${s.userId === user?.id ? "is-me" : ""}`} key={s.userId}><span className="game-result-rank">#{i + 1}</span><strong>{s.displayName || s.userId.slice(0, 8)}</strong><span className="game-result-score">{s.score}</span></div>)}</div><button className="demo-action demo-action--lime" onClick={closeGameResults} type="button">{t("gamesBack")}</button></section></div>}
    {tab === "shop" && <ShoppingList partyId={party.id} members={members} canManage={isOwner || party.role === "co_host"} />}
    {tab === "gallery" && <Gallery partyId={party.id} />}
    {tab === "koins" && <Koins partyId={party.id} />}
    {tab === "chat" && <section className="party-room-panel party-chat">
      <h2>{t("roomChatTitle")}</h2>
      <div className="party-chat-stream" ref={chatStreamRef}>
        {allChatMessages.length ? allChatMessages.map((item, index) => {
          const isMe = item.userId === user?.id;
          const sticker = item.type === "sticker" ? tusaStickers.find((s) => s.id === item.stickerId) : null;
          const reactionEntries = item.reactions ? Object.entries(item.reactions) : [];
          return <div className={`party-chat-bubble ${isMe ? "is-me" : "is-other"} ${item.type === "voice" ? "is-voice" : ""} ${item.type === "sticker" ? "is-sticker" : ""}`} key={item.id || index} onDoubleClick={() => setReactionTarget(reactionTarget === item.id ? null : item.id)}>
            {!isMe && <span className="chat-name">{item.displayName}</span>}
            {item.type === "sticker" && sticker ? (
              <span className="chat-sticker" dangerouslySetInnerHTML={{ __html: sticker.svg }} />
            ) : item.type === "voice" && item.voiceUrl ? (
              <div className="chat-voice">
                <span className="material-symbols-rounded">mic</span>
                <audio src={item.voiceUrl} controls preload="none" />
              </div>
            ) : (
              <span>{item.text}</span>
            )}
            <span className="chat-meta">
              {new Date(item.createdAt).toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" })}
              {item.type === "voice" && <span className="chat-voice-badge">🎤</span>}
            </span>
            {reactionEntries.length > 0 && <div className="chat-reactions">
              {reactionEntries.map(([emoji, users]) => (
                <button key={emoji} className={`chat-reaction ${user?.id && users.includes(user.id) ? "is-active" : ""}`} onClick={() => react(item.id, emoji)} type="button">
                  {emoji} <span>{users.length}</span>
                </button>
              ))}
            </div>}
            {reactionTarget === item.id && <EmojiPicker onSelect={(emoji) => { react(item.id, emoji); setReactionTarget(null); }} onClose={() => setReactionTarget(null)} />}
          </div>;
        }) : <p className="party-chat-system">{t("roomChatEmpty")}</p>}
        <div ref={chatEndRef} />
      </div>
      {showVoice && <VoiceRecorder onSend={sendVoice} onCancel={() => setShowVoice(false)} />}
      {showStickers && <StickerPicker onSelect={sendSticker} onClose={() => setShowStickers(false)} />}
      <div className="chat-input-bar">
        <button className="chat-tool-btn" onClick={() => { setShowStickers(!showStickers); setShowVoice(false); }} type="button" title={t("chatStickers")}>
          <span className="material-symbols-rounded">emoji_emotions</span>
        </button>
        <button className="chat-tool-btn" onClick={() => { setShowVoice(!showVoice); setShowStickers(false); }} type="button" title={t("chatVoice")}>
          <span className="material-symbols-rounded">mic</span>
        </button>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("chatType")} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <button onClick={send}>{t("chatSend")}</button>
      </div>
    </section>}
    {editing && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(false); }}><section aria-modal="true" className="demo-modal" role="dialog"><span className="demo-kicker">{t("eventHubSettingsTitle")}</span><h2>{party.title}</h2><form onSubmit={saveEdit}><label>{t("createName")}<input name="title" defaultValue={party.title} required /></label><div className="form-split"><label>{t("createDate")}<input name="date" className="event-date-input" defaultValue={eventDateInputValue(party.date)} placeholder="DD.MM.YYYY" inputMode="numeric" pattern="\d{2}\.\d{2}\.\d{4}" title="DD.MM.YYYY" required /></label><label>{t("createTime")}<input name="time" className="event-time-input" defaultValue={party.time} placeholder="21:00" inputMode="numeric" pattern="\d{2}:\d{2}" title="HH:MM" required /></label></div><label>{t("createVenue")}<input name="venue" defaultValue={party.venue} required /></label>        <label>{t("createFormat")}<span className="brand-select"><select name="category" defaultValue={party.category}><option>House Party</option><option>After-work</option><option>Trip</option><option>Birthday</option><option>Game night</option></select></span></label><label>{t("createDetails")}<textarea name="description" defaultValue={party.description} /></label><button type="submit">{t("profileSave")}</button></form></section></div>}
  </main>;
}
