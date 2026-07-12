import type { Locale } from "@/lib/i18n";

export type KnowledgeVisibility = "public" | "admin" | "engineering";

export interface KnowledgeDocument {
  id: string;
  locale: Locale;
  visibility: KnowledgeVisibility;
  sourceType: "game" | "faq" | "guide" | "code" | "operations";
  title: string;
  text: string;
  canonicalUrl?: string;
  version: string;
  checksum: string;
  updatedAt: string;
}

export interface SearchHit {
  documentId: string;
  chunkId: string;
  score: number;
  text: string;
  title: string;
  url?: string;
  citationLabel: string;
}

export interface RagAnswer {
  answer: string;
  locale: Locale;
  citations: SearchHit[];
  confidence: number;
  requestId: string;
}
