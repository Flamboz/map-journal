import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestAppContext, TestAppContext } from "../../utils/testApp";
import { createEvent } from "../../utils/factories";

async function registerUser(context: TestAppContext, email: string) {
  const response = await context.app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password: "supersecure" },
  });

  const body = response.json() as { user: { id: number }; accessToken: string };
  return {
    userId: body.user.id,
    authHeaders: { authorization: `Bearer ${body.accessToken}` },
  };
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
    const { userId, authHeaders } = await registerUser(context, "event-get@example.com");
    const eventId = await createEvent(context.run, { userId, title: "Gallery" });

    const response = await context.app.inject({
      method: "GET",
      url: `/events/${eventId}`,
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().event.id).toBe(eventId);
  });

  it("returns 404 when event does not exist", async () => {
    const { authHeaders } = await registerUser(context, "event-missing@example.com");

    const response = await context.app.inject({
      method: "GET",
      url: "/events/4a9a6f48-6db4-4f9f-bef3-f2bd9a4f0000",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe("EVENT_NOT_FOUND");
  });

  it("returns an event shared with the requesting user", async () => {
    const owner = await registerUser(context, "owner-get-share@example.com");
    const recipient = await registerUser(context, "recipient-get-share@example.com");
    const createResponse = await context.app.inject({
      method: "POST",
      url: "/events",
      headers: owner.authHeaders,
      payload: {
        name: "Shared Gallery",
        startDate: "2026-03-10",
        visibility: "share_with",
        sharedWithEmails: ["recipient-get-share@example.com"],
        lat: 40.7128,
        lng: -74.006,
      },
    });
    const eventId = createResponse.json().event.id as string;

    const response = await context.app.inject({
      method: "GET",
      url: `/events/${eventId}`,
      headers: recipient.authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().event.accessLevel).toBe("shared");
    expect(response.json().event.sharedWithEmails).toEqual(["recipient-get-share@example.com"]);
  });
});
