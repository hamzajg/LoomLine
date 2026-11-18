# Waves — auth-and-app-shell

Each wave IS an iteration: a time-boxed, independently shippable
increment — one branch, one PR, green tests, demoable outcome.
Do not start wave N+1 until wave N merges.

## Wave 1 — iteration 1

Scenarios proven by this wave:
- Shell renders navigation for a signed-in user
- Sidebar collapses on a narrow viewport
- Shell controls are keyboard operable

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US1 | As a user, I want a persistent application shell with section navigation, so that I can move between areas and always know where I am | M | — | header (brand, user, sign-out), collapsible sidebar with the section taxonomy, breadcrumbs, content area; design tokens and shared primitives |
| US2 | As a user on a small screen, I want the navigation to collapse into a drawer and remain keyboard-accessible, so that I can work on a tablet or phone | M | — | builds on US1 (same wave); responsive breakpoints, drawer toggle, focus management, ARIA names and state, visible focus; WCAG 2.1 AA targets |

## Wave 2 — iteration 2

Scenarios proven by this wave:
- Unauthenticated visitor is redirected to sign-in
- Valid credentials sign a user in
- Invalid credentials are rejected
- Signing out ends the session
- API rejects a request without a session

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US3 | As a user, I want to sign in with my username and password and sign out again, so that only I can act as myself | M | — | Keycloak (OIDC) accounts; session established via the authorization-code flow at sign-in, terminated at sign-out; generic failure message (ADR-0002) |
| US4 | As a system owner, I want every API request to require a session, so that no one can read or change data without signing in | S | — | builds on US3 (same wave); 401 for missing/invalid session; sign-in, health and the API description are the only open endpoints |

## Wave 3 — iteration 3

Scenarios proven by this wave:
- Navigation is limited to the role's sections
- Access-denied state for an ungranted route
- API rejects an out-of-role action
- Administrator creates a user with a role

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US5 | As a user, I want the navigation to show only the areas my role grants, so that I am not offered work I cannot do | M | — | requires a session (wave 2); single role-to-access map drives both the navigation payload and route guarding; ungranted route shows an access-denied state |
| US6 | As a system owner, I want the server to reject actions outside a user's role, so that access cannot be bypassed from the client | M | — | builds on US5 (same wave, same access map); 403 when authenticated but not permitted; the action must not execute; policy consulted once, not per endpoint |
| US7 | As an administrator, I want to create users and assign roles, so that I can give people exactly the access they need | M | — | requires a session (wave 2); admin-only endpoints delegate to the Keycloak Admin API; bootstrap realm/admin seeded so setup needs no manual console edit (ADR-0002) |
