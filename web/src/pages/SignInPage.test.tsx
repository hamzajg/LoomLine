import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { SignInPage } from "./SignInPage";

function renderPage(failed: boolean) {
  return render(
    <LocaleProvider>
      <SignInPage failed={failed} />
    </LocaleProvider>,
  );
}

describe("auth-and-app-shell — Wave 2", () => {
  it("Invalid credentials are rejected", () => {
    renderPage(true);

    const alert = screen.getByRole("alert");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert).toHaveTextContent(/couldn't sign you in/i);
    // The message is generic: it never names which field was wrong.
    expect(alert.textContent ?? "").not.toMatch(/username|password/i);
  });

  it("Valid credentials sign a user in — sign-in hands off to the provider", () => {
    renderPage(false);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue to sign-in/i })).toHaveAttribute(
      "href",
      "/api/auth/login",
    );
  });
});
