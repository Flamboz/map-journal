import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { CenterState } from "./mapViewTypes";

export function RecenterMap({ center, zoom }: CenterState) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

export function MapClickHandler({ onClick }: { onClick: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(event) {
      onClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}
