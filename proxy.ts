import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (host.split(":")[0].toLowerCase() === "www.tusa.game") {
    const canonical = request.nextUrl.clone();
    canonical.hostname = "tusa.game";
    canonical.port = "";
    canonical.protocol = "https:";
    return NextResponse.redirect(canonical, 308);
  }
  const hasSession = Boolean(request.cookies.get("tusa_auth")?.value);
  const hasGuestSession = Boolean(request.cookies.get("tusa_guest_session")?.value);

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (pathname.startsWith("/app") && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (pathname.startsWith("/party/") && !hasSession && !hasGuestSession) {
    const inviteCode = pathname.split("/")[2];
    if (inviteCode) {
      return NextResponse.redirect(new URL(`/join/${inviteCode}`, request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=()",
  );

  return response;
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
