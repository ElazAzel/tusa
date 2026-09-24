import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { sseHeaders, generateEvents, isRealtimeTransportAvailable } from "@/lib/live";
import { getGameSessionById, requirePartyMember } from "@/lib/parties";
import { resolveActor } from "@/lib/guest-session";

const MEMBERSHIP_RECHECK_MS = 60_000;
const channelPattern = /^(party|chat|game):([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export async function GET(request: Request) {
  if (!isRealtimeTransportAvailable()) {
    return new Response("Realtime is temporarily unavailable.", {
      status: 503,
      headers: { "Retry-After": "15", "Cache-Control": "no-store" },
    });
  }
  const actor = await resolveActor();
  if (!actor) return new Response("Unauthorized", { status: 401 });
  const userId = actor.id;
  const ip = getClientIp(request.headers);
  const rl = await distributedRateLimit(`live:connect:${userId}:${ip}`, 30, 60_000);
  if (!rl.allowed) return new Response("Too Many Requests", { status: 429 });

  const channel = new URL(request.url).searchParams.get("channel") ?? "";
  const match = channel.match(channelPattern);
  if (!match) return new Response("Invalid channel", { status: 400 });

  const [, scope, id] = match;
  const authorize = async () => {
    if (scope === "game") {
      const session = await getGameSessionById(id);
      if (!session) return "missing" as const;
      await requirePartyMember(session.partyId, userId);
    } else {
      await requirePartyMember(id, userId);
    }
    return "ok" as const;
  };
  try {
    if (await authorize() === "missing") return new Response("Not Found", { status: 404 });
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const lastEventId = request.headers.get("last-event-id") ?? undefined;

  const stream = new ReadableStream({
    async start(controller) {
      let authorizedAt = Date.now();
      for await (const event of generateEvents(channel, lastEventId)) {
        if (Date.now() - authorizedAt > MEMBERSHIP_RECHECK_MS) {
          const stillAllowed = await authorize().then((result) => result === "ok", () => false);
          if (!stillAllowed) break;
          authorizedAt = Date.now();
        }
        try { controller.enqueue(new TextEncoder().encode(event)); } catch { break; }
      }
      try { controller.close(); } catch { /* client disconnected */ }
    },
  });
  return new Response(stream, { headers: sseHeaders() });
}

export function POST() {
  return new Response("Publishing directly to live channels is not allowed.", { status: 405, headers: { Allow: "GET" } });
}
