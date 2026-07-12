import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "tusa.game";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = `${protocol}://${host}`;

  const staticPages = [
    { url: origin, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${origin}/games`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${origin}/use-cases/online-parties`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${origin}/use-cases/remote-teams`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${origin}/use-cases/in-person-parties`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${origin}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${origin}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${origin}/demo`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${origin}/privacy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${origin}/terms`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  return staticPages;
}
