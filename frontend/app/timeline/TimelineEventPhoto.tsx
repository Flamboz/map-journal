"use client";

import { useState } from "react";
import Image from "next/image";
import type { MapEventPhoto } from "../map/apiTypes";

type TimelineEventPhotoProps = {
  photos: MapEventPhoto[];
};

export function TimelineEventPhoto({ photos }: TimelineEventPhotoProps) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) return null;

  const current = photos[Math.min(index, photos.length - 1)];
  const isVideo = current.media_type === "video" || current.mime_type?.startsWith("video/");
  const hasMultiple = photos.length > 1;

  return (
    <div className="relative hidden aspect-square w-24 flex-shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--paper-muted)] sm:block">
      {isVideo ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-800">
          <svg aria-hidden="true" className="h-6 w-6 text-white/70" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      ) : (
        <Image
          src={current.url}
          alt=""
          fill
          unoptimized
          loader={({ src }) => src}
          className="object-cover"
        />
      )}

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-0.5 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
