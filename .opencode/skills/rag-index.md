# Skill: Rebuild RAG Index

After any code change, rebuild the RAG index:

```bash
npm run rag:build
```

Search the index:

```bash
npm run rag:search "query" --type component
npm run rag:search "useStageGame" --type hook
```

Chunk types: `docs`, `component`, `utility`, `game`, `route`, `css`, `hook`, `config`, `type`

The index is at `.rag/index.json` (~6 MB, gitignored).
