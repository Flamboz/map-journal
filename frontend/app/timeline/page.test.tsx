import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import TimelinePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-auth")>();
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

vi.mock("./TimelinePageContent", () => ({
  default: ({ authToken }: { authToken: string }) => <div data-testid="timeline-page-content">{authToken}</div>,
}));

describe("TimelinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes auth token into the server timeline content", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      accessToken: "token-1",
      user: {
        id: "1",
      },
    } as Awaited<ReturnType<typeof getServerSession>>);

    const view = await TimelinePage();
    render(view);

    expect(screen.getByTestId("timeline-page-content")).toHaveTextContent("token-1");
  });

  it("redirects to sign-in when auth token is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("REDIRECT_TRIGGERED");
    });

    await expect(TimelinePage()).rejects.toThrow("REDIRECT_TRIGGERED");
    expect(redirect).toHaveBeenCalledWith("/auth/signin");
  });
});
