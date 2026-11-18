# Decision review brief — Spec: Identity, access control, and the application shell

- Source: `specs/auth-and-app-shell/SPEC.md (## Decisions)`
- Generated: 2026-11-18T19:24:22Z
- Detected type: ux, security
- Focus: architecture
- Readiness: **CHALLENGE** (6/6 record elements)
- This brief is input to judgment, not a verdict. The agent fills the scorecard after reading the code.

**Reversibility:** stated

**Alternatives on record (verify they are credible, not strawmen):**
- D1 — Shell and styling mechanism. *Context & forces:* the product needs a frame, navigation, and consistent components, and today the web build depends on nothi
- It keeps the build dependency-light, lets the tokens define the product's own visual identity, and keeps every component owned and testable in-repo. *Consequenc
- Keycloak/OIDC) — strong, but a second service to run and operate; (b) local tables for user/role/assignment with passwords hashed by a vetted algorithm — the si
- Users, roles, and the assignment between them are owned here as relational data behind the identity module; passwords are stored only as a salted hash produced 

## Evidence signals (heuristic — verify before acting)

- `api/src/main/kotlin` — 12 source file(s); not a domain path, so layering checks were skipped
- `web/src` — 8 source file(s); not a domain path, so layering checks were skipped

Inspected: `api/src/main/kotlin`, `web/src`

## Design moves to test

- Which user journey does this serve, including empty, error, and slow states?
- What is the accessibility and keyboard path?
- Where does the UI hold state that belongs to the domain?
- What is the threat model, and which asset is actually being protected?
- Where are secrets stored, rotated, and audited?
- What is the least privilege this component needs?
- Invert a dependency so the unstable thing depends on the stable thing.
- Make an implicit boundary or invariant explicit before adding mechanism.
- Shrink the decision: can half of it ship independently and reversibly?

## Challenge questions

### 1. Architecture & boundaries
- Which direction do dependencies point? Can the core be tested without the framework, DB, or network?
- What is the smallest boundary that isolates this change (module, port, package)?
- What happens when each external dependency is slow, down, or returns garbage?
- Where does data ownership live, and is there a second writer?
- What is the operational story: config, migrations, rollout, rollback, observability?
- What is the blast radius if this control fails?
**Good looks like:** Policy depends on nothing; mechanisms are adapters; failure and migration paths are named.

### 2. Problem & forces
- What user/business outcome does this serve, and what breaks if we do nothing?
- Which quality attributes actually drive it (correctness, latency, cost, operability, compliance, time-to-market)? Rank them.
- Which constraints are fixed (budget, deadline, team, contracts) and which are assumed?
- Who owns this decision, and who must live with the consequences?
**Good looks like:** The dominant force is named, and "do nothing" is treated as a real option.

### 3. Alternatives & tradeoffs
- What are at least two credible alternatives, including the simplest thing that could work?
- For each: what does it make easy, what does it make hard, and what does it cost to reverse?
- Is this a one-way or two-way door? If one-way, what evidence justifies it?
- What would have to be true for the chosen option to be wrong?
**Good looks like:** A tradeoff matrix names winners and losers; reversibility is explicit; no strawman options.

### 4. Domain fit (DDD)
- Which bounded context owns this concept, and is the boundary drawn around language or deployment?
- Which terms are overloaded across contexts, and where is the translation (anti-corruption layer)?
- What are the aggregates, their invariants, and the transaction boundary? Does one transaction span aggregates?
- Are domain events the right integration mechanism, or is this a synchronous dependency?
- Does the model carry behavior, or is it an anemic data bag?
**Good looks like:** Ubiquitous language is explicit, invariants are protected at the boundary, external models are translated.

### 5. Testable design
- Where are the seams? Can time, randomness, IO, and external calls be injected?
- Which behaviors get fast unit tests, which need integration, which need contract tests?
- Does each acceptance criterion map to an observable check, or only to implementation details?
- Are the tests deterministic and independent (no shared state, no sleeps)?
- What is the failure signal when this decision turns out wrong in production?
**Good looks like:** Behavior-first tests, deterministic seams, scenario-to-test traceability, a named failure signal.

### 6. Craftsmanship
- Is this the smallest reversible step, or a big-bang change?
- Are names from the domain, or from the framework/table?
- Is the error model explicit (typed failures vs exceptions vs silent nulls)?
- Is there speculative abstraction (interfaces with one implementation, config nobody sets)?
- Is the migration path documented and rollback-able?
**Good looks like:** Small steps, intention-revealing names, explicit errors, no speculative generality, documented migration.

### 7. Decision record
- Are status, owner, and date recorded?
- Are consequences (positive and negative) written down?
- Is there a revisit trigger (metric, date, event)?
- Are links to evidence, code, and related ADRs present?
**Good looks like:** A future reader can tell why, what was traded, and when to revisit.

## Scorecard (agent fills; 1 = poor, 5 = strong, evidence required)

| Lens | Score | Evidence (file:line, test, benchmark) | Action |
|------|-------|----------------------------------------|--------|
| Problem & forces | 4 | `SPEC.md` Problem + Outcome hypothesis; the unauthenticated API and missing navigation are direct findings, role-tailored nav is marked an assumption | Confirm role needs with first users |
| Alternatives & tradeoffs | 4 | `SPEC.md` D1 (component library vs headless vs hand-rolled), D2 (external IdP vs local tables), D3 (bearer token vs cookie session) each name a simplest and a most-reversible option | Keep the OIDC-adapter fallback in mind for D2 |
| Domain fit (DDD) | 4 | `SPEC.md` D2/D4: `user`/`role`/assignment are the identity context; the access map is the policy boundary; `api/src/main/kotlin/com/loomline/order` shows the existing package-by-feature, ports/adapters style to mirror | Place identity as its own package (`identity`), not inside `order` |
| Architecture & boundaries | 4 | `api/.../order/domain/Ports.kt` (framework-free ports), `application/DomainConfiguration.kt` (CDI wiring) — identity will follow the same seam; D3 names the scaling/CSRF costs | Enforce the same port/adapters shape; policy depends on nothing |
| Testable design | 4 | `api/src/test/kotlin/.../CreateOrderUseCaseTest.kt` (deterministic domain test) and `OrderResourceIT.kt` (QuarkusTest) are the template; D3/D4 keep hashing and the access map injectable | Table-driven tests for the access matrix; contract test for 401/403 |
| Craftsmanship | 4 | Reuses the existing error shape `{code, message, fieldErrors?}` (`OrderResource.kt`); 401 vs 403 split is explicit; migrations forward-only like `V1__reference_and_orders.sql` | No speculative interfaces; one access map, documented |
| Decision record | 4 | D1–D6 carry context, options, decision, consequences and reversibility; gates G2/G3 require the identity ADR and the access matrix before their waves | Pin the hashing algorithm and session TTL in `ADR-0002-identity.md` |

**Tradeoff matrix (key doors)**

| Door | Chosen | Simplest alternative | Most reversible | Reversibility |
|------|--------|----------------------|-----------------|---------------|
| Credential store | Local `user`/`role` tables, hashed password | Local tables (same) | External IdP (OIDC) adapter behind the module | One-way for data |
| Session | HttpOnly SameSite cookie session | In-memory bearer token | Cookie (API surface is `/api/auth/*` either way) | Two-way with effort |
| Shell styling | Design tokens + in-repo primitives | Adopt a component library | Hand-rolled (local components) | Two-way |
| Authorization | One role→access map | Ad-hoc per-endpoint checks | The map (data, not code) | Two-way |

## Verdict (agent fills)

```
VERDICT: ACCEPT
STEELMAN: A local identity context (user/role/assignment behind the same
  framework-free ports/adapters seam the order feature already uses) plus a
  cookie session and a single role->access map is the smallest thing that
  closes the open-API gap and lets the shell express access. It reuses the
  existing error contract, keeps credentials one-way-safe, and leaves an OIDC
  adapter as a future swap behind the same module boundary rather than a
  rewrite.
SMALLEST NEXT STEP: Ship the shell (wave 1) with design tokens and the section
  taxonomy before any auth code, so waves 2-3 drop into a stable frame; then
  pin the hashing algorithm, session TTL and CSRF approach in
  `ADR-0002-identity.md` (gate G2) before the first credential is stored.
REVISIT TRIGGER: Reopen if enterprise SSO / central account lifecycle becomes
  a requirement (D2 becomes the wrong door), if the deployment must scale to
  multiple API instances without shared session storage (D3), or if per-record
  permissions are needed (D4).
```

### Review history

- **2026-11-18 (first pass):** ACCEPT — recorded with the tradeoff matrix above.
  The two live risks to carry into implementation are the one-way credential
  store (D2) and the CSRF/scaling cost of the cookie session (D3); both are
  named as revisit triggers rather than left implicit.

Run the review with `/challenge-decision` and the `decision-challenger`
subagent. It is advisory: it never blocks a gate or a merge.
