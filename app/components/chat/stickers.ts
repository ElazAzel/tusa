export type Sticker = {
  id: string;
  label: string;
  emoji: string;
  svg: string;
};

export const tusaStickers: Sticker[] = [
  { id: "fire", label: "Огонь", emoji: "🔥", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#C9FF05"/><text x="60" y="78" text-anchor="middle" font-size="64">🔥</text></svg>` },
  { id: "tusa-vibe", label: "TUSA Vibe", emoji: "🎉", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#FF007F"/><text x="60" y="78" text-anchor="middle" font-size="64">🎉</text></svg>` },
  { id: "clap", label: "Хлопки", emoji: "👏", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#2D00F7"/><text x="60" y="78" text-anchor="middle" font-size="64">👏</text></svg>` },
  { id: "dance", label: "Танцы", emoji: "💃", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#C9FF05"/><text x="60" y="78" text-anchor="middle" font-size="64">💃</text></svg>` },
  { id: "laugh", label: "Ржака", emoji: "😂", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#F7F7F2"/><text x="60" y="78" text-anchor="middle" font-size="64">😂</text></svg>` },
  { id: "love", label: "Любовь", emoji: "❤️", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#FF007F"/><text x="60" y="78" text-anchor="middle" font-size="64">❤️</text></svg>` },
  { id: "think", label: "Хмм", emoji: "🤔", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#C9FF05"/><text x="60" y="78" text-anchor="middle" font-size="64">🤔</text></svg>` },
  { id: "party", label: "Пати", emoji: "🥳", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#2D00F7"/><text x="60" y="78" text-anchor="middle" font-size="64">🥳</text></svg>` },
  { id: "shot", label: "Шот!", emoji: "🥃", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#C9FF05"/><text x="60" y="78" text-anchor="middle" font-size="64">🥃</text></svg>` },
  { id: "game", label: "Играем!", emoji: "🎮", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#FF007F"/><text x="60" y="78" text-anchor="middle" font-size="64">🎮</text></svg>` },
  { id: "music", label: "Музыка", emoji: "🎵", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#2D00F7"/><text x="60" y="78" text-anchor="middle" font-size="64">🎵</text></svg>` },
  { id: "tusa-logo", label: "TUSA!", emoji: "🤙", svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="18" fill="#C9FF05" stroke="#000" stroke-width="3"/><text x="60" y="68" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="28" fill="#000">TUSA</text><text x="60" y="98" text-anchor="middle" font-size="36">🤙</text></svg>` },
];

export const quickReactions = ["👍", "❤️", "😂", "🔥", "🎉", "👀", "💯", "🤙"];
