import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "tusa.game";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = `${protocol}://${host}`;

  return [
    { url: origin, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${origin}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
