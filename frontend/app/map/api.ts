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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? "http://localhost:4000";
let allowedLabelsCache: string[] | null = null;
let allowedLabelsRequest: Promise<string[]> | null = null;
let allowedVisitCompaniesCache: string[] | null = null;
let allowedVisitCompaniesRequest: Promise<string[]> | null = null;

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
  const response = await fetch(`${API_URL}/map-position?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error("MAP_POSITION_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    lastMapPosition?: LastMapPosition | null;
  };

  return data.lastMapPosition ?? null;
}

export async function fetchUserEvents(userId: string): Promise<MapEvent[]> {
  const response = await fetch(`${API_URL}/events?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error("EVENTS_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    events?: MapEvent[];
  };

  return data.events ?? [];
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

  return data.event;
}

export async function uploadEventPhotos(userId: string, eventId: number, files: File[]): Promise<MapEventPhoto[]> {
  if (files.length === 0) {
    return [];
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("photos", file);
  }

  const response = await fetch(`${API_URL}/events/${eventId}/photos?userId=${encodeURIComponent(userId)}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("EVENT_PHOTOS_UPLOAD_FAILED");
  }

  const data = (await response.json()) as {
    photos?: MapEventPhoto[];
  };

  return data.photos ?? [];
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