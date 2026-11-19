# Access matrix — roles, sections and actions

Gate: **G3 — Role access matrix agreed** (before wave 3). Owner: product-owner.
Resolver: **human** — this file is a *proposal* until the product owner accepts it.
Purpose: the single access map (SPEC D4) is derived from this document; it drives
both the server-side authorization check (401 unauthenticated, 403 unauthorized)
and the navigation the shell renders, so it must be explicit and agreed before
wave 3 lands.

Status of this revision: **agreed — approved by product-owner 2026-11-19**
(all cells confirmed as proposed, including the three *confirm* cells in §5).

## 1. Why an explicit map

`SPEC.md` D4 chooses one access map (role → areas/actions) consulted by both the
API and the navigation payload, instead of role checks scattered at each
endpoint. This file is that map's human-readable source: each cell below becomes
an entry the API consults, and the same entries decide which sections the shell
shows. A cell not granted is **denied by default**.

Legacy baseline (verified in `~/factory/legacy/RimWebERP23-01-2017/`): the
legacy `Role` carries only a label (`libelle_role`) with **no** permissions, and
`static/nav.html` shows every section to every user with **no** filtering. There
is therefore no legacy role→section mapping to inherit; the legacy system
supplied the *sections* (its functional taxonomy) and the *intent* that users
have roles, not the policy. The policy below is the modern replacement and needs
the product owner's confirmation.

## 2. Roles

The three roles seeded by gate G4 (`deploy/keycloak/loomline-realm.json`,
`SEED-DATA.md`). Realm role names are the map keys; a Keycloak realm role with a
name below resolves to its grants, and any role not listed here grants nothing.

| Realm role | From SPEC "Users" | Intent |
|------------|-------------------|--------|
| `administrator` | Administrator | Owns accounts and every area — the only role that may manage users and roles |
| `production-planner` | Production planner | Works the orders area: creates and maintains production orders and their references |
| `production-supervisor` | Production supervisor | Read-only, narrower than the planner: sees production and stock, changes nothing |

Section-owner roles (stock, quality, equipment, HR, commercial) are **not** in
this revision: per `SEED-DATA.md` they arrive with the sections they own. This
revision covers exactly what wave 3 (US5–US7) needs. See §7 open questions.

## 3. Sections

The modern taxonomy is `web/src/navigation.ts` `SECTIONS`; it keeps the legacy
functional taxonomy and drops only the empty legacy header. Section ids below are
the `SECTIONS[].id` values the shell already uses.

| Section id | Shell label | Legacy equivalent |
|------------|-------------|-------------------|
| `production` | Production | Production (Article, Modèle, OF, Gamme Opératoire/Montage, Paquet, Paramétrage) |
| `stock` | Stock | Stock (Fourniture, Tissus, Fils, Entrée/Sortie, Etat, Paramétrage) |
| `commercial` | Commercial | Gestion Commerciale (Client, Sous-Traitants) |
| `quality` | Quality | Qualité (Contrôle, Paramétrage) |
| `equipment` | Equipment | Gestion Matériel (Réparation, Machines, Pièces de rechanges, Paramétrage) |
| `hr` | HR | GRH (Personnel, Absence, Bonus, Paramétrage) |
| `access` | Access | Accès (Utilisateurs, Rôles) |

Legacy **Planning** was an accordion header with **no items**; planning work in
the modern product lives under Production (orders), so there is no separate
`planning` section.

## 4. Actions

Two action levels per section, plus the two access-administration actions. This
keeps the map small and each cell meaningful; it is deliberately *not* per-record
(SPEC "Scope out").

| Action | Meaning | Server effect |
|--------|---------|---------------|
| `view` | The section appears in navigation and its read endpoints are allowed | read requests succeed; ungranted section ⇒ 403 |
| `manage` | Create/update/delete records inside the section | mutating requests succeed; without it ⇒ 403 |
| `access:view` | List users and roles (the Access section's read side) | `GET /api/users`, `GET /api/roles` succeed |
| `access:manage` | Create users and assign roles | `POST/PUT /api/users` (role assignment) succeed |

`manage` implies `view` for the same section (a role that may change a section
may also read it); the tables show `view` only where the role reads but does not
write.

## 5. The matrix

Cells are the granted actions; `—` means denied. *confirm* marks the cells the
product owner should specifically check.

| Section / action | `administrator` | `production-planner` | `production-supervisor` |
|------------------|-----------------|----------------------|-------------------------|
| `production` view | view | view | view |
| `production` manage | manage | manage *(confirm)* | — |
| `stock` view | view | view *(confirm)* | view |
| `stock` manage | manage | — | — |
| `commercial` view | view | view *(confirm)* | — |
| `commercial` manage | manage | — | — |
| `quality` view | view | — | — |
| `quality` manage | manage | — | — |
| `equipment` view | view | — | — |
| `equipment` manage | manage | — | — |
| `hr` view | view | — | — |
| `hr` manage | manage | — | — |
| `access` view | access:view | — | — |
| `access` manage | access:manage | — | — |

Reading the matrix:

- **`administrator`** is the only role with every section and with
  `access:view` / `access:manage`. AC-12 (administrator creates a user with a
  role) rides on `access:manage`.
- **`production-planner`** owns Production (read **and** write) and reads Stock
  and Commercial for the context an order needs — clients and materials — but
  changes neither.
- **`production-supervisor`** is a strict subset of the planner: read-only, and
  narrower (no `manage` anywhere, no Commercial). This keeps "narrower scope"
  unambiguous and easy to test.

## 6. Enforcement mapping (what wave 3 must implement)

The API consults this map once, not per endpoint (US6). Endpoints and the grant
they require:

| Endpoint | Method | Required grant |
|----------|--------|----------------|
| `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout` | any | public (no session) |
| `/api/auth/session`, `/api/navigation` | GET | any authenticated session |
| `/api/orders` | GET | `production` view |
| `/api/orders` | POST/PUT | `production` manage |
| `/api/users` | GET | `access:view` |
| `/api/users` | POST/PUT | `access:manage` |
| `/api/roles` | GET | `access:view` |

Rules the checks must honour (AC-9, AC-10, AC-11):

1. No session ⇒ **401** and no work performed (already wave 2).
2. Authenticated but the grant is missing ⇒ **403** and the action does not
   execute.
3. The shell derives navigation from the same map: only `view`-granted sections
   appear (`production`, `stock`, `commercial` for a planner; `production`,
   `stock` for a supervisor). A directly-requested ungranted route renders the
   access-denied state instead of the page.
4. `default deny`: a request whose section/action has no entry is denied.

## 7. Open questions for the product owner

Please confirm or edit; any change here changes the matrix above and the wave-3
tests.

1. **Planner write scope on Production** — does `production-planner` get
   `manage` on the whole Production section, or only on orders (`production.orders`
   manage) with articles/models/routings read-only? *Proposed: whole section.*
2. **Planner's read neighbours** — should the planner read `stock` and
   `commercial` at all, or only `production`? *Proposed: read both (order context).*
3. **Supervisor's extra sections** — is a strict-subset supervisor right, or
   should the supervisor also read `quality` (floor quality oversight)? *Proposed:
   strict subset, no quality.*
4. **Administrator in the domain sections** — should `administrator` hold
   `manage` in every domain section, or be confined to `access` (separation of
   duties)? *Proposed: every section (a single super-role for this first
   release).*
5. **Other roles** — do any section-owner roles (stock-manager, quality-controller,
   equipment-manager, hr-manager, commercial) need to exist **now**, or do they
   arrive with their sections as `SEED-DATA.md` states? *Proposed: arrive later.*

## 8. On acceptance

When the product owner accepts (or accepts-with-edits) this file, gate G3 is
recorded `met` with the file as evidence, wave 3 (US5–US7) starts, and rows 2–5
of the enforcement mapping become the wave-3 acceptance tests for AC-9 to AC-12.
Edited cells are the agreement; the role names must stay in step with
`deploy/keycloak/loomline-realm.json` and `SEED-DATA.md`.
