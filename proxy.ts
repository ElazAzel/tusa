import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAppRoute = createRouteMatcher(["/app(.*)"]);
const isPartyRoute = createRouteMatcher(["/party(.*)"]);
const isLandingPage = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (isLandingPage(request) && userId) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (isAppRoute(request) && !userId) {
    return NextResponse.redirect(
      new URL(
        "/sign-in?redirect_url=" + encodeURIComponent(request.nextUrl.pathname),
        request.url,
      ),
    );
  }

  if (isPartyRoute(request) && !userId && !request.cookies.get("tusa_guest_session")) {
    const inviteCode = request.nextUrl.pathname.split("/")[2] ?? "";
    return NextResponse.redirect(new URL(`/join/${encodeURIComponent(inviteCode)}`, request.url));
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
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
