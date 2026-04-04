import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MapView from "./MapView";
import { useSession } from "next-auth/react";
import {
  createEvent,
  fetchAllowedLabels,
  fetchAllowedVisitCompanies,
  fetchLastMapPosition,
  fetchUserEvents,
  searchPlaces,
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
  searchPlaces: vi.fn(),
  createEvent: vi.fn(),
  uploadEventPhotos: vi.fn(),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  ZoomControl: () => <div data-testid="zoom-control" />,
  Marker: ({
    position,
    eventHandlers,
  }: {
    position: [number, number];
    eventHandlers?: { click?: () => void };
  }) => (
    <button type="button" data-testid="marker" onClick={() => eventHandlers?.click?.()}>
      {position.join(",")}
    </button>
  ),
  useMap: () => ({ setView: mockSetView }),
  useMapEvents: (handlers: { click?: (event: { latlng: { lat: number; lng: number } }) => void }) => {
    clickHandlers = handlers;
  },
}));

vi.mock("react-leaflet-cluster", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="marker-cluster">{children}</div>,
}));

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clickHandlers = {};
    vi.mocked(useSession).mockReturnValue({
      status: "authenticated",
      data: {
        accessToken: "token-1",
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
    vi.mocked(searchPlaces).mockResolvedValue([]);
  });

  it("prefers lastMapPosition over world defaults", async () => {
    vi.mocked(fetchLastMapPosition).mockResolvedValue({ lat: 51.5, lng: -0.09, zoom: 12 });
    vi.mocked(fetchUserEvents).mockResolvedValue([]);

    render(<MapView />);

    await waitFor(() => {
      expect(fetchLastMapPosition).toHaveBeenCalledWith("token-1");
      expect(fetchUserEvents).toHaveBeenCalledWith("token-1");
      expect(mockSetView).toHaveBeenCalledWith([51.5, -0.09], 12);
    });
  });

  it("shows offline/error overlay when events cannot load", async () => {
    vi.mocked(fetchLastMapPosition).mockResolvedValue(null);
    vi.mocked(fetchUserEvents).mockRejectedValue(new Error("Network error"));

    render(<MapView />);

    expect(await screen.findByText("Unable to load events.")).toBeInTheDocument();
  });

  it("opens preview modal when pin is clicked", async () => {
    vi.mocked(fetchUserEvents).mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000020",
        user_id: 1,
        title: "River Walk",
        name: "River Walk",
        startDate: "2026-03-03",
        endDate: null,
        description: "",
        rating: 6,
        labels: [],
        visitCompany: "",
        lat: 50.45,
        lng: 30.52,
        created_at: "2026-03-03T10:00:00.000Z",
        photos: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            path: "p.jpg",
            url: "/uploads/user-1/event-20/p.jpg",
            createdAt: "2026-03-03T10:00:00.000Z",
          },
        ],
      },
    ]);

    render(<MapView />);

    const marker = await screen.findByTestId("marker");
    fireEvent.click(marker);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("River Walk")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View full →" })).toBeInTheDocument();
  });

  it("groups events within 20m into one marker", async () => {
    vi.mocked(fetchUserEvents).mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000030",
        user_id: 1,
        title: "Near One",
        name: "Near One",
        startDate: "2026-03-01",
        endDate: null,
        description: "",
        rating: 5,
        labels: [],
        visitCompany: "",
        lat: 50.45,
        lng: 30.52,
        created_at: "2026-03-01T10:00:00.000Z",
        photos: [],
      },
      {
        id: "00000000-0000-4000-8000-000000000031",
        user_id: 1,
        title: "Near Two",
        name: "Near Two",
        startDate: "2026-03-02",
        endDate: null,
        description: "",
        rating: 5,
        labels: [],
        visitCompany: "",
        lat: 50.4501,
        lng: 30.52,
        created_at: "2026-03-02T10:00:00.000Z",
        photos: [],
      },
      {
        id: "00000000-0000-4000-8000-000000000032",
        user_id: 1,
        title: "Far Away",
        name: "Far Away",
        startDate: "2026-03-03",
        endDate: null,
        description: "",
        rating: 5,
        labels: [],
        visitCompany: "",
        lat: 50.46,
        lng: 30.52,
        created_at: "2026-03-03T10:00:00.000Z",
        photos: [],
      },
    ]);

    render(<MapView />);

    await waitFor(() => {
      expect(screen.getByTestId("marker-cluster")).toBeInTheDocument();
      expect(screen.getAllByTestId("marker")).toHaveLength(2);
    });
  });

  it("shows carousel controls and cycles grouped events deterministically", async () => {
    vi.mocked(fetchUserEvents).mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000040",
        user_id: 1,
        title: "First Grouped",
        name: "First Grouped",
        startDate: "2026-03-01",
        endDate: null,
        description: "",
        rating: 7,
        labels: [],
        visitCompany: "",
        lat: 50.45,
        lng: 30.52,
        created_at: "2026-03-05T10:00:00.000Z",
        photos: [
          {
            id: "00000000-0000-4000-8000-000000000101",
            path: "a.jpg",
            url: "/uploads/user-1/event-40/a.jpg",
            createdAt: "2026-03-05T10:00:00.000Z",
          },
        ],
      },
      {
        id: "00000000-0000-4000-8000-000000000041",
        user_id: 1,
        title: "Second Grouped",
        name: "Second Grouped",
        startDate: "2026-03-02",
        endDate: null,
        description: "",
        rating: 8,
        labels: [],
        visitCompany: "",
        lat: 50.4501,
        lng: 30.52,
        created_at: "2026-03-04T10:00:00.000Z",
        photos: [
          {
            id: "00000000-0000-4000-8000-000000000102",
            path: "b.jpg",
            url: "/uploads/user-1/event-41/b.jpg",
            createdAt: "2026-03-04T10:00:00.000Z",
          },
        ],
      },
    ]);

    render(<MapView />);

    const marker = await screen.findByTestId("marker");
    fireEvent.click(marker);

    expect(await screen.findByText("First Grouped")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous event" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next event" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next event" }));
    expect(await screen.findByText("Second Grouped")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous event" }));
    expect(await screen.findByText("First Grouped")).toBeInTheDocument();
  });

  it("renders date range, 10-star rating and preview photo", async () => {
    vi.mocked(fetchUserEvents).mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000050",
        user_id: 1,
        title: "Gallery Day",
        name: "Gallery Day",
        startDate: "2026-03-01",
        endDate: "2026-03-03",
        description: "",
        rating: 7,
        labels: [],
        visitCompany: "",
        lat: 50.45,
        lng: 30.52,
        created_at: "2026-03-03T10:00:00.000Z",
        photos: [
          {
            id: "00000000-0000-4000-8000-000000000005",
            path: "c.jpg",
            url: "/uploads/user-1/event-50/c.jpg",
            createdAt: "2026-03-03T10:00:00.000Z",
          },
        ],
      },
    ]);

    render(<MapView />);

    const marker = await screen.findByTestId("marker");
    fireEvent.click(marker);

    expect(await screen.findByText("01/03/2026 – 03/03/2026")).toBeInTheDocument();
    expect(screen.getByLabelText("Event rating")).toHaveTextContent("★★★★★★★☆☆☆");

    const image = screen.getByAltText("Gallery Day preview") as HTMLImageElement;
    expect(image.src).toContain("/uploads/user-1/event-50/c.jpg");
  });

  it("does not render rating stars when event has no rating", async () => {
    vi.mocked(fetchUserEvents).mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000051",
        user_id: 1,
        title: "No Rating Event",
        name: "No Rating Event",
        startDate: "2026-03-06",
        endDate: null,
        description: "",
        rating: null,
        labels: [],
        visitCompany: "",
        lat: 50.451,
        lng: 30.521,
        created_at: "2026-03-06T10:00:00.000Z",
        photos: [
          {
            id: "00000000-0000-4000-8000-000000000006",
            path: "d.jpg",
            url: "/uploads/user-1/event-51/d.jpg",
            createdAt: "2026-03-06T10:00:00.000Z",
          },
        ],
      },
    ]);

    render(<MapView />);

    const marker = await screen.findByTestId("marker");
    fireEvent.click(marker);

    expect(await screen.findByText("No Rating Event")).toBeInTheDocument();
    expect(screen.queryByLabelText("Event rating")).not.toBeInTheDocument();
  });

  it("opens draft form when map is clicked and validates required fields", async () => {
    render(<MapView />);

    await waitFor(() => {
      expect(fetchUserEvents).toHaveBeenCalledWith("token-1");
    });

    act(() => {
      clickHandlers.click?.({ latlng: { lat: 49.84, lng: 24.03 } });
    });

    expect(await screen.findByText("New Event")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Event" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
  });

  it("creates an event and uploads photos", async () => {
    const file = new File(["abc"], "test.jpg", { type: "image/jpeg" });

    vi.mocked(createEvent).mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000010",
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
        id: "00000000-0000-4000-8000-000000000011",
        path: "test.jpg",
        url: "/uploads/user-1/event-10/test.jpg",
        createdAt: "2026-03-04T10:01:00.000Z",
      },
    ]);

    render(<MapView />);

    act(() => {
      clickHandlers.click?.({ latlng: { lat: 50.45, lng: 30.52 } });
    });

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "City Walk" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-03-04" } });
    fireEvent.change(screen.getByLabelText("Attachments (photos and videos)"), {
      target: {
        files: [file],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Event" }));

    await waitFor(() => {
      expect(createEvent).toHaveBeenCalledWith(
        "token-1",
        expect.objectContaining({
          name: "City Walk",
          lat: 50.45,
          lng: 30.52,
        }),
      );
      expect(createEvent).toHaveBeenCalledWith("token-1", expect.not.objectContaining({ photos: expect.anything() }));
      expect(uploadEventPhotos).toHaveBeenCalledWith(
        "token-1",
        "00000000-0000-4000-8000-000000000010",
        [file],
        expect.any(Function),
      );
    });
  });

  it("searches a place, recenters, and keeps typed form values", async () => {
    vi.mocked(searchPlaces).mockResolvedValue([
      {
        displayName: "Eiffel Tower, Paris, France",
        lat: 48.8584,
        lng: 2.2945,
      },
    ]);

    render(<MapView />);

    act(() => {
      clickHandlers.click?.({ latlng: { lat: 50.45, lng: 30.52 } });
    });

    const nameInput = (await screen.findByLabelText("Name")) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Draft title" } });

    fireEvent.change(screen.getByLabelText("Search place in event form"), { target: { value: "Eiffel Tower" } });
    const placeSearchForm = screen.getByLabelText("Search place in event form").closest("form");
    expect(placeSearchForm).not.toBeNull();
    fireEvent.click(within(placeSearchForm as HTMLFormElement).getByRole("button", { name: "Go" }));

    const placeButton = await screen.findByRole("button", { name: "Eiffel Tower, Paris, France" });
    fireEvent.click(placeButton);

    await waitFor(() => {
      expect(searchPlaces).toHaveBeenCalledWith("Eiffel Tower");
      expect(mockSetView).toHaveBeenCalledWith([48.8584, 2.2945], expect.any(Number));
    });

    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Draft title");
    expect(screen.getByText("48.8584,2.2945")).toBeInTheDocument();
  });

  it("runs combined event filters only after Search click", async () => {
    vi.mocked(fetchAllowedLabels).mockResolvedValue(["Cafe", "Trip"]);
    vi.mocked(fetchAllowedVisitCompanies).mockResolvedValue(["Solo", "Friends"]);
    vi.mocked(fetchUserEvents)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "00000000-0000-4000-8000-000000000060",
          user_id: 1,
          title: "Cafe Morning",
          name: "Cafe Morning",
          startDate: "2026-03-07",
          endDate: "2026-03-08",
          description: "With friends",
          rating: 8,
          labels: ["Cafe", "Trip"],
          visitCompany: "Friends",
          lat: 50.4,
          lng: 30.5,
          created_at: "2026-03-07T10:00:00.000Z",
          photos: [],
        },
      ]);

    render(<MapView />);

    await waitFor(() => {
      expect(fetchUserEvents).toHaveBeenCalledTimes(1);
      expect(fetchUserEvents).toHaveBeenCalledWith("token-1");
    });

    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "Cafe" } });
    fireEvent.change(screen.getByLabelText("Date from"), { target: { value: "2026-03-01" } });
    fireEvent.change(screen.getByLabelText("Date to"), { target: { value: "2026-03-10" } });
    fireEvent.change(screen.getByLabelText("Visit company"), { target: { value: "Friends" } });

    fireEvent.click(screen.getByRole("button", { name: "Cafe" }));
    fireEvent.click(screen.getByRole("button", { name: "Trip" }));

    expect(fetchUserEvents).toHaveBeenCalledTimes(1);

    const eventSearchPanel = screen.getByText("Search Events").closest("section");
    expect(eventSearchPanel).not.toBeNull();
    fireEvent.click(within(eventSearchPanel as HTMLElement).getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(fetchUserEvents).toHaveBeenCalledTimes(2);
      expect(fetchUserEvents).toHaveBeenLastCalledWith("token-1", {
        search: "Cafe",
        dateFrom: "2026-03-01",
        dateTo: "2026-03-10",
        labels: ["Cafe", "Trip"],
        visitCompany: "Friends",
      });
      expect(screen.getAllByTestId("marker")).toHaveLength(1);
    });

    const eventResultsList = screen.getByLabelText("Event search results");
    expect(eventResultsList).toBeInTheDocument();
    expect(within(eventResultsList).getByText("Cafe Morning")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open event Cafe Morning" }));

    const previewDialog = await screen.findByRole("dialog");
    expect(previewDialog).toBeInTheDocument();
    expect(within(previewDialog).getByText("Cafe Morning")).toBeInTheDocument();
  });
});
