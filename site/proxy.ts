import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)", "/party(.*)"]);
const isLandingPage = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (isLandingPage(request) && userId) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (isProtectedRoute(request) && !userId) {
    return NextResponse.redirect(
      new URL(
        "/sign-in?redirect_url=" + encodeURIComponent(request.nextUrl.pathname),
        request.url,
      ),
    );
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
