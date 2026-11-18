# Order intake and tracking — specifications by example
# Scenario tags @w<N> map items to delivery waves (see WAVES.md / BACKLOG.md).

Feature: Order intake and tracking

  @w1 @happy-path
  Scenario: Create a production order
    Given a client "Maison Textile" and an article "ART-100" exist
    When the planner creates an order for 250 units due 2026-12-15
    Then the order is saved with status "DRAFT"
    And the order can be retrieved by its reference

  @w1 @edge-case
  Scenario: Reject a duplicate order reference
    Given an order with reference "OF-2026-001" exists
    When the planner creates another order with reference "OF-2026-001"
    Then the request is rejected with "Reference already exists"
    And no second order is stored

  @w1 @edge-case
  Scenario: Reject an order with a non-positive quantity
    Given a client and an article exist
    When the planner creates an order with quantity 0
    Then the request is rejected with a validation message
    And the order list is unchanged

  @w1 @edge-case
  Scenario: Reject a missing required field
    Given a client and an article exist
    When the planner creates an order without a due date
    Then the request is rejected and the missing field is identified

  @w2 @happy-path
  Scenario: Filter orders by status
    Given orders exist in "DRAFT", "RELEASED" and "COMPLETED"
    When the planner filters the list by status "RELEASED"
    Then only orders with status "RELEASED" are returned

  @w2 @happy-path
  Scenario: Find an order by reference
    Given orders exist with references "OF-2026-001" and "OF-2026-002"
    When the planner searches for "OF-2026-002"
    Then only the matching order is returned

  @w2 @happy-path
  Scenario: View an order's details
    Given an order for article "ART-100" exists
    When the supervisor opens the order
    Then the detail shows reference, article, client, quantity, due date and status

  @w3 @happy-path
  Scenario: Advance an order through its lifecycle
    Given an order in status "DRAFT"
    When the planner releases it
    Then its status becomes "RELEASED"
    And the change is timestamped

  @w3 @edge-case
  Scenario: Reject an invalid status transition
    Given an order in status "COMPLETED"
    When the planner tries to move it to "IN_PROGRESS"
    Then the request is rejected with "Invalid status transition"
    And the status remains "COMPLETED"

  @w3 @edge-case
  Scenario: Terminal orders cannot be cancelled
    Given an order in status "COMPLETED"
    When the planner tries to cancel it
    Then the request is rejected because the order is in a terminal state
