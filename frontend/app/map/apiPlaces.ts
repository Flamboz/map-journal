import { buildApiUrl } from "./apiClient";
import { createApiClientError } from "./apiErrors";
import type { PlaceSearchResult } from "./apiTypes";
import type { ReverseGeocodeAddress } from "./mapViewTypes";

export async function searchPlaces(
  query: string,
  options?: { lat?: number; lng?: number },
): Promise<PlaceSearchResult[]> {
  const response = await fetch(
    buildApiUrl("/place-search", {
      q: query.trim(),
      lat: options?.lat,
      lng: options?.lng,
    }),
  );

  if (!response.ok) {
    throw createApiClientError("PLACE_SEARCH_FAILED");
  }

  const data = (await response.json()) as {
    places?: PlaceSearchResult[];
  };

  return Array.isArray(data.places) ? data.places : [];
}

export async function fetchReverseGeocodeAddress(lat: number, lng: number): Promise<ReverseGeocodeAddress | null> {
  const response = await fetch(
    buildApiUrl("/reverse-geocode", {
      lat,
      lng,
    }),
  );

  if (!response.ok) {
    throw createApiClientError("PLACE_SEARCH_FAILED");
  }

  const data = (await response.json()) as {
    address?: ReverseGeocodeAddress | null;
  };

  return data.address ?? null;
}
