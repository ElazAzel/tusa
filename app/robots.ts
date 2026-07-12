import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isCanonicalHost, SITE_ORIGIN } from "@/lib/site";

const privatePaths = ["/api/", "/admin/", "/app/", "/party/", "/join/", "/sign-in/", "/sign-up/"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!isCanonicalHost(host)) return { rules: [{ userAgent: "*", disallow: "/" }] };

  const publicBotRules = ["GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot"]
    .map((userAgent) => ({ userAgent, allow: "/", disallow: privatePaths }));

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: privatePaths }, ...publicBotRules],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
