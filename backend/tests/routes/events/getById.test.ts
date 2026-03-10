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

describe("get event by id route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("returns event by id", async () => {
    const userId = await registerUser(context, "event-get@example.com");
    const eventId = await createEvent(context.run, { userId, title: "Gallery" });

    const response = await context.app.inject({
      method: "GET",
      url: `/events/${eventId}?userId=${userId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().event.id).toBe(eventId);
  });

  it("returns 404 when event does not exist", async () => {
    const userId = await registerUser(context, "event-missing@example.com");

    const response = await context.app.inject({
      method: "GET",
      url: `/events/4a9a6f48-6db4-4f9f-bef3-f2bd9a4f0000?userId=${userId}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe("EVENT_NOT_FOUND");
  });
});
