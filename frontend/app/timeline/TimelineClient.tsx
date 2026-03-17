"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { MapEvent } from "../map/apiTypes";
import StarRating from "../components/StarRating";
import { formatEventDateRange } from "../map/mapViewHelpers";

type Props = {
  initialEvents: MapEvent[];
  userId: string;
};

function formatYearMonth(dateStr?: string | null) {
  if (!dateStr) return { year: "", month: "" };
  const [y, m] = dateStr.split("-");
  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return { year: y, month: monthNames[Number(m)] ?? "" };
}

export default function TimelineClient({ initialEvents = [] }: Props) {
  const [filter, setFilter] = useState<string>("All");

  const eventsDesc = useMemo(() => {
    return [...initialEvents].sort((a, b) => (a.startDate && b.startDate ? (a.startDate < b.startDate ? 1 : -1) : 0));
  }, [initialEvents]);

  const labels = useMemo(() => {
    const set = new Set<string>();
    initialEvents.forEach((e) => e.labels?.forEach((l) => set.add(l)));
    return ["All", ...Array.from(set)];
  }, [initialEvents]);

  const filtered = useMemo(() => {
    if (filter === "All") return eventsDesc;
    return eventsDesc.filter((e) => e.labels?.includes(filter));
  }, [eventsDesc, filter]);

  const stats = useMemo(() => {
    if (initialEvents.length === 0) return { count: 0, years: 0 };
    const years = new Set(initialEvents.map((e) => (e.startDate ? e.startDate.split("-")[0] : "")));
    return { count: initialEvents.length, years: years.size };
  }, [initialEvents]);

  const grouped = useMemo(() => {
    const map: Record<string, Record<string, MapEvent[]>> = {};
    filtered.forEach((e) => {
      const { year, month } = formatYearMonth(e.startDate);
      if (!map[year]) map[year] = {};
      if (!map[year][month]) map[year][month] = [];
      map[year][month].push(e);
    });
    return map;
  }, [filtered]);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-serif">Journey timeline</h1>
          <p className="text-sm text-gray-500">{stats.count} events across {stats.years} years</p>
        </div>

        <div className="flex gap-2">
          {labels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setFilter(l)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                filter === l
                  ? "border-[color:var(--accent-weak)] bg-[color:var(--accent-weak-bg)] text-[color:var(--accent-weak-text)]"
                  : "border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] text-slate-700 hover:bg-[color:var(--paper-muted)]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <p>No events to show yet.</p>
      ) : (
        <section className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-300/60" />

          <div className="space-y-8 pl-20">
            {Object.keys(grouped)
              .sort((a, b) => (a < b ? 1 : -1))
              .map((year) => (
                <div key={year}>
                  <h3 className="mb-4 text-sm font-medium text-gray-500">{year}</h3>

                  {Object.keys(grouped[year])
                    .sort((a, b) => {
                      const months = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 } as Record<string, number>;
                      return (months[a] ?? 0) < (months[b] ?? 0) ? 1 : -1;
                    })
                    .map((month) => (
                      <div key={month} className="mb-6">
                        <div className="mb-4 text-sm text-gray-400">{month}</div>

                        <div className="space-y-4">
                          {grouped[year][month].map((ev) => (
                            <article key={ev.id} className="relative flex items-start gap-6">

                              <div className="absolute -left-12 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <span className="h-3 w-3 rounded-full bg-[color:var(--accent-primary)] block" aria-hidden />
                              </div>

                              <div className="flex-1 paper-card p-4">
                                <div className="flex items-start gap-4">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-medium text-gray-900">{ev.title ?? ev.name}</h4>
                                    <div className="mt-1 text-sm text-gray-500">
                                      {formatEventDateRange(ev.startDate, ev.endDate)}
                                      {" · "}
                                      {ev.city ?? ""}
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end">
                                    <div className="text-sm">
                                      <StarRating rating={ev.rating} className="inline-block" />
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500">{ev.rating != null ? `${ev.rating}/10` : ""}</div>
                                  </div>
                                </div>

                                <p className="mt-3 mb-4 text-sm text-gray-700">{ev.description}</p>

                                <div className="flex items-center gap-2">
                                  {ev.labels?.map((lbl) => (
                                    <span
                                      key={lbl}
                                      className={`rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] px-3 py-1 text-sm text-slate-700`}
                                    >
                                      {lbl}
                                    </span>
                                  ))}

                                  <Link href={`/events/${encodeURIComponent(ev.id)}`} className="ml-auto text-sm text-[color:var(--accent-primary-strong)]">
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
      )}
    </main>
  );
}
