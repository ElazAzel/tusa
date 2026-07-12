import type { Chunk, IndexEntry, RAGIndex } from "./types.js";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "it", "to", "in", "of", "for", "on", "and", "or", "not",
  "this", "that", "with", "from", "at", "by", "as", "be", "was", "are", "been",
  "do", "does", "did", "has", "have", "had", "but", "if", "so", "no", "yes",
  "true", "false", "null", "undefined", "return", "import", "export", "from",
  "const", "let", "var", "function", "class", "interface", "type", "enum",
  "extends", "implements", "new", "typeof", "instanceof", "void", "never",
  "any", "string", "number", "boolean", "object", "array",
]);

function termFreq(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const t of tokens) {
    if (STOP_WORDS.has(t)) continue;
    tf[t] = (tf[t] || 0) + 1;
  }
  return tf;
}

function computeIDF(chunks: IndexEntry[], docCount: number): Record<string, number> {
  const df: Record<string, number> = {};
  for (const entry of chunks) {
    for (const term of Object.keys(entry.tf)) {
      df[term] = (df[term] || 0) + 1;
    }
  }
  const idf: Record<string, number> = {};
  for (const [term, freq] of Object.entries(df)) {
    idf[term] = Math.log((docCount - freq + 0.5) / (freq + 0.5) + 1);
  }
  return idf;
}

export function buildIndex(chunks: Chunk[]): RAGIndex {
  const index: IndexEntry[] = chunks.map((chunk) => ({
    chunkId: chunk.id,
    file: chunk.file,
    name: chunk.name,
    type: chunk.type,
    lines: chunk.lines,
    tf: termFreq(chunk.tokens),
    docLen: chunk.tokens.length,
  }));

  const docCount = index.length;
  const avgDocLen = docCount > 0 ? index.reduce((s, e) => s + e.docLen, 0) / docCount : 0;
  const idf = computeIDF(index, docCount);

  return {
    version: 1,
    builtAt: new Date().toISOString(),
    totalChunks: chunks.length,
    totalDocs: docCount,
    avgDocLen,
    chunks,
    index,
    idf,
    docCount,
  };
}

export type { RAGIndex };
