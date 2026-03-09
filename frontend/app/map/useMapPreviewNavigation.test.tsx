import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMapPreviewNavigation } from "./useMapPreviewNavigation";
import type { MapEventGroup } from "./mapViewHelpers";

const groupedEvents: MapEventGroup[] = [
  {
    id: "group-a",
    lat: 50.45,
    lng: 30.52,
    events: [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        user_id: 1,
        title: "One",
        name: "One",
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
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        user_id: 1,
        title: "Two",
        name: "Two",
        startDate: "2026-03-02",
        endDate: null,
        description: "",
        rating: 8,
        labels: [],
        visitCompany: "",
        lat: 50.45,
        lng: 30.52,
        created_at: "2026-03-02T10:00:00.000Z",
        photos: [],
      },
    ],
  },
];

describe("useMapPreviewNavigation", () => {
  it("opens a group and cycles next/previous with wrap-around", () => {
    const { result } = renderHook(() => useMapPreviewNavigation(groupedEvents));

    expect(result.current.selectedGroup).toBeNull();

    act(() => {
      result.current.openGroup(0);
    });

    expect(result.current.selectedGroup?.id).toBe("group-a");
    expect(result.current.selectedEventIndex).toBe(0);

    act(() => {
      result.current.showNextEvent();
    });
    expect(result.current.selectedEventIndex).toBe(1);

    act(() => {
      result.current.showNextEvent();
    });
    expect(result.current.selectedEventIndex).toBe(0);

    act(() => {
      result.current.showPreviousEvent();
    });
    expect(result.current.selectedEventIndex).toBe(1);
  });

  it("clears selection state", () => {
    const { result } = renderHook(() => useMapPreviewNavigation(groupedEvents));

    act(() => {
      result.current.openGroup(0);
      result.current.showNextEvent();
      result.current.clearSelection();
    });

    expect(result.current.selectedGroupIndex).toBeNull();
    expect(result.current.selectedEventIndex).toBe(0);
    expect(result.current.selectedGroup).toBeNull();
  });
});
