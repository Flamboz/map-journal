import { API_URL, resolveApiUrl } from "../../lib/apiUrl";
import type { MapEvent, MapEventPhoto } from "./apiTypes";

type ApiQueryValue = string | number | null | undefined;
type ApiQuery = Record<string, ApiQueryValue | ApiQueryValue[]>;

export function buildApiUrl(pathname: string, query?: ApiQuery): string {
  const url = new URL(pathname, API_URL);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item === undefined || item === null || item === "") {
            continue;
          }

          url.searchParams.append(key, String(item));
        }

        continue;
      }

      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function normalizePhotos(photos: MapEventPhoto[] = []): MapEventPhoto[] {
  return photos.map((photo) => ({
    ...photo,
    url: resolveApiUrl(photo.url),
  }));
}

export function normalizeEvent(event: MapEvent): MapEvent {
  return {
    ...event,
    photos: normalizePhotos(event.photos ?? []),
  };
}