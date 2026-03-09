import { buildApiUrl, normalizePhotos } from "./apiClient";
import { createApiClientError } from "./apiErrors";
import type { MapEventPhoto } from "./apiTypes";

export async function uploadEventPhotos(userId: string, eventId: string, files: File[]): Promise<MapEventPhoto[]> {
  if (files.length === 0) {
    return [];
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("photos", file);
  }

  const response = await fetch(buildApiUrl(`/events/${eventId}/photos`, { userId }), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw createApiClientError("EVENT_NOT_FOUND");
    }

    throw createApiClientError("EVENT_PHOTOS_UPLOAD_FAILED");
  }

  const data = (await response.json()) as {
    photos?: MapEventPhoto[];
  };

  return normalizePhotos(data.photos ?? []);
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