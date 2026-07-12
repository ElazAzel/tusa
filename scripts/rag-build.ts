#!/usr/bin/env tsx

import { buildChunks } from "../lib/rag/chunker.js";
import { buildIndex } from "../lib/rag/indexer.js";
import { saveIndex, getIndexStats } from "../lib/rag/store.js";

console.log("🔍 Scanning codebase...");
const chunks = buildChunks();
console.log(`📦 Found ${chunks.length} chunks`);

console.log("📊 Building TF-IDF index...");
const index = buildIndex(chunks);

console.log("💾 Saving index...");
saveIndex(index);

console.log("\n" + getIndexStats(index));
console.log("\n✅ Index built successfully!");
