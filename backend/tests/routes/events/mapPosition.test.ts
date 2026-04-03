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

describe("map position route", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("prefers stored map position over latest event coordinates", async () => {
    const { userId, authHeaders } = await registerUser(context, "event-map@example.com");
    await createEvent(context.run, { userId, title: "Pin", lat: 34.05, lng: -118.24 });
    await context.run("INSERT INTO map_positions (user_id, lat, lng, zoom) VALUES (?, ?, ?, ?)", [userId, 10.0, 20.0, 5]);

    const response = await context.app.inject({
      method: "GET",
      url: "/map-position",
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().lastMapPosition.lat).toBe(10.0);
    expect(response.json().lastMapPosition.zoom).toBe(5);
  });

  it("stores map position on create, update and delete via routes", async () => {
    const { userId, authHeaders } = await registerUser(context, "event-map-updates@example.com");

    // create event via API (should store map position)
    const createRes = await context.app.inject({
      method: "POST",
      url: "/events",
      headers: authHeaders,
      payload: { name: "Created", startDate: "2020-01-01", lat: 12.34, lng: 56.78 },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json().event;

    let response = await context.app.inject({ method: "GET", url: "/map-position", headers: authHeaders });
    expect(response.statusCode).toBe(200);
    expect(response.json().lastMapPosition.lat).toBe(12.34);

    // update event via API (should update stored map position to the same coords)
    const updateRes = await context.app.inject({
      method: "PATCH",
      url: `/events/${created.id}`,
      headers: authHeaders,
      payload: { name: "Updated", startDate: "2020-01-01" },
    });
    expect(updateRes.statusCode).toBe(200);

    response = await context.app.inject({ method: "GET", url: "/map-position", headers: authHeaders });
    expect(response.statusCode).toBe(200);
    expect(response.json().lastMapPosition.lat).toBe(12.34);

    // delete event via API (should record deleted event coords)
    const deleteRes = await context.app.inject({ method: "DELETE", url: `/events/${created.id}`, headers: authHeaders });
    expect(deleteRes.statusCode).toBe(200);

    response = await context.app.inject({ method: "GET", url: "/map-position", headers: authHeaders });
    expect(response.statusCode).toBe(200);
    expect(response.json().lastMapPosition.lat).toBe(12.34);
  });

  it("rejects missing authentication", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/map-position",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe("UNAUTHORIZED");
  });
});
