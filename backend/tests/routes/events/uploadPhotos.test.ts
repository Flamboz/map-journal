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

describe("upload photos route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("rejects non-multipart payload", async () => {
    const { userId, authHeaders } = await registerUser(context, "photo-upload@example.com");
    const eventId = await createEvent(context.run, { userId, title: "With photos" });

    const response = await context.app.inject({
      method: "POST",
      url: `/events/${eventId}/photos`,
      headers: authHeaders,
      payload: { anything: true },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_MULTIPART");
  });

  it("rejects invalid event id", async () => {
    const { authHeaders } = await registerUser(context, "photo-upload-invalid@example.com");
    const response = await context.app.inject({
      method: "POST",
      url: "/events/not-a-uuid/photos",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_EVENT");
  });
});
