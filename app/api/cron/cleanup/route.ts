import { NextResponse } from "next/server";
import { cleanupOldData, deleteExpiredGalleryRows } from "@/lib/parties";
import { removeManagedMedia } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanupOldData();
  const mediaResults = await Promise.allSettled(result.mediaUrls.map((url) => removeManagedMedia(url)));
  const deletedMediaUrls = result.mediaUrls.filter((_, index) => mediaResults[index]?.status === "fulfilled");
  result.deleted.galleryPhotos = await deleteExpiredGalleryRows(deletedMediaUrls);
  const mediaDeleteFailures = mediaResults.filter((item) => item.status === "rejected").length;
  return NextResponse.json({ deleted: result.deleted, mediaDeleteFailures });
}
