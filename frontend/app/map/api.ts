import { API_URL, resolveApiUrl } from "../../lib/apiUrl";

export type LastMapPosition = {
  lat: number;
  lng: number;
  zoom: number;
};

export type MapEvent = {
  id: number;
  user_id: number;
  title: string;
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string;
  rating?: number | null;
  labels?: string[];
  visitCompany?: string;
  lat: number;
  lng: number;
  created_at: string;
  photos?: MapEventPhoto[];
  samePinEventIds?: number[];
};

export type MapEventPhoto = {
  id: number;
  path: string;
  url: string;
  createdAt: string;
};

export type CreateEventInput = {
  userId: string;
  name: string;
  startDate: string;
  endDate?: string;
  description?: string;
  rating?: number;
  labels?: string[];
  visitCompany?: string;
  lat: number;
  lng: number;
};

export type UpdateEventInput = {
  userId: string;
  eventId: number;
  name: string;
  startDate: string;
  endDate?: string;
  description?: string;
  rating?: number | null;
  labels?: string[];
  visitCompany?: string;
};

let allowedLabelsCache: string[] | null = null;
let allowedLabelsRequest: Promise<string[]> | null = null;
let allowedVisitCompaniesCache: string[] | null = null;
let allowedVisitCompaniesRequest: Promise<string[]> | null = null;

type ApiQuery = Record<string, string | number | null | undefined>;

function buildApiUrl(pathname: string, query?: ApiQuery): string {
  const url = new URL(pathname, API_URL);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function normalizeEvent(event: MapEvent): MapEvent {
  return {
    ...event,
    photos: (event.photos ?? []).map((photo) => ({
      ...photo,
      url: resolveApiUrl(photo.url),
    })),
  };
}

export async function fetchAllowedLabels(): Promise<string[]> {
  if (allowedLabelsCache) {
    return allowedLabelsCache;
  }

  if (allowedLabelsRequest) {
    return allowedLabelsRequest;
  }

  allowedLabelsRequest = (async () => {
    const response = await fetch(`${API_URL}/events/labels`);
    if (!response.ok) {
      throw new Error("EVENT_LABELS_FETCH_FAILED");
    }

    const data = (await response.json()) as {
      labels?: string[];
    };

    const labels = Array.isArray(data.labels) ? data.labels : [];
    allowedLabelsCache = labels;
    return labels;
  })();

  try {
    return await allowedLabelsRequest;
  } finally {
    allowedLabelsRequest = null;
  }
}

export async function fetchLastMapPosition(userId: string): Promise<LastMapPosition | null> {
  const response = await fetch(buildApiUrl("/map-position", { userId }));
  if (!response.ok) {
    throw new Error("MAP_POSITION_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    lastMapPosition?: LastMapPosition | null;
  };

  return data.lastMapPosition ?? null;
}

export async function fetchUserEvents(userId: string): Promise<MapEvent[]> {
  const response = await fetch(buildApiUrl("/events", { userId }));
  if (!response.ok) {
    throw new Error("EVENTS_FETCH_FAILED");
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
    throw new Error("EVENT_NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("EVENTS_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    event?: MapEvent;
  };

  if (!data.event) {
    throw new Error("EVENTS_FETCH_FAILED");
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
    throw new Error("EVENT_CREATE_FAILED");
  }

  const data = (await response.json()) as {
    event?: MapEvent;
  };

  if (!data.event) {
    throw new Error("EVENT_CREATE_FAILED");
  }

  return normalizeEvent(data.event);
}

export async function uploadEventPhotos(userId: string, eventId: number, files: File[]): Promise<MapEventPhoto[]> {
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
      throw new Error("EVENT_NOT_FOUND");
    }

    throw new Error("EVENT_PHOTOS_UPLOAD_FAILED");
  }

  const data = (await response.json()) as {
    photos?: MapEventPhoto[];
  };

  return (data.photos ?? []).map((photo) => ({
    ...photo,
    url: resolveApiUrl(photo.url),
  }));
}

export async function fetchAllowedVisitCompanies(): Promise<string[]> {
  if (allowedVisitCompaniesCache) {
    return allowedVisitCompaniesCache;
  }

  if (allowedVisitCompaniesRequest) {
    return allowedVisitCompaniesRequest;
  }

  allowedVisitCompaniesRequest = (async () => {
    const response = await fetch(`${API_URL}/events/visit-companies`);
    if (!response.ok) {
      throw new Error("EVENT_VISIT_COMPANIES_FETCH_FAILED");
    }

    const data = (await response.json()) as {
      visitCompanies?: string[];
    };

    const visitCompanies = Array.isArray(data.visitCompanies) ? data.visitCompanies : [];
    allowedVisitCompaniesCache = visitCompanies;
    return visitCompanies;
  })();

  try {
    return await allowedVisitCompaniesRequest;
  } finally {
    allowedVisitCompaniesRequest = null;
  }
}

export async function updateEvent(input: UpdateEventInput): Promise<MapEvent> {
  const response = await fetch(`${API_URL}/events/${encodeURIComponent(String(input.eventId))}`, {
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
    throw new Error("EVENT_NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("EVENT_UPDATE_FAILED");
  }

  const data = (await response.json()) as {
    event?: MapEvent;
  };

  if (!data.event) {
    throw new Error("EVENT_UPDATE_FAILED");
  }

  return normalizeEvent(data.event);
}

export async function deleteEventPhoto(userId: string, eventId: number, photoId: number): Promise<MapEventPhoto[]> {
  const response = await fetch(
    buildApiUrl(`/events/${encodeURIComponent(String(eventId))}/photos/${encodeURIComponent(String(photoId))}`, {
      userId,
    }),
    {
      method: "DELETE",
    },
  );

  if (response.status === 404) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    if (errorBody?.error === "EVENT_NOT_FOUND") {
      throw new Error("EVENT_NOT_FOUND");
    }

    throw new Error("EVENT_PHOTO_NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("EVENT_PHOTO_DELETE_FAILED");
  }

  const data = (await response.json()) as {
    photos?: MapEventPhoto[];
  };

  return (data.photos ?? []).map((photo) => ({
    ...photo,
    url: resolveApiUrl(photo.url),
  }));
}

export async function setEventPreviewPhoto(userId: string, eventId: number, photoId: number): Promise<MapEventPhoto[]> {
  const response = await fetch(
    buildApiUrl(
      `/events/${encodeURIComponent(String(eventId))}/photos/${encodeURIComponent(String(photoId))}/preview`,
      {
        userId,
      },
    ),
    {
      method: "PATCH",
    },
  );

  if (response.status === 404) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    if (errorBody?.error === "EVENT_NOT_FOUND") {
      throw new Error("EVENT_NOT_FOUND");
    }

    throw new Error("EVENT_PHOTO_NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("EVENT_PREVIEW_PHOTO_UPDATE_FAILED");
  }

  const data = (await response.json()) as {
    photos?: MapEventPhoto[];
  };

  return (data.photos ?? []).map((photo) => ({
    ...photo,
    url: resolveApiUrl(photo.url),
  }));
}