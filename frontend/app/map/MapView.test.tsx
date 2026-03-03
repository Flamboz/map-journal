import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MapView from "./MapView";
import { useSession } from "next-auth/react";
import { fetchLastMapPosition, fetchUserEvents } from "./api";
import type { ReactNode } from "react";

const mockSetView = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("./api", () => ({
  fetchLastMapPosition: vi.fn(),
  fetchUserEvents: vi.fn(),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }: { position: [number, number] }) => <div data-testid="marker">{position.join(",")}</div>,
  useMap: () => ({ setView: mockSetView }),
}));

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue({
      status: "authenticated",
      data: {
        user: {
          id: "1",
          email: "test@example.com",
        },
        expires: "2099-01-01T00:00:00.000Z",
      },
      update: vi.fn(),
    } as ReturnType<typeof useSession>);
  });

  it("prefers lastMapPosition over world defaults", async () => {
    vi.mocked(fetchLastMapPosition).mockResolvedValue({ lat: 51.5, lng: -0.09, zoom: 12 });
    vi.mocked(fetchUserEvents).mockResolvedValue([]);

    render(<MapView />);

    await waitFor(() => {
      expect(fetchLastMapPosition).toHaveBeenCalledWith("1");
      expect(fetchUserEvents).toHaveBeenCalledWith("1");
      expect(mockSetView).toHaveBeenCalledWith([51.5, -0.09], 12);
    });
  });

  it("shows offline/error overlay when events cannot load", async () => {
    vi.mocked(fetchLastMapPosition).mockResolvedValue(null);
    vi.mocked(fetchUserEvents).mockRejectedValue(new Error("Network error"));

    render(<MapView />);

    expect(await screen.findByText("Unable to load events.")).toBeInTheDocument();
  });
});