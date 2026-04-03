"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { MapEvent, PlaceSearchResult } from "./api";
import { EventPreviewModal } from "./EventPreviewModal";
import { MapAuthProvider } from "./MapAuthContext";
import { MapCanvas } from "./MapCanvas";
import { PIN_GROUP_DISTANCE_METERS } from "./mapViewConstants";
import { groupEventsByDistance } from "./mapViewHelpers";
import { MapViewDesktopLayout } from "./MapViewDesktopLayout";
import { MapViewMobileLayout } from "./MapViewMobileLayout";
import { useDraftPinState } from "./useDraftPinState";
import { useMapBootstrapData } from "./useMapBootstrapData";
import { useMapPreviewNavigation } from "./useMapPreviewNavigation";

type MapViewProps = {
  initialError?: string | null;
};

export default function MapView({ initialError = null }: MapViewProps) {
  const { data: session, status } = useSession();
  const authToken = session?.accessToken ?? null;
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileDraftOpen, setIsMobileDraftOpen] = useState(false);
  const currentUserEmail = session?.user?.email ?? null;
  const {
    centerState,
    setCenterState,
    events,
    setEvents,
    eventsError,
    labelOptions,
    visitCompanyOptions,
    globalError,
  } = useMapBootstrapData({ status, authToken, initialError });

  useEffect(() => {
    if (!globalError) {
      return;
    }

    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("error")) {
        url.searchParams.delete("error");
        window.history.replaceState(null, "", url.toString());
      }
    } catch {}
  }, [globalError]);

  const [eventsVersion, setEventsVersion] = useState(0);
  const groupedEvents = useMemo(() => groupEventsByDistance(events, PIN_GROUP_DISTANCE_METERS), [events]);
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
    authToken,
    onDraftOpened: clearSelection,
    onEventSaved: (newEvent) => {
      setEvents((previousEvents) => [newEvent, ...previousEvents]);
    },
  });

  function focusEventResult(event: MapEvent) {
    setCenterState((previous) => ({
      center: [event.lat, event.lng],
      zoom: previous.zoom,
    }));

    const groupIndex = groupedEvents.findIndex((group) => group.events.some((groupEvent) => groupEvent.id === event.id));
    if (groupIndex >= 0) {
      openGroup(groupIndex);
    }
  }

  function handleDesktopResultsLoaded(nextEvents: MapEvent[]) {
    clearSelection();
    setEvents(nextEvents);
  }

  function handleDesktopResultClick(event: MapEvent) {
    focusEventResult(event);
  }

  function handleMobileResultsLoaded(nextEvents: MapEvent[]) {
    clearSelection();
    setEvents(nextEvents);
    setIsLeftSidebarOpen(false);
  }

  function handleMobileResultClick(event: MapEvent) {
    focusEventResult(event);
    setIsLeftSidebarOpen(false);
  }

  function handlePlaceSelect(place: PlaceSearchResult) {
    openDraftFromPlace(place);
    setIsLeftSidebarOpen(false);
    setIsMobileDraftOpen(true);
    setCenterState((previous) => ({
      center: [place.lat, place.lng],
      zoom: previous.zoom,
    }));
  }

  function handleMapClickDraft(coords: { lat: number; lng: number }) {
    openDraftFromMapClick(coords);
    setIsMobileDraftOpen(true);
  }

  function handleCloseDraftForm() {
    setIsMobileDraftOpen(false);
  }

  function handleCancelDraft() {
    resetDraftState();
    setIsMobileDraftOpen(false);
  }

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLeftSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    function updateViewport() {
      setIsMobileViewport(window.innerWidth < 640);
    }

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const desktopMapCanvas = (
    <MapCanvas
      centerState={centerState}
      groupedEvents={groupedEvents}
      draftPosition={draftPosition}
      eventsVersion={eventsVersion}
      eventsError={eventsError}
      globalError={globalError}
      onMapClick={handleMapClickDraft}
      onOpenGroup={openGroup}
    />
  );

  const mobileMapCanvas = (
    <MapCanvas
      centerState={centerState}
      groupedEvents={groupedEvents}
      draftPosition={draftPosition}
      eventsVersion={eventsVersion}
      showStatusOverlays={false}
      onMapClick={handleMapClickDraft}
      onOpenGroup={openGroup}
    />
  );

  return (
    <MapAuthProvider authToken={authToken} currentUserEmail={currentUserEmail}>
      <section className="relative h-[calc(100vh-var(--topbar-height))] w-full overflow-hidden" aria-label="map-view">
        {isMobileViewport ? (
          <MapViewMobileLayout
            mapCanvas={mobileMapCanvas}
            isLeftSidebarOpen={isLeftSidebarOpen}
            isMobileDraftOpen={isMobileDraftOpen}
            draftPosition={draftPosition}
            draftAddress={draftAddress}
            isResolvingAddress={isResolvingAddress}
            saveError={saveError}
            isSaving={isSaving}
            labelOptions={labelOptions}
            visitCompanyOptions={visitCompanyOptions}
            onCloseDraft={handleCloseDraftForm}
            onCloseSidebar={() => setIsLeftSidebarOpen(false)}
            onCancelDraft={handleCancelDraft}
            onOpenDraft={() => setIsMobileDraftOpen(true)}
            onOpenSidebar={() => setIsLeftSidebarOpen(true)}
            onPlaceSelect={handlePlaceSelect}
            onResultClick={handleMobileResultClick}
            onResultsLoaded={handleMobileResultsLoaded}
            onSaveDraft={saveDraftEvent}
          />
        ) : (
          <MapViewDesktopLayout
            mapCanvas={desktopMapCanvas}
            labelOptions={labelOptions}
            visitCompanyOptions={visitCompanyOptions}
            draftPosition={draftPosition}
            draftAddress={draftAddress}
            isResolvingAddress={isResolvingAddress}
            saveError={saveError}
            isSaving={isSaving}
            onCancelDraft={resetDraftState}
            onPlaceSelect={handlePlaceSelect}
            onResultClick={handleDesktopResultClick}
            onResultsLoaded={handleDesktopResultsLoaded}
            onSaveDraft={saveDraftEvent}
          />
        )}

        {selectedGroup && (
          <EventPreviewModal
            events={selectedGroup.events}
            currentIndex={selectedEventIndex}
            onClose={clearSelection}
            onPrevious={showPreviousEvent}
            onNext={showNextEvent}
            onDelete={(deletedId) => {
              // remove the deleted event from local state so the pin vanishes immediately
              setEvents((previous) => previous.filter((ev) => ev.id !== deletedId));
              // bump version to force MarkerClusterGroup remount
              setEventsVersion((v) => v + 1);
              // clear selection to close the preview
              clearSelection();
            }}
          />
        )}
      </section>
    </MapAuthProvider>
  );
}
