const permutations = new Map<string, number[]>();

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function permutation(size: number, seed: string) {
  const key = `${size}:${seed}`;
  const cached = permutations.get(key);
  if (cached) return cached;
  const next = random(hashSeed(seed));
  const order = Array.from({ length: size }, (_, index) => index);
  for (let index = size - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  if (permutations.size > 500) permutations.clear();
  permutations.set(key, order);
  return order;
}

export type ContentDeck = { deckSeed: string; deckStart: number };

export function readDeck(config: Record<string, unknown>, game: string): ContentDeck {
  const deckSeed = typeof config.deckSeed === "string" && config.deckSeed ? config.deckSeed : `default:${game}`;
  const deckStart = Number.isInteger(config.deckStart) && Number(config.deckStart) >= 0 ? Number(config.deckStart) : 0;
  return { deckSeed, deckStart };
}

export function deckIndex(size: number, deck: ContentDeck, position: number) {
  if (size <= 0) return 0;
  const absolute = deck.deckStart + Math.max(0, position);
  const epoch = Math.floor(absolute / size);
  return permutation(size, `${deck.deckSeed}:${epoch}`)[absolute % size];
}

export function deckItem<T>(pool: readonly T[], deck: ContentDeck, position: number): T {
  return pool[deckIndex(pool.length, deck, position)];
}

export const DECK_STATE_KEYS = ["deckSeed", "deckStart"] as const;
