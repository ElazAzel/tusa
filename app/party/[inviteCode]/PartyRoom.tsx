"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Party, PartyRole, RsvpStatus, GameSession, ChatMessage, GameScore } from "@/lib/parties";
import { useLocale } from "@/app/components/LocaleProvider";
import LocaleToggle from "@/app/components/LocaleToggle";
import BrandLogo from "@/app/components/BrandLogo";
import { useLiveStream } from "@/app/components/useLiveStream";
import { useGameRole } from "@/app/components/useGameRole";
const AliasGame = dynamic(() => import("@/app/components/games/AliasGame"));
const MafiaGame = dynamic(() => import("@/app/components/games/MafiaGame"));
const TruthOrDare = dynamic(() => import("@/app/components/games/TruthOrDare"));
const NeverHaveIEver = dynamic(() => import("@/app/components/games/NeverHaveIEver"));
const BeerPong = dynamic(() => import("@/app/components/games/BeerPong"));
const QuizBattle = dynamic(() => import("@/app/components/games/QuizBattle"));
const RandomPair = dynamic(() => import("@/app/components/games/RandomPair"));
const UnoTracker = dynamic(() => import("@/app/components/games/UnoTracker"));
const WouldYouRather = dynamic(() => import("@/app/components/games/WouldYouRather"));
const TwoTruths = dynamic(() => import("@/app/components/games/TwoTruths"));
const KissMarryKill = dynamic(() => import("@/app/components/games/KissMarryKill"));
const BlankSlate = dynamic(() => import("@/app/components/games/BlankSlate"));
const BombParty = dynamic(() => import("@/app/components/games/BombParty"));
const Wheel = dynamic(() => import("@/app/components/games/Wheel"));
const BrainBurst = dynamic(() => import("@/app/components/games/BrainBurst"));
const TriviaGame = dynamic(() => import("@/app/components/games/Trivia"));
const ImpostorGame = dynamic(() => import("@/app/components/games/Impostor"));
const SpyfallGame = dynamic(() => import("@/app/components/games/Spyfall"));
const CodenamesGame = dynamic(() => import("@/app/components/games/Codenames"));
const WavelengthGame = dynamic(() => import("@/app/components/games/Wavelength"));
const QuiplashGame = dynamic(() => import("@/app/components/games/Quiplash"));
const FibbageGame = dynamic(() => import("@/app/components/games/Fibbage"));
const HeadsUpGame = dynamic(() => import("@/app/components/games/HeadsUp"));
const GuessSongGame = dynamic(() => import("@/app/components/games/GuessSong"));
const CharadesGame = dynamic(() => import("@/app/components/games/Charades"));
const CrocodilGame = dynamic(() => import("@/app/components/games/Crocodil"));
const WerewolfGame = dynamic(() => import("@/app/components/games/Werewolf"));
const BunkerGame = dynamic(() => import("@/app/components/games/Bunker"));
const PictionaryGame = dynamic(() => import("@/app/components/games/Pictionary"));
const GarticPhoneGame = dynamic(() => import("@/app/components/games/GarticPhone"));
const CardsOfChaosGame = dynamic(() => import("@/app/components/games/CardsOfChaos"));
const MusicQuizGame = dynamic(() => import("@/app/components/games/MusicQuiz"));
import ShoppingList from "@/app/components/ShoppingList";
import Gallery from "@/app/components/Gallery";
import Koins from "@/app/components/Koins";
import PartyPass from "@/app/components/PartyPass";
import SocialQuests from "@/app/components/SocialQuests";
import Highlights from "@/app/components/Highlights";
import Gratitude from "@/app/components/Gratitude";
import DailyChallenge from "@/app/components/DailyChallenge";
import RoomTheme from "@/app/components/RoomTheme";
import VoiceRecorder from "@/app/components/chat/VoiceRecorder";
import StickerPicker from "@/app/components/chat/StickerPicker";
import EmojiPicker from "@/app/components/chat/EmojiPicker";
import { tusaStickers } from "@/app/components/chat/stickers";
import { eventDateInputValue, formatEventDate } from "@/lib/event-format";
import EventDateTimeFields from "@/app/components/EventDateTimeFields";
import { soundChat } from "@/lib/audio";
import ReportContentButton from "@/app/components/ReportContentButton";

import { GAME_MANIFEST, formatPlayerRange, isGameId, type GameId } from "@/lib/games/manifest";

const gameCatalogue = GAME_MANIFEST;
type ChatEntry = ChatMessage & { pending?: boolean; failed?: boolean };

export default function PartyRoom({ party, actorId, actorKind, chatBackground = "paper" }: { party: Party; actorId: string; actorKind?: string; chatBackground?: string }) {
  const [tab, setTab] = useState<"space" | "games" | "chat" | "shop" | "gallery" | "koins" | "pass" | "quests" | "highlights" | "gratitude" | "theme" | "daily">("space");
  const [moreOpen, setMoreOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatEntry[]>([]);
  const [message, setMessage] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [editing, setEditing] = useState(false);
  const [rsvp, setRsvp] = useState(party.myRsvp || "going");
  const [error, setError] = useState("");
  const [shellNotice, setShellNotice] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [gameSession, setGameSession] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [roomPickerGame, setRoomPickerGame] = useState<GameId | null>(null);
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
  const [themeId, setThemeId] = useState(party.theme?.id ?? "lime");
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatStreamRef = useRef<HTMLDivElement>(null);
  const chatAtBottomRef = useRef(true);
  const gameRecoveryRef = useRef(false);

  const anyModalOpen = Boolean(moreOpen || roomPickerGame || gameResults || editing);

  useEffect(() => {
    if (!anyModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeTopModal = () => {
      if (moreOpen) setMoreOpen(false);
      else if (roomPickerGame) setRoomPickerGame(null);
      else if (gameResults) closeGameResults();
      else setEditing(false);
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const surface = document.querySelector<HTMLElement>(".more-modal-backdrop .more-modal, .demo-modal-backdrop .demo-modal");
      if (!surface) return;
      const focusables = Array.from(surface.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-\"])"));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!surface.contains(active)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeTopModal);
    window.addEventListener("keydown", trapTab);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeTopModal);
      window.removeEventListener("keydown", trapTab);
    };
  }, [anyModalOpen, moreOpen, roomPickerGame, gameResults, editing]);
  const { locale, t } = useLocale();
  const isOwner = party.role === "owner";
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${party.inviteCode}` : "";
  const filteredMembers = rsvpFilter === "all" ? members : members.filter((m) => m.rsvpStatus === rsvpFilter);
  const activeSession = activeSessions.find((s) => s.id === gameSession);
  const gameRooms = roomPickerGame ? activeSessions.filter((session) => session.game === roomPickerGame) : [];
  const gameRole = useGameRole(activeSession?.participants ?? [], actorId, activeSession?.status);

  const liveChat = useLiveStream<Record<string, unknown>>(`chat:${party.id}`);
  const liveParty = useLiveStream<Record<string, unknown>>(`party:${party.id}`);

  useEffect(() => {
    liveChat.events.forEach((raw) => {
      if (raw.type === "reaction" && raw.messageId) {
        setChatMessages((prev) => prev.map((m) => m.id === raw.messageId ? { ...m, reactions: raw.reactions as Record<string, string[]> } : m));
      }
    });
  }, [liveChat.events]);

  const allChatMessages = useMemo<ChatEntry[]>(() => {
    const existing = new Set(chatMessages.map((msg) => msg.id));
    const mutations = new Set(chatMessages.map((msg) => msg.clientMutationId).filter(Boolean));
    const liveFiltered = liveChat.events.filter((raw) => {
      if (raw.type === "reaction") return false;
      return raw.id && !existing.has(raw.id as string) && !mutations.has(raw.clientMutationId as string);
    }).map((raw) => raw as unknown as ChatEntry);
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
          if (!cancelled && data.messages) setChatMessages(data.messages as ChatEntry[]);
          return;
        } catch { if (i < retries - 1) await new Promise((res) => setTimeout(res, 1000 * (i + 1))); }
      }
    }
    loadChat();
    return () => { cancelled = true; };
  }, [party.id]);

  useEffect(() => {
    if (liveChat.connectionEpoch <= 1) return;
    fetch(`/api/chat?partyId=${party.id}`).then((r) => r.ok ? r.json() : null).then((data) => {
      if (data?.messages) setChatMessages(data.messages as ChatEntry[]);
    }).catch(() => undefined);
  }, [liveChat.connectionEpoch, party.id]);

  useEffect(() => {
    if (chatAtBottomRef.current) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    else setUnreadMessages((count) => count + 1);
  }, [allChatMessages.length]);

  function scrollChatToLatest() {
    chatAtBottomRef.current = true;
    setUnreadMessages(0);
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleChatScroll() {
    const stream = chatStreamRef.current;
    if (!stream) return;
    chatAtBottomRef.current = stream.scrollHeight - stream.scrollTop - stream.clientHeight < 56;
    if (chatAtBottomRef.current) setUnreadMessages(0);
  }

  async function submitChat(payload: { text?: string; type?: "text" | "voice" | "sticker"; voiceUrl?: string; stickerId?: string }, optimisticText?: string) {
    const clientMutationId = crypto.randomUUID();
    const optimistic: ChatEntry | null = optimisticText ? {
      id: `pending-${clientMutationId}`, partyId: party.id, userId: actorId, displayName: "", handle: "", nameColor: "#000000", chatEffect: "none",
      text: optimisticText, type: "text", voiceUrl: "", stickerId: "", reactions: {}, clientMutationId, createdAt: new Date().toISOString(), pending: true,
    } : null;
    if (optimistic) setChatMessages((current) => [...current, optimistic]);
    setChatSending(true);
    setChatError("");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId: party.id, clientMutationId, ...payload }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.message) throw new Error(data?.error || "Chat request failed");
      setChatMessages((current) => current.map((item) => item.clientMutationId === clientMutationId ? data.message as ChatEntry : item));
      chatAtBottomRef.current = true;
      return true;
    } catch {
      if (optimistic) setChatMessages((current) => current.map((item) => item.clientMutationId === clientMutationId ? { ...item, pending: false, failed: true } : item));
      setChatError(t("chatSendFailed"));
      return false;
    } finally {
      setChatSending(false);
    }
  }

  async function send() {
    const text = message.trim();
    if (!text || chatSending) return;
    soundChat();
    const sent = await submitChat({ text }, text);
    if (sent) setMessage("");
  }

  async function sendVoice(blob: Blob) {
    setChatSending(true);
    setChatError("");
    try {
      const form = new FormData();
      form.set("partyId", party.id);
      form.set("kind", "voice");
      form.set("consent", "true");
      form.set("file", new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || "audio/webm" }));
      const response = await fetch("/api/media", { method: "POST", body: form });
      const upload = await response.json().catch(() => ({}));
      if (!response.ok || !upload.media?.url) throw new Error(upload.error || "Upload failed");
      await submitChat({ type: "voice", voiceUrl: upload.media.url });
      setShowVoice(false);
    } catch {
      setChatError(t("chatSendFailed"));
    } finally {
      setChatSending(false);
    }
  }

  async function sendSticker(stickerId: string) {
    await submitChat({ type: "sticker", stickerId });
    setShowStickers(false);
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
    const loadSessions = () => fetch(`/api/games?partyId=${party.id}`).then((r) => r.json()).then((data) => {
      if (!data.sessions) return;
      const sessions = data.sessions as (GameSession & { participants: string[] })[];
      setActiveSessions(sessions);
      if (!gameRecoveryRef.current) {
        const resumable = sessions.find((session) => session.status === "active" && session.participants.includes(actorId));
        if (resumable && isGameId(resumable.game)) {
          gameRecoveryRef.current = true;
          setGameSession(resumable.id);
          setSelectedGame(resumable.game as GameId);
          setTab("games");
        }
      }
    }).catch(() => undefined);
    loadSessions();
  }, [party.id, actorId]);

  useEffect(() => {
    if (liveParty.connectionEpoch <= 1) return;
    fetch(`/api/games?partyId=${party.id}`).then((r) => r.json()).then((data) => {
      if (data.sessions) setActiveSessions(data.sessions as (GameSession & { participants: string[] })[]);
    }).catch(() => undefined);
  }, [liveParty.connectionEpoch, party.id]);

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
    fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", partyId: party.id, game, config: { locale } }) })
      .then((r) => r.json()).then((data) => {
        if (data.session) {
          setGameSession(data.session.id);
          setActiveSessions((prev) => [data.session, ...prev.filter((s) => s.id !== data.session.id)]);
        }
      }).catch((err) => console.error("launchGame failed", err));
  }

  function openGameRooms(game: GameId) {
    if (activeSessions.some((session) => session.game === game)) {
      setRoomPickerGame(game);
      return;
    }
    launchGame(game);
  }

  function joinSession(sessionId: string, game: string) {
    if (!isGameId(game)) return;
    setSelectedGame(game);
    setGameSession(sessionId);
    fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", sessionId }) })
      .then((r) => r.json()).then((data) => {
        if (data.session) {
          setActiveSessions((prev) => prev.map((s) => s.id === sessionId ? data.session : s));
        }
      }).catch((err) => console.error("joinSession failed", err));
  }

  function saveGameScore() {
    if (!gameSession || !selectedGame) return;
    const game = gameCatalogue.find((g) => g.id === selectedGame);
    fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "score", sessionId: gameSession, clientMutationId: `score:${gameSession}`, metadata: { game: selectedGame } }) })
      .then((r) => r.json()).then((data) => {
        if (data.scores) setGameResults({ scores: data.scores as GameScore[], gameTitle: game ? t(game.titleKey) : "" });
        const verifiedScore = Number(data.score?.score ?? 0);
        if (verifiedScore > 0) {
          fetch("/api/highlights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId: party.id, sessionId: gameSession, type: "score", data: { score: verifiedScore, game: selectedGame }, thumbnail: "" }) }).catch(() => {});
        }
      }).catch((err) => console.error("saveGameScore failed", err));
  }

  async function startGameSession() {
    if (!gameSession) return;
    const response = await fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", sessionId: gameSession }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || (locale === "ru" ? "Не удалось запустить игру" : "Could not start the game")); return; }
    setActiveSessions((prev) => prev.map((session) => session.id === gameSession ? data.session : session));
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
    if (activeSession?.status === "lobby") return <section className="party-room-panel game-lobby"><div className="active-game-head"><button onClick={backToCatalogue} type="button"><span className="material-symbols-rounded">arrow_back</span>{t("gamesBack")}</button><div><span>{locale === "ru" ? "Лобби" : "Lobby"}</span><h2>{game ? t(game.titleKey) : ""}</h2></div></div><div className="game-lobby-count"><strong>{activeSession.participants.length}</strong><span>{locale === "ru" ? "подключились" : "joined"}</span></div><div className="game-lobby-players">{activeSession.participants.map((id, index) => <span key={id}><i>{index + 1}</i>{id === actorId ? (locale === "ru" ? "Ты" : "You") : id.slice(-8)}</span>)}</div>{activeSession.createdBy === actorId ? <button className="demo-action demo-action--lime" disabled={activeSession.participants.length < 2} onClick={startGameSession} type="button"><span className="material-symbols-rounded">play_arrow</span>{locale === "ru" ? "Начать игру" : "Start game"}</button> : <p className="controller-answered">{locale === "ru" ? "Ждём, когда инициатор запустит игру" : "Waiting for the creator to start"}</p>}</section>;
    const componentRole = gameRole === "spectator" ? "controller" : gameRole;
    const props = { partyId: party.id, sessionId: gameSession, onSave: saveGameScore, role: componentRole };
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
      selectedGame === "bunker" ? <BunkerGame {...props} /> :
      selectedGame === "pictionary" ? <PictionaryGame {...props} /> :
      selectedGame === "gartic" ? <GarticPhoneGame {...props} /> :
      selectedGame === "cardsChaos" ? <CardsOfChaosGame {...props} /> :
      selectedGame === "musicQuiz" ? <MusicQuizGame {...props} /> : null;
    return <section className={`party-room-panel ${gameRole === "spectator" ? "is-spectating" : ""}`}><div className="active-game-head"><button onClick={backToCatalogue} type="button"><span className="material-symbols-rounded">arrow_back</span> {t("gamesBack")}</button><div><span>{t("gamesMode")}</span><h2>{game ? t(game.titleKey) : ""}</h2></div><span className="demo-chip">{game ? formatPlayerRange(game) : ""}{t("gamesPlayers")}</span></div>{gameRole === "spectator" && <div className="spectator-banner"><span className="material-symbols-rounded">visibility</span><strong>{t("spectating")}</strong></div>}<div className="spectator-board">{board}</div></section>;
  }

  const shellNav: Array<{ id: "space" | "games" | "shop" | "gallery" | "chat" | "koins" | "more"; icon: string; label: string }> = [
    { id: "space", icon: "home", label: t("demoNavHome") },
    { id: "games", icon: "sports_esports", label: t("demoNavGames") },
    { id: "shop", icon: "checklist", label: t("demoNavShopping") },
    { id: "gallery", icon: "photo_camera", label: t("demoNavGallery") },
    { id: "chat", icon: "chat_bubble", label: t("demoNavChat") },
    { id: "koins", icon: "toll", label: t("demoNavKoins") },
    { id: "more", icon: "more_horiz", label: t("moreTab") },
  ];

  function openShellSection(id: (typeof shellNav)[number]["id"]) {
    if (id === "more") { setMoreOpen(true); return; }
    setMoreOpen(false);
    setTab(id);
  }

  function notifyShell(messageText: string) {
    setShellNotice(messageText);
    window.setTimeout(() => setShellNotice(""), 1800);
  }

  async function copyPartyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      notifyShell(locale === "ru" ? "Ссылка скопирована" : "Link copied");
    } catch {
      window.prompt(locale === "ru" ? "Скопируй ссылку" : "Copy this link", inviteUrl);
    }
  }

  async function sharePartyInvite() {
    if (navigator.share) {
      await navigator.share({ title: party.title, text: party.description || party.title, url: inviteUrl }).catch(() => undefined);
      return;
    }
    await copyPartyInvite();
  }

  return <main className={`demo-shell live-party-shell party-room ${party.adultOnly ? "party-room--adult" : "party-room--family"} ${moreOpen ? "is-modal-open" : ""}`}>
    {(liveChat.hasConnectedOnce && liveParty.hasConnectedOnce && !liveChat.connected && !liveParty.connected) && <div className="connection-banner connection-banner--offline">
      <span className="material-symbols-rounded">cloud_off</span>
      {locale === "ru" ? "Нет соединения. Переподключение…" : "Connection lost. Reconnecting…"}
    </div>}

    <aside className="demo-rail live-party-rail">
      <Link className="demo-logo" href="/app" aria-label={t("backToParties")}><BrandLogo priority /><BrandLogo compact className="demo-logo-icon" /></Link>
      <nav className="demo-nav" aria-label={t("roomSpace")}>
        {shellNav.map((item) => <button aria-label={item.label} aria-current={(item.id === tab || (item.id === "more" && moreOpen)) ? "page" : undefined} className={(item.id === tab || (item.id === "more" && moreOpen)) ? "active" : ""} key={item.id} onClick={() => openShellSection(item.id)} type="button"><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{item.id === "chat" && unreadMessages > 0 && <i>{unreadMessages}</i>}</button>)}
      </nav>
      <Link className="live-party-back" href="/app"><span className="material-symbols-rounded">arrow_back</span>{t("backToParties")}</Link>
    </aside>

    <section className="demo-workspace live-party-workspace">
      <header className="demo-topbar live-party-topbar">
        <div className="topbar-event-copy"><p>{locale === "ru" ? "ТУСА ОТКРЫТА · LIVE" : "PARTY OPEN · LIVE"}</p><h1>{party.title}</h1></div>
        <div className="demo-top-actions">
          <LocaleToggle />
          <button className="demo-icon-button" onClick={() => void copyPartyInvite()} type="button" aria-label={locale === "ru" ? "Скопировать ссылку" : "Copy link"}><span className="material-symbols-rounded">content_copy</span></button>
          <button className="demo-action demo-action--lime" onClick={() => void sharePartyInvite()} type="button"><span className="material-symbols-rounded">ios_share</span>{t("roomInvite")}</button>
        </div>
      </header>

      <div className="demo-content live-party-content" key={tab}>
        {error && <p className="form-error" role="alert">{error}</p>}
        {tab === "space" && <section className="demo-hero-card live-party-hero">
          <div>
            <span className="demo-kicker">{party.adultOnly ? t("roomAdult") : t("roomFamily")}</span>
            <h2>{party.title}</h2>
            <p><span className="material-symbols-rounded">calendar_month</span>{formatEventDate(party.date, locale)} · {party.time}</p>
            <p><span className="material-symbols-rounded">location_on</span>{party.venue}</p>
            <div className="party-room-rsvp-toggle">
              {["going", "maybe", "pass"].map((status) => <button aria-pressed={rsvp === status} className={rsvp === status ? "active" : ""} key={status} onClick={() => updateRsvp(status as RsvpStatus)} type="button">{status === "going" ? (locale === "ru" ? "Иду" : "Going") : status === "maybe" ? (locale === "ru" ? "Думаю" : "Maybe") : (locale === "ru" ? "Не иду" : "Pass")}</button>)}
            </div>
          </div>
          <div className="demo-hero-stamp"><strong>{rsvpCounts.going}</strong><span>{t("eventHubGoing")}</span></div>
        </section>}
    {moreOpen && typeof document !== "undefined" && createPortal(<div className="more-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setMoreOpen(false); }}>
      <section aria-labelledby="more-modal-title" aria-modal="true" className="more-modal" role="dialog">
        <div className="more-modal-header"><h2 id="more-modal-title" className="game-step">{t("moreTab")}</h2><button aria-label={locale === "ru" ? "Закрыть" : "Close"} onClick={() => setMoreOpen(false)} type="button" className="more-modal-close"><span aria-hidden="true" className="material-symbols-rounded">close</span></button></div>
        <div className="more-modal-grid">
          <button onClick={() => { setTab("gallery"); setMoreOpen(false); }} type="button"><span className="material-symbols-rounded">photo_library</span>{t("gallerySub")}</button>
          <button onClick={() => { setTab("koins"); setMoreOpen(false); }} type="button"><span className="material-symbols-rounded">paid</span>{t("demoNavKoins")}</button>
          <button onClick={() => { setTab("pass"); setMoreOpen(false); }} type="button"><span className="material-symbols-rounded">stars</span>{t("passTab")}</button>
          <button onClick={() => { setTab("quests"); setMoreOpen(false); }} type="button"><span className="material-symbols-rounded">emoji_events</span>{t("questsTab")}</button>
          <button onClick={() => { setTab("highlights"); setMoreOpen(false); }} type="button"><span className="material-symbols-rounded">auto_awesome</span>{t("highlightTab")}</button>
          <button onClick={() => { setTab("gratitude"); setMoreOpen(false); }} type="button"><span className="material-symbols-rounded">favorite</span>{t("gratitudeTab")}</button>
          <button onClick={() => { setTab("daily"); setMoreOpen(false); }} type="button"><span className="material-symbols-rounded">today</span>{t("dailyTitle")}</button>
          <button onClick={() => { setTab("theme"); setMoreOpen(false); }} type="button"><span className="material-symbols-rounded">palette</span>{t("themeTab")}</button>
          <button onClick={() => { setMoreOpen(false); router.push("/app/profile"); }} type="button"><span className="material-symbols-rounded">person</span>{t("demoNavProfile")}</button>
        </div>
      </section>
    </div>, document.body)}

    {tab === "space" && <section className="party-room-panel live-party-overview">
      <div className="demo-panel-title"><div><span>{t("roomSpace")}</span><h2>{t("roomHero")}</h2></div><span className="demo-chip">{members.length || party.memberCount}</span></div>
      <p className="live-party-description">{party.description || t("roomDetail")}</p>
      <div className="party-room-actions">
        <Link href={`/join/${party.inviteCode}`} className="party-action-btn"><span className="material-symbols-rounded">share</span> {t("roomInvite")}</Link>
        <button className="party-action-btn" onClick={() => setTab("games")} type="button"><span className="material-symbols-rounded">grid_view</span> {t("roomTools")}</button>
        {isOwner && <>
          <button className="party-action-btn" onClick={() => setEditing(true)} type="button"><span className="material-symbols-rounded">edit</span> {t("eventHubSettings")}</button>
          <button className="party-action-btn party-action-btn--danger" onClick={deleteParty} type="button"><span className="material-symbols-rounded">delete</span> {t("eventHubDelete")}</button>
        </>}
        <button className="party-action-btn party-action-btn--qr" onClick={() => { if (qrUrl) setQrUrl(""); else generateQr(); }} type="button"><span className="material-symbols-rounded">qr_code</span> {t("eventHubQr")}</button>
      </div>
      {qrUrl && <div className="party-room-qr"><div className="party-room-qr__top"><span>{t("roomInvite")}</span><b>TUSA.game</b></div><div className="party-room-qr__code"><img src={qrUrl} alt={t("eventHubQr")} /></div><p>{party.title}</p><button onClick={() => navigator.clipboard.writeText(inviteUrl)} type="button"><span className="material-symbols-rounded">content_copy</span> {t("eventHubQrCopy")}</button></div>}
      <div className="party-members">
        <h3>{t("roomInside")} ({filteredMembers.length})</h3>
        <div className="rsvp-filter-tabs">
          {(["all", "going", "maybe", "pass"] as const).map((filter) => (
            <button key={filter} aria-pressed={rsvpFilter === filter} className={rsvpFilter === filter ? "active" : ""} onClick={() => setRsvpFilter(filter)} type="button">
              {filter === "all" ? t("roomInside") : filter === "going" ? t("eventHubGoing") : filter === "maybe" ? t("eventHubThinkingCount") : t("eventHubPass")}
              {filter !== "all" && <span> ({members.filter((m) => m.rsvpStatus === filter).length})</span>}
            </button>
          ))}
        </div>
        <div className="party-member-grid">{filteredMembers.map((m) => <div key={m.clerkUserId} className={`party-member-card ${m.role === "owner" ? "is-owner" : m.role === "co_host" ? "is-cohost" : ""}`}><span className="party-member-role">{m.role === "owner" ? "👑" : m.role === "co_host" ? "⭐" : ""}</span><strong>{m.displayName}</strong><span className="party-member-status">{m.rsvpStatus === "going" ? t("eventHubGoing") : m.rsvpStatus === "maybe" ? t("eventHubThinkingCount") : t("eventHubPass")}</span>{isOwner && m.role !== "owner" && <button className="party-action-btn" onClick={() => toggleRole(m.clerkUserId, m.role === "co_host" ? "guest" : "co_host")} type="button">{m.role === "co_host" ? t("roomRemoveCoHost") : t("roomCoHost")}</button>}</div>)}</div>
      </div>
    </section>}

    {tab === "games" && (selectedGame ? renderGame() : <section className="party-room-panel">
      <div className="demo-panel-title"><div><span>{t("gamesCatalogue")}</span><h2>{t("gamesTitle")}</h2></div><span className="demo-chip">{gameCatalogue.length}{t("gamesSessions")}</span></div>

      <div className="game-catalogue-grid">
        {gameCatalogue.map((game) => {
          const existingSession = activeSessions.find((s) => s.game === game.id);
          return <article className={`game-launch-card ${game.tone}`} key={game.id}>
            <span className="material-symbols-rounded">{game.icon}</span>
            <span className="game-player-count">{formatPlayerRange(game)}</span>
            <h3>{t(game.titleKey)}</h3>
            <p>{t(game.descKey)}</p>
            {game.category === "quick_tool" && <strong>{t("partyTool")}</strong>}
            <span className="game-status">{game.releaseStatus === "beta" ? "beta" : "✓"}</span>
            <div className="game-card-actions">
              <button className="game-launch-btn" onClick={() => openGameRooms(game.id)} type="button">{existingSession ? t("gameRoomsOpen") : t("gamesLaunch")} <span className="material-symbols-rounded">arrow_forward</span></button>
            </div>
          </article>;
        })}
      </div>

      {roomPickerGame && (() => {
        const pickerGame = gameCatalogue.find((game) => game.id === roomPickerGame);
        return <div className="demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRoomPickerGame(null); }}>
          <section aria-modal="true" className="demo-modal game-room-picker" role="dialog">
            <div className="game-room-picker__head"><div><span className="demo-kicker">{t("gameRoomsTitle")}</span><h2>{pickerGame ? t(pickerGame.titleKey) : ""}</h2></div><button aria-label={t("gameRoomsClose")} className="game-room-picker__close" onClick={() => setRoomPickerGame(null)} type="button"><span className="material-symbols-rounded">close</span></button></div>
            <p>{t("gameRoomsSubtitle")}</p>
            <div className="game-room-picker__list">
              {gameRooms.map((session, index) => {
                const host = members.find((member) => member.clerkUserId === session.createdBy)?.displayName || (locale === "ru" ? "Ведущий" : "Host");
                const isLobby = session.status === "lobby";
                return <article className={`game-room-choice ${isLobby ? "is-lobby" : "is-active"}`} key={session.id}>
                  <span className="game-room-choice__number">{index + 1}</span><div><strong>{host}</strong><span>{isLobby ? t("gameRoomsLobby") : t("gameRoomsLive")} · {session.participants.length} {t("gameRoomsPlayers")}</span></div>
                  <button className="demo-action demo-action--lime" onClick={() => { joinSession(session.id, session.game); setRoomPickerGame(null); }} type="button"><span className="material-symbols-rounded">{isLobby ? "login" : "visibility"}</span>{isLobby ? t("gameRoomsJoin") : t("gameRoomsWatch")}</button>
                </article>;
              })}
            </div>
            <button className="demo-action demo-action--pink game-room-picker__create" onClick={() => { launchGame(roomPickerGame); setRoomPickerGame(null); }} type="button"><span className="material-symbols-rounded">add</span>{t("gameRoomsCreate")}</button>
          </section>
        </div>;
      })()}

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
    {gameResults && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) closeGameResults(); }}><section aria-modal="true" className="demo-modal game-results-modal" role="dialog"><span className="demo-kicker">{t("gamesResults")}</span><h2>{gameResults.gameTitle}</h2><div className="game-results-list">{gameResults.scores.map((s, i) => <div className={`game-result-row ${s.userId === actorId ? "is-me" : ""}`} key={s.userId}><span className="game-result-rank">#{i + 1}</span><strong>{s.displayName || s.userId.slice(0, 8)}</strong><span className="game-result-score">{s.score}</span></div>)}</div><button className="demo-action demo-action--lime" onClick={closeGameResults} type="button">{t("gamesBack")}</button>{actorKind === "guest" && <p className="guest-signup-prompt"><Link href={`/sign-up?redirect_url=/party/${party.inviteCode}`}>{t("guestSignupPrompt")}</Link></p>}</section></div>}
    {tab === "shop" && <ShoppingList partyId={party.id} members={members} canManage={isOwner || party.role === "co_host"} />}
    {tab === "gallery" && <Gallery partyId={party.id} actorId={actorId} />}
    {tab === "koins" && <Koins partyId={party.id} />}
    {tab === "pass" && <PartyPass />}
    {tab === "quests" && <SocialQuests partyId={party.id} />}
    {tab === "highlights" && <Highlights partyId={party.id} />}
    {tab === "gratitude" && <Gratitude partyId={party.id} actorId={actorId} members={members.map((m) => ({ id: m.clerkUserId, displayName: m.displayName }))} />}
    {tab === "daily" && <DailyChallenge />}
    {tab === "theme" && <RoomTheme inviteCode={party.inviteCode} currentTheme={themeId} ownedThemes={party.ownedThemes} onThemeChange={(th) => setThemeId(th)} />}
    {tab === "chat" && <section className={`party-room-panel party-chat party-chat-background-${chatBackground}`}>
      <h2>{t("roomChatTitle")}</h2>
      <div className="party-chat-stream" ref={chatStreamRef} onScroll={handleChatScroll} aria-live="polite" aria-label={t("roomChatTitle")}>
        {allChatMessages.length ? allChatMessages.map((item, index) => {
          const isMe = item.userId === actorId;
          const sticker = item.type === "sticker" ? tusaStickers.find((s) => s.id === item.stickerId) : null;
          const reactionEntries = item.reactions ? Object.entries(item.reactions) : [];
          return <article className={`party-chat-bubble ${isMe ? "is-me" : "is-other"} ${item.type === "voice" ? "is-voice" : ""} ${item.type === "sticker" ? "is-sticker" : ""} ${item.chatEffect && item.chatEffect !== "none" ? `chat-effect-${item.chatEffect}` : ""} ${item.pending ? "is-pending" : ""} ${item.failed ? "is-failed" : ""}`} key={item.id || index}>
            {!isMe && <span className="chat-name" style={item.nameColor && item.nameColor !== "#000000" ? { color: item.nameColor } : undefined}>{item.displayName}</span>}
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
              {item.pending && <span className="chat-delivery"> · {t("chatSending")}</span>}
              {item.failed && <span className="chat-delivery chat-delivery--failed"> · {t("chatSendFailed")}</span>}
              {item.type === "voice" && <span className="chat-voice-badge">🎤</span>}
            </span>
            {reactionEntries.length > 0 && <div className="chat-reactions">
              {reactionEntries.map(([emoji, users]) => (
                <button key={emoji} className={`chat-reaction ${users.includes(actorId) ? "is-active" : ""}`} onClick={() => react(item.id, emoji)} type="button">
                  {emoji} <span>{users.length}</span>
                </button>
              ))}
            </div>}
            {!item.pending && <div className="chat-message-tools">
              <button className="chat-reaction-trigger" onClick={() => setReactionTarget(reactionTarget === item.id ? null : item.id)} type="button" aria-label={t("chatReact")}>+</button>
              {!isMe && <ReportContentButton partyId={party.id} targetId={item.id} targetType="chat_message" targetUserId={item.userId} onBlocked={(userId) => setChatMessages((current) => current.filter((entry) => entry.userId !== userId))} />}
            </div>}
          </article>;
        }) : <p className="party-chat-system">{t("roomChatEmpty")}</p>}
        <div ref={chatEndRef} />
      </div>
      {unreadMessages > 0 && <button className="chat-jump-latest" onClick={scrollChatToLatest} type="button">{t("chatNewMessages").replace("{count}", String(unreadMessages))}</button>}
      {showStickers && <StickerPicker onSelect={sendSticker} onClose={() => setShowStickers(false)} />}
      <div className="chat-input-bar">
        {showVoice && <VoiceRecorder onSend={sendVoice} onCancel={() => setShowVoice(false)} />}
        <div className="chat-input-wrap">
          <button className="chat-emoji-btn" onClick={() => { setShowStickers(!showStickers); setShowVoice(false); }} type="button" title={t("chatStickers")} aria-label={t("chatStickers")}>
            <span className="material-symbols-rounded">emoji_emotions</span>
          </button>
          <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 1000))} placeholder={t("chatType")} aria-label={t("chatType")} rows={1} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
        </div>
        <button className={message.trim() ? "has-text" : ""} onClick={message.trim() ? () => void send() : () => { setShowVoice(!showVoice); setShowStickers(false); }} type="button" title={message.trim() ? t("chatSend") : t("chatVoice")} aria-label={message.trim() ? t("chatSend") : t("chatVoice")} disabled={chatSending}>
          <span className="material-symbols-rounded">{chatSending ? "progress_activity" : message.trim() ? "send" : "mic"}</span>
        </button>
      </div>
      {chatError && <p className="chat-error" role="status">{chatError}</p>}
    </section>}
    {tab === "chat" && reactionTarget && typeof document !== "undefined" && createPortal(<EmojiPicker label={t("chatReact")} closeLabel={t("gameRoomsClose")} onSelect={(emoji) => { react(reactionTarget, emoji); setReactionTarget(null); }} onClose={() => setReactionTarget(null)} />, document.body)}
      </div>
    </section>

    <nav className="demo-mobile-nav live-party-mobile-nav" aria-label={t("roomSpace")}>
      <div className="demo-mobile-nav-track">
        {shellNav.map((item) => <button aria-label={item.label} aria-current={(item.id === tab || (item.id === "more" && moreOpen)) ? "page" : undefined} className={(item.id === tab || (item.id === "more" && moreOpen)) ? "active" : ""} key={item.id} onClick={() => openShellSection(item.id)} type="button"><span className="material-symbols-rounded" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
      </div>
    </nav>
    {shellNotice && <div className="demo-toast" role="status"><span className="material-symbols-rounded">check_circle</span>{shellNotice}</div>}
    {editing && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(false); }}><section aria-modal="true" className="demo-modal" role="dialog"><span className="demo-kicker">{t("eventHubSettingsTitle")}</span><h2>{party.title}</h2><form onSubmit={saveEdit}><label>{t("createName")}<input name="title" defaultValue={party.title} required /></label><EventDateTimeFields dateLabel={t("createDate")} timeLabel={t("createTime")} dateDefault={eventDateInputValue(party.date)} timeDefault={party.time} /><label>{t("createVenue")}<input name="venue" defaultValue={party.venue} required /></label><label>{t("createFormat")}<span className="brand-select"><select name="category" defaultValue={party.category}><option>House Party</option><option>After-work</option><option>Trip</option><option>Birthday</option><option>Game night</option></select></span></label><label>{t("createDetails")}<textarea name="description" defaultValue={party.description} /></label><button type="submit">{t("profileSave")}</button></form></section></div>}
  </main>;
}
