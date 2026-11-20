# LoomLine

LoomLine is a textile manufacturing operations platform. It covers the daily
loop of a production floor: taking in production orders, tracking their state,
and — in later features — routing sheets, stock, equipment, and quality.

## Status

**Active development.** Four features are shipped and validated; the fifth,
*production routing*, is in progress (wave 1 planned, decision review complete).
See [`specs/PRODUCT.md`](specs/PRODUCT.md) for the feature map and status.

## Repository layout

| Path | Contents |
|------|----------|
| `specs/PRODUCT.md` | Feature map and sequencing across all specs |
| `specs/order-intake-and-tracking/SPEC.md` | Problem, users, scope, acceptance criteria, decisions |
| `specs/PRODUCT.md` | Feature map and sequencing across all specs |
| `specs/order-intake-and-tracking/` | Shipped: order intake, status, lifecycle, and composition |
| `specs/auth-and-app-shell/` | Shipped: identity, roles, access control, and application shell |
| `specs/order-composition/` | Shipped: colour/size quantity breakdown per order |
| `specs/article-catalogue/` | Shipped: articles, colours, sizes, and size types |
| `specs/production-routing/` | In progress: ordered instruction sheets for shop floor |

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
`~/factory/.jdk/jdk-25`; JRE-only installs cannot compile), Node 24,
and Docker with Compose.

```bash
# API: tests and dev server
JAVA_HOME=~/factory/.jdk/jdk-25 ./gradlew :api:test
JAVA_HOME=~/factory/.jdk/jdk-25 ./gradlew :api:quarkusDev   # :8080

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
