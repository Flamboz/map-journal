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

  function handleAddPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    if (!onAddPhotos) {
      return;
    }

    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) {
      return;
    }

    void onAddPhotos(files);
    event.target.value = "";
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
      <div className="space-y-3">
        <div className="flex h-72 items-center justify-center rounded-lg bg-gray-200 text-sm text-gray-600">No photos available</div>
        {onAddPhotos && (
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Add photos
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddPhotos}
                className="sr-only"
                disabled={isUpdatingPhotos}
              />
            </label>
            {isUpdatingPhotos && <span className="text-sm text-gray-600">Updating photos...</span>}
          </div>
        )}
      </div>
    );
  }

  const safePhotoIndex = Math.min(photoIndex, photos.length - 1);
  const currentPhoto = photos[safePhotoIndex] ?? photos[0];
  const hasMultiplePhotos = photos.length > 1;

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
    <div className="space-y-3">
      <div className="relative h-72 overflow-hidden rounded-lg bg-gray-200">
        <Image
          src={currentPhoto.url}
          alt={`${eventName} photo ${safePhotoIndex + 1}`}
          fill
          unoptimized
          loader={({ src }) => src}
          className="h-full w-full object-cover"
        />

        <button
          type="button"
          aria-label="Open photo viewer"
          onClick={openModal}
          className="absolute inset-0 z-10 cursor-zoom-in"
        />

        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={showPreviousPhoto}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1 text-xl font-light leading-none text-gray-800"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={showNextPhoto}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1 text-xl font-light leading-none text-gray-800"
            >
              ›
            </button>
          </>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Photo {safePhotoIndex + 1} of {photos.length}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onAddPhotos && (
          <label className="inline-flex cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Add photos
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleAddPhotos}
              className="sr-only"
              disabled={isUpdatingPhotos}
            />
          </label>
        )}

        {onSetPreviewPhoto && (
          <button
            type="button"
            onClick={handleSetCurrentPhotoAsPreview}
            disabled={isUpdatingPhotos || safePhotoIndex === 0}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Set as preview
          </button>
        )}

        {onDeletePhoto && (
          <button
            type="button"
            onClick={handleDeleteCurrentPhoto}
            disabled={isUpdatingPhotos}
            className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete photo
          </button>
        )}

        {isUpdatingPhotos && <span className="text-sm text-gray-600">Updating photos...</span>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <button
            type="button"
            aria-label="Close photo viewer backdrop"
            onClick={closeModal}
            className="absolute inset-0 bg-black/70"
          />

          <div className="relative z-[1301] w-full max-w-5xl rounded-xl bg-white p-4 shadow-lg">
            <button
              type="button"
              aria-label="Close photo viewer"
              onClick={closeModal}
              className="absolute right-3 top-3 rounded bg-white/90 px-2 py-1 text-sm font-semibold text-gray-800"
            >
              ×
            </button>

            <div className="relative h-[70vh] overflow-hidden rounded-lg bg-black">
              <Image
                src={currentPhoto.url}
                alt={`${eventName} photo ${safePhotoIndex + 1}`}
                fill
                unoptimized
                loader={({ src }) => src}
                className="h-full w-full object-contain"
              />

              {hasMultiplePhotos && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo in modal"
                    onClick={showPreviousPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-2xl font-light leading-none text-gray-800"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo in modal"
                    onClick={showNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-2xl font-light leading-none text-gray-800"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Photo {safePhotoIndex + 1} of {photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
