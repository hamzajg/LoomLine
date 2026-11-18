/**
 * The identity the shell renders for.
 *
 * Wave 1 delivers the shell before authentication exists: US3/US4 (wave 2)
 * replace this placeholder with the session returned by the API. Keeping the
 * seam here — one module, one constant — makes that swap a single edit.
 */
export type ShellUser = {
  displayName: string;
  role: string;
};

export const shellUser: ShellUser = {
  displayName: "Demo operator",
  role: "Administrator",
};
