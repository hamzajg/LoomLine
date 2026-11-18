# Decision review brief — Spec: Order intake and tracking

- Source: `specs/order-intake-and-tracking/SPEC.md (## Decisions)`
- Generated: 2026-11-18T01:21:18Z
- Detected type: data, process
- Focus: architecture
- Readiness: **CHALLENGE** (6/6 record elements)
- This brief is input to judgment, not a verdict. The agent fills the scorecard after reading the code.

**Reversibility:** stated

**Alternatives on record (verify they are credible, not strawmen):**
- Alternatives considered: Spring Boot 3 + Java 17 (the earlier proposal), .NET 10 + React, NestJS + React, and server-rendered Spring MVC + Thymeleaf (tradeoffs 
- Migrations are forward-only and additive; rollback is a redeploy of the previous build. - Review outcome. /challenge-decision returned REVISE (advisory): altern

## Evidence signals (heuristic — verify before acting)

- `/usr/lib/jvm/java-25-openjdk-amd64` — no source files found to inspect

Inspected: `/usr/lib/jvm/java-25-openjdk-amd64`

## Design moves to test

- Which invariant spans more than one aggregate, and does the transaction span it too?
- Can the write model be separated from read shapes without splitting the database?
- What is the migration and rollback path for existing data?
- What feedback loop proves this process works, and how fast is it?
- Who owns it when it fails, and what is the escalation path?
- Can it be simpler without losing the guarantee?
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
- Which consistency guarantee is required, and which can be eventual?
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
| Problem & forces | 4 | `SPEC.md` Problem/Outcome; opportunity evidence marked as assumption | Validate with first users |
| Alternatives & tradeoffs | 4 | `ADR-0001-stack.md` alternatives 1–5; `SPEC.md` D1; tradeoff table below | Keep Java-only variant in mind as fallback |
| Domain fit (DDD) | 4 | `SPEC.md` D3 transition table, D4 aggregate-by-id; `STATUS-RULES.md` rules 1–8 | State `Order` aggregate + invariants in wave 1 code |
| Architecture & boundaries | 4 | `SPEC.md` D7 modular monolith, ports/adapters, framework-free domain | Enforce with a package-dependency test |
| Testable design | 4 | D7 + `STATUS-RULES.md` test obligations; QuarkusTest/Testcontainers, Vitest | Walking skeleton must run tests in wave 1 |
| Craftsmanship | 4 | Small scope, typed errors (`STATUS-RULES.md` rule 4), forward-only migrations | Keep typed domain errors, no speculative interfaces |
| Decision record | 4 | ADR has status/owner/date, alternatives, consequences, compliance checks, revisit trigger | Pin exact versions in wave 1 |

**Tradeoff matrix (amended decision)**

| Option | Time to first demo | Domain fit | Ops complexity | Reversibility |
|--------|:------------------:|:----------:|:--------------:|:-------------:|
| Chosen: Quarkus 3.40 + Kotlin + React + PG | Medium | Strong | Medium | Medium |
| Spring Boot 3 + Java 17 + React + PG | Medium | Strong | Medium | Medium |
| Quarkus + Java (no Kotlin) | Fast | Strong | Medium | Medium–High |
| .NET 10 + React + PG | Medium | Strong | Medium | Medium |
| NestJS + React + PG | Medium | Medium | Medium | Medium |
| Spring MVC + Thymeleaf | Fast | Strong | Low | High |

## Verdict (agent fills)

```
VERDICT: ACCEPT
STEELMAN: Quarkus 3.40 + Kotlin + Gradle 9 + JDK 25 keeps a transaction-heavy
  order domain in a fast-starting, container-friendly runtime while gaining
  Kotlin's null-safety and concise value modelling for the invariants this
  feature is built on; Hibernate ORM + Flyway give the migration and
  transactional guarantees, React/Vite keeps the UI independently testable,
  and every layer used here is supported by the current stable Quarkus
  platform and resolvable from this workspace.
SMALLEST NEXT STEP: Land a walking skeleton in wave 1 before domain code —
  pinned versions (Quarkus 3.40.x, Kotlin 2.2.x, Gradle 9.9.x, PostgreSQL 16),
  a committed Gradle wrapper, one JUnit 5 + Testcontainers test, one Vitest
  test, and `docker compose config` green. If JDK 25 base images or the
  Kotlin/Quarkus combination fail there, fall back to Quarkus + Java on the
  same API contract (alternatives 2 in ADR-0001) rather than switching
  frameworks.
REVISIT TRIGGER: Reopen if the walking skeleton cannot build or run on JDK 25
  within one working day, if no `25-jdk`/`25-jre` base image is usable, if the
  team cannot staff Kotlin, or if the first demo exceeds two weeks from
  wave-1 start.
```

### Review history

- **2026-11-18 (first pass):** REVISE — the original Spring Boot 3 / Java 17
  proposal lacked alternatives, ownership, and test seams; those were folded
  into `SPEC.md` D1/D7.
- **2026-11-18 (amended decision):** the product owner replaced the backend
  with Quarkus + Kotlin + Gradle + JDK 25. Re-challenged; the alternatives,
  consequences, compliance checks, and revisit trigger are now in
  `ADR-0001-stack.md`. Verdict ACCEPT, conditional on the wave-1 walking
  skeleton.

Run the review with `/challenge-decision` and the `decision-challenger`
subagent. It is advisory: it never blocks a gate or a merge.
