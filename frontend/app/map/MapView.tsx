"use client";

import { useSession } from "next-auth/react";
import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { PlaceSearchResult } from "./api";
import {
  createMarkerIconWithCount,
  DRAFT_MARKER_ICON,
  MARKER_ICON,
  PIN_GROUP_DISTANCE_METERS,
} from "./mapViewConstants";
import { EventDraftForm } from "./EventDraftForm";
import { EventPreviewModal } from "./EventPreviewModal";
import { EventSearchFilterPanel } from "./EventSearchFilterPanel";
import { PlaceSearchPanel } from "./PlaceSearchPanel";
import { groupEventsByDistance } from "./mapViewHelpers";
import { MapClickHandler, RecenterMap } from "./MapLeafletHelpers";
import { useDraftPinState } from "./useDraftPinState";
import { useMapBootstrapData } from "./useMapBootstrapData";
import { useMapPreviewNavigation } from "./useMapPreviewNavigation";

type MapViewProps = {
  initialError?: string | null;
};

export default function MapView({ initialError = null }: MapViewProps) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ? String(session.user.id) : null;
  const {
    centerState,
    setCenterState,
    events,
    setEvents,
    eventsError,
    labelOptions,
    visitCompanyOptions,
    globalError,
  } = useMapBootstrapData({ status, userId, initialError });
  const groupedEvents = groupEventsByDistance(events, PIN_GROUP_DISTANCE_METERS);
  const {
    selectedEventIndex,
    selectedGroup,
    clearSelection,
    openGroup,
    showNextEvent,
    showPreviousEvent,
  } = useMapPreviewNavigation(groupedEvents);
  const {
    draftPosition,
    draftAddress,
    isResolvingAddress,
    saveError,
    isSaving,
    openDraftFromMapClick,
    openDraftFromPlace,
    resetDraftState,
    saveDraftEvent,
  } = useDraftPinState({
    userId,
    onDraftOpened: clearSelection,
    onEventSaved: (newEvent) => {
      setEvents((previousEvents) => [newEvent, ...previousEvents]);
    },
  });

  function handlePlaceSelect(place: PlaceSearchResult) {
    openDraftFromPlace(place);
    setCenterState((previous) => ({
      center: [place.lat, place.lng],
      zoom: previous.zoom,
    }));
  }

  return (
    <section className="relative h-[calc(100vh-57px)] w-full" aria-label="map-view">
      <PlaceSearchPanel centerState={centerState} onPlaceSelect={handlePlaceSelect} />
      <EventSearchFilterPanel
        userId={userId}
        labelOptions={labelOptions}
        visitCompanyOptions={visitCompanyOptions}
        onResultsLoaded={(nextEvents) => {
          clearSelection();
          setEvents(nextEvents);
        }}
        onResultClick={(event) => {
          setCenterState((previous) => ({
            center: [event.lat, event.lng],
            zoom: previous.zoom,
          }));

          const groupIndex = groupedEvents.findIndex((group) => group.events.some((groupEvent) => groupEvent.id === event.id));
          if (groupIndex >= 0) {
            openGroup(groupIndex);
          }
        }}
      />

      <MapContainer center={centerState.center} zoom={centerState.zoom} className="h-full w-full" scrollWheelZoom zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        <RecenterMap center={centerState.center} zoom={centerState.zoom} />
        <MapClickHandler onClick={openDraftFromMapClick} />
        <MarkerClusterGroup>
          {groupedEvents.map((group, groupIndex) => (
            <Marker
              key={group.id}
              position={[group.lat, group.lng]}
              icon={group.events.length > 1 ? createMarkerIconWithCount(group.events.length) : MARKER_ICON}
              eventHandlers={{
                click: () => openGroup(groupIndex),
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
        onSave={saveDraftEvent}
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
          onClose={clearSelection}
          onPrevious={showPreviousEvent}
          onNext={showNextEvent}
        />
      )}

    </section>
  );
}