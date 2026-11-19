import { useEffect, useState } from "react";
import {
  httpOrdersApi,
  type Article,
  type Client,
  type CreatedOrder,
  type OrdersApi,
  type OrderStatus,
  type StatusHistoryEntry,
} from "../api";
import { NewOrderPage } from "./NewOrderPage";

type Props = {
  api?: OrdersApi;
  /** Whether the session may mutate orders; the server still enforces it. */
  canManage?: boolean;
};

/** UI convenience only — the server owns the real transition table. */
const TRANSITIONS: Record<OrderStatus, { to: OrderStatus; label: string }[]> = {
  DRAFT: [
    { to: "RELEASED", label: "Release" },
    { to: "CANCELLED", label: "Cancel" },
  ],
  RELEASED: [
    { to: "IN_PROGRESS", label: "Start work" },
    { to: "CANCELLED", label: "Cancel" },
  ],
  IN_PROGRESS: [
    { to: "COMPLETED", label: "Complete" },
    { to: "CANCELLED", label: "Cancel" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export function OrdersPage({ api = httpOrdersApi, canManage = false }: Props) {
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [referenceQuery, setReferenceQuery] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CreatedOrder | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    Promise.all([api.clients(), api.articles()])
      .then(([c, a]) => {
        setClients(c);
        setArticles(a);
      })
      .catch(() => {});
  }, [api]);

  const fetchOrders = () => {
    setLoading(true);
    api
      .list({
        status: statusFilter || undefined,
        reference: referenceQuery || undefined,
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [api, statusFilter, referenceQuery]);

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      setHistory([]);
      return;
    }
    api.get(selectedOrderId).then(setSelectedOrder).catch(() => {});
    api.history(selectedOrderId).then(setHistory).catch(() => setHistory([]));
  }, [api, selectedOrderId]);

  const runTransition = (to: OrderStatus) => {
    if (!selectedOrder) return;
    setTransitionError(null);
    const reason =
      selectedOrder.status === "IN_PROGRESS" && to === "CANCELLED"
        ? window.prompt("Reason for cancelling this order:")
        : undefined;
    if (reason === null) return; // user dismissed the prompt
    api
      .transition(selectedOrder.id, to, reason ?? undefined)
      .then((updated) => {
        setSelectedOrder(updated);
        fetchOrders();
        return api.history(updated.id);
      })
      .then(setHistory)
      .catch((err: Error) => setTransitionError(err.message));
  };

  const clientName = (id: string) =>
    clients.find((c) => c.id === id)?.name || id;

  const articleLabel = (id: string) => {
    const art = articles.find((a) => a.id === id);
    return art ? `${art.reference} — ${art.label}` : id;
  };

  if (showCreate) {
    return (
      <div className="orders-page">
        <div className="orders-page__nav">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setShowCreate(false);
              fetchOrders();
            }}
          >
            ← Back to orders
          </button>
        </div>
        <NewOrderPage api={api} />
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-page__header">
        <h2>Production orders</h2>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setShowCreate(true)}
        >
          + New order
        </button>
      </div>

      <div className="orders-page__filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            aria-label="Status filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="RELEASED">RELEASED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="reference-search">Search reference</label>
          <input
            id="reference-search"
            aria-label="Search reference"
            type="text"
            placeholder="Search by reference..."
            value={referenceQuery}
            onChange={(e) => setReferenceQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found.</p>
        </div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Client</th>
              <th>Article</th>
              <th>Quantity</th>
              <th>Due date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} data-testid={`order-row-${order.reference}`}>
                <td className="font-mono font-bold">{order.reference}</td>
                <td>{clientName(order.clientId)}</td>
                <td>{articleLabel(order.articleId)}</td>
                <td>{order.quantity}</td>
                <td>{order.dueDate}</td>
                <td>
                  <span className={`status-badge status-badge--${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn--sm"
                    aria-label={`View order ${order.reference}`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedOrder && (
        <div className="modal-backdrop" data-testid="order-detail-modal">
          <div className="order-detail-card">
            <div className="order-detail-card__header">
              <h3>Order details — {selectedOrder.reference}</h3>
              <button
                type="button"
                className="btn btn--icon"
                aria-label="Close details"
                onClick={() => setSelectedOrderId(null)}
              >
                ✕
              </button>
            </div>
            <div className="order-detail-card__body">
              <dl className="detail-list">
                <dt>Reference</dt>
                <dd aria-label="Detail Reference">{selectedOrder.reference}</dd>

                <dt>Status</dt>
                <dd aria-label="Detail Status">
                  <span className={`status-badge status-badge--${selectedOrder.status.toLowerCase()}`}>
                    {selectedOrder.status}
                  </span>
                </dd>

                <dt>Client</dt>
                <dd aria-label="Detail Client">{clientName(selectedOrder.clientId)}</dd>

                <dt>Article</dt>
                <dd aria-label="Detail Article">{articleLabel(selectedOrder.articleId)}</dd>

                <dt>Quantity</dt>
                <dd aria-label="Detail Quantity">{selectedOrder.quantity}</dd>

                <dt>Due date</dt>
                <dd aria-label="Detail Due Date">{selectedOrder.dueDate}</dd>
              </dl>

              {canManage && TRANSITIONS[selectedOrder.status].length > 0 && (
                <div className="order-transitions">
                  {transitionError && (
                    <p className="form-error" role="alert">
                      {transitionError}
                    </p>
                  )}
                  {TRANSITIONS[selectedOrder.status].map((action) => (
                    <button
                      key={action.to}
                      type="button"
                      className="btn btn--secondary"
                      data-testid={`transition-${action.to.toLowerCase()}`}
                      onClick={() => runTransition(action.to)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <div className="order-history">
                  <h4>Status history</h4>
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
          </div>
        </div>
      )}
    </div>
  );
}
