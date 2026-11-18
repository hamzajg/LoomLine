# LoomLine

LoomLine is a textile manufacturing operations platform. It covers the daily
loop of a production floor: taking in production orders, tracking their state,
and — in later features — routing sheets, stock, equipment, and quality.

## Status

**Spec phase.** The first feature, *order intake and tracking*, is specified and
wave-planned; no application code exists yet. See
[`specs/order-intake-and-tracking/`](specs/order-intake-and-tracking/).

## Repository layout

| Path | Contents |
|------|----------|
| `specs/PRODUCT.md` | Feature map and sequencing across all specs |
| `specs/order-intake-and-tracking/SPEC.md` | Problem, users, scope, acceptance criteria, decisions |
| `specs/order-intake-and-tracking/EXAMPLES.feature` | Executable Gherkin scenarios, tagged by delivery wave |
| `specs/order-intake-and-tracking/BACKLOG.md` | User stories and dependencies |
| `specs/order-intake-and-tracking/WAVES.md` | Shippable increments (one PR per wave) |
| `specs/order-intake-and-tracking/GATES.md` | Preconditions for each phase transition |
| `specs/order-intake-and-tracking/LOOP.md` | Delivery-loop execution record |
| `specs/order-intake-and-tracking/SPEC-AUDIT.md` | Spec audit evidence and verdict |
| `specs/order-intake-and-tracking/ADR-0001-stack.md` | Stack decision record |
| `specs/order-intake-and-tracking/SEED-DATA.md` | Reference data required by the order flow |
| `specs/order-intake-and-tracking/STATUS-RULES.md` | Order lifecycle and transition rules |

## Planned stack

- **API:** Quarkus 3.40 on Kotlin, built with Gradle 9 and JDK 25
- **Web:** React + TypeScript, built with Vite
- **Data:** PostgreSQL 16 with Flyway migrations
- **Local demo:** Docker Compose (`api`, `web`, `db`)

Rationale, alternatives, and consequence checks are in
[`ADR-0001-stack.md`](specs/order-intake-and-tracking/ADR-0001-stack.md).

## How work is delivered

Each wave in `WAVES.md` is one branch, one pull request, green tests, and a
demoable outcome. A feature is finished when its acceptance criteria are
demonstrated and recorded in `VALIDATION.md`. The delivery record lives in
`LOOP.md`.

## Development

Prerequisites: a full **JDK 25** (the workspace uses Temurin at
`/home/kali/factory/.jdk/jdk-25`; JRE-only installs cannot compile), Node 24,
and Docker with Compose.

```bash
# API: tests and dev server
JAVA_HOME=/home/kali/factory/.jdk/jdk-25 ./gradlew :api:test
JAVA_HOME=/home/kali/factory/.jdk/jdk-25 ./gradlew :api:quarkusDev   # :8080

# Web: tests and dev server (proxies /api to :8080)
cd web && npm install && npm test && npm run dev                     # :5173

# Full stack (db + api + web)
docker compose up --build        # UI on :8086, API on :8085
```

The API needs PostgreSQL. For local development, `docker compose up db`
provides it on `localhost:5433` with the credentials in
`application.properties` (`loomline` / `loomline`). Tests provision their own
throwaway database through Quarkus Dev Services and load the reference seed;
no manual setup is required.

`compose.yaml` also enables the reference seed for the demo environment. A
production deployment sets `QUARKUS_FLYWAY_LOCATIONS=db/migration` and manages
reference data through the application.
