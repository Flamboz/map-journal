import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchUserEvents } from "../map/api";
import TimelinePageContent from "./TimelinePageContent";

vi.mock("../map/api", () => ({
  fetchUserEvents: vi.fn(),
}));

describe("TimelinePageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads events and renders grouped timeline content", async () => {
    vi.mocked(fetchUserEvents).mockResolvedValue([
      {
        id: "event-2",
        user_id: 1,
        title: "Lake Day",
        name: "Lake Day",
        startDate: "2026-03-02",
        endDate: "2026-03-03",
        description: "Second event",
        rating: 8,
        labels: ["Trip"],
        visitCompany: "Friends",
        lat: 0,
        lng: 0,
        city: "Kyiv",
        created_at: "2026-03-02T10:00:00.000Z",
        photos: [],
        samePinEventIds: ["event-2"],
        accessLevel: "owner",
        visibility: "private",
        ownerEmail: "owner@example.com",
        sharedWithEmails: [],
      },
      {
        id: "event-1",
        user_id: 1,
        title: "Museum",
        name: "Museum",
        startDate: "2025-01-10",
        endDate: null,
        description: "First event",
        rating: 6,
        labels: ["Culture"],
        visitCompany: "Solo",
        lat: 0,
        lng: 0,
        city: "Lviv",
        created_at: "2025-01-10T10:00:00.000Z",
        photos: [],
        samePinEventIds: ["event-1"],
        accessLevel: "owner",
        visibility: "private",
        ownerEmail: "owner@example.com",
        sharedWithEmails: [],
      },
    ]);

    const view = await TimelinePageContent({ authToken: "token-1" });
    render(view);

    expect(fetchUserEvents).toHaveBeenCalledWith("token-1");
    expect(screen.getByText("Journey timeline")).toBeInTheDocument();
    expect(screen.getByText("2 events across 2 years")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trip" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "View full →" })).toHaveLength(2);
  });
});
