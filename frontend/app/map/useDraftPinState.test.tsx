import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEvent, fetchReverseGeocodeAddress } from "./api";
import { useDraftPinState } from "./useDraftPinState";
import type { EventFormState } from "./mapViewTypes";

vi.mock("./api", () => ({
  createEvent: vi.fn(),
  fetchReverseGeocodeAddress: vi.fn(),
}));

const formState: EventFormState = {
  name: " River Walk ",
  startDate: "2026-03-01",
  endDate: "",
  description: " description ",
  rating: 7,
  labels: ["Trip"],
  visitCompany: "Friends",
  photos: [new File(["img"], "photo.png", { type: "image/png" })],
  visibility: "private",
  sharedWithEmails: [],
};

describe("useDraftPinState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchReverseGeocodeAddress).mockResolvedValue({
      road: "Main",
      city: "Kyiv",
      country: "Ukraine",
    });
  });

  it("saves draft event with photos in one request", async () => {
    const onEventSaved = vi.fn();
    vi.mocked(createEvent).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440001",
      user_id: 1,
      title: "River Walk",
      name: "River Walk",
      startDate: "2026-03-01",
      endDate: null,
      description: "description",
      rating: 7,
      labels: ["Trip"],
      visitCompany: "Friends",
      lat: 50.45,
      lng: 30.52,
      created_at: "2026-03-01T10:00:00.000Z",
      photos: [
        {
        id: "550e8400-e29b-41d4-a716-446655440011",
        path: "a.jpg",
        url: "/uploads/a.jpg",
        createdAt: "2026-03-01T10:00:00.000Z",
        },
      ],
    });

    const { result } = renderHook(() => useDraftPinState({ authToken: "token-1", onEventSaved }));

    act(() => {
      result.current.openDraftFromMapClick({ lat: 50.45, lng: 30.52 });
    });

    await act(async () => {
      await result.current.saveDraftEvent(formState);
    });

    expect(createEvent).toHaveBeenCalledWith(
      "token-1",
      expect.objectContaining({
        name: "River Walk",
        description: "description",
        photos: formState.photos,
      }),
    );
    expect(onEventSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "550e8400-e29b-41d4-a716-446655440001",
        photos: expect.arrayContaining([expect.objectContaining({ id: "550e8400-e29b-41d4-a716-446655440011" })]),
      }),
    );
    expect(result.current.draftPosition).toBeNull();
  });

  it("sets error when create event fails", async () => {
    const onEventSaved = vi.fn();
    vi.mocked(createEvent).mockRejectedValue(new Error("create failed"));

    const { result } = renderHook(() => useDraftPinState({ authToken: "token-1", onEventSaved }));

    act(() => {
      result.current.openDraftFromMapClick({ lat: 50.45, lng: 30.52 });
    });

    await act(async () => {
      await result.current.saveDraftEvent({ ...formState, photos: [] });
    });

    await waitFor(() => {
      expect(result.current.saveError).toBe("Unable to save event. Please try again.");
    });
    expect(onEventSaved).not.toHaveBeenCalled();
  });
});
