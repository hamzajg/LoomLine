# Decision review brief — Spec: article-catalogue

- Source: `specs/article-catalogue/SPEC.md (## Decisions)`
- Generated: 2026-11-19T16:13:20Z
- Detected type: api, data
- Readiness: **CHALLENGE** (6/6 record elements)
- This brief is input to judgment, not a verdict. The agent fills the scorecard after reading the code.

**Reversibility:** stated

**Alternatives on record (verify they are credible, not strawmen):**
- When a client sends a new model or a buyer adds a colour to the range, planners cannot record it and the order form silently misses options.
- Options: (a) all four entities now — simplest for users but pulls commercial scope forward; (b) articles/colours/sizes only — chosen; (c) articles only — reject
- Options: (a) hard delete + usage check — chosen, simplest and keeps referential integrity honest; (b) soft-delete — deferred until a real need appears; (c) casc

## Evidence signals (heuristic — verify before acting)

- no code paths referenced — the review is document-only

## Design moves to test

- Is this a public contract or an implementation detail? Who depends on it?
- How will it version, and what is the backward-compatibility promise?
- Are errors part of the contract — consistent shape, codes, retry semantics — or an afterthought?
- Is the contract documented where consumers can find it (OpenAPI, AsyncAPI, schema registry, docs site), and is the doc generated from code or hand-maintained?
- Which fields and operations are stable vs experimental, and what is the deprecation path?
- Is authn/authz explicit per operation with least privilege, and is that visible in the docs?
- Are writes idempotent where clients can retry (idempotency keys, natural keys, upserts)?
- Which invariant spans more than one aggregate, and does the transaction span it too?
- Can the write model be separated from read shapes without splitting the database?
- What is the migration and rollback path for existing data?
- Invert a dependency so the unstable thing depends on the stable thing.
- Make an implicit boundary or invariant explicit before adding mechanism.
- Shrink the decision: can half of it ship independently and reversibly?

## Challenge questions

### 1. Problem & forces
- What user/business outcome does this serve, and what breaks if we do nothing?
- Which quality attributes actually drive it (correctness, latency, cost, operability, compliance, time-to-market)? Rank them.
- Which constraints are fixed (budget, deadline, team, contracts) and which are assumed?
- Who owns this decision, and who must live with the consequences?
**Good looks like:** The dominant force is named, and "do nothing" is treated as a real option.

### 2. Alternatives & tradeoffs
- What are at least two credible alternatives, including the simplest thing that could work?
- For each: what does it make easy, what does it make hard, and what does it cost to reverse?
- Is this a one-way or two-way door? If one-way, what evidence justifies it?
- What would have to be true for the chosen option to be wrong?
**Good looks like:** A tradeoff matrix names winners and losers; reversibility is explicit; no strawman options.

### 3. Domain fit (DDD)
- Which bounded context owns this concept, and is the boundary drawn around language or deployment?
- Which terms are overloaded across contexts, and where is the translation (anti-corruption layer)?
- What are the aggregates, their invariants, and the transaction boundary? Does one transaction span aggregates?
- Are domain events the right integration mechanism, or is this a synchronous dependency?
- Does the model carry behavior, or is it an anemic data bag?
- Which consistency guarantee is required, and which can be eventual?
**Good looks like:** Ubiquitous language is explicit, invariants are protected at the boundary, external models are translated.

### 4. Architecture & boundaries
- Which direction do dependencies point? Can the core be tested without the framework, DB, or network?
- What is the smallest boundary that isolates this change (module, port, package)?
- What happens when each external dependency is slow, down, or returns garbage?
- Where does data ownership live, and is there a second writer?
- What is the operational story: config, migrations, rollout, rollback, observability?
- Who are the consumers, and what is the deprecation policy?
**Good looks like:** Policy depends on nothing; mechanisms are adapters; failure and migration paths are named.

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
| Problem & forces | 4 | SPEC.md Problem cites the reference product's dedicated article/colour/size screens; LoomLine's only write path today is seed SQL | — |
| Alternatives & tradeoffs | 4 | SPEC.md D1–D7 each name rejected options (soft-delete, cascade, per-entity sections, normalized size_type table) | — |
| Domain fit (DDD) | 4 | Catalogue writes are thin CRUD use cases behind the same ports/adapters split as order-intake (domain → application → persistence/web); usage checks are repository queries, not entity logic | — |
| Architecture & boundaries | 5 | Reuses AccessPolicy/AccessMap (single authorization choke point, D4 of auth feature), ReferenceQuery ports, existing error envelope; no new framework concepts | — |
| Testable design | 5 | Uniqueness/validation/usage rules are pure domain decisions over ports — table-testable like SetOrderQuantitiesUseCaseTest with in-memory fakes | — |
| Craftsmanship | 4 | D5 (no optimistic locking) and D6 (text size_type) are the weakest points — both justified by low contention and a two-value lookup; revisit triggers named | — |
| Decision record | 4 | SPEC.md records context/options/consequences/reversibility per decision; CATALOGUE-RULES.md is the owner-facing contract | — |

## Verdict (agent fills)

```
VERDICT: ACCEPT
STEELMAN: The strongest challenge is scope: "catalogue" could mean the full
  reference-product article sub-model (models, fabrics, supplies, colour/
  size matrices, files). The counter: every order-facing picker LoomLine
  already exposes is exactly article/colour/size/client, and adding the
  richer sub-entities now would speculatively build for workflows no wave
  consumes. If the business later needs per-article colour restrictions,
  D1's boundary is where an ArticleColour association lands — additive,
  not a rewrite. Second steelman: hard delete + IN_USE guard forces
  planners to keep dead rows out by never creating them; soft-delete would
  be safer but adds hidden state — acceptable while the catalogue is small
  and owner-visible.
SMALLEST NEXT STEP: ship wave 1 backend only (CRUD + validation + usage
  guard) — independently demoable via API and de-risks the rules before
  they reach the UI.
REVISIT TRIGGER: planners report needing to retire rather than delete
  entries (add `active` flag per D3); a third size_type or renamed type
  appears (normalize D6); concurrent-edit conflicts observed (add version
  per D5).
```

Run the review with `/challenge-decision` and the `decision-challenger`
subagent. It is advisory: it never blocks a gate or a merge.
