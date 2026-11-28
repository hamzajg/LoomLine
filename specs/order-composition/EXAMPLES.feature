# order-composition — specifications by example
# Scenario tags @w<N> map items to delivery waves (see WAVES.md / BACKLOG.md).

Feature: order-composition

  @w1 @happy-path
  Scenario: Set the colour-size breakdown of an order
    Given an order for 100 units in status "DRAFT"
    And colours "Noir" and "Ecru" and sizes "S", "M" exist
    When the planner sets the breakdown to Noir/S=40, Noir/M=30, Ecru/M=30
    Then the order stores exactly those three lines
    And the sum of line quantities equals the order quantity

  @w1 @happy-path
  Scenario: Read the breakdown of an order
    Given an order with quantity lines
    When the planner or supervisor requests the breakdown
    Then the lines are returned with colour, size and quantity

  @w1 @edge-case
  Scenario: Reject a breakdown exceeding the order quantity
    Given an order for 100 units
    When the planner sets lines summing to 110
    Then the request is rejected and no lines are stored

  @w1 @edge-case
  Scenario: Reject a breakdown with an unknown colour or size
    Given an order for 100 units
    When the planner sets a line referencing an unknown colour
    Then the request is rejected and the offending field is identified

  @w2 @edge-case
  Scenario: Reject composition changes on an order in progress
    Given an order in status "IN_PROGRESS" with quantity lines
    When the planner tries to replace the breakdown
    Then the request is rejected because the composition is locked
    And the stored lines are unchanged

  @w2 @happy-path
  Scenario: View the breakdown without manage rights
    Given a supervisor session
    When the supervisor opens an order with quantity lines
    Then the breakdown is visible
    And no edit controls are offered

  @w3 @composition @feedback
  Scenario: The editor shows planned and remaining quantities
    Given an order for 120 units with 40 units in the breakdown
    When the planner edits the breakdown
    Then the editor shows 40 of 120 planned and 80 remaining
    When the planner raises a line to 150
    Then the editor warns that the draft is 30 over the order quantity

  @w4 @composition @accessibility
  Scenario: A rejected breakdown marks its quantity lines
    Given the planner is editing the breakdown of a draft order
    When the server rejects the save with a message
    Then the quantity lines are marked invalid for assistive technology
    And the lines reference the error message
    And every value the planner entered is kept
