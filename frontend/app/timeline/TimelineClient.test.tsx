import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TimelineClient from "./TimelineClient";
import TimelineList from "./TimelineList";
import { buildTimelineViewModel } from "./timelineViewModel";

const sampleEvents = [
  {
    id: "e1",
    user_id: 1,
    title: "First Trip",
    startDate: "2026-03-01",
    endDate: null,
    description: "Nice place",
    rating: 8,
    labels: ["hike"],
    city: "Lutsk",
    lat: 49.85,
    lng: 24.01,
    created_at: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "e2",
    user_id: 1,
    title: "Second Trip",
    startDate: "2025-12-15",
    endDate: null,
    description: "Another place",
    rating: 7,
    labels: ["lake"],
    city: "Lutsk",
    lat: 49.8,
    lng: 24,
    created_at: "2025-12-15T10:00:00.000Z",
  },
];

describe("TimelineClient", () => {
  it("renders the server timeline content and filters it in place", () => {
    const viewModel = buildTimelineViewModel(sampleEvents);

    render(
      <TimelineClient labels={viewModel.labels} stats={viewModel.stats}>
        <TimelineList years={viewModel.years} />
      </TimelineClient>,
    );

    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("First Trip")).toBeInTheDocument();
    expect(screen.getByText("Second Trip")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "lake" }));

    expect(screen.getByText("First Trip").closest("[data-timeline-event]")).toHaveAttribute("hidden");
    expect(screen.getByText("Second Trip").closest("[data-timeline-event]")).not.toHaveAttribute("hidden");
  });
});
