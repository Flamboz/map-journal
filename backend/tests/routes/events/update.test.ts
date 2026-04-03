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

  it("allows owners to add and remove shared recipients", async () => {
    const ownerId = await registerUser(context, "owner-update-share@example.com");
    await registerUser(context, "friend-a-update-share@example.com");
    await registerUser(context, "friend-b-update-share@example.com");
    const eventId = await createEvent(context.run, { userId: ownerId, title: "Before" });

    const shareResponse = await context.app.inject({
      method: "PATCH",
      url: `/events/${eventId}`,
      payload: {
        userId: ownerId,
        visibility: "share_with",
        sharedWithEmails: ["friend-a-update-share@example.com", "friend-b-update-share@example.com"],
      },
    });

    expect(shareResponse.statusCode).toBe(200);
    expect(shareResponse.json().event.sharedWithEmails).toEqual([
      "friend-a-update-share@example.com",
      "friend-b-update-share@example.com",
    ]);

    const privateResponse = await context.app.inject({
      method: "PATCH",
      url: `/events/${eventId}`,
      payload: {
        userId: ownerId,
        visibility: "private",
        sharedWithEmails: [],
      },
    });

    expect(privateResponse.statusCode).toBe(200);
    expect(privateResponse.json().event.visibility).toBe("private");
    expect(privateResponse.json().event.sharedWithEmails).toEqual([]);
  });
});
