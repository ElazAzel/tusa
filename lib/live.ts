type Listener = (data: unknown) => void;

const channels = new Map<string, Set<Listener>>();

export function subscribe(channel: string, listener: Listener) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel)!.add(listener);
  return () => { channels.get(channel)?.delete(listener); };
}

export function publish(channel: string, data: unknown) {
  const listeners = channels.get(channel);
  if (listeners) for (const listener of listeners) listener(data);
}

export function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

export async function* generateEvents(channel: string) {
  const queue: unknown[] = [];
  const unsub = subscribe(channel, (data) => { queue.push(data); });
  try {
    while (true) {
      while (queue.length > 0) {
        yield `data: ${JSON.stringify(queue.shift())}\n\n`;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      yield `: ping\n\n`;
    }
  } finally {
    unsub();
  }
}
