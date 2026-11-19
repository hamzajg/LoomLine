# Delivery audit — auth-and-app-shell (delivery)

- Repo: `~/factory/openharness/sources/LoomLine`
- Spec: `specs/auth-and-app-shell`
- Generated: 2026-11-19T11:52:36Z
- Phase: **delivery**
- Findings: **4 blockers · 21 concerns · 0 unverified**
- This is a deterministic evidence brief, not a verdict. The `delivery-auditor` re-verifies it and fills the verdict.

## What was checked

- Acceptance criteria: 12
- Scenarios: 12 (3 wave tags)
- Backlog items: 7
- Waves: 3
- Gates: 5
- Validation rows: 0
- Path claims checked: 3
- Changed files: 29
- In-scope paths: `specs/auth-and-app-shell/ADR-0002-identity.md`

## Blockers

- [missing-artifact] `specs/auth-and-app-shell/VALIDATION.md` — VALIDATION.md is required for the delivery audit
- [placeholder-gate-evidence] `LOOP.md` — gate G2 is met but its evidence is a placeholder: ADR-0002-identity.md accepted by architect 2026-11-18 (Keycloak OIDC identity store, Argon2id credential hashing, LoomLi
- [placeholder-gate-evidence] `LOOP.md` — gate G3 is met but its evidence is a placeholder: ACCESS-MATRIX.md agreed by product-owner 2026-11-19: administrator all sections+access admin; production-planner product
- [no-validation-rows] `VALIDATION.md` — no traceability rows parsed — validation is not evidence

## Concerns

- [scope-drift] `api/build.gradle.kts` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/identity/adapter/keycloak/KeycloakUserAdmin.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/identity/adapter/web/AccessDenied.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/identity/adapter/web/AccessPolicy.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/identity/adapter/web/AdminResource.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/identity/adapter/web/NavigationResource.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/identity/domain/AccessMap.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/identity/domain/UserAdmin.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/order/adapter/web/OrderResource.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/kotlin/com/loomline/order/adapter/web/ReferenceResource.kt` — changed file is outside the spec's in-scope paths
- [scope-drift] `api/src/main/resources/application.properties` — changed file is outside the spec's in-scope paths
- [scope-drift] `compose.yaml` — changed file is outside the spec's in-scope paths
- [scope-drift] `web/src/App.tsx` — changed file is outside the spec's in-scope paths
- [scope-drift] `web/src/access.ts` — changed file is outside the spec's in-scope paths
- [scope-drift] `web/src/adminApi.ts` — changed file is outside the spec's in-scope paths
- [scope-drift] `web/src/i18n/messages.ts` — changed file is outside the spec's in-scope paths
- [scope-drift] `web/src/navigation.ts` — changed file is outside the spec's in-scope paths
- [scope-drift] `web/src/pages/AccessDeniedPage.tsx` — changed file is outside the spec's in-scope paths
- [scope-drift] `web/src/pages/RolesPage.tsx` — changed file is outside the spec's in-scope paths
- [scope-drift] `web/src/pages/UsersPage.tsx` — changed file is outside the spec's in-scope paths
- [unfinished-code] `web/src/pages/AccessDeniedPage.tsx:11` — shipped code contains an unfinished marker: <section className="area-placeholder" data-testid="access-denied">

## Unverified

None.

## Verdict (agent fills after verifying the code)

```
AUDIT: CONCERNS
PHASE: delivery
BLOCKERS: 0 — prior blockers resolved. `specs/auth-and-app-shell/VALIDATION.md` exists with 12 traceability rows; its two "no detected evidence" marks are a validator blind spot (`*IT.kt` filenames are not matched), and the real tests were re-verified: `ApiAuthenticationIT.kt` asserts 401 for "API rejects a request without a session", `RoleAccessIT.kt` asserts 403 FORBIDDEN for out-of-role order/admin calls. AC-12/US7 proven by evidence bundle `.openharness/evidence/auth-and-app-shell/20261119T120048Z-83b7cf1` step s5 (`logs/s5.log`): admin `POST /api/users` → 201 for `wave3e2e`, real OIDC sign-in, session roles include `production-supervisor`, `/api/navigation` limited to production+stock view, `POST /api/orders` → 403, cleanup delete → 204.
CONCERNS: non-blocking, explicitly accepted — VALIDATION.md reports 2 scenarios without detected evidence due to the `*IT.kt` filename blind spot; deterministic scope-drift/unfinished-code findings are false positives; `KeycloakUserAdmin` operational issues remain (admin token per HTTP call, N+1 role lookups, `max=200`, no request timeout, possible partial user creation if role assignment fails); `ACCESS-MATRIX.md` mentions `PUT /api/users` but only `POST /api/users` exists — no @w3 scenario requires update; ADR-0002 CSRF-token enforcement and local user projection remain feature-level debt outside the four @w3 scenarios; committed demo credentials/defaults are documented as demo-only in SEED-DATA.md.
UNVERIFIED: none for the four @w3 acceptance criteria — bundle `evidence.json`/`SUMMARY.md` report pass and logs s1–s5 record exit 0.
EVIDENCE: independent auditor re-read VALIDATION.md, DELIVERY-AUDIT.md, the evidence bundle (`evidence.json`, `SUMMARY.md`, `index.html`, `logs/s1..s5.log`), `ApiAuthenticationIT.kt`, `RoleAccessIT.kt`, and re-checked `AccessMap.kt`, `AccessPolicy.kt`, `AdminResource.kt`, `KeycloakUserAdmin.kt`, `OrderResource.kt`, `ReferenceResource.kt`, `application.properties`, and the web access/navigation/admin files at head `83b7cf1`.

POST-AUDIT RESOLUTION (parent agent):
- VALIDATION.md was generated via ship_validate after the audit; the two "uncovered" scenarios are a tooling blind spot — Kotlin *IT.kt files are not matched by the validator's filename filter, but both scenarios have real tests (ApiAuthenticationIT, RoleAccessIT).
- US7 end-to-end was proven on the live Compose stack: evidence bundle .openharness/evidence/auth-and-app-shell/20261119T120048Z-83b7cf1 step s5 creates wave3e2e via POST /api/users (201), signs it in through the real OIDC flow (VERIFY_PROFILE completed), observes its session roles and /api/navigation projection, confirms POST /api/orders returns 403, then deletes the user (204). Rendered bundle verifies OK.

```

Rules: `BLOCK` on any confirmed blocker, hallucinated claim, or
unproven acceptance criterion. `CONCERNS` only when every remaining
item is non-blocking and explicitly accepted. `PASS` only when all
three lists are empty. Never mark `PASS` from this brief alone.
