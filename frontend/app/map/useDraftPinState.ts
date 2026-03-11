import { useEffect, useState } from "react";
import { createEvent, type MapEvent, type PlaceSearchResult, uploadEventPhotos } from "./api";
import { formatShortAddress } from "./mapViewHelpers";
import type { EventFormState, ReverseGeocodeAddress } from "./mapViewTypes";

type Coordinates = {
  lat: number;
  lng: number;
};

type UseDraftPinStateArgs = {
  userId: string | null;
  onEventSaved: (event: MapEvent) => void;
  onDraftOpened?: () => void;
};

type UseDraftPinStateResult = {
  draftPosition: Coordinates | null;
  draftAddress: string | null;
  isResolvingAddress: boolean;
  saveError: string | null;
  isSaving: boolean;
  openDraftFromMapClick: (coords: Coordinates) => void;
  openDraftFromPlace: (place: PlaceSearchResult) => void;
  resetDraftState: () => void;
  saveDraftEvent: (formState: EventFormState) => Promise<void>;
};

export function useDraftPinState({
  userId,
  onEventSaved,
  onDraftOpened,
}: UseDraftPinStateArgs): UseDraftPinStateResult {
  const [draftPosition, setDraftPosition] = useState<Coordinates | null>(null);
  const [draftAddress, setDraftAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function resetDraftState() {
    setDraftPosition(null);
    setDraftAddress(null);
    setIsResolvingAddress(false);
    setSaveError(null);
  }

  function openDraftFromMapClick(coords: Coordinates) {
    onDraftOpened?.();
    setDraftPosition(coords);
    setDraftAddress(null);
    setSaveError(null);
  }

  function openDraftFromPlace(place: PlaceSearchResult) {
    onDraftOpened?.();
    setDraftPosition({ lat: place.lat, lng: place.lng });
    setDraftAddress(place.displayName);
    setSaveError(null);
  }

  async function saveDraftEvent(formState: EventFormState) {
    if (!userId || !draftPosition) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const createdEvent = await createEvent({
        userId,
        name: formState.name.trim(),
        startDate: formState.startDate,
        endDate: formState.endDate || undefined,
        description: formState.description.trim() || undefined,
        rating: formState.rating ?? undefined,
        labels: formState.labels,
        visitCompany: formState.visitCompany,
        lat: draftPosition.lat,
        lng: draftPosition.lng,
      });

      let uploadedPhotos = createdEvent.photos ?? [];
      if (formState.photos.length > 0) {
        try {
          uploadedPhotos = await uploadEventPhotos(userId, createdEvent.id, formState.photos);
        } catch {
          setSaveError("Event saved, but photo upload failed.");
        }
      }

      onEventSaved({ ...createdEvent, photos: uploadedPhotos });
      resetDraftState();
    } catch {
      setSaveError("Unable to save event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!draftPosition) {
      setDraftAddress(null);
      setIsResolvingAddress(false);
      return;
    }

    const position = draftPosition;
    const abortController = new AbortController();

    async function resolveAddress() {
      setIsResolvingAddress(true);

      try {
        const requestUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        requestUrl.searchParams.set("format", "jsonv2");
        requestUrl.searchParams.set("accept-language", "uk");
        requestUrl.searchParams.set("lat", String(position.lat));
        requestUrl.searchParams.set("lon", String(position.lng));

        const response = await fetch(requestUrl.toString(), {
          signal: abortController.signal,
          headers: {
            Accept: "application/json",
            "Accept-Language": "uk",
          },
        });

        if (!response.ok) {
          throw new Error("Unable to resolve address");
        }

        const result = (await response.json()) as { address?: ReverseGeocodeAddress };
        setDraftAddress(formatShortAddress(result.address));
      } catch {
        if (!abortController.signal.aborted) {
          setDraftAddress(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsResolvingAddress(false);
        }
      }
    }

    void resolveAddress();

    return () => {
      abortController.abort();
    };
  }, [draftPosition]);

  return {
    draftPosition,
    draftAddress,
    isResolvingAddress,
    saveError,
    isSaving,
    openDraftFromMapClick,
    openDraftFromPlace,
    resetDraftState,
    saveDraftEvent,
  };
}