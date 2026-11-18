import { useEffect, useMemo, useState } from "react";
import {
  ApiFailure,
  httpOrdersApi,
  type Article,
  type Client,
  type CreatedOrder,
  type FieldErrors,
  type OrdersApi,
} from "../api";

type Props = {
  api?: OrdersApi;
};

type FormValues = {
  reference: string;
  clientId: string;
  articleId: string;
  quantity: string;
  dueDate: string;
};

const emptyValues: FormValues = {
  reference: "",
  clientId: "",
  articleId: "",
  quantity: "",
  dueDate: "",
};

export function validateOrder(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const reference = values.reference.trim();

  if (!reference) {
    errors.reference = "Reference is required.";
  } else if (reference.length > 64) {
    errors.reference = "Reference must be at most 64 characters.";
  }

  if (!values.clientId) {
    errors.clientId = "Client is required.";
  }

  if (!values.articleId) {
    errors.articleId = "Article is required.";
  }

  if (!values.quantity.trim()) {
    errors.quantity = "Quantity is required.";
  } else {
    const quantity = Number(values.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.quantity = "Quantity must be greater than zero.";
    } else if (quantity > 1_000_000) {
      errors.quantity = "Quantity must be at most 1000000.";
    }
  }

  if (!values.dueDate) {
    errors.dueDate = "Due date is required.";
  }

  return errors;
}

export function NewOrderPage({ api = httpOrdersApi }: Props) {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.clients(), api.articles()])
      .then(([loadedClients, loadedArticles]) => {
        if (cancelled) return;
        setClients(loadedClients);
        setArticles(loadedArticles);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("Reference data could not be loaded. Try again in a moment.");
      });

    return () => {
      cancelled = true;
    };
  }, [api]);

  const visibleArticles = useMemo(() => {
    if (!articles) return [];
    if (!values.clientId) return articles;
    return articles.filter((article) => article.clientId === values.clientId);
  }, [articles, values.clientId]);

  const referenceDataMissing =
    (clients !== null && clients.length === 0) ||
    (articles !== null && articles.length === 0);

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateOrder(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.create({
        reference: values.reference.trim(),
        clientId: values.clientId,
        articleId: values.articleId,
        quantity: Number(values.quantity),
        dueDate: values.dueDate,
      });
      setCreated(order);
      setValues(emptyValues);
      setFieldErrors({});
    } catch (error) {
      if (error instanceof ApiFailure) {
        setFieldErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) {
          setFormError(error.message);
        }
      } else {
        setFormError("The order could not be created. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <section className="card card--success" aria-live="polite">
        <h2>Order {created.reference} created</h2>
        <p>
          Status: <strong>{created.status}</strong>
        </p>
        <p>
          {created.quantity} units due {created.dueDate}
        </p>
        <button type="button" onClick={() => setCreated(null)}>
          Create another order
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>New production order</h2>

      {loadError ? (
        <p className="notice notice--error" role="alert">
          {loadError}
        </p>
      ) : null}

      {referenceDataMissing ? (
        <p className="notice" role="status">
          No clients or articles yet. Add reference data before creating an
          order.
        </p>
      ) : null}

      {formError ? (
        <p className="notice notice--error" role="alert">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="reference">Reference</label>
          <input
            id="reference"
            name="reference"
            value={values.reference}
            onChange={(event) => update("reference", event.target.value)}
            aria-invalid={Boolean(fieldErrors.reference)}
            aria-describedby={
              fieldErrors.reference ? "reference-error" : undefined
            }
            placeholder="OF-2026-001"
            autoComplete="off"
          />
          {fieldErrors.reference ? (
            <p className="field-error" id="reference-error" role="alert">
              {fieldErrors.reference}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="clientId">Client</label>
          <select
            id="clientId"
            name="clientId"
            value={values.clientId}
            onChange={(event) => {
              update("clientId", event.target.value);
              update("articleId", "");
            }}
            aria-invalid={Boolean(fieldErrors.clientId)}
            aria-describedby={
              fieldErrors.clientId ? "clientId-error" : undefined
            }
          >
            <option value="">Select a client</option>
            {(clients ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {fieldErrors.clientId ? (
            <p className="field-error" id="clientId-error" role="alert">
              {fieldErrors.clientId}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="articleId">Article</label>
          <select
            id="articleId"
            name="articleId"
            value={values.articleId}
            onChange={(event) => update("articleId", event.target.value)}
            aria-invalid={Boolean(fieldErrors.articleId)}
            aria-describedby={
              fieldErrors.articleId ? "articleId-error" : undefined
            }
          >
            <option value="">Select an article</option>
            {visibleArticles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.reference} — {article.label}
              </option>
            ))}
          </select>
          {fieldErrors.articleId ? (
            <p className="field-error" id="articleId-error" role="alert">
              {fieldErrors.articleId}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={values.quantity}
            onChange={(event) => update("quantity", event.target.value)}
            aria-invalid={Boolean(fieldErrors.quantity)}
            aria-describedby={
              fieldErrors.quantity ? "quantity-error" : undefined
            }
          />
          {fieldErrors.quantity ? (
            <p className="field-error" id="quantity-error" role="alert">
              {fieldErrors.quantity}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="dueDate">Due date</label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={values.dueDate}
            onChange={(event) => update("dueDate", event.target.value)}
            aria-invalid={Boolean(fieldErrors.dueDate)}
            aria-describedby={fieldErrors.dueDate ? "dueDate-error" : undefined}
          />
          {fieldErrors.dueDate ? (
            <p className="field-error" id="dueDate-error" role="alert">
              {fieldErrors.dueDate}
            </p>
          ) : null}
        </div>

        <button type="submit" disabled={submitting || referenceDataMissing}>
          {submitting ? "Creating…" : "Create order"}
        </button>
      </form>
    </section>
  );
}
