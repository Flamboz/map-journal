import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentLocation } from "./useCurrentLocation";

type SuccessCallback = (position: { coords: { latitude: number; longitude: number } }) => void;
type ErrorCallback = (error: { code: number; PERMISSION_DENIED: number }) => void;

const getCurrentPosition = vi.fn<(onSuccess: SuccessCallback, onError: ErrorCallback) => void>();

describe("useCurrentLocation", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("reports coordinates when position is resolved", () => {
    const onLocated = vi.fn();
    const { result } = renderHook(() => useCurrentLocation({ onLocated }));

    act(() => result.current.locate());
    expect(result.current.isLocating).toBe(true);

    const [onSuccess] = getCurrentPosition.mock.calls[0];
    act(() => onSuccess({ coords: { latitude: 49.84, longitude: 24.03 } }));

    expect(onLocated).toHaveBeenCalledWith({ lat: 49.84, lng: 24.03 });
    expect(result.current.isLocating).toBe(false);
    expect(result.current.locationError).toBeNull();
  });

  it("shows a permission error and clears it after a timeout", () => {
    vi.useFakeTimers();
    const onLocated = vi.fn();
    const { result } = renderHook(() => useCurrentLocation({ onLocated }));

    act(() => result.current.locate());
    const [, onError] = getCurrentPosition.mock.calls[0];
    act(() => onError({ code: 1, PERMISSION_DENIED: 1 }));

    expect(onLocated).not.toHaveBeenCalled();
    expect(result.current.isLocating).toBe(false);
    expect(result.current.locationError).toBe("Location access was denied.");

    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.locationError).toBeNull();
  });

  it("reports unsupported geolocation without calling the API", () => {
    vi.stubGlobal("navigator", {});
    const { result } = renderHook(() => useCurrentLocation({ onLocated: vi.fn() }));

    act(() => result.current.locate());

    expect(result.current.locationError).toBe("Geolocation is not supported by your browser.");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
