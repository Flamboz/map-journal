import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  fetchAllowedLabels,
  fetchAllowedVisitCompanies,
  fetchLastMapPosition,
  fetchUserEvents,
  type MapEvent,
} from "./api";
import { WORLD_CENTER, WORLD_ZOOM } from "./mapViewConstants";
import type { CenterState } from "./mapViewTypes";

type UseMapBootstrapDataArgs = {
  status: "loading" | "authenticated" | "unauthenticated";
  userId: string | null;
  initialError: string | null;
};

type UseMapBootstrapDataResult = {
  centerState: CenterState;
  setCenterState: Dispatch<SetStateAction<CenterState>>;
  events: MapEvent[];
  setEvents: Dispatch<SetStateAction<MapEvent[]>>;
  eventsError: boolean;
  labelOptions: string[];
  visitCompanyOptions: string[];
  globalError: string | null;
};

export function useMapBootstrapData({
  status,
  userId,
  initialError,
}: UseMapBootstrapDataArgs): UseMapBootstrapDataResult {
  const [centerState, setCenterState] = useState<CenterState>({ center: WORLD_CENTER, zoom: WORLD_ZOOM });
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [eventsError, setEventsError] = useState(false);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [visitCompanyOptions, setVisitCompanyOptions] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(initialError);

  useEffect(() => {
    setGlobalError(initialError);
  }, [initialError]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      return;
    }

    const authenticatedUserId = userId;

    let isActive = true;

    async function loadMapData() {
      const [positionResult, eventsResult] = await Promise.allSettled([
        fetchLastMapPosition(authenticatedUserId),
        fetchUserEvents(authenticatedUserId),
      ]);

      if (!isActive) {
        return;
      }

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

    void loadMapData();

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

  return {
    centerState,
    setCenterState,
    events,
    setEvents,
    eventsError,
    labelOptions,
    visitCompanyOptions,
    globalError,
  };
}