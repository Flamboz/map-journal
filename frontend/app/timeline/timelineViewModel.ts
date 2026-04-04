import type { MapEvent } from "../map/api";

export type TimelineMonthGroup = {
  month: string;
  events: MapEvent[];
};

export type TimelineYearGroup = {
  year: string;
  months: TimelineMonthGroup[];
};

const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthOrder: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function formatYearMonth(dateStr?: string | null) {
  if (!dateStr) {
    return { year: "", month: "" };
  }

  const [year, month] = dateStr.split("-");
  return { year, month: monthNames[Number(month)] ?? "" };
}

function sortEventsDescending(events: MapEvent[]): MapEvent[] {
  return [...events].sort((a, b) => {
    if (!a.startDate || !b.startDate) {
      return 0;
    }

    return a.startDate < b.startDate ? 1 : -1;
  });
}

function buildLabels(events: MapEvent[]): string[] {
  const uniqueLabels = new Set<string>();
  for (const event of events) {
    for (const label of event.labels ?? []) {
      uniqueLabels.add(label);
    }
  }

  return ["All", ...Array.from(uniqueLabels)];
}

export function buildTimelineViewModel(events: MapEvent[]) {
  const sortedEvents = sortEventsDescending(events);
  const groups = new Map<string, Map<string, MapEvent[]>>();

  for (const event of sortedEvents) {
    const { year, month } = formatYearMonth(event.startDate);
    const yearGroup = groups.get(year) ?? new Map<string, MapEvent[]>();
    const monthGroup = yearGroup.get(month) ?? [];

    monthGroup.push(event);
    yearGroup.set(month, monthGroup);
    groups.set(year, yearGroup);
  }

  const years = Array.from(groups.entries())
    .sort(([leftYear], [rightYear]) => (leftYear < rightYear ? 1 : -1))
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries())
        .sort(([leftMonth], [rightMonth]) => (monthOrder[leftMonth] ?? 0) < (monthOrder[rightMonth] ?? 0) ? 1 : -1)
        .map(([month, monthEvents]) => ({
          month,
          events: monthEvents,
        })),
    }));

  const yearCount = new Set(events.map((event) => (event.startDate ? event.startDate.split("-")[0] : ""))).size;

  return {
    labels: buildLabels(events),
    stats: {
      count: events.length,
      years: yearCount,
    },
    years,
  };
}
