import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestAppContext, TestAppContext } from "../utils/testApp";

describe("auth routes", () => {
  let context: TestAppContext;

  beforeEach(async () => {
    context = await createTestAppContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  it("registers and logs in a user", async () => {
    const registerResponse = await context.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "test@example.com", password: "supersecure" },
    });

    expect(registerResponse.statusCode).toBe(201);
    const registerBody = registerResponse.json();
    expect(registerBody.user.email).toBe("test@example.com");

    const loginResponse = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com", password: "supersecure" },
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.json().user.email).toBe("test@example.com");
  });

  it("rejects duplicate register and invalid credentials", async () => {
    await context.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "duplicate@example.com", password: "supersecure" },
    });

    const duplicateResponse = await context.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "duplicate@example.com", password: "supersecure" },
    });

    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json().error).toBe("USER_EXISTS");

    const invalidLoginResponse = await context.app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "duplicate@example.com", password: "wrong-pass" },
    });

    expect(invalidLoginResponse.statusCode).toBe(401);
    expect(invalidLoginResponse.json().error).toBe("INVALID_CREDENTIALS");
  });
});
