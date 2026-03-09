"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  createEvent,
  fetchAllowedLabels,
  fetchAllowedVisitCompanies,
  fetchLastMapPosition,
  fetchUserEvents,
  type MapEvent,
  type PlaceSearchResult,
  uploadEventPhotos,
} from "./api";
import {
  createMarkerIconWithCount,
  DRAFT_MARKER_ICON,
  MARKER_ICON,
  PIN_GROUP_DISTANCE_METERS,
  WORLD_CENTER,
  WORLD_ZOOM,
} from "./mapViewConstants";
import { EventDraftForm } from "./EventDraftForm";
import { EventPreviewModal } from "./EventPreviewModal";
import { PlaceSearchPanel } from "./PlaceSearchPanel";
import { formatShortAddress, groupEventsByDistance } from "./mapViewHelpers";
import { MapClickHandler, RecenterMap } from "./MapLeafletHelpers";
import type { CenterState, EventFormState, ReverseGeocodeAddress } from "./mapViewTypes";

type MapViewProps = {
  initialError?: string | null;
};

export default function MapView({ initialError = null }: MapViewProps) {
  const { data: session, status } = useSession();
  const [centerState, setCenterState] = useState<CenterState>({ center: WORLD_CENTER, zoom: WORLD_ZOOM });
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [eventsError, setEventsError] = useState(false);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [visitCompanyOptions, setVisitCompanyOptions] = useState<string[]>([]);
  const [draftPosition, setDraftPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [draftAddress, setDraftAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(initialError);

  const userId = session?.user?.id ? String(session.user.id) : null;
  const groupedEvents = groupEventsByDistance(events, PIN_GROUP_DISTANCE_METERS);
  const selectedGroup = selectedGroupIndex === null ? null : groupedEvents[selectedGroupIndex] ?? null;

  function resetDraftState() {
    setDraftPosition(null);
    setDraftAddress(null);
    setIsResolvingAddress(false);
    setSaveError(null);
  }

  function handleMapClick(coords: { lat: number; lng: number }) {
    setSelectedGroupIndex(null);
    setSelectedEventIndex(0);
    setDraftPosition(coords);
    setDraftAddress(null);
    setSaveError(null);
  }

  function handleGroupMarkerClick(groupIndex: number) {
    setSelectedGroupIndex(groupIndex);
    setSelectedEventIndex(0);
  }

  function handleClosePreview() {
    setSelectedGroupIndex(null);
    setSelectedEventIndex(0);
  }

  function handlePlaceSelect(place: PlaceSearchResult) {
    setSelectedGroupIndex(null);
    setSelectedEventIndex(0);
    setDraftPosition({ lat: place.lat, lng: place.lng });
    setDraftAddress(place.displayName);
    setSaveError(null);
    setCenterState((previous) => ({
      center: [place.lat, place.lng],
      zoom: previous.zoom,
    }));
  }

  function handleNextPreviewEvent() {
    if (!selectedGroup) {
      return;
    }

    setSelectedEventIndex((previous) => (previous + 1) % selectedGroup.events.length);
  }

  function handlePreviousPreviewEvent() {
    if (!selectedGroup) {
      return;
    }

    setSelectedEventIndex((previous) => (previous - 1 + selectedGroup.events.length) % selectedGroup.events.length);
  }

  async function handleSave(formState: EventFormState) {
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

      setEvents((previous) => [{ ...createdEvent, photos: uploadedPhotos }, ...previous]);
      resetDraftState();
    } catch {
      setSaveError("Unable to save event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    setGlobalError(initialError);
  }, [initialError]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      return;
    }

    let isActive = true;

    async function loadMapData() {
      const [positionResult, eventsResult] = await Promise.allSettled([
        fetchLastMapPosition(userId as string),
        fetchUserEvents(userId as string),
      ]);

      if (!isActive) return;

      if (positionResult.status === "fulfilled" && positionResult.value) {
        setCenterState({
          center: [positionResult.value.lat, positionResult.value.lng],
          zoom: positionResult.value.zoom,
        });
      } else {
        setCenterState({ center: WORLD_CENTER, zoom: WORLD_ZOOM });
      }

      if (eventsResult.status === "fulfilled") {
        setEvents(eventsResult.value);
        setEventsError(false);
      } else {
        setEvents([]);
        setEventsError(true);
      }
    }

    loadMapData();

    return () => {
      isActive = false;
    };
  }, [status, userId]);

  useEffect(() => {
    let isActive = true;

    Promise.all([fetchAllowedLabels(), fetchAllowedVisitCompanies()])
      .then(([labels, visitCompanies]) => {
        if (!isActive) {
          return;
        }

        setLabelOptions(labels);
        setVisitCompanyOptions(visitCompanies);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setLabelOptions([]);
        setVisitCompanyOptions([]);
      });

    return () => {
      isActive = false;
    };
  }, []);

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
        requestUrl.searchParams.set("lat", String(position.lat));
        requestUrl.searchParams.set("lon", String(position.lng));

        const response = await fetch(requestUrl.toString(), {
          signal: abortController.signal,
          headers: {
            Accept: "application/json",
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

    resolveAddress();

    return () => {
      abortController.abort();
    };
  }, [draftPosition]);

  return (
    <section className="relative h-[calc(100vh-57px)] w-full" aria-label="map-view">
      <PlaceSearchPanel centerState={centerState} onPlaceSelect={handlePlaceSelect} />

      <MapContainer center={centerState.center} zoom={centerState.zoom} className="h-full w-full" scrollWheelZoom zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        <RecenterMap center={centerState.center} zoom={centerState.zoom} />
        <MapClickHandler onClick={handleMapClick} />
        <MarkerClusterGroup>
          {groupedEvents.map((group, groupIndex) => (
            <Marker
              key={group.id}
              position={[group.lat, group.lng]}
              icon={group.events.length > 1 ? createMarkerIconWithCount(group.events.length) : MARKER_ICON}
              eventHandlers={{
                click: () => handleGroupMarkerClick(groupIndex),
              }}
            />
          ))}
        </MarkerClusterGroup>
        {draftPosition && <Marker position={[draftPosition.lat, draftPosition.lng]} icon={DRAFT_MARKER_ICON} />}
      </MapContainer>

      <EventDraftForm
        draftPosition={draftPosition}
        isResolvingAddress={isResolvingAddress}
        draftAddress={draftAddress}
        saveError={saveError}
        isSaving={isSaving}
        labelOptions={labelOptions}
        visitCompanyOptions={visitCompanyOptions}
        onCancel={resetDraftState}
        onSave={handleSave}
      />

      {eventsError && (
        <div
          role="status"
          className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded bg-black/75 px-4 py-2 text-sm text-white"
        >
          Unable to load events.
        </div>
      )}

      {globalError && (
        <div
          role="status"
          className="pointer-events-none absolute left-1/2 top-16 z-[1000] -translate-x-1/2 rounded bg-black/75 px-4 py-2 text-sm text-white"
        >
          {globalError}
        </div>
      )}

      {selectedGroup && (
        <EventPreviewModal
          events={selectedGroup.events}
          currentIndex={selectedEventIndex}
          onClose={handleClosePreview}
          onPrevious={handlePreviousPreviewEvent}
          onNext={handleNextPreviewEvent}
        />
      )}

    </section>
  );
}