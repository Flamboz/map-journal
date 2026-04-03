import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestAppContext, TestAppContext } from "../utils/testApp";

describe("integration: auth + events flow", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("registers, creates, updates, lists, and deletes an event", async () => {
    const registerResponse = await context.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "integration@example.com", password: "supersecure" },
    });
    const registerBody = registerResponse.json() as { user: { id: number }; accessToken: string };
    const userId = registerBody.user.id;
    const authHeaders = { authorization: `Bearer ${registerBody.accessToken}` };

    const createResponse = await context.app.inject({
      method: "POST",
      url: "/events",
      headers: authHeaders,
      payload: {
        name: "Integration Event",
        startDate: "2026-03-10",
        lat: 40.7128,
        lng: -74.006,
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const eventId = createResponse.json().event.id as string;

    const updateResponse = await context.app.inject({
      method: "PATCH",
      url: `/events/${eventId}`,
      headers: authHeaders,
      payload: { name: "Updated Integration Event" },
    });
    expect(updateResponse.statusCode).toBe(200);

    const listResponse = await context.app.inject({
      method: "GET",
      url: "/events",
      headers: authHeaders,
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().events).toHaveLength(1);

    const deleteResponse = await context.app.inject({
      method: "DELETE",
      url: `/events/${eventId}`,
      headers: authHeaders,
    });
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.json().success).toBe(true);
  });
});
