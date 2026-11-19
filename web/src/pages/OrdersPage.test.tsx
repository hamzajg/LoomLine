import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Article, Client, CreatedOrder, OrdersApi } from "../api";
import { OrdersPage } from "./OrdersPage";

const clients: Client[] = [
  { id: "c1", name: "Maison Textile", country: "TN" },
  { id: "c2", name: "Atelier Nord", country: "FR" },
];

const articles: Article[] = [
  { id: "a1", reference: "ART-100", label: "Chemise Popeline", clientId: "c1", sizeType: "Alpha" },
  { id: "a2", reference: "ART-200", label: "Pantalon Toile", clientId: "c2", sizeType: "Alpha" },
];

const mockOrders: CreatedOrder[] = [
  {
    id: "o1",
    reference: "OF-2026-001",
    clientId: "c1",
    articleId: "a1",
    quantity: 100,
    dueDate: "2026-12-01",
    status: "DRAFT",
    createdAt: "2026-11-18T08:00:00Z",
    updatedAt: "2026-11-18T08:00:00Z",
  },
  {
    id: "o2",
    reference: "OF-2026-002",
    clientId: "c2",
    articleId: "a2",
    quantity: 250,
    dueDate: "2026-12-15",
    status: "RELEASED",
    createdAt: "2026-11-18T08:30:00Z",
    updatedAt: "2026-11-18T08:30:00Z",
  },
  {
    id: "o3",
    reference: "OF-2026-003",
    clientId: "c1",
    articleId: "a1",
    quantity: 500,
    dueDate: "2026-12-20",
    status: "COMPLETED",
    createdAt: "2026-11-18T09:00:00Z",
    updatedAt: "2026-11-18T09:00:00Z",
  },
];

function fakeApi(overrides: Partial<OrdersApi> = {}): OrdersApi {
  return {
    clients: vi.fn().mockResolvedValue(clients),
    articles: vi.fn().mockResolvedValue(articles),
    create: vi.fn(),
    list: vi.fn().mockImplementation(async (filter?: { status?: string; reference?: string }) => {
      let filtered = [...mockOrders];
      if (filter?.status) {
        filtered = filtered.filter((o) => o.status === filter.status);
      }
      if (filter?.reference) {
        filtered = filtered.filter((o) =>
          o.reference.toLowerCase().includes(filter.reference!.toLowerCase()),
        );
      }
      return filtered;
    }),
    get: vi.fn().mockImplementation(async (id: string) => {
      const found = mockOrders.find((o) => o.id === id);
      if (!found) throw new Error("Order not found");
      return found;
    }),
    transition: vi.fn(),
    history: vi.fn().mockResolvedValue([]),
    colours: vi.fn().mockResolvedValue([]),
    sizes: vi.fn().mockResolvedValue([]),
    quantities: vi.fn().mockResolvedValue([]),
    setQuantities: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("OrdersPage — Wave 2", () => {
  it("Filter orders by status", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<OrdersPage api={api} />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
      expect(screen.getByText("OF-2026-002")).toBeInTheDocument();
      expect(screen.getByText("OF-2026-003")).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText("Status filter");
    await user.selectOptions(statusSelect, "RELEASED");

    await waitFor(() => {
      expect(screen.getByText("OF-2026-002")).toBeInTheDocument();
    });
    expect(screen.queryByText("OF-2026-001")).not.toBeInTheDocument();
    expect(screen.queryByText("OF-2026-003")).not.toBeInTheDocument();
  });

  it("Find an order by reference", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<OrdersPage api={api} />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText("Search reference");
    await user.type(searchInput, "OF-2026-002");

    await waitFor(() => {
      expect(screen.getByText("OF-2026-002")).toBeInTheDocument();
    });
    expect(screen.queryByText("OF-2026-001")).not.toBeInTheDocument();
    expect(screen.queryByText("OF-2026-003")).not.toBeInTheDocument();
  });

  it("View an order's details", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<OrdersPage api={api} />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });

    const viewButton = screen.getByLabelText("View order OF-2026-001");
    await user.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("order-detail-modal")).toBeInTheDocument();
    });

    expect(screen.getByText("Order details — OF-2026-001")).toBeInTheDocument();
    expect(screen.getByLabelText("Detail Reference")).toHaveTextContent("OF-2026-001");
    expect(screen.getByLabelText("Detail Status")).toHaveTextContent("DRAFT");
    expect(screen.getByLabelText("Detail Client")).toHaveTextContent("Maison Textile");
    expect(screen.getByLabelText("Detail Article")).toHaveTextContent("ART-100 — Chemise Popeline");
    expect(screen.getByLabelText("Detail Quantity")).toHaveTextContent("100");
    expect(screen.getByLabelText("Detail Due Date")).toHaveTextContent("2026-12-01");

    const closeButton = screen.getByLabelText("Close details");
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("order-detail-modal")).not.toBeInTheDocument();
    });
  });
});

describe("OrdersPage — Wave 3", () => {
  it("Advance an order through its lifecycle", async () => {
    const released = { ...mockOrders[0], status: "RELEASED" as const };
    const api = fakeApi({
      transition: vi.fn().mockResolvedValue(released),
      history: vi.fn().mockResolvedValue([
        {
          fromStatus: "DRAFT" as const,
          toStatus: "RELEASED" as const,
          reason: null,
          changedAt: "2026-11-19T09:00:00Z",
          changedBy: "planner",
        },
      ]),
    });
    const user = userEvent.setup();

    render(<OrdersPage api={api} canManage />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-001"));

    await waitFor(() => {
      expect(screen.getByTestId("transition-released")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("transition-released"));

    await waitFor(() => {
      expect(api.transition).toHaveBeenCalledWith("o1", "RELEASED", undefined);
    });
    expect(await screen.findByText(/DRAFT → RELEASED/)).toBeInTheDocument();
  });

  it("hides transition actions without manage rights", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<OrdersPage api={api} />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-001"));

    await waitFor(() => {
      expect(screen.getByTestId("order-detail-modal")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("transition-released")).not.toBeInTheDocument();
  });

  it("shows no transition actions on a terminal order", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<OrdersPage api={api} canManage />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-003")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-003"));

    await waitFor(() => {
      expect(screen.getByTestId("order-detail-modal")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("transition-completed")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transition-cancelled")).not.toBeInTheDocument();
  });
});

describe("OrdersPage — order-composition Wave 2", () => {
  const colours = [
    { id: "col-noir", code: "NOIR", label: "Noir" },
    { id: "col-ecru", code: "ECRU", label: "Ecru" },
  ];
  const sizes = [
    { id: "size-s", code: "S", label: "S", sizeType: "Alpha" },
    { id: "size-m", code: "M", label: "M", sizeType: "Alpha" },
  ];
  const lines = [
    { colourId: "col-noir", sizeId: "size-s", quantity: 40 },
    { colourId: "col-ecru", sizeId: "size-m", quantity: 30 },
  ];

  it("View the breakdown without manage rights", async () => {
    const api = fakeApi({
      colours: vi.fn().mockResolvedValue(colours),
      sizes: vi.fn().mockResolvedValue(sizes),
      quantities: vi.fn().mockResolvedValue(lines),
    });
    const user = userEvent.setup();

    render(<OrdersPage api={api} />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-001"));

    await waitFor(() => {
      expect(screen.getByText("Colour / size breakdown")).toBeInTheDocument();
    });
    expect(screen.getByTestId("quantity-line-0")).toHaveTextContent("NOIR");
    expect(screen.getByTestId("quantity-line-0")).toHaveTextContent("40");
    expect(screen.queryByTestId("edit-breakdown")).not.toBeInTheDocument();
  });

  it("lets a manager edit and save the breakdown", async () => {
    const api = fakeApi({
      colours: vi.fn().mockResolvedValue(colours),
      sizes: vi.fn().mockResolvedValue(sizes),
      quantities: vi.fn().mockResolvedValue(lines),
      setQuantities: vi.fn().mockResolvedValue([
        { colourId: "col-noir", sizeId: "size-m", quantity: 100 },
      ]),
    });
    const user = userEvent.setup();

    render(<OrdersPage api={api} canManage />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-001"));

    await waitFor(() => {
      expect(screen.getByTestId("edit-breakdown")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("edit-breakdown"));

    await user.click(screen.getByTestId("save-breakdown"));

    await waitFor(() => {
      expect(api.setQuantities).toHaveBeenCalledWith("o1", lines);
    });
    await waitFor(() => {
      expect(screen.getByTestId("quantity-line-0")).toHaveTextContent("100");
    });
  });

  it("hides the edit control on an order in progress", async () => {
    const inProgress = { ...mockOrders[1], status: "IN_PROGRESS" as const };
    const api = fakeApi({
      get: vi.fn().mockImplementation(async (id: string) =>
        id === "o2" ? inProgress : mockOrders.find((o) => o.id === id)!,
      ),
      colours: vi.fn().mockResolvedValue(colours),
      sizes: vi.fn().mockResolvedValue(sizes),
      quantities: vi.fn().mockResolvedValue(lines),
    });
    const user = userEvent.setup();

    render(<OrdersPage api={api} canManage />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-002")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-002"));

    await waitFor(() => {
      expect(screen.getByText("Colour / size breakdown")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("edit-breakdown")).not.toBeInTheDocument();
  });
});
