# Decision review brief — Spec: production-routing

- Source: `specs/production-routing/SPEC.md (## Decisions)`
- Generated: 2026-11-20T05:39:42Z
- Detected type: api, data
- Readiness: **CHALLENGE** (6/6 record elements)
- This brief is input to judgment, not a verdict. The agent fills the scorecard after reading the code.

**Reversibility:** stated

**Alternatives on record (verify they are credible, not strawmen):**
- The composition feature already established replace-set as the write contract for aggregate-internal collections. - Options considered: 1.
- Patch/diff API — smallest payloads, most client and server complexity. - Decision & why: option 2.
- Porting three opaque integers would force us to invent validation for values nobody can define, and would let planners enter three numbers that contradict each 
- One minutes field per step (planned duration for one unit) — explicit, testable, sufficient for sequencing and load estimates. 3. minutes + setup_minutes — clos

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
| Problem & forces | 4 | SPEC.md Problem/Outcome; legacy routing sheets (GammeOperatoire/GammeMontageOF) are the shop-floor instruction set; no routing means no sequencing or timing | — |
| Alternatives & tradeoffs | 4 | SPEC.md D1–D6 name the rejected options and why; simplest alternative (per-step CRUD) explicitly rejected in D1 | — |
| Domain fit (DDD) | 5 | Routing steps are an aggregate-internal collection of the Order aggregate; invariants (lock, validation) live in the use case, not the entity — consistent with OrderComposition pattern | — |
| Architecture & boundaries | 4 | Same ports/adapters split as order-intake and composition (domain → application → persistence/web); phases/machines reuse ReferenceCatalog-style ports; no second writer | — |
| Testable design | 5 | Replace-set + validation is pure domain logic — table-testable like SetOrderQuantitiesUseCase; no IO seams needed beyond existing TimeSource/IdGenerator | — |
| Craftsmanship | 4 | Two-way doors throughout; no speculative abstraction; D2's single duration is the weakest craft point if batch/setup time is needed (see steelman) | — |
| Decision record | 5 | SPEC.md records context/options/consequences/reversibility per decision; revisit triggers named in D2/D5 | — |

## Verdict (agent fills)

```
VERDICT: ACCEPT
STEELMAN: The strongest challenge is D2 — using one `minutes` field per step instead of the legacy `Tps/TpH/TpR` triple loses batch and setup time semantics. The counter: batch/setup time is not modelled in the legacy UI either and would require a shop-floor feature (time capture) to define anyway. The single `minutes` field is explicit, testable and sufficient for sequencing and load estimation. If the product owner confirms that batch/setup time is needed immediately, the fallback is to add `setup_minutes` as an optional field in the same use case.
SMALLEST NEXT STEP: ship wave 1 backend only (replace-set API + validation + lock guard) before touching the UI — it is independently demoable via API and de-risks the routing rules before they reach the form.
REVISIT TRIGGER: production planner feedback that batch/setup time is needed before the shop-floor feature (relax D2 to add `setup_minutes`); a third phase or machine type appearing (normalize D3).
```

Run the review with `/challenge-decision` and the `decision-challenger`
subagent. It is advisory: it never blocks a gate or a merge.
