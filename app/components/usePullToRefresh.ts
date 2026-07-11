"use client";

import { useCallback, useRef, useState } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullingRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 60 && !refreshing) {
      setPulling(true);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    pullingRef.current = false;
    if (pulling && !refreshing) {
      setRefreshing(true);
      try { await onRefresh(); } catch {}
      setRefreshing(false);
      setPulling(false);
    } else {
      setPulling(false);
    }
  }, [pulling, refreshing, onRefresh]);

  return { onTouchStart, onTouchMove, onTouchEnd, pulling, refreshing };
}
