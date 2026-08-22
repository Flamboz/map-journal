"use client";

import { useState } from "react";
import { MediaThumbnail } from "../components/MediaThumbnail";
import { isVideoMedia } from "../../lib/media";
import type { MapEventPhoto } from "../map/apiTypes";

type TimelineEventPhotoProps = {
  photos: MapEventPhoto[];
};

const ARROW_BUTTON_CLASS =
  "absolute top-1/2 z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 sm:h-5 sm:w-5";

export function TimelineEventPhoto({ photos }: TimelineEventPhotoProps) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) return null;

  const current = photos[Math.min(index, photos.length - 1)];
  const hasMultiple = photos.length > 1;

  return (
    <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--paper-muted)] sm:aspect-square sm:h-auto sm:w-24">
      <MediaThumbnail
        src={current.url}
        isVideo={isVideoMedia(current)}
        playBadgeClassName="h-10 w-10 sm:h-7 sm:w-7"
      />

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Previous attachment"
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
            className={`${ARROW_BUTTON_CLASS} left-1 sm:left-0.5`}
          >
            <svg aria-hidden="true" className="h-4 w-4 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next attachment"
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
            className={`${ARROW_BUTTON_CLASS} right-1 sm:right-0.5`}
          >
            <svg aria-hidden="true" className="h-4 w-4 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white sm:hidden">
            {Math.min(index, photos.length - 1) + 1}/{photos.length}
          </span>
        </>
      )}
    </div>
  );
}
