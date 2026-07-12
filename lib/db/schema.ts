import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

export const knowledgeVisibility = pgEnum("knowledge_visibility", ["public", "admin", "engineering"]);

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").primaryKey(),
  locale: text("locale").notNull(),
  visibility: knowledgeVisibility("visibility").notNull(),
  sourceType: text("source_type").notNull(),
  title: text("title").notNull(),
  canonicalUrl: text("canonical_url"),
  version: text("version").notNull(),
  checksum: text("checksum").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("knowledge_documents_visibility_locale_idx").on(table.visibility, table.locale)]);

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").primaryKey(),
  documentId: uuid("document_id").notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").notNull(),
  searchText: text("search_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  metadata: jsonb("metadata").notNull().default({}),
}, (table) => [index("knowledge_chunks_document_idx").on(table.documentId)]);

export const ragJobs = pgTable("rag_jobs", {
  id: uuid("id").primaryKey(),
  status: text("status").notNull(),
  visibility: knowledgeVisibility("visibility").notNull(),
  stats: jsonb("stats").notNull().default({}),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
