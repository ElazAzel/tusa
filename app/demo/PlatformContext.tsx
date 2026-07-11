"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Tab = "overview" | "games" | "shopping" | "gallery" | "chat" | "koins" | "profile";
export type RsvpStatus = "going" | "maybe" | "pass";
export type EventRole = "host" | "co-host" | "dj" | "chef" | "chronicler" | "treasurer" | "driver" | "guest";

export type Participant = {
  id: string;
  name: string;
  initials: string;
  rsvp: RsvpStatus;
  role: EventRole;
};

export type ShoppingItem = {
  id: string;
  text: string;
  quantity: number;
  unit: string;
  buyerId: string;
  price: number;
  purchased: boolean;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  author: string;
  text: string;
  createdAt: string;
  reactions: Record<string, string[]>;
  pinned?: boolean;
  voiceUrl?: string;
};

export type ChatThread = {
  id: string;
  name: string;
  messages: ChatMessage[];
};

export type BetEntry = { userId: string; option: string; stake: number };
export type Bet = {
  id: string;
  text: string;
  options: [string, string];
  status: "open" | "settled" | "cancelled";
  winner?: string;
  entries: BetEntry[];
  createdAt: string;
};

export type Photo = {
  id: string;
  name: string;
  src: string;
  createdAt: string;
  tags: string[];
  cover?: boolean;
};

export type GameRecord = {
  id: string;
  game: string;
  score: number;
  summary: string;
  createdAt: string;
};

export type EventNote = { id: string; text: string; pinned: boolean };
export type EventBlast = { id: string; text: string; createdAt: string };

export type EventData = {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  privacy: "private" | "unlisted";
  vibeTags: string[];
  disposableGallery: boolean;
  participants: Participant[];
  shopping: ShoppingItem[];
  threads: ChatThread[];
  bets: Bet[];
  photos: Photo[];
  gameHistory: GameRecord[];
  notes: EventNote[];
  blasts: EventBlast[];
};

export type KoinsTransaction = {
  id: string;
  amount: number;
  label: string;
  createdAt: string;
};

export type Profile = {
  id: string;
  name: string;
  city: string;
  bio: string;
  xp: number;
  streak: number;
  koins: number;
  badges: string[];
  frame: "lime" | "pink" | "blue";
  compashka: string;
  koinsTransactions: KoinsTransaction[];
};

export type PlatformState = {
  activeEventId: string;
  events: EventData[];
  profile: Profile;
};

type EventDraft = Pick<EventData, "title" | "description" | "category" | "date" | "time" | "venue" | "capacity" | "privacy" | "vibeTags">;

type PlatformContextValue = {
  state: PlatformState;
  event: EventData;
  toast: string;
  notify: (message: string) => void;
  updateEvent: (updater: (event: EventData) => EventData) => void;
  updateProfile: (updater: (profile: Profile) => Profile) => void;
  createEvent: (draft: EventDraft) => string;
  duplicateEvent: () => void;
  deleteEvent: () => void;
  switchEvent: (eventId: string) => void;
  gainXp: (amount: number, label: string) => void;
  resetPlatform: () => void;
};

const STORAGE_KEY = "tusa-game-platform-v2";

export const eventRoles: Array<{ value: EventRole; label: string }> = [
  { value: "host", label: "Host" },
  { value: "co-host", label: "Co-host" },
  { value: "dj", label: "DJ" },
  { value: "chef", label: "Chef" },
  { value: "chronicler", label: "Chronicler" },
  { value: "treasurer", label: "Treasurer" },
  { value: "driver", label: "Driver" },
  { value: "guest", label: "Guest" },
];

export const rsvpLabels: Record<RsvpStatus, string> = {
  going: "Going",
  maybe: "Maybe",
  pass: "Pass",
};

function uid(prefix: string) {
  return `${prefix}_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;
}

function makeEvent(overrides: Partial<EventData> = {}): EventData {
  return {
    id: uid("evt"),
    title: "Квартирник у Амира",
    description: "Музыка, Alias и тот самый плейлист. Берите хорошее настроение — остальное соберём вместе.",
    category: "house_party",
    date: "2026-07-17",
    time: "21:00",
    venue: "Алматы · Самал-2",
    capacity: 12,
    privacy: "private",
    vibeTags: ["квартирник", "музыка", "игры"],
    disposableGallery: false,
    participants: [
      { id: "you", name: "Ильяс", initials: "ИА", rsvp: "maybe", role: "host" },
      { id: "dana", name: "Дана", initials: "Д", rsvp: "going", role: "chronicler" },
      { id: "ruslan", name: "Руслан", initials: "Р", rsvp: "going", role: "dj" },
      { id: "mira", name: "Мира", initials: "М", rsvp: "going", role: "chef" },
      { id: "sanzhar", name: "Санжар", initials: "С", rsvp: "maybe", role: "driver" },
      { id: "nur", name: "Нура", initials: "Н", rsvp: "going", role: "guest" },
      { id: "zhan", name: "Жан", initials: "Ж", rsvp: "pass", role: "guest" },
    ],
    shopping: [
      { id: "shop_ice", text: "Лёд", quantity: 3, unit: "пак.", buyerId: "dana", price: 2700, purchased: true },
      { id: "shop_coal", text: "Угли", quantity: 2, unit: "пак.", buyerId: "you", price: 0, purchased: false },
      { id: "shop_drinks", text: "Кола и тоник", quantity: 6, unit: "бут.", buyerId: "ruslan", price: 6300, purchased: true },
    ],
    threads: [
      {
        id: "thread_general",
        name: "Общий",
        messages: [
          { id: "msg_1", authorId: "you", author: "Ильяс", text: "Стартуем в 21:00. Не опаздываем 😎", createdAt: "2026-07-10T18:42:00.000Z", reactions: { "🔥": ["dana", "ruslan"] }, pinned: true },
          { id: "msg_2", authorId: "dana", author: "Дана", text: "Лёд уже у меня!", createdAt: "2026-07-10T18:47:00.000Z", reactions: { "💚": ["you"] } },
        ],
      },
      { id: "thread_food", name: "Еда", messages: [] },
    ],
    bets: [
      { id: "bet_1", text: "Руслан проиграет первый раунд Alias", options: ["Да", "Нет"], status: "open", entries: [], createdAt: "2026-07-10T18:55:00.000Z" },
    ],
    photos: [],
    gameHistory: [],
    notes: [
      { id: "note_1", text: "Домофон 47. После 23:00 без криков в подъезде.", pinned: true },
    ],
    blasts: [],
    ...overrides,
  };
}

function createDefaultState(): PlatformState {
  const initialEvent = makeEvent({ id: "evt_amir_friday" });
  return {
    activeEventId: initialEvent.id,
    events: [initialEvent],
    profile: {
      id: "you",
      name: "Ильяс",
      city: "Алматы",
      bio: "Тот самый друг, который реально всё собирает.",
      xp: 760,
      streak: 4,
      koins: 340,
      badges: ["Первый сбор", "Ледяной герой", "Без опозданий"],
      frame: "lime",
      compashka: "Самал Crew",
      koinsTransactions: [
        { id: "txn_seed", amount: 340, label: "Стартовый баланс", createdAt: "2026-07-01T12:00:00.000Z" },
      ],
    },
  };
}

function loadState(): PlatformState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) {
      const parsed = JSON.parse(value) as PlatformState;
      if (parsed.events?.length && parsed.profile) return parsed;
    }
  } catch {
    // Start with safe defaults when local storage is unavailable or stale.
  }
  return createDefaultState();
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlatformState>(loadState);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Large galleries can exhaust local storage; the active session still works.
    }
  }, [state]);

  useEffect(() => {
    function syncAcrossTabs(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setState(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed updates from older tabs.
      }
    }
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const event = state.events.find((item) => item.id === state.activeEventId) ?? state.events[0];

  const updateEvent = useCallback((updater: (event: EventData) => EventData) => {
    setState((current) => ({
      ...current,
      events: current.events.map((item) => item.id === current.activeEventId ? updater(item) : item),
    }));
  }, []);

  const updateProfile = useCallback((updater: (profile: Profile) => Profile) => {
    setState((current) => {
      const profile = updater(current.profile);
      return {
        ...current,
        profile,
        events: current.events.map((item) => ({
          ...item,
          participants: item.participants.map((person) => person.id === profile.id ? { ...person, name: profile.name, initials: profile.name.slice(0, 2).toUpperCase() } : person),
          threads: item.threads.map((thread) => ({
            ...thread,
            messages: thread.messages.map((message) => message.authorId === profile.id ? { ...message, author: profile.name } : message),
          })),
        })),
      };
    });
  }, []);

  const gainXp = useCallback((amount: number, label: string) => {
    setState((current) => {
      const xp = current.profile.xp + amount;
      const badges = [...current.profile.badges];
      if (xp >= 1000 && !badges.includes("Тысяча вайба")) badges.push("Тысяча вайба");
      return { ...current, profile: { ...current.profile, xp, badges } };
    });
    notify(`+${amount} VibeScore · ${label}`);
  }, [notify]);

  const createEvent = useCallback((draft: EventDraft) => {
    const id = uid("evt");
    setState((current) => {
      const created = makeEvent({
        ...draft,
        id,
        participants: [{ id: current.profile.id, name: current.profile.name, initials: current.profile.name.slice(0, 2).toUpperCase(), rsvp: "going", role: "host" }],
        shopping: [],
        threads: [{ id: uid("thread"), name: "Общий", messages: [] }],
        bets: [],
        photos: [],
        gameHistory: [],
        notes: [],
        blasts: [],
      });
      return { ...current, activeEventId: id, events: [...current.events, created] };
    });
    notify("Ивент готов. Ссылка уже ждёт своих.");
    return id;
  }, [notify]);

  const duplicateEvent = useCallback(() => {
    setState((current) => {
      const source = current.events.find((item) => item.id === current.activeEventId) ?? current.events[0];
      const duplicated = makeEvent({
        ...source,
        id: uid("evt"),
        title: `${source.title} · копия`,
        participants: source.participants.filter((person) => person.id === current.profile.id),
        threads: [{ id: uid("thread"), name: "Общий", messages: [] }],
        photos: [],
        gameHistory: [],
        blasts: [],
      });
      return { ...current, activeEventId: duplicated.id, events: [...current.events, duplicated] };
    });
    notify("Копия готова. Осталось обновить дату.");
  }, [notify]);

  const deleteEvent = useCallback(() => {
    setState((current) => {
      if (current.events.length === 1) return current;
      const events = current.events.filter((item) => item.id !== current.activeEventId);
      return { ...current, events, activeEventId: events[0].id };
    });
    notify(state.events.length === 1 ? "Последний ивент удалять нельзя." : "Ивент удалён.");
  }, [notify, state.events.length]);

  const switchEvent = useCallback((eventId: string) => {
    setState((current) => current.events.some((item) => item.id === eventId) ? { ...current, activeEventId: eventId } : current);
  }, []);

  const resetPlatform = useCallback(() => {
    const initial = createDefaultState();
    setState(initial);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
    notify("Платформа сброшена до чистого демо.");
  }, [notify]);

  const value = useMemo<PlatformContextValue>(() => ({
    state,
    event,
    toast,
    notify,
    updateEvent,
    updateProfile,
    createEvent,
    duplicateEvent,
    deleteEvent,
    switchEvent,
    gainXp,
    resetPlatform,
  }), [state, event, toast, notify, updateEvent, updateProfile, createEvent, duplicateEvent, deleteEvent, switchEvent, gainXp, resetPlatform]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) throw new Error("usePlatform must be used inside PlatformProvider");
  return context;
}
