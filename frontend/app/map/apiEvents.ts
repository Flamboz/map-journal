import { API_URL } from "../../lib/apiUrl";
import { buildApiUrl, normalizeEvent } from "./apiClient";
import { createApiClientError } from "./apiErrors";
import type { CreateEventInput, LastMapPosition, MapEvent, UpdateEventInput } from "./apiTypes";

export async function fetchLastMapPosition(userId: string): Promise<LastMapPosition | null> {
  const response = await fetch(buildApiUrl("/map-position", { userId }));
  if (!response.ok) {
    throw createApiClientError("MAP_POSITION_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    lastMapPosition?: LastMapPosition | null;
  };

  return data.lastMapPosition ?? null;
}

export async function fetchUserEvents(userId: string): Promise<MapEvent[]> {
  const response = await fetch(buildApiUrl("/events", { userId }));
  if (!response.ok) {
    throw createApiClientError("EVENTS_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    events?: MapEvent[];
  };

  return (data.events ?? []).map(normalizeEvent);
}

export async function fetchEventById(eventId: string, userId: string): Promise<MapEvent> {
  const response = await fetch(buildApiUrl(`/events/${encodeURIComponent(eventId)}`, { userId }), {
    cache: "no-store",
  });

  if (response.status === 404) {
    throw createApiClientError("EVENT_NOT_FOUND");
  }

  if (response.status === 400) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    if (errorBody?.error === "INVALID_EVENT") {
      throw createApiClientError("EVENT_NOT_FOUND");
    }

    throw createApiClientError("EVENTS_FETCH_FAILED");
  }

  if (!response.ok) {
    throw createApiClientError("EVENTS_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    event?: MapEvent;
  };

  if (!data.event) {
    throw createApiClientError("EVENTS_FETCH_FAILED");
  }

  return normalizeEvent(data.event);
}

export async function createEvent(input: CreateEventInput): Promise<MapEvent> {
  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw createApiClientError("EVENT_CREATE_FAILED");
  }

  const data = (await response.json()) as {
    event?: MapEvent;
  };

  if (!data.event) {
    throw createApiClientError("EVENT_CREATE_FAILED");
  }

  return normalizeEvent(data.event);
}

export async function updateEvent(input: UpdateEventInput): Promise<MapEvent> {
  const response = await fetch(`${API_URL}/events/${encodeURIComponent(input.eventId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: input.userId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      description: input.description,
      rating: input.rating,
      labels: input.labels,
      visitCompany: input.visitCompany,
    }),
  });

  if (response.status === 404) {
    throw createApiClientError("EVENT_NOT_FOUND");
  }

  if (!response.ok) {
    throw createApiClientError("EVENT_UPDATE_FAILED");
  }

  const data = (await response.json()) as {
    event?: MapEvent;
  };

  if (!data.event) {
    throw createApiClientError("EVENT_UPDATE_FAILED");
  }

  return normalizeEvent(data.event);
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/events/${encodeURIComponent(eventId)}`, { userId }), {
    method: "DELETE",
  });

  if (response.status === 404) {
    throw createApiClientError("EVENT_NOT_FOUND");
  }

  if (!response.ok) {
    throw createApiClientError("EVENT_DELETE_FAILED");
  }
}