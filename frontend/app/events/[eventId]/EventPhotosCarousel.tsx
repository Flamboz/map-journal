"use client";

import { useState } from "react";
import Image from "next/image";
import type { MapEventPhoto } from "../../map/api";

type EventPhotosCarouselProps = {
  photos: MapEventPhoto[];
  eventName: string;
};

export default function EventPhotosCarousel({ photos, eventName }: EventPhotosCarouselProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (photos.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg bg-gray-200 text-sm text-gray-600">No photos available</div>
    );
  }

  const currentPhoto = photos[photoIndex] ?? photos[0];
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
          alt={`${eventName} photo ${photoIndex + 1}`}
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
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1 text-xl font-light leading-none text-gray-800"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={showNextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1 text-xl font-light leading-none text-gray-800"
            >
              ›
            </button>
          </>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Photo {photoIndex + 1} of {photos.length}
      </p>

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
                alt={`${eventName} photo ${photoIndex + 1}`}
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
              Photo {photoIndex + 1} of {photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
