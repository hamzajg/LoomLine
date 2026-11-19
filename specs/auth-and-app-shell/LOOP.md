# Delivery Loop — auth-and-app-shell

Status: running
Iterations: 2
Updated: 2026-11-19T10:23:28Z

| Wave | Status | Branch | PR | Evidence | Updated |
|------|--------|--------|----|----------|---------|
| 1 | done | feat/auth-and-app-shell-w1 | #6 | 12/12 Vitest (AppShell 3, OrdersPage 3, NewOrderPage 6) + npm run build green; no CI configured in repo; evidence auth-a | 2026-11-18T19:53:34Z |
| 2 | done | feat/auth-and-app-shell-w2 | #9 | 25/25 Gradle :api:test (ApiAuthenticationIT 4 new) + 17/17 Vitest incl. 5 new wave-2 tests + npm run build green; docker | 2026-11-19T03:18:53Z |
| 3 | pending | — | — | — | — |

## Gates

| Gate | Status | Evidence | Updated |
|------|--------|----------|---------|
| G1 | met | specs/auth-and-app-shell/DECISION-REVIEW.md (verdict ACCEPT) | 2026-11-18T19:27:28Z |
| G2 | met | ADR-0002-identity.md accepted by architect 2026-11-18 (Keycloak OIDC identity store, Argon2id credential hashing, LoomLi | 2026-11-18T20:03:57Z |
| G3 | met | ACCESS-MATRIX.md agreed by product-owner 2026-11-19: administrator all sections+access admin; production-planner product | 2026-11-19T10:23:26Z |
| G4 | met | specs/auth-and-app-shell/SEED-DATA.md — Keycloak realm 'loomline' import: confidential client loomline-app, realm roles  | 2026-11-18T20:04:30Z |
| G5 | pending | — | — |

## Events

- 2026-11-18T19:27:28Z gate G1 met: specs/auth-and-app-shell/DECISION-REVIEW.md (verdict ACCEPT)
- 2026-11-18T19:28:44Z start wave 1 on feat/auth-and-app-shell-w1
- 2026-11-18T19:53:34Z complete wave 1 (#6): 12/12 Vitest (AppShell 3, OrdersPage 3, NewOrderPage 6) + npm run build green; no CI configured in repo; evidence auth-a
- 2026-11-18T20:03:57Z gate G2 met: ADR-0002-identity.md accepted by architect 2026-11-18 (Keycloak OIDC identity store, Argon2id credential hashing, LoomLi
- 2026-11-18T20:04:30Z gate G4 met: specs/auth-and-app-shell/SEED-DATA.md — Keycloak realm 'loomline' import: confidential client loomline-app, realm roles 
- 2026-11-18T20:05:24Z start wave 2 on feat/auth-and-app-shell-w2
- 2026-11-19T03:18:53Z complete wave 2 (#9): 25/25 Gradle :api:test (ApiAuthenticationIT 4 new) + 17/17 Vitest incl. 5 new wave-2 tests + npm run build green; docker
- 2026-11-19T03:19:26Z blocked: G3: role access matrix must be agreed before wave 3 — which roles exist and exactly which sections/actions each role gra
- 2026-11-19T10:23:26Z gate G3 met: ACCESS-MATRIX.md agreed by product-owner 2026-11-19: administrator all sections+access admin; production-planner product
- 2026-11-19T10:23:28Z resumed
