"use client";

import { type FormEvent, useState } from "react";
import { searchPlaces, type PlaceSearchResult } from "./api";
import type { CenterState } from "./mapViewTypes";

type PlaceSearchPanelProps = {
  centerState: CenterState;
  onPlaceSelect: (place: PlaceSearchResult) => void;
};

function getCenterCoordinates(centerState: CenterState): { lat: number; lng: number } | null {
  const center = centerState.center;

  if (Array.isArray(center) && center.length >= 2) {
    const latitude = Number(center[0]);
    const longitude = Number(center[1]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { lat: latitude, lng: longitude };
    }
  }

  if (typeof center === "object" && center !== null && "lat" in center && "lng" in center) {
    const latitude = Number(center.lat);
    const longitude = Number(center.lng);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { lat: latitude, lng: longitude };
    }
  }

  return null;
}

export function PlaceSearchPanel({ centerState, onPlaceSelect }: PlaceSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  async function handlePlaceSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setSearchResults([]);
      setSearchError("Enter a place to search.");
      return;
    }

    setIsSearchingPlaces(true);
    setSearchError(null);

    try {
      const centerCoordinates = getCenterCoordinates(centerState);
      const places = await searchPlaces(normalizedQuery, centerCoordinates ?? undefined);
      setSearchResults(places);

      if (places.length === 0) {
        setSearchError("No places found.");
      }
    } catch {
      setSearchResults([]);
      setSearchError("Unable to search places right now.");
    } finally {
      setIsSearchingPlaces(false);
    }
  }

  return (
    <section className="paper-card p-4">
      <h2 className="text-2xl text-slate-900">Search Place</h2>
      <form className="mt-3" onSubmit={handlePlaceSearch}>
        <div className="flex gap-2">
          <input
            id="place-search"
            name="place-search"
            type="text"
            value={searchQuery}
            onChange={(searchInputEvent) => {
              setSearchQuery(searchInputEvent.target.value);
              if (searchError) {
                setSearchError(null);
              }
            }}
            placeholder="City, address, or landmark..."
            className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-sm text-slate-900"
            aria-label="Search place"
          />
          <button
            type="submit"
            className="rounded-[var(--radius-md)] bg-[color:var(--topbar-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--topbar-text)] transition hover:translate-y-[-1px] hover:bg-[color:var(--topbar-ctrl-hover)] disabled:opacity-60"
            disabled={isSearchingPlaces}
          >
            {isSearchingPlaces ? "..." : "Go"}
          </button>
        </div>
      </form>

      {searchError && <p className="mt-2 text-sm text-red-600">{searchError}</p>}

      {searchResults.length > 0 && (
        <ul className="mt-3 max-h-48 space-y-2 overflow-auto" aria-label="Place search results">
          {searchResults.map((place, placeIndex) => (
            <li key={`${place.displayName}-${place.lat}-${place.lng}-${placeIndex}`}>
              <button
                type="button"
                onClick={() => {
                  onPlaceSelect(place);
                  setSearchResults([]);
                  setSearchError(null);
                }}
                className="w-full rounded-[var(--radius-md)] border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-left text-sm text-slate-900 transition hover:bg-[color:var(--paper-muted)]"
              >
                {place.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
