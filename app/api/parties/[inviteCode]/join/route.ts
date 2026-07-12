import { NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPartyByInvite, joinParty, syncProfile } from "@/lib/parties";
import { createGuestSession, GUEST_COOKIE, guestCookieOptions, resolveActor } from "@/lib/guest-session";

const joinSchema = z.object({
  rsvp: z.enum(["going", "maybe", "pass"]).default("going"),
  displayName: z.string().trim().min(2).max(40).optional(),
  avatar: z.enum(["lime", "pink", "blue", "cream"]).optional(),
}).strict();

export async function POST(request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params;
  if (!/^[A-Za-z0-9_-]{4,32}$/.test(inviteCode)) return NextResponse.json({ error: "Invalid invite." }, { status: 400 });
  const rl = await distributedRateLimit(`party:join:${getClientIp(request.headers)}:${inviteCode}`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many join attempts. Try again shortly." }, { status: 429 });
  const parsed = joinSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Check your name and RSVP choice.", details: parsed.error.flatten() }, { status: 400 });

  const publicParty = await getPartyByInvite(inviteCode);
  if (!publicParty) return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  let actor = await resolveActor();
  let guestToken: string | null = null;

  if (!actor || actor.kind === "guest") {
    if (!parsed.data.displayName) return NextResponse.json({ error: "Enter a name to join as a guest." }, { status: 400 });
    try {
      const created = createGuestSession({
        partyId: publicParty.id,
        inviteCode,
        displayName: parsed.data.displayName,
        avatar: parsed.data.avatar ?? "lime",
      });
      guestToken = created.token;
      actor = { id: created.session.id, kind: "guest", displayName: created.session.displayName, imageUrl: "/brand/tusa-game-icon.png", guest: created.session };
    } catch {
      return NextResponse.json({ error: "Guest access is temporarily unavailable." }, { status: 503 });
    }
  }

  await syncProfile({ id: actor.id, displayName: actor.displayName, imageUrl: actor.imageUrl });
  const party = await joinParty(actor.id, inviteCode, parsed.data.rsvp);
  if (!party) return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  const response = NextResponse.json({ party, actor: { id: actor.id, kind: actor.kind } });
  if (guestToken) response.cookies.set(GUEST_COOKIE, guestToken, guestCookieOptions);
  return response;
}
