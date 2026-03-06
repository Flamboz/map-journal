import Image from "next/image";
import Link from "next/link";
import { formatEventDateRange } from "./mapViewHelpers";
import type { MapEvent } from "./api";

type EventPreviewModalProps = {
  events: MapEvent[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

function getPreviewPhotoUrl(event: MapEvent): string {
  return event.photos?.[0]?.url ?? "";
}

export function EventPreviewModal({ events, currentIndex, onClose, onPrevious, onNext }: EventPreviewModalProps) {
  const currentEvent = events[currentIndex];

  if (!currentEvent) {
    return null;
  }

  const hasMultipleEvents = events.length > 1;
  const previousEvent = hasMultipleEvents ? events[(currentIndex - 1 + events.length) % events.length] : null;
  const nextEvent = hasMultipleEvents ? events[(currentIndex + 1) % events.length] : null;

  const previousPhotoUrl = previousEvent ? getPreviewPhotoUrl(previousEvent) : "";
  const currentPhotoUrl = getPreviewPhotoUrl(currentEvent);
  const nextPhotoUrl = nextEvent ? getPreviewPhotoUrl(nextEvent) : "";
  const ratingValue = currentEvent.rating;
  const safeRating = typeof ratingValue === "number" && ratingValue > 0 ? Math.max(0, Math.min(10, ratingValue)) : 0;
  const hasRating = safeRating > 0;
  const filledStars = "★".repeat(safeRating);
  const emptyStars = "☆".repeat(10 - safeRating);

  return (
    <div className="absolute inset-0 z-[1200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close event preview"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative z-[1201] w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <button
          type="button"
          aria-label="Close"
          className="absolute right-3 top-3 rounded bg-white/90 px-2 py-1 text-sm font-semibold text-gray-800"
          onClick={onClose}
        >
          ×
        </button>

        <div className="relative mb-4 h-56 overflow-hidden rounded-lg bg-gray-200">
          {hasMultipleEvents && (
            <>
              <div className="absolute left-0 top-0 h-full w-[24%] overflow-hidden rounded-r-md opacity-80">
                {previousPhotoUrl ? (
                  <Image
                    src={previousPhotoUrl}
                    alt="Previous event preview"
                    fill
                    unoptimized
                    loader={({ src }) => src}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-300" />
                )}
              </div>

              <div className="absolute right-0 top-0 h-full w-[24%] overflow-hidden rounded-l-md opacity-80">
                {nextPhotoUrl ? (
                  <Image
                    src={nextPhotoUrl}
                    alt="Next event preview"
                    fill
                    unoptimized
                    loader={({ src }) => src}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-300" />
                )}
              </div>
            </>
          )}

          <div className="absolute left-1/2 top-0 h-full w-[72%] -translate-x-1/2 overflow-hidden rounded-md">
            {currentPhotoUrl ? (
              <Image
                src={currentPhotoUrl}
                alt={`${currentEvent.name ?? currentEvent.title} preview`}
                fill
                unoptimized
                loader={({ src }) => src}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-300 text-sm text-gray-600">No photo</div>
            )}
          </div>

          {hasMultipleEvents && (
            <>
              <button
                type="button"
                aria-label="Previous event"
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1 text-xl font-light leading-none text-gray-800"
                onClick={onPrevious}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next event"
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1 text-xl font-light leading-none text-gray-800"
                onClick={onNext}
              >
                ›
              </button>
            </>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{currentEvent.name ?? currentEvent.title}</h3>
          {hasRating && (
            <p aria-label="Event rating" className="text-base">
              <span className="text-yellow-400">{filledStars}</span>
              <span className="text-slate-300">{emptyStars}</span>
            </p>
          )}
          <p className="text-sm text-gray-700">{formatEventDateRange(currentEvent.startDate, currentEvent.endDate)}</p>
          <Link
            href={`/events/${currentEvent.id}`}
            className="inline-flex rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            See More
          </Link>
        </div>
      </div>
    </div>
  );
}
