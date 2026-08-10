import Link from "next/link";
import type { MapEvent } from "../map/api";
import StarRating from "../components/StarRating";
import { formatEventDateRange } from "../map/mapViewHelpers";
import type { TimelineYearGroup } from "./timelineViewModel";
import { TimelineEventPhoto } from "./TimelineEventPhoto";

const WEEKDAY_STYLES: Record<string, { bg: string; badge: string }> = {
  Mon: { bg: "bg-blue-100/75",    badge: "bg-blue-200 text-blue-800" },
  Tue: { bg: "bg-violet-100/75",  badge: "bg-violet-200 text-violet-800" },
  Wed: { bg: "bg-emerald-100/75", badge: "bg-emerald-200 text-emerald-800" },
  Thu: { bg: "bg-amber-100/75",   badge: "bg-amber-200 text-amber-800" },
  Fri: { bg: "bg-rose-100/75",    badge: "bg-rose-200 text-rose-800" },
  Sat: { bg: "bg-cyan-100/75",    badge: "bg-cyan-200 text-cyan-800" },
  Sun: { bg: "bg-orange-100/75",  badge: "bg-orange-200 text-orange-800" },
};

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
                    {monthGroup.days.map((dayGroup) => {
                      const styles = WEEKDAY_STYLES[dayGroup.weekday];
                      return (
                        <div
                          key={dayGroup.date}
                          className={`relative rounded-[var(--radius-md)] pb-3 pr-4 pt-10 ${styles?.bg ?? ""}`}
                        >
                          {styles && (
                            <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}>
                              {dayGroup.weekday}
                            </span>
                          )}

                          <div className="space-y-4">
                            {dayGroup.events.map((event) => (
                              <article
                                key={event.id}
                                className="relative flex items-start gap-6"
                                data-timeline-event
                                data-event-labels={buildEventLabelData(event)}
                              >
                                <div className="absolute -left-12 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                                  <span className="block h-3 w-3 rounded-full bg-[color:var(--accent-primary)]" aria-hidden />
                                </div>

                                <div className="paper-card ml-4 flex flex-1 items-start gap-4 p-4">
                                  <TimelineEventPhoto photos={event.photos ?? []} />

                                  <div className="min-w-0 flex-1">
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
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
