import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WORLD_CENTER, WORLD_ZOOM } from "./mapViewConstants";
import { useMapBootstrapData } from "./useMapBootstrapData";
import {
  fetchAllowedLabels,
  fetchAllowedVisitCompanies,
  fetchLastMapPosition,
  fetchUserEvents,
} from "./api";

vi.mock("./api", () => ({
  fetchAllowedLabels: vi.fn(),
  fetchAllowedVisitCompanies: vi.fn(),
  fetchLastMapPosition: vi.fn(),
  fetchUserEvents: vi.fn(),
}));

describe("useMapBootstrapData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAllowedLabels).mockResolvedValue(["Trip", "Food"]);
    vi.mocked(fetchAllowedVisitCompanies).mockResolvedValue(["Family"]);
    vi.mocked(fetchLastMapPosition).mockResolvedValue({ lat: 51.5, lng: -0.09, zoom: 12 });
    vi.mocked(fetchUserEvents).mockResolvedValue([]);
  });

  it("loads position, events, and metadata for authenticated user", async () => {
    const { result } = renderHook(() =>
      useMapBootstrapData({ status: "authenticated", authToken: "token-1", initialError: null }),
    );

    await waitFor(() => {
      expect(fetchLastMapPosition).toHaveBeenCalledWith("token-1");
      expect(fetchUserEvents).toHaveBeenCalledWith("token-1");
      expect(result.current.centerState).toEqual({ center: [51.5, -0.09], zoom: 12 });
      expect(result.current.events).toEqual([]);
      expect(result.current.eventsError).toBe(false);
      expect(result.current.labelOptions).toEqual(["Trip", "Food"]);
      expect(result.current.visitCompanyOptions).toEqual(["Family"]);
    });
  });

  it("falls back to world defaults and marks event load failure", async () => {
    vi.mocked(fetchLastMapPosition).mockRejectedValue(new Error("nope"));
    vi.mocked(fetchUserEvents).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() =>
      useMapBootstrapData({ status: "authenticated", authToken: "token-1", initialError: null }),
    );

    await waitFor(() => {
      expect(result.current.centerState).toEqual({ center: WORLD_CENTER, zoom: WORLD_ZOOM });
      expect(result.current.events).toEqual([]);
      expect(result.current.eventsError).toBe(true);
    });
  });

  it("does not call user-scoped loaders when unauthenticated", async () => {
    renderHook(() => useMapBootstrapData({ status: "unauthenticated", authToken: null, initialError: "x" }));

    await waitFor(() => {
      expect(fetchAllowedLabels).toHaveBeenCalledTimes(1);
      expect(fetchAllowedVisitCompanies).toHaveBeenCalledTimes(1);
    });

    expect(fetchLastMapPosition).not.toHaveBeenCalled();
    expect(fetchUserEvents).not.toHaveBeenCalled();
  });
});
