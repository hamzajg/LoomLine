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
};

export type CreatedOrder = {
  id: string;
  reference: string;
  clientId: string;
  articleId: string;
  quantity: number;
  dueDate: string;
  status: "DRAFT" | "RELEASED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
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
};
