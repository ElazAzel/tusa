import * as fs from "node:fs";
import * as path from "node:path";
import type { Chunk, ChunkType } from "./types.js";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".git", ".vercel", "coverage", "tmp"]);
const INCLUDE_DIRS = new Set([".opencode"]);
const MIN_CHUNK_LINES = 5;

let chunkIdCounter = 0;
function nextId(): string {
  return `c_${++chunkIdCounter}`;
}

function shouldSkip(dir: string): boolean {
  const base = path.basename(dir);
  if (INCLUDE_DIRS.has(base)) return false;
  return SKIP_DIRS.has(base) || base.startsWith(".");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRe = /import\s+(?:{[^}]+}|[\w*]+(?:\s*,\s*{[^}]+})?)\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const exportRe = /export\s+(?:default\s+)?(?:function|const|class|type|interface|enum)\s+(\w+)/g;
  let m;
  while ((m = exportRe.exec(content)) !== null) {
    exports.push(m[1]);
  }
  return exports;
}

function inferType(filePath: string, name: string, content: string): ChunkType {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (rel.endsWith(".md")) {
    if (rel === "AGENTS.md" || rel === "opencode.json") return "config";
    return "docs";
  }
  if (rel.endsWith(".css")) return "css";
  if (rel.match(/\.(json|ya?ml|env|config)\./)) return "config";
  if (rel.includes(".opencode/skills/")) return "config";
  if (rel.includes("app/api/") || rel.includes("route.ts")) return "route";
  if (rel.includes("app/components/games/")) return "game";
  if (name.startsWith("use") && name.length > 3 && name[3] === name[3].toUpperCase()) return "hook";
  if (name.match(/^[A-Z]/) || content.includes("className=") || content.includes("return <")) return "component";
  if (content.includes("export type") || content.includes("export interface") || content.includes("export enum")) return "type";
  return "utility";
}

function splitTSXChunks(filePath: string, content: string): Chunk[] {
  const lines = content.split("\n");
  const chunks: Chunk[] = [];
  const imports = extractImports(content);

  const boundaries: { line: number; name: string; type: "function" | "const" | "type" | "class" }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    if ((match = line.match(/^(?:export\s+)?(?:default\s+)?function\s+(\w+)/))) {
      boundaries.push({ line: i, name: match[1], type: "function" });
    } else if ((match = line.match(/^(?:export\s+)?(?:default\s+)?const\s+(\w+)\s*[:=]/))) {
      boundaries.push({ line: i, name: match[1], type: "const" });
    } else if ((match = line.match(/^(?:export\s+)?type\s+(\w+)/))) {
      boundaries.push({ line: i, name: match[1], type: "type" });
    } else if ((match = line.match(/^(?:export\s+)?interface\s+(\w+)/))) {
      boundaries.push({ line: i, name: match[1], type: "type" });
    } else if ((match = line.match(/^(?:export\s+)?class\s+(\w+)/))) {
      boundaries.push({ line: i, name: match[1], type: "class" });
    }
  }

  if (boundaries.length === 0) {
    if (lines.length > MIN_CHUNK_LINES) {
      const content1 = lines.join("\n");
      chunks.push({
        id: nextId(),
        file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        lines: [1, lines.length],
        type: inferType(filePath, path.basename(filePath, path.extname(filePath)), content1),
        name: path.basename(filePath, path.extname(filePath)),
        content: content1,
        tokens: tokenize(content1),
        imports,
        exports: extractExports(content),
        description: "",
      });
    }
    return chunks;
  }

  for (let b = 0; b < boundaries.length; b++) {
    const start = boundaries[b].line;
    const end = b + 1 < boundaries.length ? boundaries[b + 1].line : lines.length;
    const chunkLines = lines.slice(start, end);
    if (chunkLines.length < MIN_CHUNK_LINES) continue;
    const chunkContent = chunkLines.join("\n");
    const name = boundaries[b].name;
    const chunkType = inferType(filePath, name, chunkContent);

    chunks.push({
      id: nextId(),
      file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      lines: [start + 1, start + chunkLines.length],
      type: chunkType,
      name,
      content: chunkContent,
      tokens: tokenize(chunkContent),
      imports: b === 0 ? imports : [],
      exports: extractExports(chunkContent),
      description: "",
    });
  }

  return chunks;
}

function splitCSSChunks(filePath: string, content: string): Chunk[] {
  const lines = content.split("\n");
  const chunks: Chunk[] = [];

  let sectionStart = 0;
  let sectionName = "global";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionMatch = line.match(/\/\*\s*={2,}\s*(.+?)\s*\*\//);
    if (sectionMatch && i > sectionStart + MIN_CHUNK_LINES) {
      const chunkLines = lines.slice(sectionStart, i);
      if (chunkLines.length >= MIN_CHUNK_LINES) {
        chunks.push({
          id: nextId(),
          file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
          lines: [sectionStart + 1, sectionStart + chunkLines.length],
          type: "css",
          name: sectionName,
          content: chunkLines.join("\n"),
          tokens: tokenize(chunkLines.join("\n")),
          imports: [],
          exports: [],
          description: "",
        });
      }
      sectionStart = i;
      sectionName = sectionMatch[1].trim();
    }
  }

  if (lines.length - sectionStart >= MIN_CHUNK_LINES) {
    const chunkLines = lines.slice(sectionStart);
    chunks.push({
      id: nextId(),
      file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      lines: [sectionStart + 1, lines.length],
      type: "css",
      name: sectionName,
      content: chunkLines.join("\n"),
      tokens: tokenize(chunkLines.join("\n")),
      imports: [],
      exports: [],
      description: "",
    });
  }

  return chunks;
}

function splitMDChunks(filePath: string, content: string): Chunk[] {
  const lines = content.split("\n");
  const chunks: Chunk[] = [];
  let sectionStart = 0;
  let sectionName = "document";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^#{1,3}\s+/) && i > sectionStart + MIN_CHUNK_LINES) {
      const chunkLines = lines.slice(sectionStart, i);
      chunks.push({
        id: nextId(),
        file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
        lines: [sectionStart + 1, sectionStart + chunkLines.length],
        type: "docs",
        name: sectionName,
        content: chunkLines.join("\n"),
        tokens: tokenize(chunkLines.join("\n")),
        imports: [],
        exports: [],
        description: "",
      });
      sectionStart = i;
      sectionName = line.replace(/^#+\s+/, "").trim();
    }
  }

  const chunkLines = lines.slice(sectionStart);
  if (chunkLines.length >= MIN_CHUNK_LINES) {
    chunks.push({
      id: nextId(),
      file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      lines: [sectionStart + 1, lines.length],
      type: "docs",
      name: sectionName,
      content: chunkLines.join("\n"),
      tokens: tokenize(chunkLines.join("\n")),
      imports: [],
      exports: [],
      description: "",
    });
  }

  return chunks;
}

function chunkFile(filePath: string): Chunk[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath);

  if (ext === ".css") return splitCSSChunks(filePath, content);
  if (ext === ".md") return splitMDChunks(filePath, content);
  if ([".tsx", ".ts", ".jsx", ".js"].includes(ext)) return splitTSXChunks(filePath, content);
  return [];
}

export function collectFiles(dir: string, results: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkip(entry.name)) {
        collectFiles(fullPath, results);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if ([".tsx", ".ts", ".jsx", ".js", ".css", ".md"].includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export function buildChunks(): Chunk[] {
  chunkIdCounter = 0;
  const files = collectFiles(ROOT);
  const allChunks: Chunk[] = [];

  for (const file of files) {
    try {
      const chunks = chunkFile(file);
      allChunks.push(...chunks);
    } catch {
      // skip unreadable files
    }
  }

  return allChunks;
}
