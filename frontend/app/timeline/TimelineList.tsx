import Link from "next/link";
import type { MapEvent } from "../map/api";
import StarRating from "../components/StarRating";
import { formatEventDateRange } from "../map/mapViewHelpers";
import type { TimelineYearGroup } from "./timelineViewModel";

type TimelineListProps = {
  years: TimelineYearGroup[];
};

function buildEventLabelData(event: MapEvent): string {
  return (event.labels ?? []).join("|");
}

export default function TimelineList({ years }: TimelineListProps) {
  const hasEvents = years.length > 0;

  return (
    <>
      <p data-timeline-empty-state hidden={hasEvents}>
        No events to show yet.
      </p>

      <section className="relative" hidden={!hasEvents}>
        <div className="absolute bottom-0 left-8 top-0 w-px bg-gray-300/60" />

        <div className="space-y-8 pl-20">
          {years.map((yearGroup) => (
            <div key={yearGroup.year || "unknown-year"} data-timeline-year>
              <h3 className="mb-4 text-sm font-medium text-gray-500">{yearGroup.year}</h3>

              {yearGroup.months.map((monthGroup) => (
                <div key={`${yearGroup.year}-${monthGroup.month || "unknown-month"}`} className="mb-6" data-timeline-month>
                  <div className="mb-4 text-sm text-gray-400">{monthGroup.month}</div>

                  <div className="space-y-4">
                    {monthGroup.events.map((event) => (
                      <article
                        key={event.id}
                        className="relative flex items-start gap-6"
                        data-timeline-event
                        data-event-labels={buildEventLabelData(event)}
                      >
                        <div className="absolute -left-12 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                          <span className="block h-3 w-3 rounded-full bg-[color:var(--accent-primary)]" aria-hidden />
                        </div>

                        <div className="paper-card flex-1 p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900">{event.title ?? event.name}</h4>
                              <div className="mt-1 text-sm text-gray-500">
                                {formatEventDateRange(event.startDate, event.endDate)}
                                {" · "}
                                {event.city ?? ""}
                              </div>
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="text-sm">
                                <StarRating rating={event.rating} className="inline-block" />
                              </div>
                              <div className="mt-2 text-sm text-gray-500">{event.rating != null ? `${event.rating}/10` : ""}</div>
                            </div>
                          </div>

                          <p className="mb-4 mt-3 text-sm text-gray-700">{event.description}</p>

                          <div className="flex items-center gap-2">
                            {(event.labels ?? []).map((label) => (
                              <span
                                key={label}
                                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] px-3 py-1 text-sm text-slate-700"
                              >
                                {label}
                              </span>
                            ))}

                            <Link
                              href={`/events/${encodeURIComponent(event.id)}`}
                              className="ml-auto text-sm text-[color:var(--accent-primary-strong)]"
                            >
                              View full →
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
