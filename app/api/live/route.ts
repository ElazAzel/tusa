import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { sseHeaders, generateEvents, publish } from "@/lib/live";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:live`, 60, 60000);
  if (!rl.allowed) return new Response("Too Many Requests", { status: 429 });
  const url = new URL(request.url);
  const channel = url.searchParams.get("channel");
  if (!channel) return new Response("Missing channel", { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of generateEvents(channel)) {
        try { controller.enqueue(new TextEncoder().encode(event)); } catch { break; }
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:live`, 30, 60000);
  if (!rl.allowed) return new Response("Too Many Requests", { status: 429 });
  const body = await request.json().catch(() => ({}));
  const channel = String(body.channel ?? "");
  if (!channel) return new Response("Missing channel", { status: 400 });

  publish(channel, body.event ?? body);
  return new Response("OK", { status: 200 });
}
