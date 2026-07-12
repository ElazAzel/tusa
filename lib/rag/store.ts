import * as fs from "node:fs";
import * as path from "node:path";
import type { RAGIndex } from "./types.js";

const STORE_PATH = path.join(process.cwd(), ".rag", "index.json");

export function saveIndex(index: RAGIndex): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(index), "utf-8");
}

export function loadIndex(): RAGIndex | null {
  if (!fs.existsSync(STORE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as RAGIndex;
  } catch {
    return null;
  }
}

export function indexExists(): boolean {
  return fs.existsSync(STORE_PATH);
}

export function getIndexStats(index: RAGIndex): string {
  const typeCounts: Record<string, number> = {};
  for (const chunk of index.chunks) {
    typeCounts[chunk.type] = (typeCounts[chunk.type] || 0) + 1;
  }

  const fileCounts: Record<string, number> = {};
  for (const chunk of index.chunks) {
    const dir = chunk.file.split("/").slice(0, 3).join("/");
    fileCounts[dir] = (fileCounts[dir] || 0) + 1;
  }

  const topDirs = Object.entries(fileCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);

  const lines = [
    `RAG Index v${index.version}`,
    `Built: ${index.builtAt}`,
    `Chunks: ${index.totalChunks}`,
    `Documents: ${index.totalDocs}`,
    `Avg doc length: ${index.avgDocLen.toFixed(1)} tokens`,
    `IDF terms: ${Object.keys(index.idf).length}`,
    "",
    "Chunk types:",
    ...Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([t, c]) => `  ${t}: ${c}`),
    "",
    "Top directories:",
    ...topDirs.map(([d, c]) => `  ${d}: ${c}`),
  ];

  return lines.join("\n");
}
