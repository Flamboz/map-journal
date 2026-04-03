import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestAppContext, TestAppContext } from "../../utils/testApp";

async function registerUser(context: TestAppContext, email: string) {
  const response = await context.app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password: "supersecure" },
  });

  return response.json().user.id as number;
}

describe("share lookup route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("returns whether an email belongs to an existing account", async () => {
    const userId = await registerUser(context, "share-lookup-owner@example.com");
    await registerUser(context, "share-lookup-friend@example.com");

    const response = await context.app.inject({
      method: "GET",
      url: `/events/shareable-users/lookup?userId=${userId}&email=share-lookup-friend@example.com`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      exists: true,
      email: "share-lookup-friend@example.com",
    });
  });
});
