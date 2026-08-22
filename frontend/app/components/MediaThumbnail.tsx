"use client";

import Image from "next/image";
import { getVideoPosterSrc } from "../../lib/media";

type MediaThumbnailProps = {
  src: string;
  isVideo: boolean;
  alt?: string;
  objectClassName?: string;
  showPlayBadge?: boolean;
  playBadgeClassName?: string;
};

/**
 * Fills its nearest positioned ancestor with a photo, or with the first frame of a
 * video plus a play badge. The parent must be `relative`.
 */
export function MediaThumbnail({
  src,
  isVideo,
  alt = "",
  objectClassName = "object-cover",
  showPlayBadge = true,
  playBadgeClassName = "h-8 w-8",
}: MediaThumbnailProps) {
  if (!isVideo) {
    return <Image src={src} alt={alt} fill unoptimized loader={({ src: source }) => source} className={objectClassName} />;
  }

  return (
    <>
      <video
        src={getVideoPosterSrc(src)}
        className={`absolute inset-0 h-full w-full bg-black ${objectClassName}`}
        preload="metadata"
        muted
        playsInline
        tabIndex={-1}
        aria-label={alt || undefined}
      />

      {showPlayBadge && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ${playBadgeClassName}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2 translate-x-[6%]">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      )}
    </>
  );
}
