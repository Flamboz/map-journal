import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventDetailsClient from "./EventDetailsClient";
import { useRouter } from "next/navigation";
import { createApiClientError } from "../../map/apiErrors";
import {
  deleteEvent,
  fetchAllowedLabels,
  fetchAllowedVisitCompanies,
  fetchEventById,
  deleteEventPhoto,
  setEventPreviewPhoto,
  updateEvent,
  uploadEventPhotos,
} from "../../map/api";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: () => ({ get: vi.fn() }),
}));

vi.mock("../../map/api", () => ({
  fetchAllowedLabels: vi.fn(),
  fetchAllowedVisitCompanies: vi.fn(),
  fetchEventById: vi.fn(),
  updateEvent: vi.fn(),
  uploadEventPhotos: vi.fn(),
  deleteEventPhoto: vi.fn(),
  setEventPreviewPhoto: vi.fn(),
  deleteEvent: vi.fn(),
}));

vi.mock("./EventPhotosCarousel", () => ({
  default: ({
    onAddPhotos,
    onSetPreviewPhoto,
  }: {
    onAddPhotos?: (files: File[]) => void | Promise<void>;
    onSetPreviewPhoto?: (photoId: string) => void | Promise<void>;
  }) => (
    <div data-testid="event-photos-carousel">
      <button
        type="button"
        onClick={() => onAddPhotos?.([new File(["demo"], "photo.png", { type: "image/png" })])}
        disabled={!onAddPhotos}
      >
        Mock add photos
      </button>
      <button
        type="button"
        onClick={() => onSetPreviewPhoto?.("550e8400-e29b-41d4-a716-446655440012")}
        disabled={!onSetPreviewPhoto}
      >
        Mock set preview
      </button>
    </div>
  ),
}));

it("stages preview during edit and applies on save", async () => {
  const eventId = "550e8400-e29b-41d4-a716-446655440001";
  const photo1 = {
    id: "550e8400-e29b-41d4-a716-446655440011",
    path: "a.jpg",
    url: `/uploads/user-1/event-${eventId}/a.jpg`,
    createdAt: "2026-03-01T10:00:00.000Z",
  };
  const photo2 = {
    id: "550e8400-e29b-41d4-a716-446655440012",
    path: "b.jpg",
    url: `/uploads/user-1/event-${eventId}/b.jpg`,
    createdAt: "2026-03-01T10:01:00.000Z",
  };

  vi.mocked(fetchEventById).mockResolvedValue({
    id: eventId,
    user_id: 1,
    title: "River Walk",
    name: "River Walk",
    startDate: "2026-03-01",
    endDate: null,
    description: "",
    rating: 7,
    labels: [],
    visitCompany: "",
    lat: 50.45,
    lng: 30.52,
    created_at: "2026-03-01T10:00:00.000Z",
    photos: [photo1, photo2],
    samePinEventIds: [eventId],
  });

  vi.mocked(setEventPreviewPhoto).mockResolvedValue([]);

  const initialEvent = {
    id: eventId,
    user_id: 1,
    title: "River Walk",
    name: "River Walk",
    startDate: "2026-03-01",
    endDate: null,
    description: "",
    rating: 7,
    labels: [],
    visitCompany: "",
    lat: 50.45,
    lng: 30.52,
    created_at: "2026-03-01T10:00:00.000Z",
    photos: [photo1, photo2],
    samePinEventIds: [eventId],
  };

  render(<EventDetailsClient initialEvent={initialEvent} userId="1" />);

  fireEvent.click(screen.getByRole("button", { name: "Edit event" }));

  // Stage preview change
  fireEvent.click(screen.getByRole("button", { name: "Mock set preview" }));

  // should not call API yet
  expect(setEventPreviewPhoto).not.toHaveBeenCalled();

  // Save changes -> should apply staged preview
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => {
    expect(setEventPreviewPhoto).toHaveBeenCalledWith("1", eventId, photo2.id);
  });
});

describe("EventDetailsClient delete flow", () => {
  const eventId = "550e8400-e29b-41d4-a716-446655440001";
  const pushMock = vi.fn();
  const replaceMock = vi.fn();
  const refreshMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      replace: replaceMock,
      refresh: refreshMock,
    } as unknown as ReturnType<typeof useRouter>);

    vi.mocked(fetchAllowedLabels).mockResolvedValue([]);
    vi.mocked(fetchAllowedVisitCompanies).mockResolvedValue([]);
    vi.mocked(fetchEventById).mockResolvedValue({
      id: eventId,
      user_id: 1,
      title: "River Walk",
      name: "River Walk",
      startDate: "2026-03-01",
      endDate: null,
      description: "",
      rating: 7,
      labels: [],
      visitCompany: "",
      lat: 50.45,
      lng: 30.52,
      created_at: "2026-03-01T10:00:00.000Z",
      photos: [],
      samePinEventIds: [eventId],
    });
    vi.mocked(updateEvent).mockResolvedValue({} as Awaited<ReturnType<typeof updateEvent>>);
    vi.mocked(uploadEventPhotos).mockResolvedValue([]);
    vi.mocked(deleteEventPhoto).mockResolvedValue([]);
    vi.mocked(setEventPreviewPhoto).mockResolvedValue([]);
    vi.mocked(deleteEvent).mockResolvedValue(undefined);
  });

  const initialEvent = {
    id: eventId,
    user_id: 1,
    title: "River Walk",
    name: "River Walk",
    startDate: "2026-03-01",
    endDate: null,
    description: "",
    rating: 7,
    labels: [],
    visitCompany: "",
    lat: 50.45,
    lng: 30.52,
    created_at: "2026-03-01T10:00:00.000Z",
    photos: [],
    samePinEventIds: [eventId],
  };

  it("opens delete confirmation modal when user clicks delete", async () => {
    render(<EventDetailsClient initialEvent={initialEvent} userId="1" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete event" }));

    expect(await screen.findByRole("dialog", { name: "Delete event confirmation" })).toBeInTheDocument();
    expect(screen.getByText("Delete event?")).toBeInTheDocument();
    expect(screen.getByText("This will permanently delete the event and all associated photos.")).toBeInTheDocument();
  });

  it("deletes event after confirmation and navigates to map", async () => {
    render(<EventDetailsClient initialEvent={initialEvent} userId="1" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete event" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteEvent).toHaveBeenCalledWith("1", eventId);
      expect(pushMock).toHaveBeenCalledWith("/");
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("redirects to map when save hits EVENT_NOT_FOUND", async () => {
    vi.mocked(updateEvent).mockRejectedValue(createApiClientError("EVENT_NOT_FOUND"));

    render(<EventDetailsClient initialEvent={initialEvent} userId="1" />);

    fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/?error=event-not-found");
    });
  });

  it("shows save error when update fails for non-not-found reasons", async () => {
    vi.mocked(updateEvent).mockRejectedValue(createApiClientError("EVENT_UPDATE_FAILED"));

    render(<EventDetailsClient initialEvent={initialEvent} userId="1" />);

    fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save event. Please try again.")).toBeInTheDocument();
  });

  it("redirects when adding photos returns EVENT_NOT_FOUND", async () => {
    vi.mocked(uploadEventPhotos).mockRejectedValue(createApiClientError("EVENT_NOT_FOUND"));

    render(<EventDetailsClient initialEvent={initialEvent} userId="1" />);

    fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
    fireEvent.click(screen.getByRole("button", { name: "Mock add photos" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/?error=event-not-found");
    });
  });
});
