"use client";

import { type FormEvent, useState } from "react";
import { EventAccessBadge } from "../components/EventAccessBadge";
import { EventLabelsField } from "../components/EventFormFields";
import { fetchUserEvents, type EventSearchFilters, type MapEvent } from "./api";

type EventSearchFilterPanelProps = {
  userId: string | null;
  labelOptions: string[];
  visitCompanyOptions: string[];
  onResultsLoaded: (events: MapEvent[]) => void;
  onResultClick: (event: MapEvent) => void;
};

export function EventSearchFilterPanel({
  userId,
  labelOptions,
  visitCompanyOptions,
  onResultsLoaded,
  onResultClick,
}: EventSearchFilterPanelProps) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [visitCompany, setVisitCompany] = useState("");
  const [isSearchingEvents, setIsSearchingEvents] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedEvents, setSearchedEvents] = useState<MapEvent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const noMatchesMessage = "No events match your current search and filters.";
  const showNoMatchesUnderEvents = searchError === noMatchesMessage;
  const hasActiveFilters =
    search.trim().length > 0 ||
    dateFrom.length > 0 ||
    dateTo.length > 0 ||
    selectedLabels.length > 0 ||
    visitCompany.length > 0;

  async function handleEventSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setSearchError("You need to sign in before searching events.");
      return;
    }

    setSearchError(null);
    setIsSearchingEvents(true);

    const filters: EventSearchFilters = {
      search: search.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      labels: selectedLabels.length > 0 ? selectedLabels : undefined,
      visitCompany: visitCompany || undefined,
    };

    try {
      const events = await fetchUserEvents(userId, filters);
      onResultsLoaded(events);
      setSearchedEvents(events);
      setHasSearched(true);

      if (events.length === 0) {
        setSearchError("No events match your current search and filters.");
      }
    } catch {
      setSearchedEvents([]);
      setHasSearched(true);
      setSearchError("Unable to search events right now.");
    } finally {
      setIsSearchingEvents(false);
    }
  }

  return (
    <section className="paper-card flex h-full min-h-0 flex-1 flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-slate-900">Search Events</h2>
        {hasActiveFilters && (
          <button
            type="button"
            className="text-sm font-semibold text-[color:var(--link)] transition hover:text-[color:var(--link-hover)]"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
              setSelectedLabels([]);
              setVisitCompany("");
              setSearchError(null);
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <form className="mt-3 shrink-0 space-y-3" onSubmit={handleEventSearch}>
        <div>
          <input
            id="event-text-search"
            name="event-text-search"
            type="text"
            aria-label="Text"
            value={search}
            onChange={(changeEvent) => {
              setSearch(changeEvent.target.value);
              if (searchError) {
                setSearchError(null);
              }
            }}
            placeholder="Search by name or description..."
            className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-[color:var(--paper-muted)]"
            onClick={() => setShowFilters((previous) => !previous)}
          >
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-[color:var(--topbar-bg)] px-4 py-1.5 text-sm font-semibold text-[color:var(--topbar-text)] transition hover:translate-y-[-1px] hover:bg-[color:var(--topbar-ctrl-hover)] disabled:opacity-60"
            disabled={isSearchingEvents}
          >
            {isSearchingEvents ? "Searching..." : "Search"}
          </button>
        </div>

        {showFilters && (
          <div className="max-h-64 space-y-3 overflow-y-auto border-t border-[color:var(--border-soft)] pt-3 pr-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700" htmlFor="event-date-from">
                  Date from
                </label>
                <input
                  id="event-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(changeEvent) => {
                    setDateFrom(changeEvent.target.value);
                    if (searchError) {
                      setSearchError(null);
                    }
                  }}
                  className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-2 py-1 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700" htmlFor="event-date-to">
                  Date to
                </label>
                <input
                  id="event-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(changeEvent) => {
                    setDateTo(changeEvent.target.value);
                    if (searchError) {
                      setSearchError(null);
                    }
                  }}
                  className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-2 py-1 text-sm text-slate-900"
                />
              </div>
            </div>

            <div
              onChange={() => {
                if (searchError) {
                  setSearchError(null);
                }
              }}
              className="rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] p-3"
            >
              <EventLabelsField
                labelOptions={labelOptions}
                selectedLabels={selectedLabels}
                onLabelsChange={setSelectedLabels}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700" htmlFor="event-visit-company-filter">
                Visit company
              </label>
              <select
                id="event-visit-company-filter"
                value={visitCompany}
                onChange={(changeEvent) => {
                  setVisitCompany(changeEvent.target.value);
                  if (searchError) {
                    setSearchError(null);
                  }
                }}
                className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-2 py-1 text-sm text-slate-900"
              >
                <option value="">Any</option>
                {visitCompanyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>

      {searchError && !showNoMatchesUnderEvents && <p className="mt-2 text-sm text-red-600">{searchError}</p>}

      <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-[color:var(--border-soft)] pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-700">Events ({searchedEvents.length})</p>
        {showNoMatchesUnderEvents && <p className="mt-2 text-sm text-red-600">{searchError}</p>}
        {hasSearched ? (
          searchedEvents.length > 0 ? (
            <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" aria-label="Event search results">
              {searchedEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onResultClick(event)}
                    className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-[color:var(--paper-muted)]"
                    aria-label={`Open event ${event.title}`}
                  >
                    <p className="break-words font-medium text-slate-900">{event.title}</p>
                    <div className="mt-2">
                      <EventAccessBadge event={event} />
                    </div>
                    {event.startDate && <p className="text-xs text-slate-600">{event.startDate}</p>}
                  </button>
                </li>
              ))}
            </ul>
          ) : null
        ) : (
          <p className="mt-2 text-sm text-slate-600">Run a search to load events.</p>
        )}
      </div>
    </section>
  );
}
