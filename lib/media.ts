import "server-only";
import { del, put } from "@vercel/blob";

export type MediaKind = "image" | "voice";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VOICE_TYPES = new Set(["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4"]);

export const MEDIA_RETENTION_DAYS = 90;

export function validateMediaFile(file: File, kind: MediaKind) {
  const allowed = kind === "image" ? IMAGE_TYPES : VOICE_TYPES;
  const maxBytes = kind === "image" ? 4_000_000 : 1_500_000;
  if (!allowed.has(file.type)) throw new Error("Unsupported media type.");
  if (file.size < 1 || file.size > maxBytes) throw new Error(`Media must be smaller than ${Math.round(maxBytes / 1_000_000)} MB.`);
}

function extension(type: string) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "audio/webm": "webm", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a" } as Record<string, string>)[type] ?? "bin";
}

export async function storeMedia(file: File, partyId: string, kind: MediaKind) {
  validateMediaFile(file, kind);
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Media storage is not configured.");
  const pathname = `parties/${partyId}/${kind}/${crypto.randomUUID()}.${extension(file.type)}`;
  const blob = await put(pathname, file, { access: "public", addRandomSuffix: false, contentType: file.type });
  return { url: blob.url, pathname: blob.pathname, contentType: file.type, size: file.size };
}

export function isManagedMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com") && url.pathname.includes("/parties/");
  } catch {
    return false;
  }
}

export async function removeManagedMedia(value: string) {
  if (!isManagedMediaUrl(value) || !process.env.BLOB_READ_WRITE_TOKEN) return false;
  await del(value);
  return true;
}
