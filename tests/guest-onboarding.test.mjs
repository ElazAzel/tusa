import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const joinCard = readFileSync(new URL("../app/join/[inviteCode]/JoinPartyCard.tsx", import.meta.url), "utf8");
const joinRoute = readFileSync(new URL("../app/api/parties/[inviteCode]/join/route.ts", import.meta.url), "utf8");
const guestSession = readFileSync(new URL("../lib/guest-session.ts", import.meta.url), "utf8");

test("invitees can join with a nickname and avatar before account creation", () => {
  assert.match(joinCard, /guest-join-fields/);
  assert.match(joinCard, /autoComplete="nickname"/);
  assert.match(joinCard, /No registration\. This name stays inside the party\./);
  assert.match(joinCard, /guest-account-link/);
});

test("guest party access is validated, signed and stored in a protected cookie", () => {
  assert.match(joinRoute, /joinSchema\.safeParse/);
  assert.match(joinRoute, /displayName: z\.string\(\)\.trim\(\)\.min\(2\)\.max\(40\)\.optional\(\)/);
  assert.match(joinRoute, /createGuestSession/);
  assert.match(joinRoute, /response\.cookies\.set\(GUEST_COOKIE, guestToken, guestCookieOptions\)/);
  assert.match(guestSession, /createHmac\("sha256"/);
  assert.match(guestSession, /timingSafeEqual/);
  assert.match(guestSession, /httpOnly: true/);
  assert.match(guestSession, /sameSite: "lax"/);
});
