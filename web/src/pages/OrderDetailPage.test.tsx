import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiFailure, type CreatedOrder, type OrdersApi } from "../api";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { OrderDetailPage } from "./OrderDetailPage";

const order: CreatedOrder = {
  id: "o2",
  reference: "OF-2026-002",
  clientId: "c1",
  articleId: "a1",
  quantity: 120,
  dueDate: "2026-12-01",
  status: "IN_PROGRESS",
  createdAt: "2026-11-20T09:00:00Z",
  updatedAt: "2026-11-20T09:00:00Z",
};

const breakdown = [{ colourId: "col-noir", sizeId: "size-s", quantity: 40 }];

const routingSteps = [
  {
    position: 1,
    label: "Cut the panels",
    phaseId: "phase-cut",
    phaseCode: "CUT",
    machineId: null,
    machineReference: null,
    repetitions: 1,
    minutes: 4,
  },
  {
    position: 2,
    label: "Join the panels",
    phaseId: "phase-sew",
    phaseCode: "SEW",
    machineId: null,
    machineReference: null,
    repetitions: 1,
    minutes: 6,
  },
];

function fakeApi(overrides: Partial<OrdersApi> = {}): OrdersApi {
  const api: OrdersApi = {
    clients: vi.fn().mockResolvedValue([{ id: "c1", name: "Maison Textile", country: "TN" }]),
    articles: vi.fn().mockResolvedValue([
      { id: "a1", reference: "ART-100", label: "Chemise", clientId: "c1", sizeType: "Alpha", unit: "pcs" },
    ]),
    create: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(order),
    transition: vi.fn().mockResolvedValue({ ...order, status: "CANCELLED" }),
    history: vi.fn().mockResolvedValue([]),
    colours: vi.fn().mockResolvedValue([
      { id: "col-noir", code: "NOIR", label: "Noir" },
      { id: "col-ecru", code: "ECRU", label: "Ecru" },
    ]),
    sizes: vi.fn().mockResolvedValue([
      { id: "size-s", code: "S", label: "S", sizeType: "Alpha", unit: "pcs" },
    ]),
    quantities: vi.fn().mockResolvedValue(breakdown),
    setQuantities: vi.fn().mockResolvedValue(breakdown),
    phases: vi.fn().mockResolvedValue([
      { id: "phase-cut", code: "CUT", label: "Cutting" },
      { id: "phase-sew", code: "SEW", label: "Sewing" },
    ]),
    machines: vi.fn().mockResolvedValue([]),
    routing: vi.fn().mockResolvedValue(routingSteps),
    setRouting: vi.fn().mockResolvedValue(routingSteps),
    ...overrides,
  };
  return api;
}

describe("OrderDetailPage", () => {
  beforeEach(() => {
    window.history.pushState(null, "", "/production/orders/o2");
  });

  afterEach(() => {
    window.history.pushState(null, "", "/");
    vi.restoreAllMocks();
  });

  it("asks for a reason in a dialog before cancelling work in progress", async () => {
    const api = fakeApi();
    const prompt = vi.spyOn(window, "prompt");
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    fireEvent.click(screen.getByTestId("transition-cancelled"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Cancel this order?");
    expect(prompt).not.toHaveBeenCalled();
    // The safe choice holds focus in a destructive dialog.
    expect(screen.getByTestId("dialog-cancel")).toHaveFocus();

    fireEvent.change(screen.getByLabelText("Reason for cancelling"), {
      target: { value: "Machine broken" },
    });
    fireEvent.click(screen.getByTestId("dialog-confirm"));

    await waitFor(() =>
      expect(api.transition).toHaveBeenCalledWith("o2", "CANCELLED", "Machine broken"),
    );
    expect(prompt).not.toHaveBeenCalled();
  });

  it("does not cancel without a reason", async () => {
    const api = fakeApi();
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    fireEvent.click(screen.getByTestId("transition-cancelled"));
    fireEvent.click(screen.getByTestId("dialog-confirm"));

    expect(api.transition).not.toHaveBeenCalled();
  });

  it("removes only the requested routing step", async () => {
    const draftOrder: CreatedOrder = { ...order, status: "DRAFT" };
    const api = fakeApi({ get: vi.fn().mockResolvedValue(draftOrder) });
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    await screen.findByText("Join the panels");
    fireEvent.click(screen.getByTestId("edit-routing"));
    expect(await screen.findByLabelText("Label 2")).toHaveValue("Join the panels");

    fireEvent.click(screen.getByRole("button", { name: "Remove step 2" }));

    expect(screen.getByLabelText("Label 1")).toHaveValue("Cut the panels");
    expect(screen.queryByLabelText("Label 2")).not.toBeInTheDocument();
  });

  it("shows the remaining quantity while editing and flags an over-total draft", async () => {
    const draftOrder: CreatedOrder = { ...order, status: "DRAFT" };
    const api = fakeApi({ get: vi.fn().mockResolvedValue(draftOrder) });
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    await screen.findByTestId("quantity-line-0");
    fireEvent.click(screen.getByTestId("edit-breakdown"));

    expect(await screen.findByTestId("breakdown-remaining")).toHaveTextContent(
      "40 of 120 planned — 80 remaining",
    );

    fireEvent.change(screen.getByLabelText("Quantity 1"), {
      target: { value: "150" },
    });

    expect(screen.getByTestId("breakdown-remaining")).toHaveTextContent(
      "150 of 120 planned — 30 over the order quantity",
    );
    expect(screen.getByTestId("breakdown-remaining")).toHaveClass(
      "breakdown-editor__total--over",
    );
  });

  it("ties a rejected breakdown to its quantity lines", async () => {
    const draftOrder: CreatedOrder = { ...order, status: "DRAFT" };
    const api = fakeApi({
      get: vi.fn().mockResolvedValue(draftOrder),
      setQuantities: vi.fn().mockRejectedValue(
        new ApiFailure("VALIDATION_FAILED", "The breakdown could not be saved.", {
          quantity: "Total exceeds the order quantity.",
        }),
      ),
    });
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    await screen.findByTestId("quantity-line-0");
    fireEvent.click(screen.getByTestId("edit-breakdown"));
    fireEvent.click(screen.getByTestId("save-breakdown"));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Total exceeds the order quantity.");

    const quantity = screen.getByLabelText("Quantity 1");
    expect(quantity).toHaveAttribute("aria-invalid", "true");
    const describedBy = quantity.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      "Total exceeds the order quantity.",
    );
  });

  it("ties a rejected routing sheet to its step fields", async () => {
    const draftOrder: CreatedOrder = { ...order, status: "DRAFT" };
    const api = fakeApi({
      get: vi.fn().mockResolvedValue(draftOrder),
      setRouting: vi.fn().mockRejectedValue(
        new ApiFailure("VALIDATION_FAILED", "The routing could not be saved.", {
          label: "Label is required.",
        }),
      ),
    });
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    await screen.findByText("Join the panels");
    fireEvent.click(screen.getByTestId("edit-routing"));
    fireEvent.click(screen.getByTestId("save-routing"));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Label is required.");

    const label = screen.getByLabelText("Label 1");
    expect(label).toHaveAttribute("aria-invalid", "true");
    const describedBy = label.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      "Label is required.",
    );
  });

  it("shows the planned total and reorders routing steps", async () => {
    const draftOrder: CreatedOrder = { ...order, status: "DRAFT" };
    const api = fakeApi({ get: vi.fn().mockResolvedValue(draftOrder) });
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    await screen.findByText("Join the panels");
    fireEvent.click(screen.getByTestId("edit-routing"));

    expect(await screen.findByTestId("routing-total")).toHaveTextContent(
      "Planned minutes per unit: 10",
    );

    fireEvent.click(screen.getByRole("button", { name: "Move step 2 up" }));

    expect(screen.getByLabelText("Label 1")).toHaveValue("Join the panels");
    expect(screen.getByLabelText("Label 2")).toHaveValue("Cut the panels");
  });

  it("confirms before an empty sheet clears the routing", async () => {
    const draftOrder: CreatedOrder = { ...order, status: "DRAFT" };
    const api = fakeApi({ get: vi.fn().mockResolvedValue(draftOrder) });
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    await screen.findByText("Join the panels");
    fireEvent.click(screen.getByTestId("edit-routing"));
    await screen.findByLabelText("Label 2");

    fireEvent.click(screen.getByRole("button", { name: "Remove step 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove step 1" }));
    fireEvent.click(screen.getByTestId("save-routing"));

    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Clear the routing sheet?",
    );
    expect(api.setRouting).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("dialog-confirm"));

    await waitFor(() => expect(api.setRouting).toHaveBeenCalledWith("o2", []));
  });

  it("keeps the breakdown editor open when discarding is declined", async () => {
    const draftOrder: CreatedOrder = { ...order, status: "DRAFT" };
    const api = fakeApi({ get: vi.fn().mockResolvedValue(draftOrder) });
    render(
      <LocaleProvider>
        <OrderDetailPage api={api} canManage />
      </LocaleProvider>,
    );

    await screen.findByText("OF-2026-002");
    await screen.findByTestId("quantity-line-0");
    fireEvent.click(screen.getByTestId("edit-breakdown"));
    fireEvent.change(await screen.findByLabelText("Quantity 1"), {
      target: { value: "55" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Discard unsaved changes?");
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    expect(screen.getByTestId("save-breakdown")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity 1")).toHaveValue(55);
    expect(api.setQuantities).not.toHaveBeenCalled();
  });
});
