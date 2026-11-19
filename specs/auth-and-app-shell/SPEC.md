# Spec: Identity, access control, and the application shell

> Spec-driven development artifact. This file is the contract: implementation
> is done when every acceptance criterion maps to a scenario in
> `EXAMPLES.feature` and every scenario has a passing check.

## Problem

LoomLine today is one unprotected page: the API answers every request without
credentials, the browser build has no navigation, no identity, and no place to
put a second screen, and there is no way to tell a planner from a supervisor.
A production-floor tool cannot be exposed past a single laptop in this state,
and it cannot grow: every future area (stock, quality, equipment, HR) would be
another orphan view. This feature establishes the two foundations everything
else stands on — an application shell that gives the product a stable frame and
a way to navigate, and authenticated, role-scoped access so each person sees and
can do only what their job requires.

## Users

- **Administrator** (primary for accounts): creates users and assigns roles.
- **Production planner** (primary for the product): signs in and works in the
  orders area.
- **Production supervisor** (secondary): signs in with a narrower scope.
- **Future section owners** — stock, quality, equipment, HR (secondary): each
  will see only their own sections once those features land.

## Outcome hypothesis

- Expected user outcome: a person signs in once and lands in a coherent
  workspace where every reachable screen is one their role is allowed to use,
  instead of an open, single-view page.
- Opportunity evidence: the current API is fully unauthenticated and the UI has
  no navigation — both are direct findings from the running system, not
  assumptions. That users additionally want role-tailored navigation is an
  **assumption** to confirm with the first real users.
- Signal: share of API requests made with a valid session, and the number of
  screens reachable per role. Baseline is unknown; no numeric target is
  asserted.
- Follow-up owner/date: product owner, four weeks after first release.

## Scope (in)

- **Application shell.** Persistent header (product brand, current user,
  sign-out) and a collapsible left sidebar with the product's section
  taxonomy — Production, Stock, Commercial, Quality, Equipment, HR, Access —
  plus breadcrumbs and a responsive layout (fixed sidebar on wide viewports, a
  header-toggled drawer on narrow ones).
- **Design tokens and primitives.** A token layer (colour, type, spacing,
  radii, elevation) and a small shared component set — buttons, tiles/cards,
  tables, badges, form fields, dialog, and loading/empty/error states — so all
  pages render consistently.
- **Accessibility and i18n posture.** The shell is keyboard-operable and
  exposes state to assistive technology (WCAG 2.1 AA targets for contrast,
  focus, and names); copy is externalised for at least French and English, with
  the layout prepared for right-to-left scripts.
- **Accounts.** Users with a unique username, a display name, and an active
  flag, owned by an external OIDC provider (Keycloak) and projected locally as
  data; roles held as realm roles and mapped to the product's access model
  (see `ADR-0002-identity.md`).
- **Authentication.** A sign-in screen, a session, and sign-out, over the OIDC
  authorization-code flow; every `/api/**` request requires a valid session
  (sign-in, health, and the API description are the only exceptions).
- **Authorization.** A role-to-access map checked on the server (401
  unauthenticated, 403 unauthorized) and reflected in the shell so navigation
  and routes match the caller's role.
- **Bootstrap.** A first administrator and a demo realm, provisioned through
  the data gate, so the product can be set up without a manual database or
  console edit.

## Scope (out)

- Multi-factor authentication and social login.
- Multi-tenancy and per-record (row-level) permissions; roles grant areas and
  actions, not individual rows.
- Self-service password reset by email, email verification, and account
  invitation mail (no mail infrastructure in this deployment).
- Login attempt throttling beyond a single generic failure message; account
  lockout policy.
- Building the sections the shell navigates to (stock, quality, equipment, HR,
  commercial); those routes land in a clearly-labelled not-yet-available state.
- Translations beyond French and English; a right-to-left locale is *structurally*
  ready but not populated.
- An audit log of authentication or access events.

## Acceptance criteria

<!-- Scenario(s): use scenario names verbatim from EXAMPLES.feature and/or
     @w<N> tags — ship_validate resolves both for traceability. -->

| # | Criterion | Scenario(s) |
|---|-----------|-------------|
| 1 | A signed-in user sees the persistent shell — header, sidebar sections, content area — and can collapse or expand the sidebar | @w1 |
| 2 | On a narrow viewport the sidebar becomes a drawer toggled from the header and content stays readable | @w1 |
| 3 | Every interactive shell control is reachable and operable by keyboard and exposes its state to assistive technology | @w1 |
| 4 | Visiting any application route without a session redirects to the sign-in screen | @w2 |
| 5 | A user with valid credentials signs in and lands in the shell, identified by display name and role | @w2 |
| 6 | Sign-in with an unknown username or wrong password is rejected with one generic message and creates no session | @w2 |
| 7 | Signing out ends the session and protected routes redirect to sign-in again | @w2 |
| 8 | An API request without a valid session is rejected with 401 and performs no work | @w2 |
| 9 | The sidebar and routes shown to a user are exactly those their role grants | @w3 |
| 10 | Reaching a route the role does not grant shows an access-denied state instead of the page | @w3 |
| 11 | An API call outside the caller's role is rejected with 403 and the action does not execute | @w3 |
| 12 | An administrator creates a user, assigns a role, and that user signs in with exactly the granted access | @w3 |

## Decisions

- **D1 — Shell and styling mechanism.** *Context & forces:* the product needs a
  frame, navigation, and consistent components, and today the web build depends
  on nothing but React. *Options considered:* (a) adopt a full component library
  (e.g. MUI/Chakra) — fast, but large, opinionated, and hard to theme to the
  product's own identity; (b) headless primitives (e.g. Radix) plus tokens —
  accessible, but another dependency surface and more wiring; (c) hand-rolled
  CSS with a design-token layer and a small in-repo component set — the simplest
  and most reversible. *Decision & why:* (c). It keeps the build dependency-light,
  lets the tokens define the product's own visual identity, and keeps every
  component owned and testable in-repo. *Consequences:* positive — no lock-in,
  small bundle, full control of accessibility and theming; negative — the team
  owns the primitives and must handle focus, ARIA, and responsive behaviour
  explicitly. *Reversibility:* two-way door (components are local and swappable);
  revisit if the component surface grows beyond what the team can maintain.
- **D2 — Identity store and credential hashing.** *Context & forces:* there is
  no user concept at all, and credentials must never be stored recoverably.
  *Options considered:* (a) an external identity provider (Keycloak/OIDC) — a
  second service to run, but central account lifecycle and hashing done
  properly; (b) local tables for user/role/assignment with in-process hashing —
  the simplest credible option for a self-contained deployment.
  *Decision & why:* **(a), external OIDC — Keycloak**, decided at gate G2 and
  recorded in `ADR-0002-identity.md`; this **supersedes** the earlier (b) choice
  in this spec. LoomLine keeps only a projection of the user (keyed by the OIDC
  subject) and never stores a password; credential hashing is **Argon2id**,
  owned by the realm. User administration (US7) delegates to the provider's
  Admin API for the same reason — the API orchestrates but never holds
  credential material. *Consequences:* positive — no in-house secret handling,
  central lifecycle, Argon2id by default; negative — an extra runtime
  dependency, an offline/degraded-mode gap, and a projection that can go stale
  between sign-ins. *Reversibility:* one-way door for the account source of
  truth; the local projection is the seam that keeps a later provider swap or a
  local-table fallback behind the same module boundary. See `ADR-0002-identity.md`
  for the full rationale and alternatives.
- **D3 — Session mechanism.** *Context & forces:* a browser SPA calling a
  same-origin API needs an authenticated session that survives navigation and
  cannot be trivially read by scripts. *Options considered:* (a) a bearer token
  kept by the client (localStorage/in-memory) — common for APIs, but exposes the
  token to script and needs client-side lifecycle care; (b) a server session
  carried by a secure, HttpOnly, SameSite cookie — simplest for a same-origin
  app, the token is not reachable from JavaScript. *Decision & why:* (b). With
  the OIDC identity store (D2), the OIDC tokens are held **server-side only**;
  after the authorization-code callback LoomLine establishes its own session,
  carried by the cookie, and clears it at sign-out; state-changing requests are
  protected against cross-site request forgery (SameSite plus a token check). *Consequences:* positive — no token handling in the client, no
  XSS token theft; negative — cookie/session handling and CSRF protection become
  explicit concerns, and horizontal scaling later needs shared session storage.
  *Reversibility:* two-way door with effort (the API surface is `/api/auth/*`
  either way); revisit before any multi-instance deployment.
- **D4 — Authorization model.** *Context & forces:* access must be enforced
  where it cannot be bypassed (the server) and reflected where it is experienced
  (the shell). *Options considered:* (a) hard-coded role checks scattered at
  each endpoint — quick, but drifts and leaks policy; (b) roles-as-data plus a
  single access map (role → areas/actions) consulted by both the API and the
  navigation payload — one source of truth. *Decision & why:* (b). The map is
  the contract; the API returns 401 when unauthenticated and 403 when
  authenticated but not permitted, and the shell derives its navigation from the
  same map. *Consequences:* positive — one policy, no drift, easy to review;
  negative — the map must be maintained and documented (see gate G3) and is a
  natural place for mistakes. *Reversibility:* two-way door; revisit if
  per-record permissions are needed.
- **D5 — Public contract and documentation.** *Context & forces:* the access
  rules must be a testable, documented contract, and the API is the product's
  public surface. *Options considered:* ad-hoc endpoints versus a described,
  versioned contract. *Decision & why:* the feature exposes `/api/auth/*`
  (session), `/api/users` and `/api/roles` (administration, role-scoped), and
  the current-session/navigation payload; errors reuse the existing stable
  `{code, message, fieldErrors?}` shape; the API description (OpenAPI) is
  published with an interactive reference so the contract is part of the
  deliverable. *Consequences:* positive — the contract is explicit and testable;
  negative — the description must be kept current with the code.
  *Reversibility:* two-way door; additive endpoints.
- **D6 — Accessibility and localisation posture.** *Context & forces:* the shell
  is the frame every user lives in; accessibility and language are cheapest to
  build in now. *Decision & why:* the shell targets WCAG 2.1 AA for the controls
  it introduces (keyboard operation, visible focus, accessible names, sufficient
  contrast) and externalises copy for French and English with the layout
  prepared for right-to-left. *Consequences:* positive — usable for everyone and
  ready to localise; negative — token choices and components carry a11y
  obligations from the start. *Reversibility:* two-way door.
