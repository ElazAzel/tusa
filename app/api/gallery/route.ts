import { auth, currentUser } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { addGalleryPhoto, getGalleryPhotos, trackAnalytics, updateGalleryPhoto, deleteGalleryPhoto, grantEngagementReward } from "@/lib/parties";
import { publish } from "@/lib/live";
import { isManagedMediaUrl, removeManagedMedia } from "@/lib/media";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addSchema = z.object({
  action: z.literal("add"),
  partyId: z.string().uuid(),
  name: z.string().min(1).max(200),
  src: z.string().url().max(2048),
  storagePath: z.string().min(1).max(600),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(4_000_000),
  consent: z.literal(true),
}).strict();

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`api:${ip}:gallery`, 60, 60000);
    if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");
    if (!partyId) return Response.json({ error: "partyId required" }, { status: 400 });
    const photos = await getGalleryPhotos(partyId);
    return Response.json({ photos });
  } catch { return Response.json({ error: "Gallery error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`api:${ip}:gallery`, 20, 60000);
    if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
    const body = await request.json().catch(() => ({}));
    if (body.action === "add") {
      const parsed = addSchema.safeParse(body);
      if (!parsed.success || !isManagedMediaUrl(parsed.data?.src ?? "")) return Response.json({ error: "Invalid managed media." }, { status: 400 });
      const photo = await addGalleryPhoto(userId, parsed.data.partyId, parsed.data);
      trackAnalytics(userId, "photo_uploaded", { partyId: body.partyId, photoId: photo.id });
      publish(`gallery:${body.partyId}`, { action: "add", photo });
      grantEngagementReward(userId, "photo", body.partyId).catch(() => undefined);
      return Response.json({ photo });
    }
    if (body.action === "update") {
      const photo = await updateGalleryPhoto(body.photoId, userId, body.updates);
      if (photo) publish(`gallery:${photo.partyId}`, { action: "update", photo });
      return Response.json({ photo });
    }
    if (body.action === "delete") {
      const deleted = await deleteGalleryPhoto(body.photoId, userId);
      if (deleted?.src) await removeManagedMedia(deleted.src).catch(() => undefined);
      publish(`gallery:${body.partyId}`, { action: "delete", photoId: body.photoId });
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch { return Response.json({ error: "Gallery error" }, { status: 500 }); }
}
