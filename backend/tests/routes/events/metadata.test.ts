import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestAppContext, TestAppContext } from "../../utils/testApp";

describe("metadata routes", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("returns labels metadata", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/events/labels",
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json().labels)).toBe(true);
  });

  it("returns visit companies metadata", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/events/visit-companies",
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json().visitCompanies)).toBe(true);
  });
});
