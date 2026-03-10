import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestAppContext, TestAppContext } from "../../utils/testApp";
import { createEvent } from "../../utils/factories";

async function registerUser(context: TestAppContext, email: string) {
  const response = await context.app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password: "supersecure" },
  });

  return response.json().user.id as number;
}

describe("map position route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("returns latest event coordinates", async () => {
    const userId = await registerUser(context, "event-map@example.com");
    await createEvent(context.run, { userId, title: "Pin", lat: 34.05, lng: -118.24 });

    const response = await context.app.inject({
      method: "GET",
      url: `/map-position?userId=${userId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().lastMapPosition.lat).toBe(34.05);
  });

  it("rejects missing userId", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/map-position",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_USER");
  });
});
