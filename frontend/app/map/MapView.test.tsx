import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MapView from "./MapView";
import { useSession } from "next-auth/react";
import {
  createEvent,
  fetchAllowedLabels,
  fetchAllowedVisitCompanies,
  fetchLastMapPosition,
  fetchUserEvents,
  uploadEventPhotos,
} from "./api";
import type { ReactNode } from "react";

const mockSetView = vi.fn();
let clickHandlers: { click?: (event: { latlng: { lat: number; lng: number } }) => void } = {};

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("./api", () => ({
  fetchAllowedLabels: vi.fn(),
  fetchAllowedVisitCompanies: vi.fn(),
  fetchLastMapPosition: vi.fn(),
  fetchUserEvents: vi.fn(),
  createEvent: vi.fn(),
  uploadEventPhotos: vi.fn(),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }: { position: [number, number] }) => <div data-testid="marker">{position.join(",")}</div>,
  useMap: () => ({ setView: mockSetView }),
  useMapEvents: (handlers: { click?: (event: { latlng: { lat: number; lng: number } }) => void }) => {
    clickHandlers = handlers;
  },
}));

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clickHandlers = {};
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
    vi.mocked(fetchLastMapPosition).mockResolvedValue(null);
    vi.mocked(fetchUserEvents).mockResolvedValue([]);
    vi.mocked(fetchAllowedLabels).mockResolvedValue([]);
    vi.mocked(fetchAllowedVisitCompanies).mockResolvedValue([]);
    vi.mocked(uploadEventPhotos).mockResolvedValue([]);
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

  it("opens draft form when map is clicked and validates required fields", async () => {
    render(<MapView />);

    await waitFor(() => {
      expect(fetchUserEvents).toHaveBeenCalledWith("1");
    });

    act(() => {
      clickHandlers.click?.({ latlng: { lat: 49.84, lng: 24.03 } });
    });

    expect(await screen.findByText("Create event")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(await screen.findByText("Date or date range is required.")).toBeInTheDocument();
  });

  it("creates an event and uploads photos", async () => {
    vi.mocked(createEvent).mockResolvedValue({
      id: 10,
      user_id: 1,
      title: "City Walk",
      name: "City Walk",
      startDate: "2026-03-04",
      endDate: null,
      description: "",
      rating: 7,
      labels: ["Trip"],
      visitCompany: "Friends",
      lat: 50.45,
      lng: 30.52,
      created_at: "2026-03-04T10:00:00.000Z",
      photos: [],
    });

    vi.mocked(uploadEventPhotos).mockResolvedValue([
      {
        id: 1,
        path: "user-1/event-10/test.jpg",
        url: "/uploads/user-1/event-10/test.jpg",
        createdAt: "2026-03-04T10:00:00.000Z",
      },
    ]);

    render(<MapView />);

    act(() => {
      clickHandlers.click?.({ latlng: { lat: 50.45, lng: 30.52 } });
    });

    fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "City Walk" } });
    fireEvent.change(screen.getByLabelText("Date *"), { target: { value: "2026-03-04" } });
    fireEvent.change(screen.getByLabelText("Photos"), {
      target: {
        files: [new File(["abc"], "test.jpg", { type: "image/jpeg" })],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "1",
          name: "City Walk",
          lat: 50.45,
          lng: 30.52,
        }),
      );
      expect(uploadEventPhotos).toHaveBeenCalledWith("1", 10, expect.any(Array));
    });
  });
});