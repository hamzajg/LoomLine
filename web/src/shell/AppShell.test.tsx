import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { AppShell } from "./AppShell";

function setViewport(narrow: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches: narrow,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
}

function renderShell(children: ReactNode) {
  return render(
    <LocaleProvider>
      <AppShell
        user={{ displayName: "Demo operator", role: "Administrator" }}
      >
        {children}
      </AppShell>
    </LocaleProvider>,
  );
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  setViewport(false);
});

describe("auth-and-app-shell — Wave 1", () => {
  it("Shell renders navigation for a signed-in user", () => {
    renderShell(<h1>Production orders screen</h1>);

    expect(screen.getByText("LoomLine")).toBeInTheDocument();
    expect(screen.getByText("Demo operator")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: /sections/i });
    for (const section of [
      "Production",
      "Stock",
      "Commercial",
      "Quality",
      "Equipment",
      "Workforce",
      "Access",
    ]) {
      expect(within(nav).getByRole("button", { name: section })).toBeInTheDocument();
    }

    expect(
      screen.getByRole("heading", { name: "Production orders screen" }),
    ).toBeInTheDocument();
  });

  it("Sidebar collapses on a narrow viewport", async () => {
    setViewport(true);
    const user = userEvent.setup();
    renderShell(<p>Screen content</p>);

    const toggle = screen.getByRole("button", { name: /toggle navigation/i });
    const sidebar = screen.getByTestId("app-sidebar");

    expect(sidebar).not.toBeVisible();
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(sidebar).toBeVisible();
    expect(
      screen.getByRole("button", { name: /close navigation/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Screen content");
  });

  it("Shell controls are keyboard operable", async () => {
    const user = userEvent.setup();
    renderShell(<p>Screen content</p>);

    const toggle = screen.getByRole("button", { name: /toggle navigation/i });
    await user.tab();
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", "app-sidebar");

    const nav = screen.getByRole("navigation", { name: /sections/i });
    const orders = within(nav).getByRole("link", { name: "Orders" });
    orders.focus();
    expect(orders).toHaveFocus();
    expect(orders).toHaveAttribute("aria-current", "page");

    expect(
      within(nav).getByRole("button", { name: "Production" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
