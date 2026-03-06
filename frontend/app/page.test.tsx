import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("./map/MapViewClient", () => ({
  default: () => <div data-testid="map-view">Map View</div>,
}));

describe("Home page", () => {
  it("renders the map view", async () => {
    const view = await Home({ searchParams: Promise.resolve({}) });
    render(view);

    expect(screen.getByTestId("map-view")).toBeInTheDocument();
  });
});