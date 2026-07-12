const MAX_SCORE = 100_000;

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

/** Derives a result from the persisted server snapshot. Client score values are ignored. */
export function deriveVerifiedScore(state: Record<string, unknown>) {
  const scoreMap = state.scores;
  if (scoreMap && typeof scoreMap === "object" && !Array.isArray(scoreMap)) {
    const values = Object.values(scoreMap).map(safeNumber);
    if (values.length) return Math.min(MAX_SCORE, Math.max(...values));
  }
  for (const key of ["score", "count", "points", "correctAnswers"] as const) {
    if (key in state) return Math.min(MAX_SCORE, safeNumber(state[key]));
  }
  if (typeof state.winner === "string" && state.winner) return 1;
  if (Array.isArray(state.pairs)) return Math.min(MAX_SCORE, state.pairs.length);
  if (Array.isArray(state.completed)) return Math.min(MAX_SCORE, state.completed.length);
  return 0;
}
