# Decision review brief — Spec: order-composition

- Source: `specs/order-composition/SPEC.md (## Decisions)`
- Generated: 2026-11-19T14:22:04Z
- Detected type: ux, architecture
- Readiness: **CHALLENGE** (5/6 record elements)
- This brief is input to judgment, not a verdict. The agent fills the scorecard after reading the code.

**Missing before this is reviewable:**
- `alternatives` — list at least two credible alternatives, including the simplest one

**Reversibility:** stated

## Evidence signals (heuristic — verify before acting)

- no code paths referenced — the review is document-only

## Design moves to test

- Which user journey does this serve, including empty, error, and slow states?
- What is the accessibility and keyboard path?
- Where does the UI hold state that belongs to the domain?
- Can this be a module inside the current deployable before it becomes a service?
- Which dependency can be inverted so the core owns the interface?
- What is the smallest reversible step that tests the boundary?
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
**Good looks like:** Ubiquitous language is explicit, invariants are protected at the boundary, external models are translated.

### 4. Architecture & boundaries
- Which direction do dependencies point? Can the core be tested without the framework, DB, or network?
- What is the smallest boundary that isolates this change (module, port, package)?
- What happens when each external dependency is slow, down, or returns garbage?
- Where does data ownership live, and is there a second writer?
- What is the operational story: config, migrations, rollout, rollback, observability?
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
| Problem & forces | 4 | SPEC.md Problem/Outcome; legacy OFQuantite/OFCouleurCodeTaille entities | — |
| Alternatives & tradeoffs | 4 | SPEC.md D1–D5 each name the rejected option and why; simplest alternative (free-text colour/size on the line) explicitly rejected in D4 | — |
| Domain fit (DDD) | 4 | Lines are an aggregate-internal collection of the Order aggregate; invariants (sum, uniqueness, lock) live in the use case, not the entity — consistent with CreateOrderUseCase/TransitionOrderUseCase pattern | — |
| Architecture & boundaries | 4 | Same ports/adapters split as order-intake (domain → application → persistence/web); colour/size reads reuse ReferenceCatalog-style ports | — |
| Testable design | 5 | Replace-set + sum rule is pure domain logic — table-testable like TransitionOrderUseCaseTest; no IO seams needed beyond existing TimeSource/IdGenerator | — |
| Craftsmanship | 4 | Two-way doors throughout; no speculative abstraction; D5's text size_type match is the weakest craft point (see steelman) | — |
| Decision record | 4 | SPEC.md records context/options/consequences/reversibility per decision; revisit triggers named below | — |

## Verdict (agent fills)

```
VERDICT: ACCEPT
STEELMAN: The strongest challenge is D2 — requiring sum(lines) == order.quantity
  forbids progressive entry: a planner cannot save a partial breakdown and
  complete it later. The counter: replace-set writes are atomic, so "partial"
  is a client-side concern (keep the form open), and a breakdown that doesn't
  add up is worse than none — it would silently misreport variant demand.
  If planners genuinely need server-side partial drafts, the fallback is
  sum <= total with an explicit "unassigned" remainder, which is a small,
  local change to one use case. D5's text size_type match is brittle if size
  types ever need renaming, but it mirrors the existing article column and a
  normalized table is disproportionate for two seeded types.
SMALLEST NEXT STEP: ship wave 1 backend only (lines + validation + lock
  guard) before touching the UI — it is independently demoable via API and
  de-risks the sum/lock rules before they reach the form.
REVISIT TRIGGER: planner feedback that partial breakdowns are needed
  (relax D2 to sum <= total); a third size_type appearing (normalize D5).
```

Run the review with `/challenge-decision` and the `decision-challenger`
subagent. It is advisory: it never blocks a gate or a merge.
