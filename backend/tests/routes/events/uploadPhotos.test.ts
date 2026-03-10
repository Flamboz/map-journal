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

describe("upload photos route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("rejects non-multipart payload", async () => {
    const userId = await registerUser(context, "photo-upload@example.com");
    const eventId = await createEvent(context.run, { userId, title: "With photos" });

    const response = await context.app.inject({
      method: "POST",
      url: `/events/${eventId}/photos?userId=${userId}`,
      payload: { anything: true },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_MULTIPART");
  });

  it("rejects invalid event id", async () => {
    const response = await context.app.inject({
      method: "POST",
      url: "/events/not-a-uuid/photos?userId=1",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_EVENT");
  });
});
