"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CatalogueGame = {
  id: string;
  title: string;
  description: string;
  category: "full_game" | "quick_tool" | "experimental";
  categoryLabel: string;
  playerLabel: string;
  statusLabel: string;
  openLabel: string;
  slug: string;
  tone: string;
};

type Copy = { search: string; all: string; full: string; tools: string; result: string; empty: string };

export default function GameCatalogue({ games, copy }: { games: CatalogueGame[]; copy: Copy }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "full_game" | "quick_tool">("all");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return games.filter((game) => (category === "all" || game.category === category) && (!needle || `${game.title} ${game.description}`.toLocaleLowerCase().includes(needle)));
  }, [category, games, query]);

  return <section className="catalogue-shell" aria-label={copy.result}>
    <div className="catalogue-controls">
      <label className="catalogue-search"><span className="material-symbols-rounded" aria-hidden="true">search</span><span className="sr-only">{copy.search}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label>
      <div className="catalogue-filters" role="group" aria-label={copy.result}>
        {([['all', copy.all], ['full_game', copy.full], ['quick_tool', copy.tools]] as const).map(([value, label]) => <button type="button" aria-pressed={category === value} className={category === value ? "active" : ""} onClick={() => setCategory(value)} key={value}>{label}</button>)}
      </div>
      <strong className="catalogue-count" aria-live="polite">{filtered.length} {copy.result}</strong>
    </div>
    {filtered.length ? <div className="games-grid catalogue-grid">
      {filtered.map((game) => <article key={game.id} className={`game-card game-card--${game.tone}`}>
        <div className="game-card-meta"><span>{game.categoryLabel}</span><span>{game.playerLabel}</span></div>
        <h2>{game.title}</h2><p>{game.description}</p>
        <div className="game-card-footer"><span className="game-status">{game.statusLabel}</span><Link href={`/games/${game.slug}`}>{game.openLabel} <span aria-hidden="true">→</span></Link></div>
      </article>)}
    </div> : <div className="catalogue-empty"><span className="material-symbols-rounded" aria-hidden="true">search_off</span><strong>{copy.empty}</strong><button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>{copy.all}</button></div>}
  </section>;
}
