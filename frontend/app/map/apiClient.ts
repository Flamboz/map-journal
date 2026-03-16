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
    thumbnail_url: photo.thumbnail_url ? resolveApiUrl(photo.thumbnail_url) : photo.thumbnail_url,

    media_type: (function () {
      if (photo.media_type) return photo.media_type;
      if (photo.mime_type) return photo.mime_type.startsWith("video/") ? "video" : "photo";
      try {
        const parsed = new URL(photo.url, API_URL);
        const pathname = parsed.pathname || "";
        const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
        const videoExts = new Set(["mp4", "webm", "ogg", "mov", "mkv", "m4v"]);
        if (videoExts.has(ext)) return "video";
      } catch (e) {
        console.log(e)
      }
      return "photo";
    })(),
  }));
}

export function normalizeEvent(event: MapEvent): MapEvent {
  return {
    ...event,
    photos: normalizePhotos(event.photos ?? []),
  };
}