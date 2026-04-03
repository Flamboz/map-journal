import { buildApiUrl, normalizePhotos } from "./apiClient";
import { createApiClientError } from "./apiErrors";
import type { MapEventPhoto } from "./apiTypes";

export async function uploadEventPhotos(
  userId: string,
  eventId: string,
  files: File[],
  onProgress?: (progress: { loaded: number; total: number }) => void,
): Promise<MapEventPhoto[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  for (const file of files) {
    formData.append("photos", file);
  }

  return await new Promise<MapEventPhoto[]>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildApiUrl(`/events/${eventId}/photos`, { userId }));

    xhr.onload = () => {
      if (xhr.status === 201) {
        try {
          const json = JSON.parse(xhr.responseText) as { photos?: MapEventPhoto[] };
          resolve(normalizePhotos(json.photos ?? []));
        } catch {
          reject(createApiClientError("EVENT_PHOTOS_UPLOAD_FAILED"));
        }
        return;
      }

      if (xhr.status === 404) {
        reject(createApiClientError("EVENT_NOT_FOUND"));
        return;
      }

      reject(createApiClientError("EVENT_PHOTOS_UPLOAD_FAILED"));
    };

    xhr.onerror = () => reject(createApiClientError("EVENT_PHOTOS_UPLOAD_FAILED"));

    if (xhr.upload && typeof xhr.upload.addEventListener === "function") {
      xhr.upload.addEventListener("progress", (ev: ProgressEvent) => {
        if (ev.lengthComputable && onProgress) {
          onProgress({ loaded: ev.loaded, total: ev.total });
        }
      });
    }

    xhr.send(formData);
  });
}

export async function deleteEventPhoto(userId: string, eventId: string, photoId: string): Promise<MapEventPhoto[]> {
  const response = await fetch(
    buildApiUrl(`/events/${encodeURIComponent(eventId)}/photos/${encodeURIComponent(photoId)}`, {
      userId,
    }),
    {
      method: "DELETE",
    },
  );

  if (response.status === 404) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    if (errorBody?.error === "EVENT_NOT_FOUND") {
      throw createApiClientError("EVENT_NOT_FOUND");
    }

    throw createApiClientError("EVENT_PHOTO_NOT_FOUND");
  }

  if (!response.ok) {
    throw createApiClientError("EVENT_PHOTO_DELETE_FAILED");
  }

  const data = (await response.json()) as {
    photos?: MapEventPhoto[];
  };

  return normalizePhotos(data.photos ?? []);
}

export async function setEventPreviewPhoto(userId: string, eventId: string, photoId: string): Promise<MapEventPhoto[]> {
  const response = await fetch(
    buildApiUrl(`/events/${encodeURIComponent(eventId)}/photos/${encodeURIComponent(photoId)}/preview`, {
      userId,
    }),
    {
      method: "PATCH",
    },
  );

  if (response.status === 404) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    if (errorBody?.error === "EVENT_NOT_FOUND") {
      throw createApiClientError("EVENT_NOT_FOUND");
    }

    throw createApiClientError("EVENT_PHOTO_NOT_FOUND");
  }

  if (!response.ok) {
    throw createApiClientError("EVENT_PREVIEW_PHOTO_UPDATE_FAILED");
  }

  const data = (await response.json()) as {
    photos?: MapEventPhoto[];
  };

  return normalizePhotos(data.photos ?? []);
}
