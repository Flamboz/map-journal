import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { fetchEventById } from "../../map/api";
import { createApiClientError } from "../../map/apiErrors";
import EventDetailsPageContent from "./EventDetailsPageContent";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("../../map/api", () => ({
  fetchEventById: vi.fn(),
}));

vi.mock("./EventDetailsClient", () => ({
  default: ({
    initialEvent,
    authToken,
    readOnlyContentId,
    mediaContentId,
  }: {
    initialEvent: { id: string; title: string };
    authToken: string;
    readOnlyContentId: string;
    mediaContentId: string;
  }) => (
    <div data-testid="event-details-client">
      {`${initialEvent.id}-${initialEvent.title}-${authToken}-${readOnlyContentId}-${mediaContentId}`}
    </div>
  ),
}));

describe("EventDetailsPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes loaded event into details client", async () => {
    const eventId = "550e8400-e29b-41d4-a716-446655440001";

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
      ],
      accessLevel: "owner",
      visibility: "private",
      ownerEmail: "owner@example.com",
      sharedWithEmails: [],
    });

    const view = await EventDetailsPageContent({
      eventId,
      authToken: "token-1",
      currentUserEmail: null,
    });

    render(view);

    expect(fetchEventById).toHaveBeenCalledWith(eventId, "token-1");
    expect(screen.getByTestId("event-details-client")).toHaveTextContent(
      `${eventId}-River Walk-token-1-event-read-only-${eventId}-event-media-${eventId}`,
    );
    expect(screen.getByText("Event 2 of 3 at this pin")).toBeInTheDocument();
  });

  it("redirects to map with error when event no longer exists", async () => {
    vi.mocked(fetchEventById).mockRejectedValue(createApiClientError("EVENT_NOT_FOUND"));

    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("REDIRECT_TRIGGERED");
    });

    await expect(
      EventDetailsPageContent({
        eventId: "550e8400-e29b-41d4-a716-446655440001",
        authToken: "token-1",
        currentUserEmail: null,
      }),
    ).rejects.toThrow("REDIRECT_TRIGGERED");

    expect(redirect).toHaveBeenCalledWith("/?error=event-not-found");
  });
});
