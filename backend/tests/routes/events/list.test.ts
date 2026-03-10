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
});
