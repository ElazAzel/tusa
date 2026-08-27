function commandId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function notify(type: "tusa:game-command-error" | "tusa:game-command-success", detail?: { message?: string }) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(type, { detail }));
}

export async function sendGameCommand(sessionId: string, actionType: string, payload?: unknown) {
  const clientMutationId = commandId();
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let terminal = false;
    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "playerAction", sessionId, actionType, payload, clientMutationId }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (response.ok) {
        notify("tusa:game-command-success");
        return data as { ok: true; commandId: string };
      }
      const message = typeof data.error === "string" ? data.error : `Game command rejected (${response.status})`;
      if (response.status < 500 && response.status !== 409 && response.status !== 429) {
        terminal = true;
        throw new Error(message);
      }
      lastError = new Error(message);
    } catch (error) {
      lastError = error;
      if (terminal) break;
    }
    if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 350 * 2 ** attempt));
  }
  const error = lastError instanceof Error ? lastError : new Error("Game command failed");
  notify("tusa:game-command-error", { message: error.message });
  throw error;
}
