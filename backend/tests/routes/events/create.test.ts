import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestAppContext, TestAppContext } from "../../utils/testApp";

async function registerUser(context: TestAppContext, email: string) {
  const response = await context.app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password: "supersecure" },
  });

  return response.json().user.id as number;
}

describe("create event route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("creates an event for a valid user", async () => {
    const userId = await registerUser(context, "event-create@example.com");

    const response = await context.app.inject({
      method: "POST",
      url: "/events",
      payload: {
        userId,
        name: "Museum Trip",
        startDate: "2026-03-10",
        description: "A nice visit",
        rating: 8,
        labels: ["Museum"],
        visitCompany: "Solo",
        lat: 40.7128,
        lng: -74.006,
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.event.name).toBe("Museum Trip");
    expect(typeof body.event.id).toBe("string");
  });

  it("rejects invalid rating", async () => {
    const userId = await registerUser(context, "event-rating@example.com");

    const response = await context.app.inject({
      method: "POST",
      url: "/events",
      payload: {
        userId,
        name: "Bad Rating",
        startDate: "2026-03-10",
        rating: 11,
        lat: 40.7128,
        lng: -74.006,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_RATING");
  });
});
