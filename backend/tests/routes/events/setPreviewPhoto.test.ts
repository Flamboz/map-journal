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

describe("set preview photo route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("rejects invalid event id", async () => {
    const response = await context.app.inject({
      method: "PATCH",
      url: "/events/not-a-uuid/photos/4a9a6f48-6db4-4f9f-bef3-f2bd9a4f0000/preview?userId=1",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_EVENT");
  });

  it("returns photo not found when event exists but photo does not", async () => {
    const userId = await registerUser(context, "photo-preview@example.com");
    const eventId = await createEvent(context.run, { userId, title: "Preview Event" });

    const response = await context.app.inject({
      method: "PATCH",
      url: `/events/${eventId}/photos/4a9a6f48-6db4-4f9f-bef3-f2bd9a4f0000/preview?userId=${userId}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe("PHOTO_NOT_FOUND");
  });
});
