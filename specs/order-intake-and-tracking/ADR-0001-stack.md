# ADR-0001 — Stack and scaffold

- **Status:** accepted — owner approved 2026-11-18 (gate G3)
- **Date:** 2026-11-18
- **Owner:** tech lead (proposal) · product owner (acceptance)
- **Supersedes:** the initial Spring Boot 3 / Java 17 proposal (same date, not
  committed)
- **Related:** `SPEC.md` D1, D2, D7; `DECISION-REVIEW.md`; `GATES.md` G3

## Context

LoomLine's first feature is production-order intake and tracking: a small,
transaction-heavy workflow whose hard part is business invariants (unique
reference, positive quantity, legal status transitions) rather than UI
volume. The legacy system was a Java 8 / Spring Boot 1.4 / MySQL / AngularJS
application whose state handling was weak, so the rebuild needs stronger
transactional guarantees and explicit state rules rather than a bigger
surface.

Workspace facts verified on 2026-11-18:

- JDK 25 present at `/usr/lib/jvm/java-25-openjdk-amd64` (also JDK 21 and 17).
- Gradle is not preinstalled; Gradle 9.9.1 is the current distribution and the
  project will commit a wrapper.
- Node 24 / npm 12 present for the frontend.
- Maven Central and the Gradle plugin portal are reachable; Quarkus 3.40.1 is
  the current stable platform and Kotlin 2.2.x plugin resolves.

## Decision

| Layer | Choice | Version |
|-------|--------|---------|
| Backend | Quarkus (REST, Validation, Hibernate ORM with Panache, Flyway) | 3.40.x |
| Language | Kotlin (JVM target 25) | 2.2.x |
| Build | Gradle with committed wrapper; Kotlin DSL | 9.9 |
| Runtime | JDK | 25 (JVM mode; no native image in v1) |
| Frontend | React + TypeScript, built with Vite | current majors |
| Database | PostgreSQL, migrations with Flyway | 16 |
| Packaging | Docker Compose (`api`, `web`, `db`) for local/demo | — |
| Backend tests | JUnit 5 + QuarkusTest + Testcontainers (PostgreSQL) | — |
| Frontend tests | Vitest + Testing Library | — |

Architecture: modular monolith packaged by feature (`order`, `reference`).
The domain layer is plain Kotlin (no Quarkus imports) behind ports; `Clock`
and id generation are injected. Persistence and REST live in adapters.
Migrations are forward-only and additive.

Gradle toolchain targets Java 25 explicitly so builds are reproducible
regardless of the JDK that launches Gradle.

## Alternatives considered

1. **Spring Boot 3 + Java 17** — the original proposal. Strong domain and
   persistence tooling, but slower startup, heavier memory footprint, and no
   team preference for Spring; rejected in favour of Quarkus.
2. **Quarkus + Java (no Kotlin)** — removes the Kotlin toolchain and its
   compile-time cost; rejected because null-safety and concise value types
   help the invariant-heavy domain, and the product owner chose Kotlin.
3. **.NET 10 minimal API + React + PostgreSQL** — equal fit, toolchain
   present; rejected for the same lack of an existing .NET estate and a weaker
   mapping from the legacy JPA model.
4. **NestJS + React + PostgreSQL** — one language across the stack, thinner
   transactional/domain tooling for this workflow.
5. **Server-rendered Spring MVC + Thymeleaf** — fewest moving parts, but the
   product needs an interactive list/filter/detail experience and a public API
   a later client can reuse.

Tradeoffs are scored in `DECISION-REVIEW.md` (time to first demo, domain fit,
ops complexity, reversibility).

## Consequences

**Positive**
- Fast startup and low memory suit a Compose-based demo and later container
  deployment; build-time CDI validation catches wiring errors early.
- Hibernate ORM + Flyway give the transactional and migration guarantees this
  feature depends on; Panache keeps the persistence adapter small.
- Kotlin's type system makes illegal states and null fields harder to
  represent, which is exactly the domain's failure mode.
- Toolchain is pinned by the Gradle wrapper and the Java 25 toolchain, so the
  build does not drift with the host JDK.

**Negative / costs**
- Smaller hiring pool than Spring/Java; if the team cannot staff Kotlin, this
  ADR must be revisited.
- JDK 25 is newer than many base images; container images must be verified
  (`eclipse-temurin:25-jdk` / `25-jre` or equivalent) before wave 1 closes.
- Kotlin adds a compile step and annotation-processing considerations for
  Hibernate; generated JPA metamodel is not used in v1.
- Native image is deliberately out of scope, so the startup advantage is
  partial.

**Neutral**
- Flyway means schema changes ship as migrations, so rollback is a redeploy of
  the previous build rather than a down-migration.

## Compliance checks for wave 1

1. `./gradlew build` succeeds on JDK 25 (`java -version` printed in CI logs).
2. The committed wrapper downloads a pinned Gradle 9.9.x distribution.
3. `docker compose config` validates (gate G5) and `docker compose up` serves
   `/q/health` and `GET /api/orders`.
4. No Quarkus types leak into the domain package; a unit test imports the
   domain package without starting Quarkus.

## Revisit trigger

Reopen this ADR if the team cannot staff Kotlin/Quarkus, if the first demo
takes longer than two weeks from wave-1 start, if JDK 25 base images prove
unusable, or if the follow-on authentication feature cannot land within one
wave of this feature.

## Acceptance

Accepted by the product owner on 2026-11-18 in response to the gate-G3
question ("for backend use quarkus with kotlin and gradle jdk 25"). Recorded as
gate evidence by `ship_loop`:

```bash
python -m openharness run ship_loop --repo_path=sources/LoomLine \
  --spec_dir=specs/order-intake-and-tracking --action=gate \
  --gate=G3 --status=met --evidence="ADR-0001-stack.md accepted by product owner 2026-11-18 (Quarkus+Kotlin+Gradle, JDK 25)"
```
