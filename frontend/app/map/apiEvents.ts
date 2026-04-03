import { API_URL } from "../../lib/apiUrl";
import { buildApiUrl, buildAuthHeaders, normalizeEvent } from "./apiClient";
import { createApiClientError } from "./apiErrors";
import type { CreateEventInput, LastMapPosition, MapEvent, UpdateEventInput } from "./apiTypes";

export type EventSearchFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  labels?: string[];
  visitCompany?: string;
};

export async function fetchLastMapPosition(authToken: string): Promise<LastMapPosition | null> {
  const response = await fetch(buildApiUrl("/map-position"), {
    headers: buildAuthHeaders(authToken),
  });
  if (!response.ok) {
    throw createApiClientError("MAP_POSITION_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    lastMapPosition?: LastMapPosition | null;
  };

  return data.lastMapPosition ?? null;
}

export async function fetchUserEvents(authToken: string, filters?: EventSearchFilters): Promise<MapEvent[]> {
  const response = await fetch(
    buildApiUrl("/events", {
      search: filters?.search,
      dateFrom: filters?.dateFrom,
      dateTo: filters?.dateTo,
      labels: filters?.labels,
      visitCompany: filters?.visitCompany,
    }),
    {
      headers: buildAuthHeaders(authToken),
    },
  );
  if (!response.ok) {
    throw createApiClientError("EVENTS_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    events?: MapEvent[];
  };

  return (data.events ?? []).map(normalizeEvent);
}

export async function fetchEventById(eventId: string, authToken: string): Promise<MapEvent> {
  const response = await fetch(buildApiUrl(`/events/${encodeURIComponent(eventId)}`), {
    cache: "no-store",
    headers: buildAuthHeaders(authToken),
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

export async function createEvent(authToken: string, input: CreateEventInput): Promise<MapEvent> {
  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: buildAuthHeaders(authToken, { "Content-Type": "application/json" }),
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

export async function updateEvent(authToken: string, input: UpdateEventInput): Promise<MapEvent> {
  const response = await fetch(`${API_URL}/events/${encodeURIComponent(input.eventId)}`, {
    method: "PATCH",
    headers: buildAuthHeaders(authToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      description: input.description,
      rating: input.rating,
      labels: input.labels,
      visitCompany: input.visitCompany,
      visibility: input.visibility,
      sharedWithEmails: input.sharedWithEmails,
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

export async function deleteEvent(authToken: string, eventId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/events/${encodeURIComponent(eventId)}`), {
    method: "DELETE",
    headers: buildAuthHeaders(authToken),
  });

  if (response.status === 404) {
    throw createApiClientError("EVENT_NOT_FOUND");
  }

  if (!response.ok) {
    throw createApiClientError("EVENT_DELETE_FAILED");
  }
}

export async function lookupShareableUserEmail(authToken: string, email: string): Promise<string | null> {
  const response = await fetch(buildApiUrl("/events/shareable-users/lookup", { email }), {
    cache: "no-store",
    headers: buildAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw createApiClientError("EVENT_CREATE_FAILED");
  }

  const data = (await response.json()) as { exists?: boolean; email?: string | null };
  return data.exists ? data.email ?? null : null;
}
