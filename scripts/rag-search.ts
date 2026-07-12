#!/usr/bin/env tsx

import { loadIndex, getIndexStats } from "../lib/rag/store.js";
import { search, getContext } from "../lib/rag/search.js";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: npx tsx scripts/rag-search.ts <query> [options]

Options:
  --type <type>     Filter by chunk type: component, hook, route, game, css, docs, utility, type, config
  --file <path>     Filter by file path substring
  --limit <n>       Max results (default: 10)
  --context         Show full code context instead of summaries
  --stats           Show index statistics
  --list-types      List all chunk types in index

Examples:
  npx tsx scripts/rag-search.ts "how does multiplayer work"
  npx tsx scripts/rag-search.ts "chat input" --type component
  npx tsx scripts/rag-search.ts "useStageGame" --type hook
  npx tsx scripts/rag-search.ts "game session" --type route
  npx tsx scripts/rag-search.ts "brand colors" --type css
  npx tsx scripts/rag-search.ts "AliasGame" --file games
  npx tsx scripts/rag-search.ts "multiplayer" --context --limit 3`);
  process.exit(0);
}

const index = loadIndex();
if (!index) {
  console.error("❌ No index found. Run `npx tsx scripts/rag-build.ts` first.");
  process.exit(1);
}

if (args.includes("--stats")) {
  console.log(getIndexStats(index));
  process.exit(0);
}

if (args.includes("--list-types")) {
  const types: Record<string, number> = {};
  for (const chunk of index.chunks) {
    types[chunk.type] = (types[chunk.type] || 0) + 1;
  }
  console.log("Chunk types in index:");
  for (const [t, c] of Object.entries(types).sort(([, a], [, b]) => b - a)) {
    console.log(`  ${t}: ${c}`);
  }
  process.exit(0);
}

const queryParts: string[] = [];
const options: Record<string, unknown> = {};
let i = 0;
while (i < args.length) {
  if (args[i] === "--type" && args[i + 1]) {
    options.type = args[i + 1];
    i += 2;
  } else if (args[i] === "--file" && args[i + 1]) {
    options.file = args[i + 1];
    i += 2;
  } else if (args[i] === "--limit" && args[i + 1]) {
    options.limit = parseInt(args[i + 1], 10);
    i += 2;
  } else if (args[i] === "--context") {
    options.context = true;
    i++;
  } else {
    queryParts.push(args[i]);
    i++;
  }
}

const query = queryParts.join(" ");
if (!query) {
  console.error("❌ No query provided.");
  process.exit(1);
}

if (options.context) {
  const context = getContext(index, query, (options.limit as number) || 3);
  console.log(context);
} else {
  const results = search(index, query, options as { type?: "component" | "hook" | "route" | "game" | "css" | "docs" | "utility" | "type" | "config"; file?: string; limit?: number });
  if (results.length === 0) {
    console.log("No results found.");
  } else {
    for (const r of results) {
      const preview = r.chunk.content.slice(0, 200).replace(/\n/g, " ");
      console.log(`\n[${r.rank}] ${r.chunk.file}:${r.chunk.lines[0]}–${r.chunk.lines[1]} [${r.chunk.type}:${r.chunk.name}] score=${r.score.toFixed(3)}`);
      console.log(`    ${preview}...`);
    }
  }
}
