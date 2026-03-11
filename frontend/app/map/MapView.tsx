"use client";

import { useEffect, useState } from "react";
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
import { LeftSidebar } from "./LeftSidebar";
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
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileDraftOpen, setIsMobileDraftOpen] = useState(false);
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

  return (
    <section className="relative h-[calc(100vh-var(--topbar-height))] w-full overflow-hidden" aria-label="map-view">
      {isMobileViewport ? (
        <>
          <button
            type="button"
            className="absolute left-3 top-3 z-[1200] rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow"
            onClick={() => setIsLeftSidebarOpen(true)}
          >
            Filters
          </button>

          {draftPosition && !isMobileDraftOpen && (
            <button
              type="button"
              className="absolute right-3 top-3 z-[1200] rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow"
              onClick={() => setIsMobileDraftOpen(true)}
            >
              Draft
            </button>
          )}

          {isLeftSidebarOpen && (
            <div className="absolute inset-0 z-[1190] bg-[#1d2140]/35" onClick={() => setIsLeftSidebarOpen(false)} aria-hidden="true" />
          )}

          <div
            className={`absolute left-0 top-0 z-[1200] h-full w-[90%] max-w-[24rem] transition-transform duration-300 ${
              isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            aria-label="Mobile filters drawer"
          >
            <button
              type="button"
              aria-label="Close filters panel"
              title="Close"
              className="absolute right-3 top-3 z-[1210] inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] text-slate-700 transition hover:bg-[color:var(--paper-muted)]"
              onClick={() => setIsLeftSidebarOpen(false)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <LeftSidebar
              userId={userId}
              labelOptions={labelOptions}
              visitCompanyOptions={visitCompanyOptions}
              onResultsLoaded={(nextEvents) => {
                clearSelection();
                setEvents(nextEvents);
                setIsLeftSidebarOpen(false);
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

                setIsLeftSidebarOpen(false);
              }}
            />
          </div>

          <div className="h-full">
            <MapContainer center={centerState.center} zoom={centerState.zoom} className="h-full w-full" scrollWheelZoom zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomleft" />
              <RecenterMap center={centerState.center} zoom={centerState.zoom} />
              <MapClickHandler onClick={handleMapClickDraft} />
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

            <div
              className={`pointer-events-none absolute inset-y-0 right-0 z-[1300] h-full w-[90%] max-w-[24rem] transition-transform duration-300 ${
                draftPosition && isMobileDraftOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="pointer-events-auto relative h-full overflow-y-auto rounded-l-[var(--radius-lg)] border-l border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] p-4">
                <button
                  type="button"
                  aria-label="Close draft panel"
                  title="Close"
                  className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--paper-surface)] text-slate-700 transition hover:bg-[color:var(--paper-muted)]"
                  onClick={handleCloseDraftForm}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <EventDraftForm
                  draftPosition={draftPosition}
                  isResolvingAddress={isResolvingAddress}
                  draftAddress={draftAddress}
                  saveError={saveError}
                  isSaving={isSaving}
                  labelOptions={labelOptions}
                  visitCompanyOptions={visitCompanyOptions}
                  onCancel={handleCancelDraft}
                  onSave={saveDraftEvent}
                  onPlaceSelect={handlePlaceSelect}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full">
          <LeftSidebar
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

          <div className="h-full flex-1 p-4 lg:p-5">
            <div className="relative h-full overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border-soft)] shadow-[var(--shadow-soft)]">
              <MapContainer center={centerState.center} zoom={centerState.zoom} className="h-full w-full" scrollWheelZoom zoomControl={false}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position="bottomleft" />
                <RecenterMap center={centerState.center} zoom={centerState.zoom} />
                <MapClickHandler onClick={handleMapClickDraft} />
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
            </div>
          </div>

          <div className="h-full w-[23rem] min-w-[23rem] border-l border-[color:var(--border-soft)] bg-[color:var(--paper-muted)] p-4 lg:w-[26rem] lg:min-w-[26rem]">
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
              onPlaceSelect={handlePlaceSelect}
            />
          </div>
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