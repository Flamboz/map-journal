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

function formatCount(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

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
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="mb-1 font-serif text-2xl sm:text-3xl">Journey timeline</h1>
          <p className="text-sm text-gray-500">
            {formatCount(stats.count, "event")} across {formatCount(stats.years, "year")}
          </p>
        </div>

        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0 sm:pb-0">
          {labels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              aria-pressed={filter === label}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition ${
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
