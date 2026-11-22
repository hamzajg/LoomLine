# Delivery Loop — production-routing

Status: done
Iterations: 0
Review: required
Updated: 2026-11-22T09:05:03Z

| Wave | Status | Branch | PR | Evidence | Updated |
|------|--------|--------|----|----------|---------|
| 1 | done | feat/production-routing-w1 | #35 | PR #35 merged; 106 backend tests pass; routing replace-set API + V3 migration | 2026-11-22T09:05:03Z |
| 2 | done | feat/production-routing-w2 | #36 | PR #36 merged; 106 backend + 33 frontend tests pass; edit routing UI | 2026-11-22T09:05:03Z |
| 3 | done | feat/production-routing-w3 | #37 | PR #37 merged; 106 backend + 35 frontend tests pass; read-only routing + locked message | 2026-11-22T09:05:03Z |

## Gates

| Gate | Status | Evidence | Updated |
|------|--------|----------|---------|
| G1 | met | specs/production-routing/DECISION-REVIEW.md | 2026-11-20T05:43:29Z |
| G2 | met | SEED-DATA.md — 6 phases, 4 machines with fixed UUIDs; schema V3 + repeatable seed owned by wave 1 | 2026-11-20T05:47:41Z |
| G3 | met | ROUTING-RULES.md agreed by product owner 2026-11-20 (single duration, optional sheet, seeded read-only machines, IN_PROG | 2026-11-20T05:47:41Z |
| G4 | pending | — | — |

## Events

- 2026-11-20T05:43:29Z gate G1 met: specs/production-routing/DECISION-REVIEW.md
- 2026-11-20T05:43:39Z blocked: G3: Confirm routing rules - single minutes field, optional sheet at release, seeded read-only machines, IN_PROGRESS lock
- 2026-11-20T05:47:32Z resumed
- 2026-11-20T05:47:41Z gate G2 met: SEED-DATA.md — 6 phases, 4 machines with fixed UUIDs; schema V3 + repeatable seed owned by wave 1
- 2026-11-20T05:47:41Z gate G3 met: ROUTING-RULES.md agreed by product owner 2026-11-20 (single duration, optional sheet, seeded read-only machines, IN_PROG
- 2026-11-21T14:59:00Z start wave 1 on feat/production-routing-w1
- 2026-11-21T14:59:00Z complete wave 1 (7b5c9e3): 106 tests pass, 0 failed; PUT/GET /api/orders/{id}/routing, GET /api/phases, GET /api/machines endpoints; V3 migration +
- 2026-11-21T14:59:09Z start wave 2 on feat/production-routing-w2
- 2026-11-21T15:08:13Z complete wave 2 (36): 106 backend tests pass, 33 frontend tests pass; 8 OrderRoutingIT integration tests for edit flow; frontend routing UI in
- 2026-11-21T15:08:36Z start wave 3 on feat/production-routing-w3
- 2026-11-21T15:11:48Z complete wave 3 (37): 106 backend tests pass, 35 frontend tests pass; locked message for IN_PROGRESS orders; read-only routing view; all 3 wav
- 2026-11-21T15:17:10Z feature validated and shipped
- 2026-11-22T09:05:03Z complete wave 1 (#35): PR #35 merged; 106 backend tests pass; routing replace-set API + V3 migration
- 2026-11-22T09:05:03Z complete wave 2 (#36): PR #36 merged; 106 backend + 33 frontend tests pass; edit routing UI
- 2026-11-22T09:05:03Z complete wave 3 (#37): PR #37 merged; 106 backend + 35 frontend tests pass; read-only routing + locked message
