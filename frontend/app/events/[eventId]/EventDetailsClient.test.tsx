import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventDetailsClient from "./EventDetailsClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createApiClientError } from "../../map/apiErrors";
import {
  deleteEventPhoto,
  deleteEvent,
  fetchAllowedLabels,
  fetchAllowedVisitCompanies,
  fetchEventById,
  updateEvent,
  uploadEventPhotos,
} from "../../map/api";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("../../map/api", () => ({
  deleteEventPhoto: vi.fn(),
  fetchAllowedLabels: vi.fn(),
  fetchAllowedVisitCompanies: vi.fn(),
  fetchEventById: vi.fn(),
  updateEvent: vi.fn(),
  uploadEventPhotos: vi.fn(),
  deleteEvent: vi.fn(),
}));

vi.mock("./EventPhotosCarousel", () => ({
  default: ({
    onAddPhotos,
    onDeletePhoto,
    onSetPreviewPhoto,
  }: {
    onAddPhotos?: (files: File[]) => void | Promise<void>;
    onDeletePhoto?: (photoId: string) => void | Promise<void>;
    onSetPreviewPhoto?: (photoId: string) => void | Promise<void>;
  }) => (
    <div data-testid="event-photos-carousel">
      <button
        type="button"
        onClick={() => onAddPhotos?.([new File(["demo"], "photo.png", { type: "image/png" })])}
        disabled={!onAddPhotos}
      >
        Mock add attachments
      </button>
      <button
        type="button"
        onClick={() => onDeletePhoto?.("550e8400-e29b-41d4-a716-446655440011")}
        disabled={!onDeletePhoto}
      >
        Mock delete attachment
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

it("sends staged photo deletions on save", async () => {
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
    accessLevel: "owner",
    visibility: "private",
    ownerEmail: "",
    sharedWithEmails: [],
  });

  vi.mocked(updateEvent).mockResolvedValue({
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
    photos: [photo2],
    samePinEventIds: [eventId],
    accessLevel: "owner",
    visibility: "private",
    ownerEmail: "",
    sharedWithEmails: [],
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
    photos: [photo1, photo2],
    samePinEventIds: [eventId],
    accessLevel: "owner" as const,
    visibility: "private" as const,
    ownerEmail: "",
    sharedWithEmails: [],
  };

  render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

  fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
  fireEvent.click(screen.getByRole("button", { name: "Mock delete attachment" }));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => {
    expect(updateEvent).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        eventId,
        photoIdsToDelete: [photo1.id],
      }),
    );
  });
});

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
    accessLevel: "owner",
    visibility: "private",
    ownerEmail: "",
    sharedWithEmails: [],
  });

  vi.mocked(updateEvent).mockResolvedValue({
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
    photos: [photo2, photo1],
    samePinEventIds: [eventId],
    accessLevel: "owner",
    visibility: "private",
    ownerEmail: "",
    sharedWithEmails: [],
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
    photos: [photo1, photo2],
    samePinEventIds: [eventId],
    accessLevel: "owner" as const,
    visibility: "private" as const,
    ownerEmail: "",
    sharedWithEmails: [],
  };

  render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

  fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
  fireEvent.click(screen.getByRole("button", { name: "Mock set preview" }));

  expect(updateEvent).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => {
    expect(updateEvent).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        eventId,
        previewPhotoId: photo2.id,
      }),
    );
  });
});

describe("EventDetailsClient delete flow", () => {
  const eventId = "550e8400-e29b-41d4-a716-446655440001";
  const pushMock = vi.fn();
  const replaceMock = vi.fn();
  const refreshMock = vi.fn();
  const searchParamsMock = {
    get: vi.fn(),
    toString: vi.fn(),
  };
  const resolvedEvent = {
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
    accessLevel: "owner" as const,
    visibility: "private" as const,
    ownerEmail: "",
    sharedWithEmails: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      replace: replaceMock,
      refresh: refreshMock,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue(`/events/${eventId}`);
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");
    vi.mocked(useSearchParams).mockReturnValue(searchParamsMock as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(fetchAllowedLabels).mockResolvedValue([]);
    vi.mocked(fetchAllowedVisitCompanies).mockResolvedValue([]);
    vi.mocked(fetchEventById).mockResolvedValue(resolvedEvent);
    vi.mocked(updateEvent).mockResolvedValue(resolvedEvent);
    vi.mocked(uploadEventPhotos).mockResolvedValue([]);
    vi.mocked(deleteEventPhoto).mockResolvedValue([]);
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
    accessLevel: "owner" as const,
    visibility: "private" as const,
    ownerEmail: "",
    sharedWithEmails: [],
  };

  it("opens delete confirmation modal when user clicks delete", async () => {
    render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete event" }));

    expect(await screen.findByRole("dialog", { name: "Delete event confirmation" })).toBeInTheDocument();
    expect(screen.getByText("Delete event?")).toBeInTheDocument();
    expect(screen.getByText("This will permanently delete the event and all associated attachments.")).toBeInTheDocument();
  });

  it("deletes event after confirmation and navigates to map", async () => {
    render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete event" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteEvent).toHaveBeenCalledWith("token-1", eventId);
      expect(pushMock).toHaveBeenCalledWith("/");
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("redirects to map when save hits EVENT_NOT_FOUND", async () => {
    vi.mocked(updateEvent).mockRejectedValue(createApiClientError("EVENT_NOT_FOUND"));

    render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/?error=event-not-found");
    });
  });

  it("shows save error when update fails for non-not-found reasons", async () => {
    vi.mocked(updateEvent).mockRejectedValue(createApiClientError("EVENT_UPDATE_FAILED"));

    render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save event. Please try again.")).toBeInTheDocument();
  });

  it("redirects when adding photos returns EVENT_NOT_FOUND", async () => {
    vi.mocked(uploadEventPhotos).mockRejectedValue(createApiClientError("EVENT_NOT_FOUND"));

    render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
    fireEvent.click(screen.getByRole("button", { name: "Mock add attachments" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/?error=event-not-found");
    });
  });

  it("rolls back edit-session uploads and exits edit mode on cancel", async () => {
    const uploadedPhoto = {
      id: "550e8400-e29b-41d4-a716-446655440099",
      path: "uploaded.jpg",
      url: `/uploads/user-1/event-${eventId}/uploaded.jpg`,
      createdAt: "2026-03-01T10:05:00.000Z",
    };

    vi.mocked(uploadEventPhotos).mockResolvedValue([uploadedPhoto]);

    render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit event" }));
    fireEvent.click(screen.getByRole("button", { name: "Mock add attachments" }));

    await waitFor(() => {
      expect(uploadEventPhotos).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(deleteEventPhoto).toHaveBeenCalledWith("token-1", eventId, uploadedPhoto.id);
      expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit event" })).toBeInTheDocument();
    });
  });

  it("consumes edit query mode so cancel can leave edit state", async () => {
    searchParamsMock.get.mockImplementation((key: string) => (key === "edit" ? "true" : null));
    searchParamsMock.toString.mockReturnValue("edit=true");

    render(<EventDetailsClient initialEvent={initialEvent} authToken="token-1" currentUserEmail={null} />);

    expect(await screen.findByRole("button", { name: "Save changes" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(`/events/${eventId}`, { scroll: false });
      expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit event" })).toBeInTheDocument();
    });
  });
});
