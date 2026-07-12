import type { Chunk, RAGIndex, SearchOptions, SearchResult } from "./types.js";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "it", "to", "in", "of", "for", "on", "and", "or", "not",
  "this", "that", "with", "from", "at", "by", "as", "be", "was", "are", "been",
  "do", "does", "did", "has", "have", "had", "but", "if", "so", "no", "yes",
  "true", "false", "null", "undefined", "return", "import", "export", "from",
  "const", "let", "var", "function", "class", "interface", "type", "enum",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function bm25Score(
  queryTokens: string[],
  entry: { tf: Record<string, number>; docLen: number },
  idf: Record<string, number>,
  avgDocLen: number,
  docCount: number,
): number {
  const k1 = 1.5;
  const b = 0.75;
  let score = 0;

  for (const term of queryTokens) {
    const tfVal = entry.tf[term] || 0;
    const idfVal = idf[term] || 0;
    const numerator = tfVal * (k1 + 1);
    const denominator = tfVal + k1 * (1 - b + b * (entry.docLen / avgDocLen));
    score += idfVal * (numerator / denominator);
  }

  return score;
}

export function search(index: RAGIndex, query: string, options: SearchOptions = {}): SearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const { type, file, limit = 10, minScore = 0.1 } = options;

  const results: SearchResult[] = [];

  for (let i = 0; i < index.index.length; i++) {
    const entry = index.index[i];
    if (type && entry.type !== type) continue;
    if (file && !entry.file.includes(file)) continue;

    const score = bm25Score(queryTokens, entry, index.idf, index.avgDocLen, index.docCount);
    if (score >= minScore) {
      const chunk = index.chunks.find((c) => c.id === entry.chunkId);
      if (chunk) {
        results.push({ chunk, score, rank: 0 });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);

  for (let i = 0; i < results.length; i++) {
    results[i].rank = i + 1;
  }

  return results.slice(0, limit);
}

export function searchByFile(index: RAGIndex, filePath: string): Chunk[] {
  return index.chunks.filter((c) => c.file.includes(filePath));
}

export function searchByType(index: RAGIndex, type: string): Chunk[] {
  return index.chunks.filter((c) => c.type === type);
}

export function getContext(index: RAGIndex, query: string, maxChunks: number = 5): string {
  const results = search(index, query, { limit: maxChunks });
  return results
    .map(
      (r) =>
        `// ${r.chunk.file}:${r.chunk.lines[0]}–${r.chunk.lines[1]} [${r.chunk.type}:${r.chunk.name}] (score: ${r.score.toFixed(3)})\n${r.chunk.content}`,
    )
    .join("\n\n---\n\n");
}
