export type LastMapPosition = {
  lat: number;
  lng: number;
  zoom: number;
};

export type MapEvent = {
  id: number;
  user_id: number;
  title: string;
  lat: number;
  lng: number;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? "http://localhost:4000";

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