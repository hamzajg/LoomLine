import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ApiFailure,
  httpCatalogueApi,
  type Article,
  type CatalogueApi,
  type Client,
  type Colour,
  type Size,
} from "../api";
import { useLocale } from "../i18n/LocaleProvider";

type Props = {
  api?: CatalogueApi;
  /** Whether the session may mutate catalogue rows; the server still enforces it. */
  canManage?: boolean;
};

type Tab = "articles" | "colours" | "sizes";

type Column<T> = { header: string; cell: (item: T) => ReactNode };

type FieldKind = "text" | "select";

type FieldSpec = {
  name: string;
  label: string;
  kind?: FieldKind;
  options?: { value: string; label: string }[];
  required?: boolean;
};

type Crud<T extends { id: string }> = {
  search: (query: string) => Promise<T[]>;
  create: (payload: Record<string, string>) => Promise<T>;
  update: (id: string, payload: Record<string, string>) => Promise<T>;
  remove: (id: string) => Promise<void>;
};

type Editing = { id: string | null; values: Record<string, string> };

function EntityPanel<T extends { id: string }>({
  title,
  crud,
  columns,
  fields,
  canManage,
  emptyValues,
  toForm,
  toPayload,
}: {
  title: string;
  crud: Crud<T>;
  columns: Column<T>[];
  fields: FieldSpec[];
  canManage: boolean;
  emptyValues: Record<string, string>;
  toForm: (item: T) => Record<string, string>;
  toPayload: (values: Record<string, string>) => Record<string, string>;
}) {
  const { t } = useLocale();
  const [items, setItems] = useState<T[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(
    (q: string) => {
      crud
        .search(q)
        .then((data) => {
          setItems(data);
          setFailed(false);
        })
        .catch(() => setFailed(true));
    },
    [crud],
  );

  useEffect(() => {
    setItems(null);
    reload("");
  }, [reload]);

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    reload(query.trim());
  }

  function startCreate() {
    setError(null);
    setFieldErrors({});
    setNotice(null);
    setEditing({ id: null, values: { ...emptyValues } });
  }

  function startEdit(item: T) {
    setError(null);
    setFieldErrors({});
    setNotice(null);
    setEditing({ id: item.id, values: toForm(item) });
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const payload = toPayload(editing.values);
      if (editing.id === null) {
        await crud.create(payload);
      } else {
        await crud.update(editing.id, payload);
      }
      setEditing(null);
      setNotice(t("saved"));
      reload(query.trim());
    } catch (err) {
      if (err instanceof ApiFailure) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError(t("saveFailed"));
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: T) {
    if (!window.confirm(t("confirmDelete"))) return;
    setError(null);
    try {
      await crud.remove(item.id);
      setNotice(t("deleted"));
      reload(query.trim());
    } catch (err) {
      if (err instanceof ApiFailure) {
        setError(err.message);
      } else {
        setError(t("deleteFailed"));
      }
    }
  }

  return (
    <section className="catalogue-panel" data-testid={`panel-${title.toLowerCase()}`}>
      <div className="orders-page__header">
        <h2>{title}</h2>
        {canManage ? (
          <button type="button" className="btn btn--primary" onClick={startCreate}>
            {t("newEntry")}
          </button>
        ) : null}
      </div>

      <form className="orders-page__filters" onSubmit={onSearch}>
        <div className="filter-group">
          <label htmlFor={`search-${title}`}>{t("search")}</label>
          <input
            id={`search-${title}`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <button type="submit" className="btn btn--secondary">
          {t("search")}
        </button>
      </form>

      {editing ? (
        <form className="card" onSubmit={onSave} data-testid="entry-form">
          <h3>{editing.id === null ? t("newEntry") : t("editEntry")}</h3>
          {fields.map((field) => (
            <div className="field" key={field.name}>
              <label htmlFor={`f-${field.name}`}>{field.label}</label>
              {field.kind === "select" ? (
                <select
                  id={`f-${field.name}`}
                  value={editing.values[field.name] ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      values: { ...editing.values, [field.name]: e.target.value },
                    })
                  }
                  required={field.required}
                >
                  <option value="">—</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`f-${field.name}`}
                  type="text"
                  value={editing.values[field.name] ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      values: { ...editing.values, [field.name]: e.target.value },
                    })
                  }
                  required={field.required}
                />
              )}
              {fieldErrors[field.name] ? (
                <p className="field-error">{fieldErrors[field.name]}</p>
              ) : null}
            </div>
          ))}
          {error ? <p className="form-error" data-testid="form-error">{error}</p> : null}
          <div className="breakdown-editor__actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? t("saving") : t("save")}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setEditing(null)}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      ) : null}

      {notice ? <p className="notice" data-testid="panel-notice">{notice}</p> : null}
      {failed ? <p className="empty-state">{t("loadFailed")}</p> : null}
      {items === null && !failed ? <p className="loading">{t("loading")}</p> : null}
      {items !== null ? (
        <table className="orders-table" data-testid="entries-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.header}>{col.header}</th>
              ))}
              {canManage ? <th>{t("actions")}</th> : null}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (canManage ? 1 : 0)}>
                  <p className="empty-state">{t("emptyCatalogue")}</p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  {columns.map((col) => (
                    <td key={col.header}>{col.cell(item)}</td>
                  ))}
                  {canManage ? (
                    <td>
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={() => startEdit(item)}
                      >
                        {t("edit")}
                      </button>{" "}
                      <button
                        type="button"
                        className="btn btn--sm btn--icon"
                        onClick={() => onDelete(item)}
                      >
                        {t("delete")}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}

export function CataloguePage({ api = httpCatalogueApi, canManage = false }: Props) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("articles");
  const [clients, setClients] = useState<Client[]>([]);
  const [sizeTypes, setSizeTypes] = useState<string[]>([]);

  useEffect(() => {
    api.clients().then(setClients).catch(() => {});
    api
      .searchSizes()
      .then((sizes) =>
        setSizeTypes([...new Set(sizes.map((s) => s.sizeType))].sort()),
      )
      .catch(() => {});
  }, [api]);

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const sizeTypeOptions = sizeTypes.map((st) => ({ value: st, label: st }));

  const articleCrud: Crud<Article> = {
    search: (q) => api.searchArticles(q),
    create: (p) =>
      api.createArticle({
        reference: p.reference ?? "",
        label: p.label ?? "",
        clientId: p.clientId ?? "",
        sizeType: p.sizeType || null,
        unit: p.unit ?? "",
      }),
    update: (id, p) =>
      api.updateArticle(id, {
        reference: p.reference ?? "",
        label: p.label ?? "",
        clientId: p.clientId ?? "",
        sizeType: p.sizeType || null,
        unit: p.unit ?? "",
      }),
    remove: (id) => api.deleteArticle(id),
  };

  const colourCrud: Crud<Colour> = {
    search: (q) => api.searchColours(q),
    create: (p) =>
      api.createColour({ code: p.code ?? "", label: p.label ?? "" }),
    update: (id, p) =>
      api.updateColour(id, { code: p.code ?? "", label: p.label ?? "" }),
    remove: (id) => api.deleteColour(id),
  };

  const sizeCrud: Crud<Size> = {
    search: (q) => api.searchSizes(q),
    create: (p) =>
      api.createSize({
        code: p.code ?? "",
        label: p.label ?? "",
        sizeType: p.sizeType ?? "",
      }),
    update: (id, p) =>
      api.updateSize(id, {
        code: p.code ?? "",
        label: p.label ?? "",
        sizeType: p.sizeType ?? "",
      }),
    remove: (id) => api.deleteSize(id),
  };

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="orders-page catalogue-page">
      <div className="orders-page__header">
        <h1>{t("catalogueTitle")}</h1>
      </div>
      <nav className="orders-page__nav" aria-label={t("catalogueTitle")}>
        {(["articles", "colours", "sizes"] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "btn btn--primary" : "btn btn--secondary"}
            onClick={() => setTab(id)}
          >
            {t(`catalogue.${id}`)}
          </button>
        ))}
      </nav>

      {tab === "articles" ? (
        <EntityPanel<Article>
          title={t("catalogue.articles")}
          crud={articleCrud}
          canManage={canManage}
          emptyValues={{ reference: "", label: "", clientId: "", sizeType: "", unit: "" }}
          toForm={(a) => ({
            reference: a.reference,
            label: a.label,
            clientId: a.clientId,
            sizeType: a.sizeType ?? "",
            unit: a.unit,
          })}
          toPayload={(v) => ({ ...v })}
          fields={[
            { name: "reference", label: t("field.reference"), required: true },
            { name: "label", label: t("field.label"), required: true },
            {
              name: "clientId",
              label: t("field.client"),
              kind: "select",
              options: clientOptions,
              required: true,
            },
            {
              name: "sizeType",
              label: t("field.sizeType"),
              kind: "select",
              options: sizeTypeOptions,
            },
            { name: "unit", label: t("field.unit"), required: true },
          ]}
          columns={[
            { header: t("field.reference"), cell: (a) => <span className="font-mono font-bold">{a.reference}</span> },
            { header: t("field.label"), cell: (a) => a.label },
            { header: t("field.client"), cell: (a) => clientName(a.clientId) },
            { header: t("field.sizeType"), cell: (a) => a.sizeType ?? "—" },
            { header: t("field.unit"), cell: (a) => a.unit },
          ]}
        />
      ) : null}

      {tab === "colours" ? (
        <EntityPanel<Colour>
          title={t("catalogue.colours")}
          crud={colourCrud}
          canManage={canManage}
          emptyValues={{ code: "", label: "" }}
          toForm={(c) => ({ code: c.code, label: c.label })}
          toPayload={(v) => ({ ...v })}
          fields={[
            { name: "code", label: t("field.code"), required: true },
            { name: "label", label: t("field.label"), required: true },
          ]}
          columns={[
            { header: t("field.code"), cell: (c) => <span className="font-mono font-bold">{c.code}</span> },
            { header: t("field.label"), cell: (c) => c.label },
          ]}
        />
      ) : null}

      {tab === "sizes" ? (
        <EntityPanel<Size>
          title={t("catalogue.sizes")}
          crud={sizeCrud}
          canManage={canManage}
          emptyValues={{ code: "", label: "", sizeType: "" }}
          toForm={(s) => ({ code: s.code, label: s.label, sizeType: s.sizeType })}
          toPayload={(v) => ({ ...v })}
          fields={[
            { name: "code", label: t("field.code"), required: true },
            { name: "label", label: t("field.label"), required: true },
            { name: "sizeType", label: t("field.sizeType"), required: true },
          ]}
          columns={[
            { header: t("field.code"), cell: (s) => <span className="font-mono font-bold">{s.code}</span> },
            { header: t("field.label"), cell: (s) => s.label },
            { header: t("field.sizeType"), cell: (s) => s.sizeType },
          ]}
        />
      ) : null}
    </div>
  );
}
