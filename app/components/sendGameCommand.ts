function commandId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function sendGameCommand(sessionId: string, actionType: string, payload?: unknown) {
  const clientMutationId = commandId();
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "playerAction", sessionId, actionType, payload, clientMutationId }),
      });
      if (response.ok) return await response.json() as { ok: true; commandId: string };
      if (response.status < 500 && response.status !== 429) throw new Error(`Game command rejected (${response.status})`);
      lastError = new Error(`Game command retryable failure (${response.status})`);
    } catch (error) { lastError = error; }
    if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 350 * 2 ** attempt));
  }
  throw lastError instanceof Error ? lastError : new Error("Game command failed");
}
