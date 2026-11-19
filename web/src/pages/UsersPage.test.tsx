import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { UsersPage } from "./UsersPage";

const listUsers = vi.fn();
const listRoles = vi.fn();
const createUser = vi.fn();

vi.mock("../adminApi", () => ({
  listUsers: (...args: unknown[]) => listUsers(...args),
  listRoles: (...args: unknown[]) => listRoles(...args),
  createUser: (...args: unknown[]) => createUser(...args),
}));

function renderPage() {
  return render(
    <LocaleProvider>
      <UsersPage />
    </LocaleProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listUsers.mockResolvedValue([
    { id: "u1", username: "planner", email: "p@x.io", enabled: true, roles: ["production-planner"] },
  ]);
  listRoles.mockResolvedValue([
    { id: "administrator" },
    { id: "production-planner" },
    { id: "production-supervisor" },
  ]);
  createUser.mockResolvedValue({ id: "u2", username: "newbie", email: null, enabled: true, roles: ["production-supervisor"] });
});

describe("auth-and-app-shell — Wave 3 (US7)", () => {
  it("Lists users and roles from the API", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByTestId("users-table")).toBeInTheDocument());
    expect(screen.getByText("planner")).toBeInTheDocument();
    const roleSelect = screen.getByLabelText(/role/i);
    expect(roleSelect).toHaveTextContent(/administrator/i);
    expect(roleSelect).toHaveTextContent(/production supervisor/i);
  });

  it("Administrator creates a user with a role", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByTestId("user-form")).toBeInTheDocument());

    await user.type(screen.getByLabelText(/username/i), "newbie");
    await user.type(screen.getByLabelText(/password/i), "s3cret");
    await user.selectOptions(screen.getByLabelText(/role/i), "production-supervisor");
    await user.click(screen.getByRole("button", { name: /create user/i }));

    await waitFor(() =>
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "newbie",
          password: "s3cret",
          role: "production-supervisor",
        }),
      ),
    );
    await waitFor(() => expect(screen.getByTestId("user-created")).toBeInTheDocument());
  });
});
