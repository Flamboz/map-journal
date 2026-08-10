"use client";

import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  createMarkerIconWithCount,
  DRAFT_MARKER_ICON,
  MARKER_ICON,
} from "./mapViewConstants";
import { MapClickHandler, RecenterMap } from "./MapLeafletHelpers";
import type { MapEventGroup } from "./mapViewHelpers";
import type { CenterState } from "./mapViewTypes";

type DraftCoordinates = {
  lat: number;
  lng: number;
};

type MapCanvasProps = {
  centerState: CenterState;
  groupedEvents: MapEventGroup[];
  draftPosition: DraftCoordinates | null;
  eventsVersion: number;
  eventsError?: boolean;
  globalError?: string | null;
  showStatusOverlays?: boolean;
  isFullscreen: boolean;
  onMapClick: (coords: DraftCoordinates) => void;
  onOpenGroup: (groupIndex: number) => void;
  onToggleFullscreen: () => void;
};

export function MapCanvas({
  centerState,
  groupedEvents,
  draftPosition,
  eventsVersion,
  eventsError = false,
  globalError = null,
  showStatusOverlays = true,
  isFullscreen,
  onMapClick,
  onOpenGroup,
  onToggleFullscreen,
}: MapCanvasProps) {
  return (
    <>
      <MapContainer center={centerState.center} zoom={centerState.zoom} className="h-full w-full" scrollWheelZoom zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        <RecenterMap center={centerState.center} zoom={centerState.zoom} />
        <MapClickHandler onClick={onMapClick} />
        <MarkerClusterGroup key={eventsVersion}>
          {groupedEvents.map((group, groupIndex) => (
            <Marker
              key={group.id}
              position={[group.lat, group.lng]}
              icon={group.events.length > 1 ? createMarkerIconWithCount(group.events.length) : MARKER_ICON}
              eventHandlers={{
                click: () => onOpenGroup(groupIndex),
              }}
            />
          ))}
        </MarkerClusterGroup>
        {draftPosition && <Marker position={[draftPosition.lat, draftPosition.lng]} icon={DRAFT_MARKER_ICON} />}
      </MapContainer>

      <button
        type="button"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        onClick={onToggleFullscreen}
        className="absolute bottom-8 right-3 z-[1000] inline-flex h-8 w-8 items-center justify-center rounded bg-white/90 text-gray-700 shadow hover:bg-white"
      >
        {isFullscreen ? (
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        ) : (
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8V5a2 2 0 0 1 2-2h3" />
            <path d="M16 3h3a2 2 0 0 1 2 2v3" />
            <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
            <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
          </svg>
        )}
      </button>

      {showStatusOverlays && eventsError && (
        <div
          role="status"
          className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded bg-black/75 px-4 py-2 text-sm text-white"
        >
          Unable to load events.
        </div>
      )}

      {showStatusOverlays && globalError && (
        <div
          role="status"
          className="pointer-events-none absolute left-1/2 top-16 z-[1000] -translate-x-1/2 rounded bg-black/75 px-4 py-2 text-sm text-white"
        >
          {globalError}
        </div>
      )}
    </>
  );
}
