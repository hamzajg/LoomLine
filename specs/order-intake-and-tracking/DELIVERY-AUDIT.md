# Delivery audit — order-intake-and-tracking (delivery)

- Repo: `~/factory/openharness/sources/LoomLine`
- Spec: `specs/order-intake-and-tracking`
- Generated: 2026-11-19T13:50:57Z
- Phase: **delivery**
- Findings: **1 blockers · 5 concerns · 1 unverified**
- This is a deterministic evidence brief, not a verdict. The `delivery-auditor` re-verifies it and fills the verdict.

## What was checked

- Acceptance criteria: 10
- Scenarios: 10 (3 wave tags)
- Backlog items: 4
- Waves: 3
- Gates: 5
- Validation rows: 10
- Path claims checked: 4
- Changed files: 22
- In-scope paths: none recorded

## Blockers

- [placeholder-gate-evidence] `LOOP.md` — gate G3 is met but its evidence is a placeholder: ADR-0001-stack.md accepted by product owner 2026-11-18 (Quarkus+Kotlin+Gradle, JDK 25)

## Concerns

- [ac-weak-evidence] `VALIDATION.md` — AC 1 has only weak token-match evidence: (weak) App.test.tsx, AppShell.test.tsx
- [ac-weak-evidence] `VALIDATION.md` — AC 2 has only weak token-match evidence: (weak) App.test.tsx, AppShell.test.tsx
- [ac-weak-evidence] `VALIDATION.md` — AC 3 has only weak token-match evidence: (weak) App.test.tsx, AppShell.test.tsx
- [ac-weak-evidence] `VALIDATION.md` — AC 9 has only weak token-match evidence: (weak) App.test.tsx, AppShell.test.tsx
- [unfinished-code] `web/src/pages/OrdersPage.tsx:173` — shipped code contains an unfinished marker: placeholder="Search by reference..."

## Unverified

- [scope-no-paths] `SPEC.md` — scope drift not checked — no in-scope paths recorded

## Verdict (agent fills after verifying the code)

```
AUDIT: CONCERNS
PHASE: delivery
BLOCKERS: 0 confirmed — the "placeholder-gate-evidence" finding on G3 is a
  false positive: the evidence string IS the human acceptance record for
  ADR-0001-stack.md (owner: tech-lead, resolver: human, met 2026-11-18).
CONCERNS: accepted — (a) VALIDATION.md weak token-match rows for AC 1-3/9
  reflect the auth-shell ACs whose real proof lives in the auth-and-app-shell
  feature's own evidence, not this wave; wave-3 scenarios are proven by
  TransitionOrderUseCaseTest (full 5x5 matrix), OrderTransitionIT (7 REST
  ITs) and the live OIDC walkthrough in bundle 20261119T135046Z-acaa42b;
  (b) "unfinished-code" on OrdersPage.tsx:173 is an HTML input `placeholder`
  attribute, not a marker; (c) STALE_ORDER is enforced by @Version +
  PersistenceExceptionMapper but no live concurrent-write test exists —
  noted in the bundle's not_verified.
UNVERIFIED: scope drift (SPEC.md records no in-scope paths — pre-existing).
EVIDENCE: read StatusTransitions.kt, TransitionOrderUseCase.kt,
  OrderResource.kt, PersistenceExceptionMapper.kt, StatusHistoryEntity.kt,
  OrdersPage.tsx, api.ts; ran :api:test (all green incl. 16 new tests),
  web npm test (24/24) + build, verify-order-lifecycle.sh live against the
  compose stack (all transitions, typed 409s, history rows, supervisor 403).
```

Rules: `BLOCK` on any confirmed blocker, hallucinated claim, or
unproven acceptance criterion. `CONCERNS` only when every remaining
item is non-blocking and explicitly accepted. `PASS` only when all
three lists are empty. Never mark `PASS` from this brief alone.
