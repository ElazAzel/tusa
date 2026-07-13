"use client";

import { useEffect, useState } from "react";

const svgCache = new Map<string, string>();

export default function InlineSvg({ url, className }: { url: string; className?: string }) {
  const [svg, setSvg] = useState<string | null>(() => svgCache.get(url) ?? null);

  useEffect(() => {
    if (svgCache.has(url)) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) {
          svgCache.set(url, text);
          setSvg(text);
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [url]);

  if (!svg) return <span className={className} style={{ display: "inline-block", width: 48, height: 48 }} />;

  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}
