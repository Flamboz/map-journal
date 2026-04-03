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

describe("list events route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("lists events for a user", async () => {
    const userId = await registerUser(context, "event-list@example.com");
    await createEvent(context.run, { userId, title: "Cafe Break" });

    const response = await context.app.inject({
      method: "GET",
      url: `/events?userId=${userId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().events).toHaveLength(1);
    expect(response.json().events[0].name).toBe("Cafe Break");
  });

  it("requires userId", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/events",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_USER");
  });

  it("includes events shared with the requesting user", async () => {
    const ownerId = await registerUser(context, "owner-list-share@example.com");
    const recipientId = await registerUser(context, "recipient-list-share@example.com");
    const createResponse = await context.app.inject({
      method: "POST",
      url: "/events",
      payload: {
        userId: ownerId,
        name: "Shared Cafe",
        startDate: "2026-03-10",
        visibility: "share_with",
        sharedWithEmails: ["recipient-list-share@example.com"],
        lat: 40.7128,
        lng: -74.006,
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const response = await context.app.inject({
      method: "GET",
      url: `/events?userId=${recipientId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().events).toHaveLength(1);
    expect(response.json().events[0].accessLevel).toBe("shared");
    expect(response.json().events[0].ownerEmail).toBe("owner-list-share@example.com");
  });
});
