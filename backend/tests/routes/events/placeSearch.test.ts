import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAppContext, TestAppContext } from "../../utils/testApp";

describe("place search route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("returns normalized places from upstream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { display_name: "Paris", lat: "48.8566", lon: "2.3522" },
          { display_name: "", lat: "0", lon: "0" },
        ],
      }),
    );

    const response = await context.app.inject({
      method: "GET",
      url: "/place-search?q=paris",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().places).toHaveLength(1);
    expect(response.json().places[0].displayName).toBe("Paris");
  });

  it("returns a normalized reverse geocoded address from upstream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          address: {
            road: "Main Street",
            house_number: "10",
            city: "Kyiv",
            country: "Ukraine",
          },
        }),
      }),
    );

    const response = await context.app.inject({
      method: "GET",
      url: "/reverse-geocode?lat=50.45&lng=30.52",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().address).toEqual({
      road: "Main Street",
      house_number: "10",
      city: "Kyiv",
      country: "Ukraine",
    });
  });

  it("rejects invalid reverse geocode coordinates", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/reverse-geocode?lat=abc&lng=30.52",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_COORDINATES");
  });

  it("rejects empty query", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/place-search",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_QUERY");
  });
});
