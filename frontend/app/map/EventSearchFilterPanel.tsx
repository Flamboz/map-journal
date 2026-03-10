"use client";

import { type FormEvent, useState } from "react";
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
  const [showFilters, setShowFilters] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedEvents, setSearchedEvents] = useState<MapEvent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

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
    <aside className="absolute left-4 top-40 z-[1100] max-h-[calc(100vh-7rem)] w-[min(28rem,calc(100%-2rem))] overflow-y-auto rounded-lg bg-white p-3 shadow-lg">
      <h2 className="text-base font-semibold text-slate-900">Search events</h2>
      <form className="mt-2 space-y-2" onSubmit={handleEventSearch}>
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
            placeholder="Search by name or description"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setShowFilters((previous) => !previous)}
          >
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
          {selectedLabels.length > 0 && (
            <span className="text-xs text-slate-600">{selectedLabels.length} labels</span>
          )}
          <button
            type="submit"
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            disabled={isSearchingEvents}
          >
            {isSearchingEvents ? "Searching..." : "Search"}
          </button>
        </div>

        {showFilters && (
          <div className="max-h-44 space-y-2 overflow-y-auto border-t border-slate-200 pt-2 pr-1">
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
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
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
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
                />
              </div>
            </div>

            <div
              onChange={() => {
                if (searchError) {
                  setSearchError(null);
                }
              }}
              className="rounded border border-slate-200 p-2"
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
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
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

      {searchError && <p className="mt-2 text-sm text-red-600">{searchError}</p>}

      {hasSearched && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-700">Events ({searchedEvents.length})</p>
          {searchedEvents.length > 0 ? (
            <ul className="mt-2 max-h-32 space-y-2 overflow-auto" aria-label="Event search results">
              {searchedEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onResultClick(event)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                    aria-label={`Open event ${event.title}`}
                  >
                    <p className="font-medium text-slate-900">{event.title}</p>
                    {event.startDate && <p className="text-xs text-slate-600">{event.startDate}</p>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No events to display.</p>
          )}
        </div>
      )}
    </aside>
  );
}
