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

describe("update event route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("updates an owned event", async () => {
    const userId = await registerUser(context, "event-update@example.com");
    const eventId = await createEvent(context.run, { userId, title: "Before" });

    const response = await context.app.inject({
      method: "PATCH",
      url: `/events/${eventId}`,
      payload: {
        userId,
        name: "After",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().event.name).toBe("After");
  });

  it("forbids updates by another user", async () => {
    const ownerId = await registerUser(context, "event-owner@example.com");
    const otherId = await registerUser(context, "event-other@example.com");
    const eventId = await createEvent(context.run, { userId: ownerId, title: "Private" });

    const response = await context.app.inject({
      method: "PATCH",
      url: `/events/${eventId}`,
      payload: {
        userId: otherId,
        name: "Hijack",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe("FORBIDDEN");
  });
});
