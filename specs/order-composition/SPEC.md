# Spec: order-composition

> Spec-driven development artifact. This file is the contract: implementation
> is done when every acceptance criterion maps to a scenario in
> `EXAMPLES.feature` and every scenario has a passing check.

## Problem

A production order today carries a single total quantity. On the shop floor
an order is actually produced as a breakdown — so many pieces in each colour
and size — and planners currently have nowhere to record that breakdown.
Without it, picking, cutting and packing cannot be planned per variant, and
the total on the order cannot be reconciled against what will really be
sewn. This feature adds the colour/size quantity composition to an order,
with the same server-enforced rigour the lifecycle already has.

## Users

- **Production planner** — records and corrects the colour/size breakdown
  while the order is still plannable.
- **Production supervisor** — reads the breakdown to verify what to produce.
- **Administrator** — same rights as the planner on the production section.

## Outcome hypothesis

- Expected user outcome: every plannable order carries an explicit
  colour/size breakdown that reconciles with its total quantity, visible to
  everyone who can view production.
- Opportunity evidence: the legacy system's order screen has a dedicated
  "Code Couleur / Taille" quantity section (`OFCouleurCodeTaille` +
  `OFQuantite` entities); orders without a breakdown cannot drive cutting
  or packing plans.
- Signal: share of non-terminal orders with at least one quantity line;
  baseline 0% (feature does not exist yet).
- Follow-up owner/date: product owner, at the next planning review.

## Scope (in)

- Colour and size reference data (code + label; sizes belong to a size type).
- Quantity lines on an order: colour × size × quantity, unique per
  colour+size pair.
- Replace-set API: the client submits the full desired breakdown; the
  server validates and stores it atomically.
- Validation: positive quantities, known colour/size, size compatible with
  the article's size type, sum of lines equals the order quantity.
- Composition editable only while the order is `DRAFT` or `RELEASED`;
  locked from `IN_PROGRESS` onward (same boundary as the lifecycle).
- Order detail shows the breakdown; the list is unchanged.

## Scope (out)

- Production phases and operation routing (gammes) — separate feature.
- External preparation / external production subcontracting.
- Per-line prices, costs, or currencies.
- Editing the order's article/client after creation (composition follows
  the article's size type; changing the article is out of scope).
- Files, need sheets, seasons, models.

## Acceptance criteria

| # | Criterion | Scenario(s) |
|---|-----------|-------------|
| 1 | A planner can set the colour/size quantity breakdown on a plannable order | Set the colour-size breakdown of an order, Read the breakdown of an order |
| 2 | Invalid breakdowns are rejected with typed errors and nothing is stored | Reject a breakdown that does not reconcile, Reject a breakdown with an unknown colour or size |
| 3 | The breakdown locks once production starts | Reject composition changes on an order in progress |
| 4 | Viewers see the breakdown without being able to change it | View the breakdown without manage rights |

## Decisions

- **D1 — Composition is a replace-set, not per-line CRUD.** The client sends
  the complete desired list of lines; the server diffs and stores it in one
  transaction. Chosen over per-line endpoints because the sum invariant and
  uniqueness are whole-set properties — validating them per-line invites
  intermediate invalid states. Reversibility: two-way door; a per-line API
  can be added later without changing stored data.
- **D2 — Lines are optional but must reconcile when present.** An order may
  have zero lines (backwards compatible with orders created before this
  feature). Once at least one line exists, quantities must be positive and
  their sum must equal the order's total quantity. Chosen over "lines always
  required" (would break existing orders and the create flow) and over
  "sum may differ" (a breakdown that doesn't add up is worse than none).
  Reversibility: two-way door — the rule lives in one use case.
- **D3 — Composition is locked from IN_PROGRESS onward.** Editing is
  allowed in DRAFT and RELEASED only. This mirrors the lifecycle boundary:
  once work has started, the breakdown is a fact of production, not a
  planning input. Reversibility: two-way door; the guard is one check in
  the use case.
- **D4 — Colours and sizes are first-class reference tables.** `colour`
  (code, label) and `size` (code, label, size_type) replace free-text
  entry; quantity lines reference them by id. Chosen over embedding
  colour/size strings on the line because the legacy model scopes colour
  codes to colours and sizes to size types, and referential integrity is
  what makes the breakdown reportable. Reversibility: two-way door.
- **D5 — Size compatibility is enforced against the article's size type.**
  A line's size must belong to the same size type as the order's article.
  Articles carry `size_type` as text today; sizes carry the same key.
  Reversibility: two-way door.
