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

describe("create event route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("creates an event for a valid user", async () => {
    const { authHeaders } = await registerUser(context, "event-create@example.com");

    const response = await context.app.inject({
      method: "POST",
      url: "/events",
      headers: authHeaders,
      payload: {
        name: "Museum Trip",
        startDate: "2026-03-10",
        description: "A nice visit",
        rating: 8,
        labels: ["Museum"],
        visitCompany: "Solo",
        lat: 40.7128,
        lng: -74.006,
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.event.name).toBe("Museum Trip");
    expect(typeof body.event.id).toBe("string");
  });

  it("rejects invalid rating", async () => {
    const { authHeaders } = await registerUser(context, "event-rating@example.com");

    const response = await context.app.inject({
      method: "POST",
      url: "/events",
      headers: authHeaders,
      payload: {
        name: "Bad Rating",
        startDate: "2026-03-10",
        rating: 11,
        lat: 40.7128,
        lng: -74.006,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_RATING");
  });

  it("creates a shared event for existing recipient emails", async () => {
    const { authHeaders } = await registerUser(context, "owner-create-share@example.com");
    await registerUser(context, "friend-create-share@example.com");

    const response = await context.app.inject({
      method: "POST",
      url: "/events",
      headers: authHeaders,
      payload: {
        name: "Shared Museum Trip",
        startDate: "2026-03-10",
        visibility: "share_with",
        sharedWithEmails: ["friend-create-share@example.com"],
        lat: 40.7128,
        lng: -74.006,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().event.visibility).toBe("share_with");
    expect(response.json().event.sharedWithEmails).toEqual(["friend-create-share@example.com"]);
    expect(response.json().event.accessLevel).toBe("owner");
  });

  it("rejects shared events when the email does not belong to an existing account", async () => {
    const { authHeaders } = await registerUser(context, "owner-create-invalid@example.com");

    const response = await context.app.inject({
      method: "POST",
      url: "/events",
      headers: authHeaders,
      payload: {
        name: "Invalid Share",
        startDate: "2026-03-10",
        visibility: "share_with",
        sharedWithEmails: ["missing-user@example.com"],
        lat: 40.7128,
        lng: -74.006,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("SHARED_USER_NOT_FOUND");
  });
});
