"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";
import type { GalleryPhoto } from "@/lib/parties";
import ReportContentButton from "@/app/components/ReportContentButton";

async function compressImage(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });
  const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image compression failed")), "image/jpeg", 0.78));
}

function downloadPhoto(photo: GalleryPhoto) {
  const anchor = document.createElement("a");
  anchor.href = photo.src;
  anchor.download = `${photo.name.replace(/\.[^.]+$/, "")}-tusa.jpg`;
  anchor.click();
}

export default function Gallery({ partyId, actorId }: { partyId: string; actorId: string }) {
  const { t } = useLocale();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [recapIndex, setRecapIndex] = useState<number | null>(null);
  const [flashbackId, setFlashbackId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(() => {
    fetch(`/api/gallery?partyId=${partyId}`).then((response) => response.json()).then((data) => {
      if (data.photos) setPhotos(data.photos);
    }).catch(() => undefined);
  }, [partyId]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const sortedPhotos = useMemo(() => [...photos].sort((a, b) => Number(b.cover) - Number(a.cover) || b.createdAt.localeCompare(a.createdAt)), [photos]);
  const flashback = photos.find((photo) => photo.id === flashbackId);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type)).slice(0, 12);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const compressed = await compressImage(file);
        const form = new FormData();
        form.set("partyId", partyId);
        form.set("kind", "image");
        form.set("consent", "true");
        form.set("file", new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        const uploadResponse = await fetch("/api/media", { method: "POST", body: form });
        const upload = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok || !upload.media?.url) throw new Error(upload.error || "Upload failed");
        const addResponse = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", partyId, name: file.name, src: upload.media.url, storagePath: upload.media.pathname, contentType: upload.media.contentType, sizeBytes: upload.media.size, consent: true }),
        });
        if (!addResponse.ok) throw new Error("Gallery save failed");
      }
      loadPhotos();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("galleryError"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function updatePhoto(photoId: string, updates: { cover?: boolean; tags?: string[] }) {
    await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", photoId, updates }) });
    loadPhotos();
  }

  function addTag(photoId: string) {
    const tag = (tagDrafts[photoId] ?? "").trim().replace(/^#/, "").slice(0, 24);
    const photo = photos.find((item) => item.id === photoId);
    if (!tag || !photo || photo.tags.includes(tag)) return;
    void updatePhoto(photoId, { tags: [...photo.tags, tag] });
    setTagDrafts((drafts) => ({ ...drafts, [photoId]: "" }));
  }

  async function deletePhoto(photoId: string) {
    const response = await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", photoId, partyId }) });
    if (!response.ok) setError(t("galleryError"));
    loadPhotos();
  }

  function showFlashback() {
    if (!photos.length) return setError(t("galleryNeedPhoto"));
    setFlashbackId(photos[Math.floor(Math.random() * photos.length)].id);
  }

  return <section className="party-room-panel">
    <div className="demo-panel-title"><div><span>{t("galleryTitle")}</span><h2>{t("gallerySub")}</h2></div><span className="demo-chip">{photos.length}{t("galleryCount")}</span></div>
    <div className="gallery-controls scroll-row">
      <label className="gallery-control-button primary"><input accept="image/jpeg,image/png,image/webp" multiple onChange={handleUpload} ref={fileRef} type="file" /><span className="material-symbols-rounded">add_a_photo</span>{uploading ? t("galleryProcessing") : t("galleryAdd")}</label>
      <button disabled={!photos.length} onClick={() => setRecapIndex(0)} type="button"><span className="material-symbols-rounded">movie</span>{t("galleryRecap")}</button>
      <button onClick={showFlashback} type="button"><span className="material-symbols-rounded">history_toggle_off</span>{t("galleryFlashback")}</button>
    </div>
    <p className="gallery-consent-note"><span className="material-symbols-rounded">verified_user</span>{t("galleryNotice")}</p>
    {error && <p className="feature-error" role="alert">{error}</p>}
    {flashback && <article className="flashback-card"><img alt="" src={flashback.src} className="flashback-image" /><div><span>{t("galleryFlashbackTitle")}</span><h3>{new Date(flashback.createdAt).toLocaleDateString()}</h3><button onClick={() => setFlashbackId(null)} type="button"><span className="material-symbols-rounded">close</span>{t("galleryClose")}</button></div></article>}
    <div className="gallery-grid gallery-grid--real">{sortedPhotos.map((photo) => <article className={photo.cover ? "cover" : ""} key={photo.id}>
      <div className="gallery-image-wrap"><img alt={photo.name} src={photo.src} className="gallery-thumb" />{photo.cover && <span className="cover-label"><span className="material-symbols-rounded cover-star">star</span>{t("galleryCover")}</span>}</div>
      <div className="gallery-photo-meta"><strong>{photo.name}</strong><time>{new Date(photo.createdAt).toLocaleDateString()}</time></div>
      <div className="photo-tags">{photo.tags.map((tag) => <button key={tag} onClick={() => void updatePhoto(photo.id, { tags: photo.tags.filter((item) => item !== tag) })} type="button">#{tag} ×</button>)}</div>
      <form className="photo-tag-form" onSubmit={(event) => { event.preventDefault(); addTag(photo.id); }}><input aria-label={`${t("galleryTag")}${photo.name}`} placeholder={t("galleryTagPlace")} value={tagDrafts[photo.id] ?? ""} onChange={(event) => setTagDrafts((drafts) => ({ ...drafts, [photo.id]: event.target.value }))} /><button type="submit"><span className="material-symbols-rounded">add</span></button></form>
      <div className="photo-actions"><button aria-label={`${t("galleryMakeCover")}${photo.name}${t("galleryMakeCoverEnd")}`} onClick={() => void updatePhoto(photo.id, { cover: true })} type="button"><span className="material-symbols-rounded">star</span></button><button aria-label={`${t("galleryDownload")}${photo.name}`} onClick={() => downloadPhoto(photo)} type="button"><span className="material-symbols-rounded">download</span></button>{photo.userId !== actorId && <ReportContentButton partyId={partyId} targetId={photo.id} targetType="gallery_photo" targetUserId={photo.userId} onBlocked={(userId) => setPhotos((current) => current.filter((item) => item.userId !== userId))} />}<button aria-label={`${t("galleryDeletePhoto")}${photo.name}`} onClick={() => void deletePhoto(photo.id)} type="button"><span className="material-symbols-rounded">delete</span></button></div>
    </article>)}</div>
    {!photos.length && <div className="empty-state gallery-empty"><span className="material-symbols-rounded">photo_library</span><strong>{t("galleryEmpty")}</strong><span>{t("galleryEmptySub")}</span></div>}
    {recapIndex !== null && photos.length > 0 && <div className="demo-modal-backdrop recap-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecapIndex(null); }}><section aria-modal="true" className="recap-modal" role="dialog"><img alt={`Recap: ${photos[recapIndex].name}`} src={photos[recapIndex].src} /><div className="recap-overlay"><span>{t("galleryRecapTitle")}{recapIndex + 1}/{photos.length}</span><div><button aria-label={t("galleryPrev")} onClick={() => setRecapIndex((index) => index === null ? 0 : (index - 1 + photos.length) % photos.length)} type="button"><span className="material-symbols-rounded">arrow_back</span></button><button onClick={() => downloadPhoto(photos[recapIndex])} type="button"><span className="material-symbols-rounded">download</span>{t("galleryDownloadBtn")}</button><button aria-label={t("galleryNext")} onClick={() => setRecapIndex((index) => index === null ? 0 : (index + 1) % photos.length)} type="button"><span className="material-symbols-rounded">arrow_forward</span></button></div></div><button className="recap-close" aria-label={t("galleryCloseRecap")} onClick={() => setRecapIndex(null)} type="button"><span className="material-symbols-rounded">close</span></button></section></div>}
  </section>;
}
