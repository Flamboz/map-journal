export type LastMapPosition = {
  lat: number;
  lng: number;
  zoom: number;
};

export type PlaceSearchResult = {
  displayName: string;
  lat: number;
  lng: number;
};

export type MapEventPhoto = {
  id: string;
  path: string;
  url: string;
  createdAt: string;
};

export type MapEvent = {
  id: string;
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
  samePinEventIds?: string[];
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
  eventId: string;
  name: string;
  startDate: string;
  endDate?: string;
  description?: string;
  rating?: number | null;
  labels?: string[];
  visitCompany?: string;
};