import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestAppContext, TestAppContext } from "../../utils/testApp";

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

describe("share lookup route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("returns whether an email belongs to an existing account", async () => {
    const { authHeaders } = await registerUser(context, "share-lookup-owner@example.com");
    await registerUser(context, "share-lookup-friend@example.com");

    const response = await context.app.inject({
      method: "GET",
      url: "/events/shareable-users/lookup?email=share-lookup-friend@example.com",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      exists: true,
      email: "share-lookup-friend@example.com",
    });
  });
});
