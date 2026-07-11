"use client";

import Image from "next/image";
import { ChangeEvent, useMemo, useState } from "react";
import { Photo, usePlatform } from "../PlatformContext";
import { Icon } from "./Icon";
import { useLocale } from "@/app/components/LocaleProvider";

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

function downloadPhoto(photo: Photo) {
  const anchor = document.createElement("a");
  anchor.href = photo.src;
  anchor.download = photo.name.replace(/\.[^.]+$/, "") + "-tusa.jpg";
  anchor.click();
}

export function GalleryHub() {
  const { event, updateEvent, notify, gainXp } = usePlatform();
  const { t } = useLocale();
  const [uploading, setUploading] = useState(false);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [recapIndex, setRecapIndex] = useState<number | null>(null);
  const [flashbackId, setFlashbackId] = useState<string | null>(null);

  const sortedPhotos = useMemo(() => [...event.photos].sort((a, b) => Number(b.cover) - Number(a.cover) || b.createdAt.localeCompare(a.createdAt)), [event.photos]);
  const flashback = event.photos.find((photo) => photo.id === flashbackId);

  async function handleUpload(changeEvent: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(changeEvent.target.files ?? []).filter((file) => file.type.startsWith("image/")).slice(0, 12);
    if (!files.length) return;
    setUploading(true);
    try {
      const photos = await Promise.all(files.map(async (file, index) => ({
        id: `photo_${Date.now()}_${index}`,
        name: file.name,
        src: await compressImage(file),
        createdAt: new Date(file.lastModified || Date.now()).toISOString(),
        tags: [],
        cover: event.photos.length === 0 && index === 0,
      })));
      updateEvent((current) => ({ ...current, photos: [...current.photos, ...photos] }));
      gainXp(files.length * 4, `${files.length}${t("galleryPhotosAdded")}`);
    } catch {
      notify(t("galleryError"));
    } finally {
      setUploading(false);
      changeEvent.target.value = "";
    }
  }

  function addTag(photoId: string) {
    const tag = (tagDrafts[photoId] ?? "").trim().replace(/^#/, "").slice(0, 24);
    if (!tag) return;
    updateEvent((current) => ({
      ...current,
      photos: current.photos.map((photo) => photo.id === photoId && !photo.tags.includes(tag) ? { ...photo, tags: [...photo.tags, tag] } : photo),
    }));
    setTagDrafts((current) => ({ ...current, [photoId]: "" }));
  }

  function showFlashback() {
    if (!event.photos.length) {
      notify(t("galleryNeedPhoto"));
      return;
    }
    const random = event.photos[Math.floor(Math.random() * event.photos.length)];
    setFlashbackId(random.id);
  }

  return (
    <section className="demo-tab-panel gallery-panel">
      <div className="demo-panel-title"><div><span>{t("galleryTitle")}</span><h2>{t("gallerySub")}</h2></div><span className="demo-chip">{event.photos.length}{t("galleryCount")}</span></div>
      <div className="gallery-controls scroll-row">
        <label className="gallery-control-button primary"><input accept="image/*" multiple onChange={handleUpload} type="file" /><Icon name="add_a_photo" /> {uploading ? t("galleryProcessing") : t("galleryAdd")}</label>
        <button disabled={!event.photos.length} onClick={() => setRecapIndex(0)} type="button"><Icon name="movie" /> {t("galleryRecap")}</button>
        <button onClick={showFlashback} type="button"><Icon name="history_toggle_off" /> {t("galleryFlashback")}</button>
        <label className="gallery-disposable"><input checked={event.disposableGallery} onChange={(changeEvent) => updateEvent((current) => ({ ...current, disposableGallery: changeEvent.target.checked }))} type="checkbox" /><span><Icon name="timer" /> {t("galleryDisposable")}</span></label>
      </div>
      {event.disposableGallery && <div className="gallery-notice"><Icon name="timer" /> {t("galleryNotice")}</div>}

      {flashback && (
        <article className="flashback-card"><Image alt={`FlashBack: ${flashback.name}`} fill sizes="(max-width: 760px) 100vw, 720px" src={flashback.src} unoptimized /><div><span>{t("galleryFlashbackTitle")}</span><h3>{new Date(flashback.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</h3><button onClick={() => setFlashbackId(null)} type="button"><Icon name="close" /> {t("galleryClose")}</button></div></article>
      )}

      <div className="gallery-grid gallery-grid--real">
        {sortedPhotos.map((photo) => (
          <article className={photo.cover ? "cover" : ""} key={photo.id}>
            <div className="gallery-image-wrap"><Image alt={photo.name} fill sizes="(max-width: 760px) 50vw, 33vw" src={photo.src} unoptimized />{photo.cover && <span className="cover-label"><Icon name="star" /> {t("galleryCover")}</span>}</div>
            <div className="gallery-photo-meta"><strong>{photo.name}</strong><time>{new Date(photo.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time></div>
            <div className="photo-tags">{photo.tags.map((tag) => <button key={tag} onClick={() => updateEvent((current) => ({ ...current, photos: current.photos.map((item) => item.id === photo.id ? { ...item, tags: item.tags.filter((value) => value !== tag) } : item) }))} type="button">#{tag} ×</button>)}</div>
            <form className="photo-tag-form" onSubmit={(formEvent) => { formEvent.preventDefault(); addTag(photo.id); }}><input aria-label={`${t("galleryTag")}${photo.name}`} placeholder={t("galleryTagPlace")} value={tagDrafts[photo.id] ?? ""} onChange={(changeEvent) => setTagDrafts((current) => ({ ...current, [photo.id]: changeEvent.target.value }))} /><button type="submit"><Icon name="add" /></button></form>
            <div className="photo-actions"><button aria-label={`${t("galleryMakeCover")}${photo.name}${t("galleryMakeCoverEnd")}`} onClick={() => updateEvent((current) => ({ ...current, photos: current.photos.map((item) => ({ ...item, cover: item.id === photo.id })) }))} type="button"><Icon name="star" /></button><button aria-label={`${t("galleryDownload")}${photo.name}`} onClick={() => downloadPhoto(photo)} type="button"><Icon name="download" /></button><button aria-label={`${t("galleryDeletePhoto")}${photo.name}`} onClick={() => updateEvent((current) => ({ ...current, photos: current.photos.filter((item) => item.id !== photo.id) }))} type="button"><Icon name="delete" /></button></div>
          </article>
        ))}
      </div>
      {!event.photos.length && <div className="empty-state gallery-empty"><Icon name="photo_library" /><strong>{t("galleryEmpty")}</strong><span>{t("galleryEmptySub")}</span></div>}

      {recapIndex !== null && event.photos.length > 0 && (
        <div className="demo-modal-backdrop recap-backdrop" role="presentation">
          <section aria-modal="true" className="recap-modal" role="dialog">
            <Image alt={`Recap: ${event.photos[recapIndex].name}`} fill priority sizes="100vw" src={event.photos[recapIndex].src} unoptimized />
            <div className="recap-overlay"><span>{t("galleryRecapTitle")}{recapIndex + 1}/{event.photos.length}</span><h2>{event.title}</h2><div><button aria-label={t("galleryPrev")} onClick={() => setRecapIndex((index) => index === null ? 0 : (index - 1 + event.photos.length) % event.photos.length)} type="button"><Icon name="arrow_back" /></button><button onClick={() => downloadPhoto(event.photos[recapIndex])} type="button"><Icon name="download" /> {t("galleryDownloadBtn")}</button><button aria-label={t("galleryNext")} onClick={() => setRecapIndex((index) => index === null ? 0 : (index + 1) % event.photos.length)} type="button"><Icon name="arrow_forward" /></button></div></div>
            <button className="recap-close" aria-label={t("galleryCloseRecap")} onClick={() => setRecapIndex(null)} type="button"><Icon name="close" /></button>
          </section>
        </div>
      )}
    </section>
  );
}
