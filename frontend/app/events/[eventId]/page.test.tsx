import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventDetailsPage from "./page";
import { getServerSession } from "next-auth";
import { fetchEventById } from "../../map/api";
import { redirect } from "next/navigation";

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

vi.mock("./EventDetailsClient", () => ({
  default: ({
    initialEvent,
    userId,
  }: {
    initialEvent: { id: string; title: string };
    userId: string;
  }) => <div data-testid="event-details-client">{`${initialEvent.id}-${initialEvent.title}-${userId}`}</div>,
}));

describe("Event details page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes loaded event into details client", async () => {
    const eventId = "550e8400-e29b-41d4-a716-446655440001";

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "1",
      },
    } as Awaited<ReturnType<typeof getServerSession>>);

    vi.mocked(fetchEventById).mockResolvedValue({
      id: eventId,
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
      samePinEventIds: [
        "550e8400-e29b-41d4-a716-446655440003",
        eventId,
        "550e8400-e29b-41d4-a716-446655440002",
      ],
      photos: [
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          path: "a.jpg",
          url: `/uploads/user-1/event-${eventId}/a.jpg`,
          createdAt: "2026-03-01T10:00:00.000Z",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440012",
          path: "b.jpg",
          url: `/uploads/user-1/event-${eventId}/b.jpg`,
          createdAt: "2026-03-01T10:01:00.000Z",
        },
      ],
    });

    const view = await EventDetailsPage({
      params: Promise.resolve({ eventId }),
    });

    render(view);

    expect(fetchEventById).toHaveBeenCalledWith(eventId, "1");
    expect(screen.getByTestId("event-details-client")).toHaveTextContent(`${eventId}-River Walk-1`);
  });

  it("redirects to map with error when event no longer exists", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "1",
      },
    } as Awaited<ReturnType<typeof getServerSession>>);

    vi.mocked(fetchEventById).mockRejectedValue(new Error("EVENT_NOT_FOUND"));

    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("REDIRECT_TRIGGERED");
    });

    await expect(
      EventDetailsPage({
        params: Promise.resolve({ eventId: "550e8400-e29b-41d4-a716-446655440001" }),
      }),
    ).rejects.toThrow("REDIRECT_TRIGGERED");

    expect(redirect).toHaveBeenCalledWith("/?error=event-not-found");
  });
});
