"use client";

import { createContext, useContext, type ReactNode } from "react";

type MapAuthContextValue = {
  authToken: string | null;
  currentUserEmail: string | null;
};

const MapAuthContext = createContext<MapAuthContextValue>({
  authToken: null,
  currentUserEmail: null,
});

type MapAuthProviderProps = MapAuthContextValue & {
  children: ReactNode;
};

export function MapAuthProvider({ authToken, currentUserEmail, children }: MapAuthProviderProps) {
  return <MapAuthContext.Provider value={{ authToken, currentUserEmail }}>{children}</MapAuthContext.Provider>;
}

export function useMapAuth() {
  return useContext(MapAuthContext);
}
