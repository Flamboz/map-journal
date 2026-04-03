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
  onMapClick: (coords: DraftCoordinates) => void;
  onOpenGroup: (groupIndex: number) => void;
};

export function MapCanvas({
  centerState,
  groupedEvents,
  draftPosition,
  eventsVersion,
  eventsError = false,
  globalError = null,
  showStatusOverlays = true,
  onMapClick,
  onOpenGroup,
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
