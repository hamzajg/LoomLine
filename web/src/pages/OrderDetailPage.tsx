import { useEffect, useRef, useState } from "react";
import { navigate } from "../router";
import {
  ApiFailure,
  httpOrdersApi,
  type Article,
  type Client,
  type Colour,
  type CreatedOrder,
  type MachineResponse,
  type OrdersApi,
  type OrderStatus,
  type PhaseResponse,
  type QuantityLine,
  type QuantityLineResponse,
  type RoutingStepInput,
  type RoutingStepResponse,
  type Size,
  type StatusHistoryEntry,
} from "../api";
import { useLocale } from "../i18n/LocaleProvider";
import { useRoute } from "../router";
import { Dialog } from "../shell/Dialog";

/** UI convenience only — the server owns the real transition table. */
const TRANSITIONS: Record<OrderStatus, { to: OrderStatus; label: string }[]> = {
  DRAFT: [
    { to: "RELEASED", label: "Release" },
    { to: "CANCELLED", label: "Cancel order" },
  ],
  RELEASED: [
    { to: "IN_PROGRESS", label: "Start work" },
    { to: "CANCELLED", label: "Cancel order" },
  ],
  IN_PROGRESS: [
    { to: "COMPLETED", label: "Complete" },
    { to: "CANCELLED", label: "Cancel order" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

type Props = {
  api?: OrdersApi;
  /** Whether the session may mutate orders; the server still enforces it. */
  canManage?: boolean;
};

export function OrderDetailPage({ api = httpOrdersApi, canManage = false }: Props) {
  const { t } = useLocale();
  const { path } = useRoute();
  const orderId = path.split("/").pop() || "";

  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [quantities, setQuantities] = useState<QuantityLineResponse[]>([]);
  const [routing, setRouting] = useState<RoutingStepResponse[]>([]);
  const [phases, setPhases] = useState<PhaseResponse[]>([]);
  const [machines, setMachines] = useState<MachineResponse[]>([]);
  const [colours, setColours] = useState<Colour[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [editingBreakdown, setEditingBreakdown] = useState(false);
  const [editingRouting, setEditingRouting] = useState(false);
  const [draftLines, setDraftLines] = useState<QuantityLine[]>([]);
  const [draftSteps, setDraftSteps] = useState<RoutingStepInput[]>([]);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingBreakdown, setSavingBreakdown] = useState(false);
  const [savingRouting, setSavingRouting] = useState(false);
  const [savingTransition, setSavingTransition] = useState(false);
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState<"breakdown" | "routing" | null>(null);
  const [confirmClearRouting, setConfirmClearRouting] = useState(false);
  // Snapshot of each editor's draft when opened, so closing can tell whether
  // the user would lose work.
  const [breakdownBaseline, setBreakdownBaseline] = useState("");
  const [routingBaseline, setRoutingBaseline] = useState("");
  const [restoreFocus, setRestoreFocus] = useState<"breakdown" | "routing" | null>(null);
  const breakdownEditorRef = useRef<HTMLDivElement | null>(null);
  const routingEditorRef = useRef<HTMLDivElement | null>(null);
  const breakdownOpenerRef = useRef<HTMLButtonElement | null>(null);
  const routingOpenerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    Promise.all([api.clients(), api.articles(), api.phases(), api.machines(), api.colours(), api.sizes()])
      .then(([c, a, p, m, col, s]) => {
        setClients(c);
        setArticles(a);
        setPhases(p);
        setMachines(m);
        setColours(col);
        setSizes(s);
      })
      .catch(() => {});
  }, [api]);

  const fetchOrder = () => {
    if (!orderId) return;
    setLoading(true);
    api
      .get(orderId)
      .then((data) => {
        setOrder(data);
        setLoading(false);
        return api.history(data.id);
      })
      .then(setHistory)
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [api, orderId]);

  useEffect(() => {
    if (order) {
      api.quantities(order.id).then(setQuantities).catch(() => {});
      api.routing(order.id).then(setRouting).catch(() => {});
    }
  }, [api, order]);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name || id;
  const articleLabel = (id: string) => {
    const art = articles.find((a) => a.id === id);
    return art ? `${art.reference} — ${art.label}` : id;
  };
  const colourLabel = (id: string) => colours.find((c) => c.id === id)?.label || id;
  const sizeLabel = (id: string) => sizes.find((s) => s.id === id)?.code || id;
  const phaseLabel = (id: string) => phases.find((p) => p.id === id)?.label || id;
  const machineLabel = (id: string | null) => (id ? machines.find((m) => m.id === id)?.label || "None" : "None");
  const articleSizeType = order?.articleId ? articles.find((a) => a.id === order.articleId)?.sizeType : undefined;

  const startEditingBreakdown = (event: React.MouseEvent<HTMLButtonElement>) => {
    breakdownOpenerRef.current = event.currentTarget;
    const draft = quantities.map((q) => ({
      colourId: q.colourId,
      sizeId: q.sizeId,
      quantity: q.quantity,
    }));
    setDraftLines(draft);
    setBreakdownBaseline(JSON.stringify(draft));
    setBreakdownError(null);
    setEditingBreakdown(true);
  };

  const closeBreakdown = () => {
    setEditingBreakdown(false);
    setBreakdownError(null);
    setConfirmDiscard(null);
    setRestoreFocus("breakdown");
  };

  const requestCloseBreakdown = () => {
    if (JSON.stringify(draftLines) !== breakdownBaseline) setConfirmDiscard("breakdown");
    else closeBreakdown();
  };

  const saveBreakdown = () => {
    if (!order) return;
    setBreakdownError(null);
    setSavingBreakdown(true);
    api
      .setQuantities(order.id, draftLines)
      .then((saved) => {
        setQuantities(saved);
        setBreakdownBaseline(JSON.stringify(draftLines));
        closeBreakdown();
        fetchOrder();
      })
      .catch((err: Error) =>
        setBreakdownError(
          err instanceof ApiFailure
            ? Object.values(err.fieldErrors).join(" ") || err.message
            : err.message,
        ),
      )
      .finally(() => setSavingBreakdown(false));
  };

  const startEditingRouting = (event: React.MouseEvent<HTMLButtonElement>) => {
    routingOpenerRef.current = event.currentTarget;
    const draft = routing.map((r) => ({
      position: r.position,
      label: r.label,
      phaseId: r.phaseId,
      machineId: r.machineId,
      repetitions: r.repetitions,
      minutes: r.minutes,
    }));
    setDraftSteps(draft);
    setRoutingBaseline(JSON.stringify(draft));
    setRoutingError(null);
    setEditingRouting(true);
  };

  const closeRouting = () => {
    setEditingRouting(false);
    setRoutingError(null);
    setConfirmDiscard(null);
    setRestoreFocus("routing");
  };

  const requestCloseRouting = () => {
    if (JSON.stringify(draftSteps) !== routingBaseline) setConfirmDiscard("routing");
    else closeRouting();
  };

  const saveRouting = () => {
    if (!order) return;
    setRoutingError(null);
    // An empty sheet clears the routing; that is a destructive write, so it
    // asks before it happens.
    if (draftSteps.length === 0 && routing.length > 0) {
      setConfirmClearRouting(true);
      return;
    }
    submitRouting();
  };

  const submitRouting = () => {
    if (!order) return;
    setSavingRouting(true);
    api
      .setRouting(order.id, draftSteps)
      .then((saved) => {
        setRouting(saved);
        setRoutingBaseline(JSON.stringify(draftSteps));
        closeRouting();
        fetchOrder();
      })
      .catch((err: Error) =>
        setRoutingError(
          err instanceof ApiFailure
            ? Object.values(err.fieldErrors).join(" ") || err.message
            : err.message,
        ),
      )
      .finally(() => setSavingRouting(false));
  };

  const applyTransition = (to: OrderStatus, reason?: string) => {
    if (!order) return;
    setTransitionError(null);
    setSavingTransition(true);
    api
      .transition(order.id, to, reason)
      .then((updated) => {
        setOrder(updated);
        fetchOrder();
        return api.history(updated.id);
      })
      .then(setHistory)
      .catch((err: Error) => setTransitionError(err.message))
      .finally(() => setSavingTransition(false));
  };

  const runTransition = (to: OrderStatus) => {
    if (!order) return;
    // A cancelled order in progress must say why; the short blocking decision
    // is a modal, never a browser prompt.
    if (order.status === "IN_PROGRESS" && to === "CANCELLED") {
      setCancelReason("");
      setConfirmCancellation(true);
      return;
    }
    applyTransition(to);
  };

  // Inline editors take focus when opened and hand it back when closed.
  useEffect(() => {
    if (editingBreakdown) {
      breakdownEditorRef.current?.querySelector<HTMLElement>("select, input")?.focus();
    }
  }, [editingBreakdown]);

  useEffect(() => {
    if (editingRouting) {
      routingEditorRef.current?.querySelector<HTMLElement>("input, select")?.focus();
    }
  }, [editingRouting]);

  useEffect(() => {
    if (!restoreFocus) return;
    if (restoreFocus === "breakdown") breakdownOpenerRef.current?.focus();
    else routingOpenerRef.current?.focus();
    setRestoreFocus(null);
  }, [restoreFocus]);

  const goBack = () => {
    navigate("/production/orders");
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-page__header">
          <button type="button" className="btn btn--secondary" onClick={goBack}>
            ← {t("item.orders")}
          </button>
        </div>
        <p className="loading">{t("loading")}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="orders-page">
        <div className="orders-page__header">
          <button type="button" className="btn btn--secondary" onClick={goBack}>
            ← {t("item.orders")}
          </button>
        </div>
        <div className="empty-state">
          <p>{t("notAvailable")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-page__header">
        <button type="button" className="btn btn--secondary" onClick={goBack} data-testid="back-to-orders">
          ← {t("item.orders")}
        </button>
        <h2>{t("item.orderDetail")} — {order.reference}</h2>
      </div>

      <div className="card">
        <dl className="detail-list">
          <dt>{t("field.reference")}</dt>
          <dd aria-label="Detail Reference">{order.reference}</dd>

          <dt>{t("field.status")}</dt>
          <dd aria-label="Detail Status" aria-live="polite">
            <span className={`status-badge status-badge--${order.status.toLowerCase()}`}>
              {t(`status.${order.status.toLowerCase()}`) || order.status}
            </span>
          </dd>

          <dt>{t("field.client")}</dt>
          <dd aria-label="Detail Client">{clientName(order.clientId)}</dd>

          <dt>{t("field.article")}</dt>
          <dd aria-label="Detail Article">{articleLabel(order.articleId)}</dd>

          <dt>{t("field.quantity")}</dt>
          <dd aria-label="Detail Quantity">{order.quantity}</dd>

          <dt>{t("field.dueDate")}</dt>
          <dd aria-label="Detail Due Date">{order.dueDate}</dd>
        </dl>

        {canManage && TRANSITIONS[order.status].length > 0 && (
          <div className="order-transitions">
            {transitionError && (
              <p className="form-error" role="alert">{transitionError}</p>
            )}
            {TRANSITIONS[order.status].map((action) => (
              <button
                key={action.to}
                type="button"
                className="btn btn--secondary"
                data-testid={`transition-${action.to.toLowerCase()}`}
                onClick={() => runTransition(action.to)}
                disabled={savingTransition}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <div className="order-breakdown">
          <div className="order-breakdown__header">
            <h3>Colour / size breakdown</h3>
            {canManage && order.status !== "IN_PROGRESS" && order.status !== "COMPLETED" && order.status !== "CANCELLED" && !editingBreakdown && (
              <button
                type="button"
                className="btn btn--sm"
                ref={breakdownOpenerRef}
                data-testid="edit-breakdown"
                onClick={startEditingBreakdown}
              >
                {t("edit")}
              </button>
            )}
          </div>

          {!editingBreakdown ? (
            quantities.length === 0 ? (
              <p className="empty-state">No breakdown recorded.</p>
            ) : (
              <div className="table-wrapper">
                <table className="orders-table orders-table--compact">
                  <caption className="visually-hidden">Colour / size breakdown</caption>
                  <thead>
                    <tr>
                      <th>Colour</th>
                      <th>Size</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quantities.map((q, i) => (
                      <tr key={i} data-testid={`quantity-line-${i}`}>
                        <td>{colourLabel(q.colourId)}</td>
                        <td>{sizeLabel(q.sizeId)}</td>
                        <td>{q.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div
              className="breakdown-editor"
              ref={breakdownEditorRef}
              role="group"
              aria-label="Colour / size breakdown editor"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  requestCloseBreakdown();
                }
              }}
            >
              {breakdownError && (
                <p className="form-error" id="breakdown-error" role="alert">
                  {breakdownError}
                </p>
              )}
              <div className="breakdown-editor__row breakdown-editor__row--head" aria-hidden="true">
                <span>Colour</span>
                <span>Size</span>
                <span>Quantity</span>
                <span />
              </div>
              {draftLines.map((line, i) => (
                <div className="breakdown-editor__row" key={i}>
                  <select
                    aria-label={`Colour ${i + 1}`}
                    aria-invalid={breakdownError ? true : undefined}
                    aria-describedby={breakdownError ? "breakdown-error" : undefined}
                    value={line.colourId}
                    onChange={(e) =>
                      setDraftLines((prev) =>
                        prev.map((l, j) => (j === i ? { ...l, colourId: e.target.value } : l)),
                      )
                    }
                  >
                    <option value="">Colour…</option>
                    {colours.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`Size ${i + 1}`}
                    aria-invalid={breakdownError ? true : undefined}
                    aria-describedby={breakdownError ? "breakdown-error" : undefined}
                    value={line.sizeId}
                    onChange={(e) =>
                      setDraftLines((prev) =>
                        prev.map((l, j) => (j === i ? { ...l, sizeId: e.target.value } : l)),
                      )
                    }
                  >
                    <option value="">Size…</option>
                    {sizes
                      .filter((s) => !articleSizeType || s.sizeType === articleSizeType)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} ({s.sizeType})
                        </option>
                      ))}
                  </select>
                  <input
                    aria-label={`Quantity ${i + 1}`}
                    aria-invalid={breakdownError ? true : undefined}
                    aria-describedby={breakdownError ? "breakdown-error" : undefined}
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      setDraftLines((prev) =>
                        prev.map((l, j) => (j === i ? { ...l, quantity: Number(e.target.value) } : l)),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="btn btn--sm"
                    aria-label={`Remove line ${i + 1}`}
                    onClick={() => setDraftLines((prev) => prev.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(() => {
                const planned = draftLines.reduce(
                  (sum, line) => sum + (Number.isFinite(line.quantity) ? line.quantity : 0),
                  0,
                );
                const remaining = order.quantity - planned;
                const over = remaining < 0;
                return (
                  <p
                    className={`breakdown-editor__total${over ? " breakdown-editor__total--over" : ""}`}
                    data-testid="breakdown-remaining"
                    role="status"
                    aria-live="polite"
                  >
                    {over
                      ? `${planned} of ${order.quantity} planned — ${Math.abs(remaining)} over the order quantity`
                      : `${planned} of ${order.quantity} planned — ${remaining} remaining`}
                  </p>
                );
              })()}
              <div className="breakdown-editor__actions">
                <button
                  type="button"
                  className="btn btn--sm"
                  data-testid="add-line"
                  onClick={() =>
                    setDraftLines((prev) => [...prev, { colourId: "", sizeId: "", quantity: 1 }])
                  }
                >
                  + Add line
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  data-testid="save-breakdown"
                  onClick={saveBreakdown}
                  disabled={savingBreakdown}
                >
                  {savingBreakdown ? t("saving") : t("save")}
                </button>
                <button type="button" className="btn btn--secondary" onClick={requestCloseBreakdown}>
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="order-routing">
          <div className="order-breakdown__header">
            <h3>Production routing</h3>
            {order.status === "IN_PROGRESS" && routing.length > 0 && (
              <p className="form-error" role="alert" data-testid="routing-locked">
                Routing locked — order is in progress
              </p>
            )}
            {canManage && order.status !== "IN_PROGRESS" && order.status !== "COMPLETED" && order.status !== "CANCELLED" && !editingRouting && (
              <button
                type="button"
                className="btn btn--sm"
                ref={routingOpenerRef}
                data-testid="edit-routing"
                onClick={startEditingRouting}
              >
                {t("edit")}
              </button>
            )}
          </div>

          {!editingRouting ? (
            routing.length === 0 ? (
              <p className="empty-state">No routing sheet recorded.</p>
            ) : (
              <div className="table-wrapper">
                <table className="orders-table orders-table--compact">
                  <caption className="visually-hidden">Production routing</caption>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Label</th>
                      <th>Phase</th>
                      <th>Machine</th>
                      <th>Reps</th>
                      <th>Min.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routing.map((r) => (
                      <tr key={r.position} data-testid={`routing-step-${r.position}`}>
                        <td>{r.position}</td>
                        <td>{r.label}</td>
                        <td>{phaseLabel(r.phaseId)}</td>
                        <td>{machineLabel(r.machineId)}</td>
                        <td>{r.repetitions}</td>
                        <td>{r.minutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div
              className="breakdown-editor"
              ref={routingEditorRef}
              role="group"
              aria-label="Production routing editor"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  requestCloseRouting();
                }
              }}
            >
              {routingError && <p className="form-error" role="alert">{routingError}</p>}
              {draftSteps.map((step, i) => (
                <div className="breakdown-editor__row" key={i}>
                  <input
                    aria-label={`Label ${i + 1}`}
                    type="text"
                    value={step.label}
                    onChange={(e) =>
                      setDraftSteps((prev) =>
                        prev.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)),
                      )
                    }
                  />
                  <select
                    aria-label={`Phase ${i + 1}`}
                    value={step.phaseId}
                    onChange={(e) =>
                      setDraftSteps((prev) =>
                        prev.map((s, j) => (j === i ? { ...s, phaseId: e.target.value } : s)),
                      )
                    }
                  >
                    <option value="">Phase…</option>
                    {phases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`Machine ${i + 1}`}
                    value={step.machineId ?? ""}
                    onChange={(e) =>
                      setDraftSteps((prev) =>
                        prev.map((s, j) => (j === i ? { ...s, machineId: e.target.value || null } : s)),
                      )
                    }
                  >
                    <option value="">None</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.reference} — {m.label} ({m.active ? "active" : "inactive"})
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={`Reps ${i + 1}`}
                    type="number"
                    min={1}
                    value={step.repetitions}
                    onChange={(e) =>
                      setDraftSteps((prev) =>
                        prev.map((s, j) => (j === i ? { ...s, repetitions: Number(e.target.value) } : s)),
                      )
                    }
                  />
                  <input
                    aria-label={`Minutes ${i + 1}`}
                    type="number"
                    min={1}
                    value={step.minutes}
                    onChange={(e) =>
                      setDraftSteps((prev) =>
                        prev.map((s, j) => (j === i ? { ...s, minutes: Number(e.target.value) } : s)),
                      )
                    }
                  />
                  <div className="breakdown-editor__row-actions">
                    <button
                      type="button"
                      className="btn btn--sm"
                      aria-label={`Move step ${i + 1} up`}
                      disabled={i === 0}
                      onClick={() => setDraftSteps((prev) => moveStep(prev, i, i - 1))}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm"
                      aria-label={`Move step ${i + 1} down`}
                      disabled={i === draftSteps.length - 1}
                      onClick={() => setDraftSteps((prev) => moveStep(prev, i, i + 1))}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm"
                      aria-label={`Remove step ${i + 1}`}
                      onClick={() =>
                        setDraftSteps((prev) =>
                          prev.filter((_, j) => j !== i).map((s, j) => ({ ...s, position: j + 1 })),
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <p className="breakdown-editor__total" data-testid="routing-total">
                Planned minutes per unit:{" "}
                {draftSteps.reduce(
                  (sum, step) =>
                    sum +
                    (Number.isFinite(step.minutes) ? step.minutes : 0) *
                      (Number.isFinite(step.repetitions) ? step.repetitions : 0),
                  0,
                )}
              </p>
              <div className="breakdown-editor__actions">
                <button
                  type="button"
                  className="btn btn--sm"
                  data-testid="add-routing-step"
                  onClick={() =>
                    setDraftSteps((prev) => [
                      ...prev,
                      { position: prev.length + 1, label: "", phaseId: "", machineId: null, repetitions: 1, minutes: 1 },
                    ])
                  }
                >
                  + Add step
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  data-testid="save-routing"
                  onClick={saveRouting}
                  disabled={savingRouting}
                >
                  {savingRouting ? t("saving") : t("save")}
                </button>
                <button type="button" className="btn btn--secondary" onClick={requestCloseRouting}>
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="order-history">
            <h3>Status history</h3>
            <ul>
              {history.map((entry, i) => (
                <li key={i}>
                  {entry.fromStatus ?? "—"} → {entry.toStatus}
                  {entry.reason ? ` (${entry.reason})` : ""} —{" "}
                  {new Date(entry.changedAt).toLocaleString()} by{" "}
                  {entry.changedBy}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {confirmCancellation ? (
        <Dialog
          title={t("cancelOrderTitle")}
          description={t("cancelOrderBody")}
          confirmLabel={savingTransition ? t("saving") : t("confirmCancelOrder")}
          onCancel={() => setConfirmCancellation(false)}
          onConfirm={() => {
            if (!cancelReason.trim()) return;
            applyTransition("CANCELLED", cancelReason.trim());
            setConfirmCancellation(false);
          }}
          destructive
          busy={savingTransition}
        >
          <div className="field">
            <label htmlFor="cancel-reason">{t("cancelReason")}</label>
            <input
              id="cancel-reason"
              type="text"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              aria-required="true"
              aria-describedby="cancel-reason-hint"
            />
            <p id="cancel-reason-hint" className="field-hint">
              {t("cancelReasonRequired")}
            </p>
          </div>
        </Dialog>
      ) : null}

      {confirmClearRouting ? (
        <Dialog
          title={t("clearRoutingTitle")}
          description={t("clearRoutingBody")}
          confirmLabel={t("clearRouting")}
          onCancel={() => setConfirmClearRouting(false)}
          onConfirm={() => {
            setConfirmClearRouting(false);
            submitRouting();
          }}
          destructive
          busy={savingRouting}
        />
      ) : null}

      {confirmDiscard ? (
        <Dialog
          title={t("discardTitle")}
          description={t("discardBody")}
          confirmLabel={t("discard")}
          cancelLabel={t("keepEditing")}
          onCancel={() => setConfirmDiscard(null)}
          onConfirm={() =>
            confirmDiscard === "breakdown" ? closeBreakdown() : closeRouting()
          }
          destructive
        />
      ) : null}
    </div>
  );
}

/** Move a routing step and renumber positions, so the sheet stays 1..n. */
function moveStep(steps: RoutingStepInput[], from: number, to: number) {
  const next = [...steps];
  const moved = next[from];
  if (!moved) return next;
  next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((step, index) => ({ ...step, position: index + 1 }));
}

// Helper to get the article's size type for filtering sizes in breakdown editor
