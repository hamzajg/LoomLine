export type Client = {
  id: string;
  name: string;
  country: string | null;
};

export type Article = {
  id: string;
  reference: string;
  label: string;
  clientId: string;
  sizeType: string | null;
  unit: string;
};

export type Colour = {
  id: string;
  code: string;
  label: string;
};

export type Size = {
  id: string;
  code: string;
  label: string;
  sizeType: string;
};

export type QuantityLine = {
  colourId: string;
  sizeId: string;
  quantity: number;
};

export type OrderStatus =
  | "DRAFT"
  | "RELEASED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type CreatedOrder = {
  id: string;
  reference: string;
  clientId: string;
  articleId: string;
  quantity: number;
  dueDate: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type StatusHistoryEntry = {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string | null;
  changedAt: string;
  changedBy: string;
};

export type NewOrderInput = {
  reference: string;
  clientId: string;
  articleId: string;
  quantity: number;
  dueDate: string;
};

export type FieldErrors = Record<string, string>;

export class ApiFailure extends Error {
  readonly code: string;
  readonly fieldErrors: FieldErrors;

  constructor(code: string, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiFailure";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export type QuantityLineResponse = QuantityLine & { id?: string };

export type OrderFilter = {
  status?: string;
  reference?: string;
};

export type ArticleInput = {
  reference: string;
  label: string;
  clientId: string;
  sizeType?: string | null;
  unit: string;
};

export type ColourInput = { code: string; label: string };
export type SizeInput = { code: string; label: string; sizeType: string };

export interface CatalogueApi {
  clients(): Promise<Client[]>;
  searchArticles(query?: string): Promise<Article[]>;
  createArticle(input: ArticleInput): Promise<Article>;
  updateArticle(id: string, input: ArticleInput): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  searchColours(query?: string): Promise<Colour[]>;
  createColour(input: ColourInput): Promise<Colour>;
  updateColour(id: string, input: ColourInput): Promise<Colour>;
  deleteColour(id: string): Promise<void>;
  searchSizes(query?: string): Promise<Size[]>;
  createSize(input: SizeInput): Promise<Size>;
  updateSize(id: string, input: SizeInput): Promise<Size>;
  deleteSize(id: string): Promise<void>;
}

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

async function writeJson<T>(path: string, method: string, body: unknown): Promise<T> {
  return readJson<T>(
    await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function deleteJson(path: string): Promise<void> {
  const response = await fetch(path, { method: "DELETE" });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiFailure(
      body.code ?? "REQUEST_FAILED",
      body.message ?? "The request failed.",
      body.fieldErrors ?? {},
    );
  }
}

export const httpCatalogueApi: CatalogueApi = {
  async clients() {
    return readJson<Client[]>(await fetch("/api/clients"));
  },

  async searchArticles(query) {
    return readJson<Article[]>(await fetch(`/api/articles${qs({ q: query })}`));
  },

  async createArticle(input) {
    return writeJson<Article>("/api/articles", "POST", input);
  },

  async updateArticle(id, input) {
    return writeJson<Article>(`/api/articles/${encodeURIComponent(id)}`, "PUT", input);
  },

  async deleteArticle(id) {
    await deleteJson(`/api/articles/${encodeURIComponent(id)}`);
  },

  async searchColours(query) {
    return readJson<Colour[]>(await fetch(`/api/colours${qs({ q: query })}`));
  },

  async createColour(input) {
    return writeJson<Colour>("/api/colours", "POST", input);
  },

  async updateColour(id, input) {
    return writeJson<Colour>(`/api/colours/${encodeURIComponent(id)}`, "PUT", input);
  },

  async deleteColour(id) {
    await deleteJson(`/api/colours/${encodeURIComponent(id)}`);
  },

  async searchSizes(query) {
    return readJson<Size[]>(await fetch(`/api/sizes${qs({ q: query })}`));
  },

  async createSize(input) {
    return writeJson<Size>("/api/sizes", "POST", input);
  },

  async updateSize(id, input) {
    return writeJson<Size>(`/api/sizes/${encodeURIComponent(id)}`, "PUT", input);
  },

  async deleteSize(id) {
    await deleteJson(`/api/sizes/${encodeURIComponent(id)}`);
  },
};

export interface OrdersApi {
  clients(): Promise<Client[]>;
  articles(): Promise<Article[]>;
  create(input: NewOrderInput): Promise<CreatedOrder>;
  list(filter?: OrderFilter): Promise<CreatedOrder[]>;
  get(id: string): Promise<CreatedOrder>;
  transition(id: string, to: OrderStatus, reason?: string): Promise<CreatedOrder>;
  history(id: string): Promise<StatusHistoryEntry[]>;
  colours(): Promise<Colour[]>;
  sizes(): Promise<Size[]>;
  quantities(id: string): Promise<QuantityLineResponse[]>;
  setQuantities(id: string, lines: QuantityLine[]): Promise<QuantityLineResponse[]>;
}

type ErrorBody = {
  code?: string;
  message?: string;
  fieldErrors?: FieldErrors | null;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & ErrorBody;

  if (!response.ok) {
    throw new ApiFailure(
      body.code ?? "REQUEST_FAILED",
      body.message ?? "The request failed.",
      body.fieldErrors ?? {},
    );
  }

  return body;
}

export const httpOrdersApi: OrdersApi = {
  async clients() {
    return readJson<Client[]>(await fetch("/api/clients"));
  },

  async articles() {
    return readJson<Article[]>(await fetch("/api/articles"));
  },

  async create(input) {
    return readJson<CreatedOrder>(
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  },

  async list(filter = {}) {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.reference) params.set("reference", filter.reference);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return readJson<CreatedOrder[]>(await fetch(`/api/orders${qs}`));
  },

  async get(id: string) {
    return readJson<CreatedOrder>(await fetch(`/api/orders/${encodeURIComponent(id)}`));
  },

  async transition(id, to, reason) {
    return readJson<CreatedOrder>(
      await fetch(`/api/orders/${encodeURIComponent(id)}/transitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, reason: reason ?? null }),
      }),
    );
  },

  async history(id) {
    return readJson<StatusHistoryEntry[]>(
      await fetch(`/api/orders/${encodeURIComponent(id)}/history`),
    );
  },

  async colours() {
    return readJson<Colour[]>(await fetch("/api/colours"));
  },

  async sizes() {
    return readJson<Size[]>(await fetch("/api/sizes"));
  },

  async quantities(id) {
    return readJson<QuantityLineResponse[]>(
      await fetch(`/api/orders/${encodeURIComponent(id)}/quantities`),
    );
  },

  async setQuantities(id, lines) {
    return readJson<QuantityLineResponse[]>(
      await fetch(`/api/orders/${encodeURIComponent(id)}/quantities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      }),
    );
  },
};
