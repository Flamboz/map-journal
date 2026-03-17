import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TimelineClient from "./TimelineClient";

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
    lat: 49.80,
    lng: 24.00,
    created_at: "2025-12-15T10:00:00.000Z",
  },
];

describe("TimelineClient", () => {
  it("renders grouped years and months and shows event info", () => {
    render(<TimelineClient initialEvents={sampleEvents} userId="1" />);

    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();

    expect(screen.getByText("Mar")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();

    expect(screen.getByText("First Trip")).toBeInTheDocument();
    expect(screen.getByText("Second Trip")).toBeInTheDocument();

    expect(screen.getByText("01/03/2026 · Lutsk")).toBeInTheDocument();
    expect(screen.getByText("15/12/2025 · Lutsk")).toBeInTheDocument();
  });
});
