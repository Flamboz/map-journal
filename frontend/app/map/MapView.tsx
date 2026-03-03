"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { fetchLastMapPosition, fetchUserEvents, type MapEvent } from "./api";

const WORLD_CENTER: LatLngExpression = [20, 0];
const WORLD_ZOOM = 2;

type CenterState = {
  center: LatLngExpression;
  zoom: number;
};

function RecenterMap({ center, zoom }: CenterState) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

export default function MapView() {
  const { data: session, status } = useSession();
  const [centerState, setCenterState] = useState<CenterState>({ center: WORLD_CENTER, zoom: WORLD_ZOOM });
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [eventsError, setEventsError] = useState(false);

  const userId = session?.user?.id ? String(session.user.id) : null;

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

  return (
    <section className="relative h-[calc(100vh-57px)] w-full" aria-label="map-view">
      <MapContainer center={centerState.center} zoom={centerState.zoom} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={centerState.center} zoom={centerState.zoom} />
        {events.map((event) => (
          <Marker key={event.id} position={[event.lat, event.lng]} />
        ))}
      </MapContainer>

      {eventsError && (
        <div
          role="status"
          className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded bg-black/75 px-4 py-2 text-sm text-white"
        >
          Unable to load events.
        </div>
      )}
    </section>
  );
}