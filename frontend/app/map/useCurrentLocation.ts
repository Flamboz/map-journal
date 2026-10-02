import { useEffect, useState } from "react";

type Coordinates = {
  lat: number;
  lng: number;
};

type UseCurrentLocationArgs = {
  onLocated: (coords: Coordinates) => void;
};

type UseCurrentLocationResult = {
  isLocating: boolean;
  locationError: string | null;
  locate: () => void;
};

const LOCATION_ERROR_TIMEOUT_MS = 4000;

export function useCurrentLocation({ onLocated }: UseCurrentLocationArgs): UseCurrentLocationResult {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationError) {
      return;
    }

    const timeoutId = window.setTimeout(() => setLocationError(null), LOCATION_ERROR_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [locationError]);

  function locate() {
    if (isLocating) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onLocated({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        setIsLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location access was denied."
            : "Unable to determine your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return { isLocating, locationError, locate };
}
