/**
 * The signed-in identity and the sign-in / sign-out hand-offs.
 *
 * Wave 1 rendered the shell for a placeholder identity; wave 2 replaces that
 * with the real session (US3/US4). The browser never handles a password: the
 * API runs the OIDC authorization-code flow (ADR-0002), keeps the tokens
 * server-side, and exposes only this session projection behind an HttpOnly
 * cookie.
 */

/** The identity the shell renders for. */
export type ShellUser = {
  username: string;
  displayName: string;
  roles: string[];
};

/** Entry point that starts sign-in: the API redirects to the identity provider. */
export const SIGN_IN_PATH = "/api/auth/login";

/** Entry point that ends the session: the API clears it and returns to the app. */
export const SIGN_OUT_PATH = "/api/auth/logout";

/**
 * Who the caller is, or `null` when they have no session.
 *
 * The API answers a fetch/XHR with `401` rather than a redirect (see
 * `quarkus.oidc.authentication.java-script-auto-redirect`), so the status is the
 * signal the shell keys off to show the sign-in screen.
 */
export async function fetchSession(): Promise<ShellUser | null> {
  const response = await fetch("/api/auth/session", {
    headers: { "X-Requested-With": "JavaScript" },
    credentials: "same-origin",
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`The session endpoint answered ${response.status}.`);
  }

  const body = (await response.json()) as Partial<ShellUser>;
  const username = body.username ?? "";
  return {
    username,
    displayName: body.displayName?.trim() || username,
    roles: body.roles ?? [],
  };
}
