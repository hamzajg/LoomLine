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

## Experience

- Primary journey: planner opens a DRAFT or RELEASED order, goes to its
  composition section, adds colour × size quantity lines, watches the
  remaining quantity against the order total, and saves the whole breakdown in
  one action.
- Edge states: an order with no lines shows an empty breakdown with an "add
  line" action; a breakdown over the order quantity is refused with the
  offending total highlighted and nothing saved; the editor shows the planned
  total and the remaining quantity against the order before saving and warns
  as soon as the draft goes over; unknown or incompatible
  colour/size choices are disabled or explained inline; from IN_PROGRESS the
  section is read-only and says why; viewers see the same rows without edit
  controls; on narrow viewports each quantity row stacks its fields instead of
  scrolling horizontally.
- UX bar: the remaining quantity is always visible while editing, the editor
  is one replace-set form rather than a per-row save dance, and a failed save
  leaves every entered line intact.
- Accessibility: colour and size pickers are labelled and keyboard operable;
  quantity inputs have visible labels and error text tied to the field; the
  breakdown table exposes row and column headers; the lock state is conveyed
  as text, not by disabled styling alone.
- UI pattern: F-pattern — the order header, total and breakdown table read
  top-left downward; the add-line row sits directly under the table it
  extends.
- Navigation/overlay: inline — the breakdown editor is a section on the
  full-page order detail, so totals and lines stay visible; `IN_PROGRESS`
  locks it in place.

## Scope (in)

- Colour and size reference data (code + label; sizes belong to a size type).
- Quantity lines on an order: colour × size × quantity, unique per
  colour+size pair.
- Replace-set API: the client submits the full desired breakdown; the
  server validates and stores it atomically.
- Validation: positive quantities, known colour/size, size compatible with
  the article's size type, sum of lines does not exceed the order quantity
  (partial breakdowns allowed).
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
| 2 | Invalid breakdowns are rejected with typed errors and nothing is stored | Reject a breakdown exceeding the order quantity, Reject a breakdown with an unknown colour or size |
| 3 | The breakdown locks once production starts | Reject composition changes on an order in progress |
| 4 | Viewers see the breakdown without being able to change it | View the breakdown without manage rights |

## Decisions

- **D1 — Composition is a replace-set, not per-line CRUD.** The client sends
  the complete desired list of lines; the server diffs and stores it in one
  transaction. Chosen over per-line endpoints because the sum invariant and
  uniqueness are whole-set properties — validating them per-line invites
  intermediate invalid states. Reversibility: two-way door; a per-line API
  can be added later without changing stored data.
- **D2 — Lines are optional, may be partial, and may not exceed the total.**
  An order may have zero lines (backwards compatible), and lines may cover
  only part of the quantity — progressive entry is legitimate. The only sum
  rule is `sum <= order.quantity`: a breakdown claiming more than the order
  holds is nonsense. Agreed by the product owner 2026-11-19 (see
  COMPOSITION-RULES.md). Reversibility: two-way door — the rule lives in
  one use case.
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
