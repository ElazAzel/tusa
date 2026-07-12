export type ChunkType = "component" | "hook" | "route" | "utility" | "type" | "css" | "docs" | "config" | "game";

export interface Chunk {
  id: string;
  file: string;
  lines: [number, number];
  type: ChunkType;
  name: string;
  content: string;
  tokens: string[];
  imports: string[];
  exports: string[];
  description: string;
}

export interface IndexEntry {
  chunkId: string;
  file: string;
  name: string;
  type: ChunkType;
  lines: [number, number];
  tf: Record<string, number>;
  docLen: number;
}

export interface RAGIndex {
  version: number;
  builtAt: string;
  totalChunks: number;
  totalDocs: number;
  avgDocLen: number;
  chunks: Chunk[];
  index: IndexEntry[];
  idf: Record<string, number>;
  docCount: number;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
  rank: number;
}

export interface SearchOptions {
  type?: ChunkType;
  file?: string;
  limit?: number;
  minScore?: number;
}
