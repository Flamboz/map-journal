"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type TimelineClientProps = {
  labels: string[];
  stats: {
    count: number;
    years: number;
  };
  children: ReactNode;
};

export default function TimelineClient({ labels, stats, children }: TimelineClientProps) {
  const [filter, setFilter] = useState("All");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const eventElements = Array.from(container.querySelectorAll<HTMLElement>("[data-timeline-event]"));
    const monthElements = Array.from(container.querySelectorAll<HTMLElement>("[data-timeline-month]"));
    const yearElements = Array.from(container.querySelectorAll<HTMLElement>("[data-timeline-year]"));
    const emptyState = container.querySelector<HTMLElement>("[data-timeline-empty-state]");

    for (const eventElement of eventElements) {
      const eventLabels = eventElement.dataset.eventLabels?.split("|").filter(Boolean) ?? [];
      eventElement.hidden = filter !== "All" && !eventLabels.includes(filter);
    }

    for (const monthElement of monthElements) {
      monthElement.hidden = monthElement.querySelector("[data-timeline-event]:not([hidden])") === null;
    }

    for (const yearElement of yearElements) {
      yearElement.hidden = yearElement.querySelector("[data-timeline-month]:not([hidden])") === null;
    }

    const hasVisibleEvents = eventElements.some((eventElement) => !eventElement.hidden);
    if (emptyState) {
      emptyState.hidden = hasVisibleEvents;
    }
  }, [filter]);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-3xl font-serif">Journey timeline</h1>
          <p className="text-sm text-gray-500">
            {stats.count} events across {stats.years} years
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {labels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              aria-pressed={filter === label}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                filter === label
                  ? "border-[color:var(--accent-weak)] bg-[color:var(--accent-weak-bg)] text-[color:var(--accent-weak-text)]"
                  : "border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] text-slate-700 hover:bg-[color:var(--paper-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div ref={containerRef}>{children}</div>
    </main>
  );
}
