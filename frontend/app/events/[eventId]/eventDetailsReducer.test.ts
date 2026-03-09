import { describe, expect, it } from "vitest";
import { createInitialEventDetailsState, eventDetailsReducer } from "./eventDetailsReducer";
import type { MapEvent } from "../../map/api";

const baseEvent: MapEvent = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  user_id: 1,
  title: "River Walk",
  name: "River Walk",
  startDate: "2026-03-01",
  endDate: null,
  description: "desc",
  rating: 7,
  labels: ["Trip"],
  visitCompany: "Friends",
  lat: 50.45,
  lng: 30.52,
  created_at: "2026-03-01T10:00:00.000Z",
  photos: [],
  samePinEventIds: ["550e8400-e29b-41d4-a716-446655440001"],
};

describe("eventDetailsReducer", () => {
  it("initializes from event", () => {
    const state = createInitialEventDetailsState(baseEvent);

    expect(state.event.id).toBe(baseEvent.id);
    expect(state.isEditing).toBe(false);
    expect(state.selectedRating).toBe(7);
    expect(state.selectedLabels).toEqual(["Trip"]);
    expect(state.startDateMin).toBe("2026-03-01");
  });

  it("resets edit fields on START_EDIT and CANCEL_EDIT", () => {
    const initial = createInitialEventDetailsState(baseEvent);
    const dirty = {
      ...initial,
      selectedRating: 3,
      selectedLabels: ["Food"],
      startDateMin: "2026-03-09",
      saveError: "err",
    };

    const editing = eventDetailsReducer(dirty, { type: "START_EDIT" });
    expect(editing.isEditing).toBe(true);
    expect(editing.selectedRating).toBe(7);
    expect(editing.selectedLabels).toEqual(["Trip"]);
    expect(editing.startDateMin).toBe("2026-03-01");
    expect(editing.saveError).toBeNull();

    const canceled = eventDetailsReducer(editing, { type: "CANCEL_EDIT" });
    expect(canceled.isEditing).toBe(false);
    expect(canceled.selectedRating).toBe(7);
    expect(canceled.selectedLabels).toEqual(["Trip"]);
  });

  it("applies SAVE_SUCCESS and exits editing", () => {
    const initial = createInitialEventDetailsState(baseEvent);
    const editing = eventDetailsReducer(initial, { type: "START_EDIT" });
    const updatedEvent: MapEvent = {
      ...baseEvent,
      name: "Updated Name",
      rating: 9,
      labels: ["Trip", "Park"],
      startDate: "2026-03-05",
    };

    const saved = eventDetailsReducer(editing, { type: "SAVE_SUCCESS", payload: updatedEvent });

    expect(saved.isEditing).toBe(false);
    expect(saved.event.name).toBe("Updated Name");
    expect(saved.selectedRating).toBe(9);
    expect(saved.selectedLabels).toEqual(["Trip", "Park"]);
    expect(saved.startDateMin).toBe("2026-03-05");
  });
});
