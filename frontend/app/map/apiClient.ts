import { API_URL, resolveApiUrl } from "../../lib/apiUrl";
import type { MapEvent, MapEventPhoto } from "./apiTypes";

type ApiQueryValue = string | number | null | undefined;
type ApiQuery = Record<string, ApiQueryValue | ApiQueryValue[]>;

export function buildAuthHeaders(authToken: string, headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...headers,
    Authorization: `Bearer ${authToken}`,
  };
}

export function buildApiUrl(pathname: string, query?: ApiQuery): string {
  const base = `${API_URL}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  const url = new URL(base);

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

function detectMediaTypeFromUrl(url: string): "photo" | "video" {
  const path = url.split("?")[0].split("#")[0];
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const videoExts = new Set(["mp4", "webm", "ogg", "mov", "mkv", "m4v"]);
  return videoExts.has(ext) ? "video" : "photo";
}

export function normalizePhotos(photos: MapEventPhoto[] = []): MapEventPhoto[] {
  return photos.map((photo) => ({
    ...photo,
    url: resolveApiUrl(photo.url),
    thumbnail_url: photo.thumbnail_url ? resolveApiUrl(photo.thumbnail_url) : photo.thumbnail_url,

    media_type:
      photo.media_type ??
      (photo.mime_type
        ? photo.mime_type.startsWith("video/") ? "video" : "photo"
        : detectMediaTypeFromUrl(photo.url)),
  }));
}

export function normalizeEvent(event: MapEvent): MapEvent {
  return {
    ...event,
    photos: normalizePhotos(event.photos ?? []),
    accessLevel: event.accessLevel === "shared" ? "shared" : "owner",
    visibility: event.visibility === "share_with" ? "share_with" : "private",
    ownerEmail: event.ownerEmail ?? "",
    sharedWithEmails: event.sharedWithEmails ?? [],
  };
}
