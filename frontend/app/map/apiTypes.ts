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

export type EventVisibility = "private" | "share_with";
export type EventAccessLevel = "owner" | "shared";

export type MapEventPhoto = {
  id: string;
  path: string;
  url: string;
  createdAt: string;
  mime_type?: string; // e.g. "image/jpeg" or "video/mp4"
  original_name?: string;
  size_bytes?: number;
  // Convenience flag for rendering
  media_type?: "photo" | "video";
  thumbnail_url?: string;
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
  city?: string;
  visitCompany?: string;
  lat: number;
  lng: number;
  created_at: string;
  photos?: MapEventPhoto[];
  samePinEventIds?: string[];
  accessLevel?: EventAccessLevel;
  visibility?: EventVisibility;
  ownerEmail?: string;
  sharedWithEmails?: string[];
};

export type CreateEventInput = {
  name: string;
  startDate: string;
  endDate?: string;
  description?: string;
  rating?: number;
  labels?: string[];
  visitCompany?: string;
  lat: number;
  lng: number;
  photos?: File[];
  visibility: EventVisibility;
  sharedWithEmails: string[];
};

export type UpdateEventInput = {
  eventId: string;
  name: string;
  startDate: string;
  endDate?: string;
  description?: string;
  rating?: number | null;
  labels?: string[];
  visitCompany?: string;
  visibility: EventVisibility;
  sharedWithEmails: string[];
  photoIdsToDelete?: string[];
  previewPhotoId?: string | null;
};
