import { ApiFailure } from "./api";

export type ManagedUser = {
  id: string;
  username: string;
  email: string | null;
  enabled: boolean;
  roles: string[];
};

export type NewUserInput = {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password: string;
  role: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "X-Requested-With": "JavaScript", "Content-Type": "application/json" },
    credentials: "same-origin",
    ...init,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };
    throw new ApiFailure(body.code ?? "ERROR", body.message ?? `Request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export function listUsers(): Promise<ManagedUser[]> {
  return request<ManagedUser[]>("/api/users");
}

export function listRoles(): Promise<{ id: string }[]> {
  return request<{ id: string }[]>("/api/roles");
}

export function createUser(input: NewUserInput): Promise<ManagedUser> {
  return request<ManagedUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
