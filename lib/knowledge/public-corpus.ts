import { createHash } from "node:crypto";
import { copy, type Locale } from "@/lib/i18n";
import { GAME_MANIFEST, formatPlayerRange } from "@/lib/games/manifest";
import { gamePageCopy } from "@/lib/games/page-copy";
import { CONTENT_UPDATED_AT, SITE_ORIGIN } from "@/lib/site";
import type { KnowledgeDocument, SearchHit } from "./types";

function checksum(value: string) { return createHash("sha256").update(value).digest("hex").slice(0, 24); }
function tokens(value: string) { return value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []; }

export function buildPublicCorpus(locale: Locale): KnowledgeDocument[] {
  const ui = gamePageCopy[locale];
  const gameDocs = GAME_MANIFEST.map((game) => {
    const title = copy(locale, game.titleKey);
    const description = copy(locale, game.descKey);
    const text = `${title}. ${description} ${ui.players}: ${formatPlayerRange(game)}. ${ui.duration}: ${game.seo.durationMinutes} ${ui.minutes}. ${ui.equipment}: ${game.seo.equipment === "phones_and_stage" ? ui.phonesAndStage : ui.phones}. ${ui.beta} ${ui.safe}`;
    return {
      id: `game:${game.id}:${locale}`,
      locale,
      visibility: "public",
      sourceType: "game",
      title,
      text,
      canonicalUrl: `${SITE_ORIGIN}/games/${game.seo.slug}`,
      version: "1",
      checksum: checksum(text),
      updatedAt: CONTENT_UPDATED_AT.toISOString(),
    } satisfies KnowledgeDocument;
  });
  const help = locale === "ru"
    ? [
        ["guide:join:ru", "Как войти в тусу", "Откройте ссылку-приглашение, войдите в аккаунт, выберите статус участия и подключитесь к игровому лобби. После перезагрузки активная сессия восстанавливается из сохранённого snapshot."],
        ["guide:create:ru", "Как создать тусу", "Хост входит в TUSA.game, создаёт событие, указывает дату, время и место, а затем делится одной ссылкой или QR-кодом. Создание в beta открывается действующим промокодом."],
        ["guide:reconnect:ru", "Что делать после разрыва связи", "Не создавайте новую игру. Откройте ту же тусу: TUSA.game повторно подключится к realtime-каналу и запросит последний сохранённый snapshot сессии."],
      ]
    : [
        ["guide:join:en", "How to join a party", "Open the invite link, sign in, choose your RSVP status and join the game lobby. After a reload, the active session is restored from its saved snapshot."],
        ["guide:create:en", "How to create a party", "A host signs in to TUSA.game, creates an event with its date, time and venue, then shares one link or QR code. During beta, an active promo code unlocks creation."],
        ["guide:reconnect:en", "How session recovery works", "Do not create another game after a connection loss. Open the same party: TUSA.game reconnects to its realtime channel and requests the latest saved session snapshot."],
      ];
  return [...gameDocs, ...help.map(([id, title, text]) => ({ id, locale, visibility: "public", sourceType: "guide", title, text, canonicalUrl: `${SITE_ORIGIN}/faq`, version: "1", checksum: checksum(text), updatedAt: CONTENT_UPDATED_AT.toISOString() } satisfies KnowledgeDocument))];
}

export function searchPublicCorpus(query: string, locale: Locale, limit = 5): SearchHit[] {
  const queryTokens = [...new Set(tokens(query))];
  if (queryTokens.length === 0) return [];
  return buildPublicCorpus(locale).map((document) => {
    const documentTokens = tokens(`${document.title} ${document.text}`);
    const frequencies = new Map<string, number>();
    for (const token of documentTokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    const exactTitle = document.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ? 2 : 0;
    const matched = queryTokens.reduce((score, token) => score + Math.min(frequencies.get(token) ?? 0, 3), 0);
    const score = exactTitle + matched / Math.sqrt(Math.max(documentTokens.length, 1));
    return { document, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(({ document, score }, index) => ({
    documentId: document.id,
    chunkId: `${document.id}:0`,
    score: Number(score.toFixed(4)),
    text: document.text,
    title: document.title,
    url: document.canonicalUrl,
    citationLabel: `[${index + 1}]`,
  }));
}
