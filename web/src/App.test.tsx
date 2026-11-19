import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";

/** A minimal fetch Response stand-in (jsdom keeps `Response` optional). */
function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response;
}

const planner = {
  username: "planner",
  displayName: "Nadia Planner",
  roles: ["production-planner"],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(null, "", "/quality/controls");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auth-and-app-shell — Wave 2", () => {
  it("Unauthenticated visitor is redirected to sign-in", async () => {
    window.history.replaceState(null, "", "/production/orders");
    fetchMock.mockResolvedValue(jsonResponse(null, 401));

    render(<App />);

    await waitFor(() => expect(screen.getByTestId("sign-in")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", expect.anything());
    // The originally requested route is not shown.
    expect(
      screen.queryByRole("navigation", { name: /sections/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
  });

  it("Valid credentials sign a user in", async () => {
    fetchMock.mockResolvedValue(jsonResponse(planner));

    render(<App />);

    await waitFor(() => expect(screen.getByTestId("app-shell")).toBeInTheDocument());
    expect(screen.getByText("Nadia Planner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /sections/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("sign-in")).not.toBeInTheDocument();
  });

  it("Signing out ends the session", async () => {
    fetchMock.mockResolvedValue(jsonResponse(planner));

    render(<App />);
    await waitFor(() => expect(screen.getByTestId("app-shell")).toBeInTheDocument());

    // Sign-out leaves through the API so the server clears the session cookie.
    expect(screen.getByRole("link", { name: /sign out/i })).toHaveAttribute(
      "href",
      "/api/auth/logout",
    );
  });
});
