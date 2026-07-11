"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";
import type { GalleryPhoto } from "@/lib/parties";

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
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function downloadPhoto(photo: GalleryPhoto) {
  const anchor = document.createElement("a");
  anchor.href = photo.src;
  anchor.download = photo.name.replace(/\.[^.]+$/, "") + "-tusa.jpg";
  anchor.click();
}

export default function Gallery({ partyId }: { partyId: string }) {
  const { t } = useLocale();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [recapIndex, setRecapIndex] = useState<number | null>(null);
  const [flashbackId, setFlashbackId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function loadPhotos() {
    fetch(`/api/gallery?partyId=${partyId}`).then((r) => r.json()).then((data) => {
      if (data.photos) setPhotos(data.photos);
    }).catch(() => undefined);
  }

  useEffect(() => { loadPhotos(); }, [partyId]);

  const sortedPhotos = useMemo(() => [...photos].sort((a, b) => Number(b.cover) - Number(a.cover) || b.createdAt.localeCompare(a.createdAt)), [photos]);
  const flashback = photos.find((p) => p.id === flashbackId);

  async function handleUpload(changeEvent: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(changeEvent.target.files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, 12);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const src = await compressImage(file);
        await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", partyId, name: file.name, src }) });
      }
      loadPhotos();
    } catch {
      alert(t("galleryError"));
    } finally {
      setUploading(false);
      if (changeEvent.target) changeEvent.target.value = "";
    }
  }

  function addTag(photoId: string) {
    const tag = (tagDrafts[photoId] ?? "").trim().replace(/^#/, "").slice(0, 24);
    if (!tag) return;
    const photo = photos.find((p) => p.id === photoId);
    if (!photo || photo.tags.includes(tag)) return;
    fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", photoId, updates: { tags: [...photo.tags, tag] } }) }).then(loadPhotos).catch(() => undefined);
    setTagDrafts((d) => ({ ...d, [photoId]: "" }));
  }

  function toggleCover(photoId: string) {
    fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", photoId, updates: { cover: true } }) }).then(loadPhotos).catch(() => undefined);
  }

  function del(photoId: string) {
    fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", photoId }) }).then(loadPhotos).catch(() => undefined);
  }

  function showFlashback() {
    if (!photos.length) { alert(t("galleryNeedPhoto")); return; }
    const random = photos[Math.floor(Math.random() * photos.length)];
    setFlashbackId(random.id);
  }

  return <section className="party-room-panel"><div className="demo-panel-title"><div><span>{t("galleryTitle")}</span><h2>{t("gallerySub")}</h2></div><span className="demo-chip">{photos.length}{t("galleryCount")}</span></div><div className="gallery-controls scroll-row"><label className="gallery-control-button primary"><input accept="image/*" multiple onChange={handleUpload} ref={fileRef} type="file" /><span className="material-symbols-rounded">add_a_photo</span> {uploading ? t("galleryProcessing") : t("galleryAdd")}</label><button disabled={!photos.length} onClick={() => setRecapIndex(0)} type="button"><span className="material-symbols-rounded">movie</span> {t("galleryRecap")}</button><button onClick={showFlashback} type="button"><span className="material-symbols-rounded">history_toggle_off</span> {t("galleryFlashback")}</button></div>{flashback && <article className="flashback-card"><img alt="" src={flashback.src} className="flashback-image" /><div><span>{t("galleryFlashbackTitle")}</span><h3>{new Date(flashback.createdAt).toLocaleDateString()}</h3><button onClick={() => setFlashbackId(null)} type="button"><span className="material-symbols-rounded">close</span> {t("galleryClose")}</button></div></article>}<div className="gallery-grid gallery-grid--real">{sortedPhotos.map((photo) => <article className={photo.cover ? "cover" : ""} key={photo.id}><div className="gallery-image-wrap"><img alt={photo.name} src={photo.src} className="gallery-thumb" />{photo.cover && <span className="cover-label"><span className="material-symbols-rounded cover-star">star</span> {t("galleryCover")}</span>}</div><div className="gallery-photo-meta"><strong>{photo.name}</strong><time>{new Date(photo.createdAt).toLocaleDateString()}</time></div><div className="photo-tags">{photo.tags.map((tag) => <button key={tag} onClick={() => { const updated = photo.tags.filter((t) => t !== tag); fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", photoId: photo.id, updates: { tags: updated } }) }).then(loadPhotos).catch(() => undefined); }} type="button">#{tag} ×</button>)}</div><form className="photo-tag-form" onSubmit={(e) => { e.preventDefault(); addTag(photo.id); }}><input aria-label={`${t("galleryTag")}${photo.name}`} placeholder={t("galleryTagPlace")} value={tagDrafts[photo.id] ?? ""} onChange={(e) => setTagDrafts((d) => ({ ...d, [photo.id]: e.target.value }))} /><button type="submit"><span className="material-symbols-rounded">add</span></button></form><div className="photo-actions"><button aria-label={`${t("galleryMakeCover")}${photo.name}${t("galleryMakeCoverEnd")}`} onClick={() => toggleCover(photo.id)} type="button"><span className="material-symbols-rounded">star</span></button><button aria-label={`${t("galleryDownload")}${photo.name}`} onClick={() => downloadPhoto(photo)} type="button"><span className="material-symbols-rounded">download</span></button><button aria-label={`${t("galleryDeletePhoto")}${photo.name}`} onClick={() => del(photo.id)} type="button"><span className="material-symbols-rounded">delete</span></button></div></article>)}</div>{!photos.length && <div className="empty-state gallery-empty"><span className="material-symbols-rounded" style={{ fontSize: "42px", color: "var(--pink)" }}>photo_library</span><strong>{t("galleryEmpty")}</strong><span>{t("galleryEmptySub")}</span></div>}{recapIndex !== null && photos.length > 0 && <div className="demo-modal-backdrop recap-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setRecapIndex(null); }}><section aria-modal="true" className="recap-modal" role="dialog"><img alt={`Recap: ${photos[recapIndex].name}`} src={photos[recapIndex].src} style={{ width: "100%", height: "100%", objectFit: "contain" }} /><div className="recap-overlay"><span>{t("galleryRecapTitle")}{recapIndex + 1}/{photos.length}</span><div><button aria-label={t("galleryPrev")} onClick={() => setRecapIndex((i) => i === null ? 0 : (i - 1 + photos.length) % photos.length)} type="button"><span className="material-symbols-rounded">arrow_back</span></button><button onClick={() => downloadPhoto(photos[recapIndex])} type="button"><span className="material-symbols-rounded">download</span> {t("galleryDownloadBtn")}</button><button aria-label={t("galleryNext")} onClick={() => setRecapIndex((i) => i === null ? 0 : (i + 1) % photos.length)} type="button"><span className="material-symbols-rounded">arrow_forward</span></button></div></div><button className="recap-close" aria-label={t("galleryCloseRecap")} onClick={() => setRecapIndex(null)} type="button"><span className="material-symbols-rounded">close</span></button></section></div>}</section>;
}
