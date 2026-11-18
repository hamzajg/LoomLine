# ADR-0002 — Identity, credential hashing, and session

- **Status:** accepted — owner approved 2026-11-18 (gate G2)
- **Date:** 2026-11-18
- **Owner:** architect (decision) · product owner (acceptance)
- **Supersedes:** `SPEC.md` D2 "local tables" (option b), same date, this file
- **Related:** `SPEC.md` D2, D3, D4, D5; `GATES.md` G2, G3, G4, G5;
  `specs/order-intake-and-tracking/ADR-0001-stack.md`

## Context

`SPEC.md` D2 originally proposed identity as **local tables** (users, roles and
assignments owned by LoomLine, passwords hashed in-process). At gate G2 the
human architect reviewed that proposal against the deployment reality and
overturned it: the deployment already runs behind a shared identity service,
central account lifecycle (joiners, leavers, audit) is a real operating need,
and building credential storage in-house would make LoomLine responsible for
secrets it does not want to hold. The choice is therefore an **external OIDC
provider**, with the local store reduced to a projection.

Legacy baseline (what we are migrating from), verified 2026-11-18 in
`~/factory/legacy/RimWebERP23-01-2017/`:

- `Utilisateur` holds `username` and a **plaintext** `password`, links to one
  `Personnel` and a free-standing many-to-many `Role` (`libelle_role` only —
  a label with no permissions attached).
- There is **no** permission entity, **no** Spring Security, no working login
  controller, and no session/token anywhere in the web app; the login page is
  a dead template and the user service methods return `null`.
- The sidebar (`static/nav.html`) is **static HTML** with no role filtering;
  every item is visible to everyone. Two independent copies of the menu exist
  (`nav.html` and a hand-built list in `resources/scripts/app.js`), which is
  why navigation and access drift apart in what we inherit.

The modernized model must therefore keep the legacy *functional* taxonomy
(Production, Stock, Commercial, Quality, Equipment, HR/GRH, Access — plus the
empty Planning header) and the user↔role→section intent, while replacing the
plaintext credentials, the absent enforcement, and the duplicated menu with a
single authoritative source each. The application-shell navigation introduced
in wave 1 already models that taxonomy (`web/src/navigation.ts`).

## Decision

| Concern | Choice | Source of truth | Notes |
|---------|--------|-----------------|-------|
| Identity store | **External OIDC — Keycloak** (authorization-code flow) | Keycloak | accounts and account lifecycle live in Keycloak |
| Credential hashing | **Argon2id** | Keycloak credential store | LoomLine never stores a password; the realm is configured (modern Keycloak releases default) to Argon2 families — verified by a compliance check |
| Local user data | **Projection only** | Keycloak | keyed by the OIDC `sub`: username, display name, active flag; **no** password column |
| Roles | Realm roles in Keycloak, mapped to the product access map | Keycloak (assignment) · LoomLine (map) | the role→area/action map stays product data (D4), keyed by role name; G3 owns its contents |
| Browser session | **LoomLine server-side session**, carried by an `HttpOnly`, `Secure`, `SameSite=Lax` cookie, plus a CSRF token for state-changing requests | LoomLine | OIDC tokens are held server-side only and never reach JavaScript |
| Public surface | `/api/auth/*` (login/callback/logout/session), `/api/users`, `/api/roles` | LoomLine | unchanged from D5; `/api/auth/*` orchestrates the OIDC redirect/callback and the local session |

Flow: the browser hits `/api/auth/login`; LoomLine redirects to Keycloak; the
authorization-code callback exchanges the code for tokens **server-side**,
projects/refreshes the local user row and its role names, then establishes the
LoomLine session cookie. Sign-out clears the LoomLine session (and, if
configured, the Keycloak session). Every other `/api/**` request is authorized
against the local session and the access map; unauthenticated is 401,
authenticated-but-not-permitted is 403.

Wedding credentials to an external provider does **not** weaken the legacy
intent: the legacy `Utilisateur.personnel` link is preserved as the local
projection's stable id, so domain records (orders and later modules) can keep
referencing a local user row while credentials live elsewhere.

## Alternatives considered

1. **Keycloak / OIDC (chosen)** — one more service to run, but central
   lifecycle, Argon2id by default, and no in-house secret handling. Cost is
   operational: a realm, a client, and a demo container to maintain.
2. **Local tables with in-process hashing** (the superseded D2b) — self
   contained and no extra service, but makes LoomLine own password storage,
   lockout, and lifecycle, and duplicates tooling an identity service already
   provides. Rejected at G2.
3. **A hosted OIDC provider** (cloud IdP) — least to operate, but the
   deployment must work self-hosted/offline on the factory network, so a
   self-hostable provider was required.
4. **LDAP / Kerberos directly** — matches a classic enterprise estate but is
   heavier to model roles and modern web flows; OIDC over Keycloak covers it.

Tradeoffs (operational cost vs. secret-handling risk vs. reversibility) are
recorded in `DECISION-REVIEW.md` and refined here.

## Consequences

**Positive**
- LoomLine holds **no passwords**; the plaintext-password defect inherited from
  the legacy model cannot be reproduced.
- Account lifecycle (create, disable, offboard) is central and auditable in one
  place, and Argon2id is the hashing standard rather than a per-project choice.
- The client never sees an access token: the session cookie is `HttpOnly`, so
  the XSS token-theft class in D3 is closed by construction.
- The `/api/auth/*` surface and the `{code, message, fieldErrors?}` error shape
  are unchanged, so D5 and the existing UI contract still hold.

**Negative / costs**
- An extra runtime dependency (Keycloak) enters the demo and any later
  deployment; the Compose stack grows and G5 must validate it.
- More moving parts in the sign-in path (browser → LoomLine → Keycloak →
  back), so wave 2 tests must cover the redirect/callback round trip and
  session establishment, not just a local credential check.
- Local user rows are a **projection**: they can be stale if Keycloak changes
  between sign-ins, so the projection must be refreshed at sign-in and reads
  that must be exact should query Keycloak.
- Offline-first factory expectations are not met by a strict OIDC dependency;
  a fallback (cached session lifetime) must be considered if the site loses the
  identity service (see revisit trigger).

**Neutral**
- The legacy `Role` label gains meaning: it becomes a realm role name that the
  G3 access matrix maps to sections and actions. Labels that were decorative in
  the legacy system become policy here.
- US7's administrator story shifts: LoomLine's `/api/users` and `/api/roles`
  delegate creation and role assignment to the Keycloak Admin API and return
  the projected result, rather than writing a password row.

## Compliance checks for wave 2

1. `docker compose config` validates with a `keycloak` service present (gate
   G5) and the realm is imported on start (`realm` import file committed under
   the deploy/seed location named by G4's `SEED-DATA.md`).
2. No password column exists in any LoomLine migration; `grep -ri password`
   over the API migrations returns no credential storage (only the transient
   login request DTO).
3. The realm's password-hashing policy is Argon2id; the seed documentation
   records the provider/algorithm actually in force.
4. A signed-in session cookie is set with `HttpOnly`, `Secure`, and
   `SameSite=Lax`, and a state-changing request without the CSRF token is
   rejected.
5. `GET /api/orders` (or any protected `/api/**`) without a session returns
   **401** and performs no work; with a session but outside the role it returns
   **403** (wave 3, once G3 lands).

## Revisit trigger

Reopen this ADR if the factory network cannot depend on the identity service
being reachable (offline/degraded mode becomes a requirement), if a second
product in the estate needs a shared session contract, if Keycloak's operating
cost outweighs central lifecycle, or if the deployment moves to a hosted IdP
whose flow differs materially from the authorization-code flow recorded here.

## Acceptance

Accepted by the owner (architect) on 2026-11-18 in response to the gate-G2
question. Answers recorded verbatim in substance:

- "Where should users, roles and assignments live?" → **External OIDC
  (Keycloak)**.
- "How should passwords be hashed at rest?" → **Argon2id**.
- "How should the authenticated session be carried between browser and API?"
  → **HttpOnly cookie + CSRF**.

This supersedes `SPEC.md` D2 (option b, local tables). Recorded as gate
evidence by `ship_loop`:

```bash
python -m openharness run ship_loop --repo_path=sources/LoomLine \
  --spec_dir=specs/auth-and-app-shell --action=gate \
  --gate=G2 --status=met \
  --evidence="ADR-0002-identity.md accepted by architect 2026-11-18 (Keycloak OIDC identity store, Argon2id credential hashing, LoomLine HttpOnly cookie+CSRF session)"
```
