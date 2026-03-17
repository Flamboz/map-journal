"use client";

import { useState } from "react";
import Image from "next/image";
import type { MapEventPhoto } from "../../map/api";

type EventPhotosCarouselProps = {
  photos: MapEventPhoto[];
  eventName: string;
  isUpdatingPhotos?: boolean;
  onAddPhotos?: (files: File[]) => void | Promise<void>;
  onDeletePhoto?: (photoId: string) => void | Promise<void>;
  onSetPreviewPhoto?: (photoId: string) => void | Promise<void>;
};

export default function EventPhotosCarousel({
  photos,
  eventName,
  isUpdatingPhotos = false,
  onAddPhotos,
  onDeletePhoto,
  onSetPreviewPhoto,
}: EventPhotosCarouselProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleAddPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    if (!onAddPhotos) {
      console.debug("EventPhotosCarousel: onAddPhotos not provided");
      return;
    }

    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) {
      return;
    }

    console.debug("EventPhotosCarousel: picked files", files.map((f) => f.name));

    try {
      const result = onAddPhotos(files);
      if (result && typeof (result).then === "function") {
        await result;
      }
    } catch (error) {
      console.error("EventPhotosCarousel: upload error", error);
    } finally {
      // reset input so the same file can be re-picked later
      event.target.value = "";
    }
  }

  function handleDeleteCurrentPhoto() {
    if (!onDeletePhoto || photos.length === 0) {
      return;
    }

    const currentPhoto = photos[photoIndex] ?? photos[0];
    if (!currentPhoto) {
      return;
    }

    void onDeletePhoto(currentPhoto.id);
  }

  function handleSetCurrentPhotoAsPreview() {
    if (!onSetPreviewPhoto || photos.length === 0) {
      return;
    }

    const currentPhoto = photos[photoIndex] ?? photos[0];
    if (!currentPhoto) {
      return;
    }

    void onSetPreviewPhoto(currentPhoto.id);
  }

  if (photos.length === 0) {
    return (
      <div className="relative">
        <div className="h-72 md:h-96 lg:h-[360px] rounded-2xl bg-[color:var(--empty-bg)] shadow-inner flex items-center justify-center text-sm text-gray-600">
          <div className="text-center">
            <svg className="mx-auto mb-2 h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 3v4M16 3v4M3 11h18" />
            </svg>
            <div>No attachments available</div>
          </div>
        </div>
        {onAddPhotos && (
          <label className="absolute right-4 bottom-4 z-30 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-lg cursor-pointer">
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add attachment</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleAddPhotos}
              className="sr-only"
              disabled={isUpdatingPhotos}
            />
          </label>
        )}

      </div>
    );
  }

  const safePhotoIndex = Math.min(photoIndex, photos.length - 1);
  const currentPhoto = photos[safePhotoIndex] ?? photos[0];
  const hasMultiplePhotos = photos.length > 1;
  const isCurrentPreview = safePhotoIndex === 0;

  function showPreviousPhoto() {
    setPhotoIndex((previous) => (previous - 1 + photos.length) % photos.length);
  }

  function showNextPhoto() {
    setPhotoIndex((previous) => (previous + 1) % photos.length);
  }

  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative h-72 md:h-96 lg:h-[360px] overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
        {(currentPhoto.media_type === "video" || (currentPhoto.mime_type && currentPhoto.mime_type.startsWith("video/"))) ? (
          <video src={currentPhoto.url} className="h-full w-full object-cover" controls preload="metadata" />
        ) : (
          <Image
            src={currentPhoto.url}
            alt={`${eventName} attachment ${safePhotoIndex + 1}`}
            fill
            unoptimized
            loader={({ src }) => src}
            className="h-full w-full object-cover"
          />
        )}
 
        {/* subtle gradient at bottom for better contrast with controls/text */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none rounded-b-2xl" />
        {onAddPhotos && (
          <label className="absolute right-4 bottom-4 z-30 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-lg cursor-pointer">
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add attachment</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleAddPhotos}
              className="sr-only"
              disabled={isUpdatingPhotos}
            />
          </label>
        )}

        {onDeletePhoto && (
          <button
            type="button"
            aria-label="Delete attachment"
            onClick={handleDeleteCurrentPhoto}
            disabled={isUpdatingPhotos}
            className="absolute left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger-strong)] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-200 shadow"
          >
            <svg aria-hidden="true" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              <path d="M19 6l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        )}

        {onSetPreviewPhoto && (
          <button
            type="button"
            aria-label="Set as preview"
            onClick={() => { if (isCurrentPreview || isUpdatingPhotos) return; void handleSetCurrentPhotoAsPreview(); }}
            disabled={isUpdatingPhotos}
            className={`absolute right-3 top-3 z-50 inline-flex h-10 items-center gap-2 rounded-full px-3 py-1 text-sm font-medium shadow focus:outline-none focus:ring-2 ${isCurrentPreview ? 'bg-[color:var(--preview-bg)] text-[color:var(--preview-text)] hover:bg-[color:var(--preview-bg)] focus:ring-[color:var(--preview-hover)]' : 'bg-[color:var(--preview-bg)] text-[color:var(--preview-text)] hover:bg-[color:var(--preview-hover)] focus:ring-[color:var(--preview-hover)]'} ${isUpdatingPhotos ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {isCurrentPreview ? (
              <svg aria-hidden="true" className="h-4 w-4 text-[color:var(--preview-text)]" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="h-4 w-4 text-[color:var(--preview-text)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            )}
            <span className="hidden sm:inline">Preview</span>
          </button>
        )}

          <button
          type="button"
          aria-label="Open attachment viewer"
          onClick={openModal}
            className="absolute inset-0 z-10 cursor-zoom-in"
        />

        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              aria-label="Previous attachment"
              onClick={showPreviousPhoto}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 border border-gray-100 text-amber-700 shadow-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            <button
              type="button"
              aria-label="Next attachment"
              onClick={showNextPhoto}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 border border-gray-100 text-amber-700 shadow-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </>
        )}
      </div>

        <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">Attachment {safePhotoIndex + 1} of {photos.length}</p>

        <div className="flex items-center gap-2">
        { /* floating add button moved into image area above */ }

        {/* Set-as-preview button moved into image area (top-right) */}

        {/* Delete button moved into the image area (top-left) */}

        {isUpdatingPhotos && <span className="text-sm text-gray-600">Updating attachments...</span>}
        </div>
      </div>

      {/* Floating add-photo button moved into the image area; duplicate removed. */}

      {isModalOpen && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Attachment viewer">
          <button
            type="button"
            aria-label="Close attachment viewer backdrop"
            onClick={closeModal}
            className="absolute inset-0 bg-black/70"
          />

          <div className="relative z-[1301] w-full max-w-5xl rounded-xl bg-white p-4 shadow-lg">
            <button
              type="button"
              aria-label="Close attachment viewer"
              onClick={closeModal}
              className="absolute right-3 top-3 rounded bg-white/90 px-2 py-1 text-sm font-semibold text-gray-800"
            >
              ×
            </button>

            <div className="relative h-[70vh] overflow-hidden rounded-lg bg-black">
              {(currentPhoto.media_type === "video" || (currentPhoto.mime_type && currentPhoto.mime_type.startsWith("video/"))) ? (
                <video src={currentPhoto.url} className="h-full w-full object-contain" controls preload="metadata" />
              ) : (
                <Image
                  src={currentPhoto.url}
                  alt={`${eventName} attachment ${safePhotoIndex + 1}`}
                  fill
                  unoptimized
                  loader={({ src }) => src}
                  className="h-full w-full object-contain"
                />
              )}

              {hasMultiplePhotos && (
                <>
                  <button
                    type="button"
                    aria-label="Previous attachment in modal"
                    onClick={showPreviousPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-gray-100 text-amber-800 shadow-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Next attachment in modal"
                    onClick={showNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-gray-100 text-amber-800 shadow-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Attachment {safePhotoIndex + 1} of {photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
