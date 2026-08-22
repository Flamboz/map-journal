import Link from "next/link";
import StarRating from "../components/StarRating";
import type { MapEvent } from "../map/api";
import { formatEventDateRange } from "../map/mapViewHelpers";
import { TimelineEventPhoto } from "./TimelineEventPhoto";

type TimelineEventCardProps = {
  event: MapEvent;
};

function buildEventLabelData(event: MapEvent): string {
  return (event.labels ?? []).join("|");
}

function buildMetaText(event: MapEvent): string {
  const dateText = formatEventDateRange(event.startDate, event.endDate);
  return [dateText, event.city].filter((part) => Boolean(part && part.trim())).join(" · ");
}

export function TimelineEventCard({ event }: TimelineEventCardProps) {
  const hasRating = event.rating != null;

  return (
    <article
      className="relative flex items-start gap-6"
      data-timeline-event
      data-event-labels={buildEventLabelData(event)}
    >
      <div className="absolute -left-7 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 sm:-left-12">
        <span className="block h-3 w-3 rounded-full bg-[color:var(--accent-primary)]" aria-hidden />
      </div>

      <div className="paper-card flex flex-1 flex-col gap-3 p-3 sm:ml-4 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
        <TimelineEventPhoto photos={event.photos ?? []} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-medium text-gray-900 sm:text-lg">{event.title ?? event.name}</h4>
              <div className="mt-1 text-xs text-gray-500 sm:text-sm">{buildMetaText(event)}</div>
            </div>

            {hasRating && (
              <div className="flex shrink-0 flex-col items-end">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 sm:hidden">
                  <span className="text-[color:var(--star)]">★</span>
                  {event.rating}/10
                </span>

                <div className="hidden sm:block">
                  <div className="text-sm">
                    <StarRating rating={event.rating} className="inline-block" />
                  </div>
                  <div className="mt-2 text-right text-sm text-gray-500">{event.rating}/10</div>
                </div>
              </div>
            )}
          </div>

          <p className="mb-3 mt-2 line-clamp-4 text-sm text-gray-700 sm:mb-4 sm:mt-3 sm:line-clamp-none">
            {event.description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {(event.labels ?? []).map((label) => (
              <span
                key={label}
                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] px-3 py-1 text-xs text-slate-700 sm:text-sm"
              >
                {label}
              </span>
            ))}

            <Link
              href={`/events/${encodeURIComponent(event.id)}`}
              className="ml-auto whitespace-nowrap text-sm text-[color:var(--accent-primary-strong)]"
            >
              View full →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
