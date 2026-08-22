import type { TimelineYearGroup } from "./timelineViewModel";
import { TimelineEventCard } from "./TimelineEventCard";

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

export default function TimelineList({ years }: TimelineListProps) {
  const hasEvents = years.length > 0;

  return (
    <>
      <p data-timeline-empty-state hidden={hasEvents}>
        No events to show yet.
      </p>

      <section className="relative" hidden={!hasEvents}>
        <div className="absolute bottom-0 left-3 top-0 w-px bg-gray-300/60 sm:left-8" />

        <div className="space-y-8 pl-8 sm:pl-20">
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
                          className={`relative rounded-[var(--radius-md)] px-2 pb-3 pt-9 sm:pl-0 sm:pr-4 sm:pt-10 ${styles?.bg ?? ""}`}
                        >
                          {styles && (
                            <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}>
                              {dayGroup.weekday}
                            </span>
                          )}

                          <div className="space-y-4">
                            {dayGroup.events.map((event) => (
                              <TimelineEventCard key={event.id} event={event} />
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
