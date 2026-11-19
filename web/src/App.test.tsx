import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { SectionGrant } from "./access";
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

/** The planner's projection of the taxonomy, as /api/navigation serves it. */
const plannerGrants: SectionGrant[] = [
  { id: "production", view: true, manage: true },
  { id: "stock", view: true, manage: false },
  { id: "commercial", view: true, manage: false },
  { id: "quality", view: false, manage: false },
  { id: "equipment", view: false, manage: false },
  { id: "hr", view: false, manage: false },
  { id: "access", view: false, manage: false },
];

let fetchMock: ReturnType<typeof vi.fn>;

function mockApi(session: unknown, grants: SectionGrant[] = plannerGrants) {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/auth/session") return Promise.resolve(jsonResponse(session));
    if (url === "/api/navigation") return Promise.resolve(jsonResponse({ sections: grants }));
    return Promise.resolve(jsonResponse({}, 404));
  });
}

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
    window.history.replaceState(null, "", "/production/orders");
    mockApi(planner);

    render(<App />);

    await waitFor(() => expect(screen.getByTestId("app-shell")).toBeInTheDocument());
    expect(screen.getByText("Nadia Planner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /sections/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("sign-in")).not.toBeInTheDocument();
  });

  it("Signing out ends the session", async () => {
    window.history.replaceState(null, "", "/production/orders");
    mockApi(planner);

    render(<App />);
    await waitFor(() => expect(screen.getByTestId("app-shell")).toBeInTheDocument());

    // Sign-out leaves through the API so the server clears the session cookie.
    expect(screen.getByRole("link", { name: /sign out/i })).toHaveAttribute(
      "href",
      "/api/auth/logout",
    );
  });
});

describe("auth-and-app-shell — Wave 3", () => {
  it("Navigation is limited to the role's sections", async () => {
    window.history.replaceState(null, "", "/production/orders");
    mockApi(planner);

    render(<App />);
    await waitFor(() => expect(screen.getByTestId("app-shell")).toBeInTheDocument());

    const nav = screen.getByRole("navigation", { name: /sections/i });
    // Granted: production (view+manage), stock, commercial (view).
    expect(nav).toHaveTextContent(/production/i);
    expect(nav).toHaveTextContent(/stock/i);
    expect(nav).toHaveTextContent(/commercial/i);
    // Not granted: quality, equipment, hr, access.
    expect(nav).not.toHaveTextContent(/quality/i);
    expect(nav).not.toHaveTextContent(/equipment/i);
    expect(nav).not.toHaveTextContent(/workforce/i);
    expect(nav).not.toHaveTextContent(/access/i);
  });

  it("Access-denied state for an ungranted route", async () => {
    window.history.replaceState(null, "", "/quality/controls");
    mockApi(planner);

    render(<App />);
    await waitFor(() => expect(screen.getByTestId("access-denied")).toBeInTheDocument());
    expect(screen.queryByText(/controls/i)).not.toBeInTheDocument();
  });
});
