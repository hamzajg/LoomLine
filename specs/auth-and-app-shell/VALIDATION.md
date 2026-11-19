# Validation — auth-and-app-shell

## Traceability

| AC | Criterion | Scenarios | Wave(s) | Test evidence |
|----|-----------|-----------|---------|---------------|
| 1 | A signed-in user sees the persistent shell — header… | Shell controls are keyboard operable, Shell renders navigation for a signed-in user, Sidebar collapses on a narrow viewport | 1 | AppShell.test.tsx |
| 2 | On a narrow viewport the sidebar becomes a drawer toggled… | Shell controls are keyboard operable, Shell renders navigation for a signed-in user, Sidebar collapses on a narrow viewport | 1 | AppShell.test.tsx |
| 3 | Every interactive shell control is reachable and operable… | Shell controls are keyboard operable, Shell renders navigation for a signed-in user, Sidebar collapses on a narrow viewport | 1 | AppShell.test.tsx |
| 4 | Visiting any application route without a session redirects… | API rejects a request without a session, Invalid credentials are rejected, Signing out ends the session, Unauthenticated visitor is redirected to sign-in, Valid credentials sign a user in | 2 | App.test.tsx, SignInPage.test.tsx |
| 5 | A user with valid credentials signs in and lands in the… | API rejects a request without a session, Invalid credentials are rejected, Signing out ends the session, Unauthenticated visitor is redirected to sign-in, Valid credentials sign a user in | 2 | App.test.tsx, SignInPage.test.tsx |
| 6 | Sign-in with an unknown username or wrong password is… | API rejects a request without a session, Invalid credentials are rejected, Signing out ends the session, Unauthenticated visitor is redirected to sign-in, Valid credentials sign a user in | 2 | App.test.tsx, SignInPage.test.tsx |
| 7 | Signing out ends the session and protected routes redirect… | API rejects a request without a session, Invalid credentials are rejected, Signing out ends the session, Unauthenticated visitor is redirected to sign-in, Valid credentials sign a user in | 2 | App.test.tsx, SignInPage.test.tsx |
| 8 | An API request without a valid session is rejected with 401… | API rejects a request without a session, Invalid credentials are rejected, Signing out ends the session, Unauthenticated visitor is redirected to sign-in, Valid credentials sign a user in | 2 | App.test.tsx, SignInPage.test.tsx |
| 9 | The sidebar and routes shown to a user are exactly those… | API rejects an out-of-role action, Access-denied state for an ungranted route, Administrator creates a user with a role, Navigation is limited to the role's sections | 3 | App.test.tsx, UsersPage.test.tsx |
| 10 | Reaching a route the role does not grant shows an… | API rejects an out-of-role action, Access-denied state for an ungranted route, Administrator creates a user with a role, Navigation is limited to the role's sections | 3 | App.test.tsx, UsersPage.test.tsx |
| 11 | An API call outside the caller's role is rejected with 403… | API rejects an out-of-role action, Access-denied state for an ungranted route, Administrator creates a user with a role, Navigation is limited to the role's sections | 3 | App.test.tsx, UsersPage.test.tsx |
| 12 | An administrator creates a user, assigns a role, and that… | API rejects an out-of-role action, Access-denied state for an ungranted route, Administrator creates a user with a role, Navigation is limited to the role's sections | 3 | App.test.tsx, UsersPage.test.tsx |

## Scenario coverage

- Scenarios: 12 total, 10 with detected test evidence, 2 without
- ✓ `Shell renders navigation for a signed-in user` (@w1)
- ✓ `Sidebar collapses on a narrow viewport` (@w1)
- ✓ `Shell controls are keyboard operable` (@w1)
- ✓ `Unauthenticated visitor is redirected to sign-in` (@w2)
- ✓ `Valid credentials sign a user in` (@w2)
- ✓ `Invalid credentials are rejected` (@w2)
- ✓ `Signing out ends the session` (@w2)
- ✗ `API rejects a request without a session` (@w2)
- ✓ `Navigation is limited to the role's sections` (@w3)
- ✓ `Access-denied state for an ungranted route` (@w3)
- ✗ `API rejects an out-of-role action` (@w3)
- ✓ `Administrator creates a user with a role` (@w3)

## Demo script (manual walkthrough)

1. **Shell renders navigation for a signed-in user** — run the app, perform the scenario, observe the outcome.
2. **Valid credentials sign a user in** — run the app, perform the scenario, observe the outcome.

## Gaps

- 2 scenario(s) lack detected test evidence — verify manually or add checks

Note: 'no evidence' means neither the scenario name nor a
token match was found in test files — verify by hand before
treating it as a real gap. '~' marks weak token-match evidence.

## Outcome follow-up

Optional; this is a post-release learning record, not a finish gate.
- Status: not yet measured
- Owner and review date: (record when known)
- Signal and observed result: (record after release; do not invent)
- Learning or next action: (record after review)