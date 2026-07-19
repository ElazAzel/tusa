import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { updateEmailDelivery } from "@/lib/operations";

export const dynamic = "force-dynamic";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyWebhook(body: string, headers: Headers) {
  const secretValue = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const id = headers.get("svix-id") ?? "";
  const timestamp = headers.get("svix-timestamp") ?? "";
  const signatures = headers.get("svix-signature") ?? "";
  if (!secretValue || !id || !timestamp || !signatures) return false;
  const epoch = Number(timestamp);
  if (!Number.isFinite(epoch) || Math.abs(Date.now() / 1000 - epoch) > 300) return false;
  const secret = Buffer.from(secretValue.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", secret).update(`${id}.${timestamp}.${body}`).digest("base64");
  return signatures.split(" ").some((part) => {
    const [version, received] = part.split(",");
    return version === "v1" && Boolean(received) && safeEqual(expected, received);
  });
}

const statusByEvent = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "sent",
  "email.failed": "failed",
} as const;

export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyWebhook(body, request.headers)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const event = JSON.parse(body) as { type?: keyof typeof statusByEvent; data?: { email_id?: string } };
  const status = event.type ? statusByEvent[event.type] : undefined;
  const messageId = event.data?.email_id;
  if (status && messageId) await updateEmailDelivery(messageId, status);
  return NextResponse.json({ ok: true });
}
