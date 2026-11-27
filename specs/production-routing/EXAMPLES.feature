# production-routing — specifications by example
# Scenario tags @w<N> map items to delivery waves (see WAVES.md / BACKLOG.md).

Feature: production-routing

  @w1 @happy-path
  Scenario: Set the routing sheet of a draft order
    Given an order for 100 units in status "DRAFT"
    And phases "Cutting", "Sewing" and "Finishing" exist
    And active machines "MC-01" and "MC-02" exist
    When the planner replaces the routing sheet with:
      | Label            | Phase    | Machine | Repetitions | Minutes |
      | Cut the panels   | Cutting  | MC-02   | 1           | 4       |
      | Join the panels  | Sewing   | MC-01   | 2           | 6       |
      | Press and finish | Finishing|         | 1           | 3       |
    Then the order stores exactly those three steps in the submitted order
    And the steps are numbered 1, 2 and 3

  @w1 @happy-path
  Scenario: Read the routing sheet in submitted order
    Given an order with a three-step routing sheet
    When the planner or supervisor requests the routing sheet
    Then the steps are returned with label, phase, machine, repetitions and minutes
    And the steps are ordered by their stored position

  @w1 @edge-case
  Scenario: Clear the routing sheet of an order
    Given an order in status "DRAFT" with a routing sheet
    When the planner replaces the routing sheet with an empty list
    Then the order stores no routing steps

  @w1 @edge-case
  Scenario: Reject a step with an unknown phase or machine
    Given an order in status "DRAFT"
    When the planner submits a step referencing an unknown phase
    Then the request is rejected and the offending step and field are identified
    And no routing steps are stored

  @w1 @edge-case
  Scenario: Reject a step with an invalid label, duration or repetitions
    Given an order in status "DRAFT"
    When the planner submits a step with a blank label, zero minutes or zero repetitions
    Then the request is rejected with a field error for each invalid value
    And no routing steps are stored

  @w1 @edge-case
  Scenario: Reject routing changes on an order in progress
    Given an order in status "IN_PROGRESS" with a routing sheet
    When the planner tries to replace the routing sheet
    Then the request is rejected because the routing is locked
    And the stored steps are unchanged

  @w2 @happy-path
  Scenario: Edit routing steps on the order screen
    Given a planner opens a draft order with a two-step routing sheet
    When the planner adds a step, removes one and moves the remaining step first
    And the planner saves the routing
    Then the order screen shows the new sequence
    And reopening the order shows the same sequence

  @w3 @happy-path
  Scenario: View routing without manage rights
    Given a supervisor session
    When the supervisor opens an order with a routing sheet
    Then the routing steps are visible in order
    And no edit controls are offered
    And a direct write attempt is refused

  @w3 @edge-case
  Scenario: Show a locked routing sheet on an order in progress
    Given an order in status "IN_PROGRESS" with a routing sheet
    When the planner opens the order
    Then the routing steps are visible
    And the sheet is marked as locked and no edit controls are offered

  @w4 @routing @accessibility
  Scenario: The routing sheet shows its total and reorders from the keyboard
    Given a draft order with two routing steps of 4 and 6 minutes
    When the planner edits the routing
    Then the planned total is 10 minutes per unit
    And the second step can be moved up with a button

  @w4 @routing @safety
  Scenario: An empty routing sheet asks before it clears
    Given a routing sheet with steps
    When the planner saves it with no steps
    Then a confirmation names the consequence
    And nothing is saved until the planner confirms
