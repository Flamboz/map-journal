import { useEffect, useState } from "react";
import { createEvent, fetchReverseGeocodeAddress, type MapEvent, type PlaceSearchResult, uploadEventPhotos } from "./api";
import { formatShortAddress } from "./mapViewHelpers";
import type { DraftSaveStatus, EventFormState } from "./mapViewTypes";

type Coordinates = {
  lat: number;
  lng: number;
};

type UseDraftPinStateArgs = {
  authToken: string | null;
  onEventSaved: (event: MapEvent) => void;
  onDraftOpened?: () => void;
};

type UseDraftPinStateResult = {
  draftPosition: Coordinates | null;
  draftAddress: string | null;
  isResolvingAddress: boolean;
  saveError: string | null;
  isSaving: boolean;
  saveStatus: DraftSaveStatus | null;
  hasCreatedEvent: boolean;
  openDraftFromMapClick: (coords: Coordinates) => void;
  openDraftFromPlace: (place: PlaceSearchResult) => void;
  resetDraftState: () => void;
  saveDraftEvent: (formState: EventFormState) => Promise<void>;
};

export function useDraftPinState({
  authToken,
  onEventSaved,
  onDraftOpened,
}: UseDraftPinStateArgs): UseDraftPinStateResult {
  const [draftPosition, setDraftPosition] = useState<Coordinates | null>(null);
  const [draftAddress, setDraftAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  function resetDraftState() {
    setDraftPosition(null);
    setDraftAddress(null);
    setIsResolvingAddress(false);
    setSaveError(null);
    setSaveStatus(null);
    setCreatedEventId(null);
  }

  function openDraftFromMapClick(coords: Coordinates) {
    onDraftOpened?.();
    setDraftPosition(coords);
    setDraftAddress(null);
    setSaveError(null);
    setSaveStatus(null);
    setCreatedEventId(null);
  }

  function openDraftFromPlace(place: PlaceSearchResult) {
    onDraftOpened?.();
    setDraftPosition({ lat: place.lat, lng: place.lng });
    setDraftAddress(place.displayName);
    setSaveError(null);
    setSaveStatus(null);
    setCreatedEventId(null);
  }

  async function saveDraftEvent(formState: EventFormState) {
    if (!authToken || !draftPosition || isSaving || createdEventId) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveStatus({ phase: "creating", totalFiles: formState.photos.length });
    let createdEvent: MapEvent | null = null;

    try {
      createdEvent = await createEvent(authToken, {
        name: formState.name.trim(),
        startDate: formState.startDate,
        endDate: formState.endDate || undefined,
        description: formState.description.trim() || undefined,
        rating: formState.rating ?? undefined,
        labels: formState.labels,
        visitCompany: formState.visitCompany,
        lat: draftPosition.lat,
        lng: draftPosition.lng,
        visibility: formState.visibility,
        sharedWithEmails: formState.sharedWithEmails,
      });

      setCreatedEventId(createdEvent.id);
      onEventSaved(createdEvent);

      if (formState.photos.length === 0) {
        resetDraftState();
        return;
      }

      const totalFiles = formState.photos.length;
      let uploadedPhotos = createdEvent.photos ?? [];

      for (const [fileIndex, file] of formState.photos.entries()) {
        const completedFiles = fileIndex;
        const currentFileName = file.name || `Attachment ${fileIndex + 1}`;

        setSaveStatus({
          phase: "uploading",
          totalFiles,
          completedFiles,
          currentFileName,
          progressPercent: Math.round((completedFiles / totalFiles) * 100),
        });

        const nextPhotos = await uploadEventPhotos(authToken, createdEvent.id, [file], ({ loaded, total }) => {
          const currentFileProgress = total > 0 ? loaded / total : 0;
          const overallProgress = ((completedFiles + currentFileProgress) / totalFiles) * 100;

          setSaveStatus({
            phase: "uploading",
            totalFiles,
            completedFiles,
            currentFileName,
            progressPercent: Math.max(0, Math.min(100, Math.round(overallProgress))),
          });
        });

        uploadedPhotos = [...uploadedPhotos, ...nextPhotos];
        onEventSaved({
          ...createdEvent,
          photos: uploadedPhotos,
        });
      }

      resetDraftState();
    } catch {
      setSaveStatus(null);

      if (createdEvent) {
        setSaveError("Event created, but attachment upload failed. You can add attachments later from the event page.");
        return;
      }

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
        const address = await fetchReverseGeocodeAddress(position.lat, position.lng);
        if (abortController.signal.aborted) {
          return;
        }

        setDraftAddress(formatShortAddress(address ?? undefined));
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
    saveStatus,
    hasCreatedEvent: createdEventId !== null,
    openDraftFromMapClick,
    openDraftFromPlace,
    resetDraftState,
    saveDraftEvent,
  };
}
