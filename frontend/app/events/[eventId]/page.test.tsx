import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventDetailsPage from "./page";
import { getServerSession } from "next-auth";
import { fetchEventById } from "../../map/api";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("../../map/api", () => ({
  fetchEventById: vi.fn(),
}));

vi.mock("./EventPhotosCarousel", () => ({
  default: ({ photos }: { photos: Array<{ id: number }> }) => <div data-testid="photos-carousel">Photos: {photos.length}</div>,
}));

describe("Event details page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders required event fields in order and disabled placeholder actions", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "1",
      },
    } as Awaited<ReturnType<typeof getServerSession>>);

    vi.mocked(fetchEventById).mockResolvedValue({
      id: 10,
      user_id: 1,
      title: "River Walk",
      name: "River Walk",
      startDate: "2026-03-01",
      endDate: "2026-03-03",
      description: "A calm evening walk by the river.",
      rating: 8,
      labels: ["Trip", "Lake"],
      visitCompany: "Friends",
      lat: 50.45,
      lng: 30.52,
      created_at: "2026-03-01T10:00:00.000Z",
      samePinEventIds: [12, 10, 8],
      photos: [
        { id: 1, path: "a.jpg", url: "/uploads/user-1/event-10/a.jpg", createdAt: "2026-03-01T10:00:00.000Z" },
        { id: 2, path: "b.jpg", url: "/uploads/user-1/event-10/b.jpg", createdAt: "2026-03-01T10:01:00.000Z" },
      ],
    });

    const view = await EventDetailsPage({
      params: Promise.resolve({ eventId: "10" }),
    });

    render(view);

    expect(fetchEventById).toHaveBeenCalledWith("10", "1");
    expect(screen.getByTestId("photos-carousel")).toHaveTextContent("Photos: 2");

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Rating")).toBeInTheDocument();
    expect(screen.getByText("Labels")).toBeInTheDocument();
    expect(screen.getByText("Visit company")).toBeInTheDocument();

    expect(screen.getByText("River Walk")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go back to map" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Previous event at this pin" })).toHaveAttribute("href", "/events/12");
    expect(screen.getByRole("link", { name: "Next event at this pin" })).toHaveAttribute("href", "/events/8");
    expect(screen.getByText("Event 2 of 3 at this pin")).toBeInTheDocument();
    expect(screen.getByText("2026-03-01 – 2026-03-03")).toBeInTheDocument();
    expect(screen.getByText("A calm evening walk by the river.")).toBeInTheDocument();
    expect(screen.getByLabelText("Event rating")).toHaveTextContent("★★★★★★★★☆☆ (8/10)");
    expect(screen.getByText("Trip, Lake")).toBeInTheDocument();
    expect(screen.getByText("Friends")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Edit event" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete event" })).toBeDisabled();
  });
});
