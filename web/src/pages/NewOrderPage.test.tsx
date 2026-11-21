import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiFailure, type Article, type Client, type OrdersApi } from "../api";
import { NewOrderPage } from "./NewOrderPage";

const clients: Client[] = [
  { id: "c1", name: "Maison Textile", country: "TN" },
];

const articles: Article[] = [
  { id: "a1", reference: "ART-100", label: "Chemise", clientId: "c1", sizeType: "Alpha", unit: "pcs" },
];

function fakeApi(overrides: Partial<OrdersApi> = {}): OrdersApi {
  return {
    clients: vi.fn().mockResolvedValue(clients),
    articles: vi.fn().mockResolvedValue(articles),
    create: vi.fn().mockResolvedValue({
      id: "o1",
      reference: "OF-2026-001",
      clientId: "c1",
      articleId: "a1",
      quantity: 250,
      dueDate: "2026-12-15",
      status: "DRAFT",
      createdAt: "2026-11-18T08:00:00Z",
      updatedAt: "2026-11-18T08:00:00Z",
    }),
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockRejectedValue(new Error("not found")),
    transition: vi.fn(),
    history: vi.fn().mockResolvedValue([]),
    colours: vi.fn().mockResolvedValue([]),
    sizes: vi.fn().mockResolvedValue([]),
    quantities: vi.fn().mockResolvedValue([]),
    setQuantities: vi.fn().mockResolvedValue([]),
    phases: vi.fn().mockResolvedValue([]),
    machines: vi.fn().mockResolvedValue([]),
    routing: vi.fn().mockResolvedValue([]),
    setRouting: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() =>
    expect(screen.getByLabelText("Client")).toBeInTheDocument(),
  );

  await user.type(screen.getByLabelText("Reference"), "  OF-2026-001  ");
  await user.selectOptions(screen.getByLabelText("Client"), "c1");
  await user.selectOptions(screen.getByLabelText("Article"), "a1");
  await user.type(screen.getByLabelText("Quantity"), "250");
  fireEvent.change(screen.getByLabelText("Due date"), {
    target: { value: "2026-12-15" },
  });
}

describe("NewOrderPage", () => {
  it("creates an order and shows its draft status", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<NewOrderPage api={api} />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create order" }));

    await waitFor(() =>
      expect(screen.getByText("Order OF-2026-001 created")).toBeInTheDocument(),
    );
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(api.create).toHaveBeenCalledWith({
      reference: "OF-2026-001",
      clientId: "c1",
      articleId: "a1",
      quantity: 250,
      dueDate: "2026-12-15",
    });
  });

  it("blocks submission and explains every missing field", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<NewOrderPage api={api} />);
    await user.click(screen.getByRole("button", { name: "Create order" }));

    expect(screen.getByText("Reference is required.")).toBeInTheDocument();
    expect(screen.getByText("Client is required.")).toBeInTheDocument();
    expect(screen.getByText("Article is required.")).toBeInTheDocument();
    expect(screen.getByText("Quantity is required.")).toBeInTheDocument();
    expect(screen.getByText("Due date is required.")).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("rejects a non-positive quantity before calling the API", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<NewOrderPage api={api} />);
    await waitFor(() =>
      expect(screen.getByLabelText("Client")).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText("Quantity"), "0");
    await user.click(screen.getByRole("button", { name: "Create order" }));

    expect(
      screen.getByText("Quantity must be greater than zero."),
    ).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("shows a duplicate reference message from the API", async () => {
    const api = fakeApi({
      create: vi
        .fn()
        .mockRejectedValue(
          new ApiFailure(
            "DUPLICATE_REFERENCE",
            "An order with this reference already exists.",
          ),
        ),
    });
    const user = userEvent.setup();

    render(<NewOrderPage api={api} />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create order" }));

    expect(
      await screen.findByText("An order with this reference already exists."),
    ).toBeInTheDocument();
  });

  it("shows field errors returned by the API", async () => {
    const api = fakeApi({
      create: vi
        .fn()
        .mockRejectedValue(
          new ApiFailure("VALIDATION_FAILED", "The order could not be created.", {
            reference: "Reference already exists.",
          }),
        ),
    });
    const user = userEvent.setup();

    render(<NewOrderPage api={api} />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create order" }));

    expect(
      await screen.findByText("Reference already exists."),
    ).toBeInTheDocument();
  });

  it("explains when there is no reference data to order from", async () => {
    const api = fakeApi({
      clients: vi.fn().mockResolvedValue([]),
      articles: vi.fn().mockResolvedValue([]),
    });
    const user = userEvent.setup();

    render(<NewOrderPage api={api} />);

    expect(
      await screen.findByText(/No clients or articles yet/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create order" })).toBeDisabled();
    expect(user).toBeTruthy();
  });
});
