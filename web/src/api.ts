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
