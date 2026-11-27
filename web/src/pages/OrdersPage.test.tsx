import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Article, Client, CreatedOrder, OrdersApi } from "../api";
import { OrdersPage } from "./OrdersPage";
import { navigate } from "../router";

vi.mock("../router", () => ({
  navigate: vi.fn(),
}));

const clients: Client[] = [
  { id: "c1", name: "Maison Textile", country: "TN" },
  { id: "c2", name: "Atelier Nord", country: "FR" },
];

const articles: Article[] = [
  { id: "a1", reference: "ART-100", label: "Chemise Popeline", clientId: "c1", sizeType: "Alpha", unit: "pcs" },
  { id: "a2", reference: "ART-200", label: "Pantalon Toile", clientId: "c2", sizeType: "Alpha", unit: "pcs" },
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
    phases: vi.fn().mockResolvedValue([]),
    machines: vi.fn().mockResolvedValue([]),
    routing: vi.fn().mockResolvedValue([]),
    setRouting: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("OrdersPage — Wave 2", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("keeps the filter after the list is remounted from a detail", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    const view = render(<OrdersPage api={api} />);
    await screen.findByText("OF-2026-001");

    await user.selectOptions(screen.getByLabelText("Status"), "DRAFT");
    await waitFor(() =>
      expect(screen.queryByText("OF-2026-002")).not.toBeInTheDocument(),
    );

    view.unmount();
    render(<OrdersPage api={fakeApi()} />);

    expect(await screen.findByLabelText("Status")).toHaveValue("DRAFT");
    expect(screen.queryByText("OF-2026-002")).not.toBeInTheDocument();
  });

  it("offers to create the first order when the list is empty", async () => {
    render(<OrdersPage api={fakeApi({ list: vi.fn().mockResolvedValue([]) })} canManage />);

    expect(await screen.findByTestId("orders-empty")).toHaveTextContent(
      "No orders yet. Create the first production order.",
    );
    expect(screen.getAllByRole("button", { name: "+ New order" })).toHaveLength(2);
  });

  it("offers to clear the filters when a search finds nothing", async () => {
    const user = userEvent.setup();
    render(
      <OrdersPage
        api={fakeApi({ list: vi.fn().mockResolvedValue([]) })}
        canManage
      />,
    );
    await screen.findByTestId("orders-empty");

    await user.type(screen.getByLabelText("Search reference"), "OF-9999");

    expect(
      await screen.findByRole("button", { name: "Clear filters" }),
    ).toBeInTheDocument();
  });

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

  it("opens the new-order route from the list", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<OrdersPage api={api} canManage />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /new order/i }));

    expect(navigate).toHaveBeenCalledWith("/production/orders/new");
  });

  it("navigates to order detail page on view", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<OrdersPage api={api} />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });

    const viewButton = screen.getByLabelText("View order OF-2026-001");
    await user.click(viewButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/production/orders/o1");
    });
  });
});

describe("OrdersPage — Wave 3", () => {
  it("navigates to order detail page on view (Wave 3)", async () => {
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
      expect(navigate).toHaveBeenCalledWith("/production/orders/o1");
    });
  });

  it("navigates to order detail page on view (no manage rights)", async () => {
    const api = fakeApi();
    const user = userEvent.setup();

    render(<OrdersPage api={api} />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-001"));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/production/orders/o1");
    });
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
      expect(navigate).toHaveBeenCalledWith("/production/orders/o3");
    });
  });
});

describe("OrdersPage — order-composition Wave 2", () => {
  const colours = [
    { id: "col-noir", code: "NOIR", label: "Noir" },
    { id: "col-ecru", code: "ECRU", label: "Ecru" },
  ];
  const sizes = [
    { id: "size-s", code: "S", label: "S", sizeType: "Alpha", unit: "pcs" },
    { id: "size-m", code: "M", label: "M", sizeType: "Alpha", unit: "pcs" },
  ];
  const lines = [
    { colourId: "col-noir", sizeId: "size-s", quantity: 40 },
    { colourId: "col-ecru", sizeId: "size-m", quantity: 30 },
  ];

  it("navigates to order detail page on view (breakdown)", async () => {
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
      expect(navigate).toHaveBeenCalledWith("/production/orders/o1");
    });
  });

  it("navigates to order detail page on view (breakdown, canManage)", async () => {
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
      expect(navigate).toHaveBeenCalledWith("/production/orders/o1");
    });
  });

  it("navigates to order detail page on view (breakdown, in progress)", async () => {
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
      expect(navigate).toHaveBeenCalledWith("/production/orders/o2");
    });
  });

});

describe("OrdersPage — production-routing Wave 3", () => {
  const routingSteps = [
    {
      position: 1,
      label: "Cut the panels",
      phaseId: "phase-cut",
      phaseCode: "CUT",
      machineId: "machine-1",
      machineReference: "MC-01",
      repetitions: 1,
      minutes: 4,
    },
    {
      position: 2,
      label: "Join the panels",
      phaseId: "phase-sew",
      phaseCode: "SEW",
      machineId: "machine-2",
      machineReference: "MC-02",
      repetitions: 2,
      minutes: 6,
    },
  ];

  it("navigates to order detail page on view (routing)", async () => {
    const api = fakeApi({
      routing: vi.fn().mockResolvedValue(routingSteps),
    });
    const user = userEvent.setup();

    render(<OrdersPage api={api} />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-001")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-001"));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/production/orders/o1");
    });
  });

  it("navigates to order detail page on view (routing, in progress)", async () => {
    const inProgress = { ...mockOrders[1], status: "IN_PROGRESS" as const };
    const api = fakeApi({
      get: vi.fn().mockImplementation(async (id: string) =>
        id === "o2" ? inProgress : mockOrders.find((o) => o.id === id)!,
      ),
      routing: vi.fn().mockResolvedValue(routingSteps),
    });
    const user = userEvent.setup();

    render(<OrdersPage api={api} canManage />);

    await waitFor(() => {
      expect(screen.getByText("OF-2026-002")).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText("View order OF-2026-002"));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/production/orders/o2");
    });
  });
});
