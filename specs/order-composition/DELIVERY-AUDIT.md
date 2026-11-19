# Delivery audit — order-composition (delivery)

- Repo: `~/factory/openharness/sources/LoomLine`
- Spec: `specs/order-composition`
- Generated: 2026-11-19T15:20:34Z
- Phase: **delivery**
- Findings: **2 blockers · 5 concerns · 1 unverified**
- This is a deterministic evidence brief, not a verdict. The `delivery-auditor` re-verifies it and fills the verdict.

## What was checked

- Acceptance criteria: 4
- Scenarios: 6 (2 wave tags)
- Backlog items: 3
- Waves: 2
- Gates: 4
- Validation rows: 4
- Path claims checked: 2
- Changed files: 18
- In-scope paths: none recorded

## Blockers

- [placeholder-gate-evidence] `LOOP.md` — gate G1 is met but its evidence is a placeholder: DECISION-REVIEW.md — verdict ACCEPT; steelman on D2 answered by owner amendment (partial allowed)
- [placeholder-gate-evidence] `LOOP.md` — gate G3 is met but its evidence is a placeholder: COMPOSITION-RULES.md agreed by product owner 2026-11-19

## Concerns

- [ac-weak-evidence] `VALIDATION.md` — AC 1 has only weak token-match evidence: (weak) NewOrderPage.test.tsx
- [ac-weak-evidence] `VALIDATION.md` — AC 2 has only weak token-match evidence: (weak) NewOrderPage.test.tsx
- [ac-weak-evidence] `VALIDATION.md` — AC 3 has only weak token-match evidence: (weak) OrdersPage.test.tsx
- [ac-weak-evidence] `VALIDATION.md` — AC 4 has only weak token-match evidence: (weak) OrdersPage.test.tsx
- [validation-gap] `VALIDATION.md` — unresolved validation gap: 4 scenario(s) lack detected test evidence — verify manually or add checks

## Unverified

- [scope-no-paths] `SPEC.md` — scope drift not checked — no in-scope paths recorded

## Verdict (agent fills after verifying the code)

```
AUDIT: CONCERNS
PHASE: delivery
BLOCKERS: 0 confirmed — placeholder-gate-evidence findings are false
  positives (evidence strings are the actual acceptance records).
CONCERNS: accepted — (a) weak-evidence rows are token-match noise; real
  proof is OrderCompositionIT + SetOrderQuantitiesUseCaseTest + live
  verify-composition.sh + 5 browser screenshots in bundle
  20261119T152442Z-9730f4f; (b) "unfinished-code" is an HTML input
  placeholder attribute; (c) wave-2 UI verified via Playwright-core +
  system chromium, not the harness (policy: harness never drives browsers).
UNVERIFIED: scope drift (no in-scope paths — pre-existing).
EVIDENCE: read OrdersPage.tsx breakdown editor, api.ts additions,
  OrderBreakdown flows; ran web 27/27 + build, :api:test green, live
  OIDC script (lock/403/read paths), screenshots attached and verified.
```

Rules: `BLOCK` on any confirmed blocker, hallucinated claim, or
unproven acceptance criterion. `CONCERNS` only when every remaining
item is non-blocking and explicitly accepted. `PASS` only when all
three lists are empty. Never mark `PASS` from this brief alone.
