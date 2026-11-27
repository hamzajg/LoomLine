import { useEffect, useState } from "react";
import { navigate } from "../router";
import {
  httpOrdersApi,
  type Article,
  type Client,
  type CreatedOrder,
  type OrdersApi,
} from "../api";
import { NEW_ORDER_PATH } from "../navigation";

type Props = {
  api?: OrdersApi;
  /** Whether the session may mutate orders; the server still enforces it. */
  canManage?: boolean;
};

const FILTERS_KEY = "loomline.orders.filters";

/**
 * The list keeps its filter while a detail is opened and closed (see the
 * feature's experience contract). The detail is a separate route that
 * replaces this component, so the filter lives in session storage rather
 * than in component state.
 */
function storedFilters(): { status: string; reference: string } {
  try {
    const raw = window.sessionStorage.getItem(FILTERS_KEY);
    if (!raw) return { status: "", reference: "" };
    const parsed = JSON.parse(raw) as { status?: unknown; reference?: unknown };
    return {
      status: typeof parsed.status === "string" ? parsed.status : "",
      reference: typeof parsed.reference === "string" ? parsed.reference : "",
    };
  } catch {
    return { status: "", reference: "" };
  }
}

export function OrdersPage({ api = httpOrdersApi, canManage = false }: Props) {
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(
    () => storedFilters().status,
  );
  const [referenceQuery, setReferenceQuery] = useState<string>(
    () => storedFilters().reference,
  );

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ status: statusFilter, reference: referenceQuery }),
      );
    } catch {
      // Storage unavailable: the filter still holds for this visit.
    }
  }, [statusFilter, referenceQuery]);
  const [loading, setLoading] = useState(true);

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

  const clientName = (id: string) =>
    clients.find((c) => c.id === id)?.name || id;

  const articleLabel = (id: string) => {
    const art = articles.find((a) => a.id === id);
    return art ? `${art.reference} — ${art.label}` : id;
  };

  const filtered = statusFilter !== "" || referenceQuery.trim() !== "";

  const clearFilters = () => {
    setStatusFilter("");
    setReferenceQuery("");
  };

  return (
    <div className="orders-page">
      <div className="orders-page__header">
        <h2>Production orders</h2>
        {canManage && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate(NEW_ORDER_PATH)}
          >
            + New order
          </button>
        )}
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
        <div className="empty-state" data-testid="orders-empty">
          {filtered ? (
            <>
              <p>No orders match these filters.</p>
              <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p>No orders yet. Create the first production order.</p>
              {canManage ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => navigate(NEW_ORDER_PATH)}
                >
                  + New order
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <table className="orders-table">
          <caption className="visually-hidden">Production orders</caption>
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
                    onClick={() => navigate(`/production/orders/${order.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}