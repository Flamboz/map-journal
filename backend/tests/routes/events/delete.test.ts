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

describe("delete event route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("deletes an owned event", async () => {
    const { userId, authHeaders } = await registerUser(context, "event-delete@example.com");
    const eventId = await createEvent(context.run, { userId, title: "Delete Me" });

    const response = await context.app.inject({
      method: "DELETE",
      url: `/events/${eventId}`,
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().success).toBe(true);
  });

  it("forbids delete by another user", async () => {
    const owner = await registerUser(context, "event-delete-owner@example.com");
    const other = await registerUser(context, "event-delete-other@example.com");
    const eventId = await createEvent(context.run, { userId: owner.userId, title: "Protected" });

    const response = await context.app.inject({
      method: "DELETE",
      url: `/events/${eventId}`,
      headers: other.authHeaders,
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe("FORBIDDEN");
  });
});
