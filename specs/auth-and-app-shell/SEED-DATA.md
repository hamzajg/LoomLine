# Seed data — bootstrap administrator, realm roles, and demo accounts

Gate: **G4 — Bootstrap administrator and demo credentials seeded** (before
wave 2). Owner: tech-lead. Resolver: agent.
Purpose: the shell and the sign-in demo must never stall on an empty identity
store. The first administrator, the realm roles the access model references,
and a couple of demo accounts must exist with **no manual console or database
edit**, and the whole set must be reproducible from the repository alone.

With the OIDC decision (`ADR-0002-identity.md`) the identity store is
**Keycloak**, so "seed data" here means a **realm import** — not SQL rows.

## Realm and client

| Concern | Value | Notes |
|---------|-------|-------|
| Realm | `loomline` | one realm for the product |
| Client id | `loomline-app` | confidential client, **standard (authorization-code) flow** |
| Client secret | `${OIDC_CLIENT_SECRET}` | demo value in `.env`; never a committed production secret |
| Redirect URI | `http://localhost:8085/api/auth/callback` | the API terminates the callback (D5) |
| Post-logout redirect | `http://localhost:8086/` | back to the web app |
| Web origin | `http://localhost:8086` | CORS/redirect allow-list |
| Credential hashing | **Argon2id** (realm password policy / hashing provider) | per ADR-0002 |

## Realm roles

The minimum the access map (D4) references. The **exact** role→section/action
matrix is owned by gate **G3** (`ACCESS-MATRIX.md`); roles added there must be
added to this import too.

| Realm role | Corresponds to (SPEC "Users") |
|------------|-------------------------------|
| `administrator` | Administrator — creates users and assigns roles |
| `production-planner` | Production planner — works in the orders area |
| `production-supervisor` | Production supervisor — narrower scope |

Section-owner roles (stock, quality, equipment, HR) are **not** seeded here;
they arrive with their sections and are recorded by G3.

## Accounts

| Username | Realm role(s) | Purpose | Password |
|----------|---------------|---------|----------|
| `admin` | `administrator` | bootstrap administrator for the LoomLine app; signs in and administers users | `ChangeMe!2026` (demo only) |
| `planner` | `production-planner` | demo planner; primary happy-path sign-in | `Demo!2026` (demo only) |
| `supervisor` | `production-supervisor` | demo supervisor; narrower-scope sign-in (wave 3) | `Demo!2026` (demo only) |

Two levels of administrator are deliberately distinct:

- **Keycloak server admin** (`KEYCLOAK_ADMIN` / `KEYCLOAK_ADMIN_PASSWORD`, demo
  only) — manages the server and the realm; used once to import and inspect.
- **Application administrator** (`admin` realm user above) — signs into
  LoomLine and exercises the wave-3 administration story (US7).

Passwords above are **demo credentials** and are documented as such; production
must override them and the client secret out-of-band. No real secret is
committed.

## Where the data lives

- **Realm import file:** `deploy/keycloak/loomline-realm.json` — the realm,
  client, realm roles, and the three accounts above, with credentials entered
  as Keycloak's `password` credential type so the realm hashes them (Argon2id).
- **Compose service:** a `keycloak` service in `compose.yaml` started with
  `--import-realm`, exposing host port **8087** (chosen to avoid `8085`/`8086`/
  `5433`) and pointing at the import file above.
- **API wiring:** the `api` service receives the OIDC settings it needs —
  `OIDC_AUTH_SERVER_URL` (e.g. `http://keycloak:8080/realms/loomline`),
  `OIDC_CLIENT_ID=loomline-app`, `OIDC_CLIENT_SECRET`, and the public
  `OIDC_REDIRECT_URI`. `.env.example` gains the non-secret defaults.
- **Idempotency:** Keycloak imports a realm only when it does not already
  exist, so the seed is safe on a fresh volume. Re-seeding after edits requires
  removing the Keycloak data volume (or a partial import); this is documented
  in the README, and nothing in the flow assumes a pre-existing realm.
- LoomLine's local **user projection** table is populated at first sign-in from
  the token; it is not seeded (it has no password and no rows are required
  ahead of time).

## Demo preconditions

1. `docker compose up` starts `db`, `keycloak`, `api`, and `web`.
2. `GET http://localhost:8087/realms/loomline/.well-known/openid-configuration`
   returns the realm document (realm is imported).
3. Signing in as `planner` / `Demo!2026` reaches the shell; signing in as
   `admin` / `ChangeMe!2026` reaches the shell as an administrator.
4. An unknown username makes no session (generic failure) — the wave-2 signal
   that the realm is authoritative rather than a local table.
5. No password is readable in the LoomLine database.

## Evidence

Record, as gate evidence when marking G4 met, the output of:

```bash
docker compose config >/dev/null && echo "compose ok"
curl -fsS http://localhost:8087/realms/loomline/.well-known/openid-configuration \
  | head -c 400
# realm user count (3) and the realm's password policy (argon2)
```

The artifact is the file itself (`specs/auth-and-app-shell/SEED-DATA.md`), which
is what gate G4's check resolves.
