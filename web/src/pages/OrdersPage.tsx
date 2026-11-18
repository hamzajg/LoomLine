import { useEffect, useState } from "react";
import {
  httpOrdersApi,
  type Article,
  type Client,
  type CreatedOrder,
  type OrdersApi,
} from "../api";
import { NewOrderPage } from "./NewOrderPage";

type Props = {
  api?: OrdersApi;
};

export function OrdersPage({ api = httpOrdersApi }: Props) {
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [referenceQuery, setReferenceQuery] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CreatedOrder | null>(null);
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
      return;
    }
    api.get(selectedOrderId).then(setSelectedOrder).catch(() => {});
  }, [api, selectedOrderId]);

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
