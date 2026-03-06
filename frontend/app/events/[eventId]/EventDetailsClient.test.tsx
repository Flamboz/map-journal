import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventDetailsClient from "./EventDetailsClient";
import { useRouter } from "next/navigation";
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
  default: () => <div data-testid="event-photos-carousel" />,
}));

describe("EventDetailsClient delete flow", () => {
  const pushMock = vi.fn();
  const refreshMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      replace: vi.fn(),
      refresh: refreshMock,
    } as unknown as ReturnType<typeof useRouter>);

    vi.mocked(fetchAllowedLabels).mockResolvedValue([]);
    vi.mocked(fetchAllowedVisitCompanies).mockResolvedValue([]);
    vi.mocked(fetchEventById).mockResolvedValue({
      id: 10,
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
      samePinEventIds: [10],
    });
    vi.mocked(updateEvent).mockResolvedValue({} as Awaited<ReturnType<typeof updateEvent>>);
    vi.mocked(uploadEventPhotos).mockResolvedValue([]);
    vi.mocked(deleteEventPhoto).mockResolvedValue([]);
    vi.mocked(setEventPreviewPhoto).mockResolvedValue([]);
    vi.mocked(deleteEvent).mockResolvedValue(undefined);
  });

  const initialEvent = {
    id: 10,
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
    samePinEventIds: [10],
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
      expect(deleteEvent).toHaveBeenCalledWith("1", 10);
      expect(pushMock).toHaveBeenCalledWith("/");
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
