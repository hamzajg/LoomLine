# stock-and-materials — specifications by example
# Scenario tags @w<N> map items to delivery waves (see WAVES.md / BACKLOG.md).

Feature: stock-and-materials

  @w1 @happy-path
  Scenario: Create a material with a stable code
    Given an authorized inventory manager
    When they create a THREAD material with code MAT-THREAD-COTTON-20, label Cotton thread 20/2, unit kg, and supplier reference SUP-001
    Then the material is stored active and can be found by code, label, kind, and supplier reference

  @w1
  Scenario: List and filter materials
    Given several materials exist across THREAD, SUPPLY, and FABRIC kinds
    When an authorized user lists materials filtered by kind SUPPLY and search text zip
    Then only matching materials are returned with code, label, kind, unit, active flag, and current locations count

  @w1 @happy-path
  Scenario: Post a stock receipt
    Given material MAT-THREAD-COTTON-20 exists and stock location MAIN is available
    When an authorized manager posts a RECEIPT of 100 kg at MAIN
    Then the movement is stored immutably and the derived level for MAT-THREAD-COTTON-20 at MAIN is 100 kg

  @w1
  Scenario: Post a stock issue
    Given MAT-THREAD-COTTON-20 has a derived level of 100 kg at MAIN
    When an authorized manager posts an ISSUE of 30 kg at MAIN
    Then the derived level for MAT-THREAD-COTTON-20 at MAIN becomes 70 kg and the issue movement is listed

  @w1 @edge-case
  Scenario: Reject a movement with unknown material or location
    Given no material with code UNKNOWN-MAT exists and location NOWHERE is not seeded
    When an authorized manager posts a RECEIPT for UNKNOWN-MAT at NOWHERE
    Then the request fails with typed field errors for material and location and no movement or level change is stored

  @w1 @edge-case
  Scenario: Reject a movement with non-positive quantity
    Given material MAT-THREAD-COTTON-20 exists and location MAIN is available
    When an authorized manager posts a RECEIPT with quantity 0
    Then the request fails with a typed quantity error and no movement is stored

  @w2 @happy-path
  Scenario: Post a movement from the stock screen
    Given an authorized inventory manager is signed in and MAT-THREAD-COTTON-20 has level 70 kg at MAIN
    When they open Stock > Movements, choose ISSUE, enter 10 kg at MAIN, and submit
    Then the stock screen shows the saved movement and the level for MAT-THREAD-COTTON-20 at MAIN becomes 60 kg without a page reload error

  @w2
  Scenario: View stock levels read-only as supervisor
    Given a production supervisor is signed in and MAT-THREAD-COTTON-20 has movements at MAIN and SECONDARY
    When they open Stock > Levels
    Then they see the derived balance for each material and location with movement history available read-only and no create, edit, post, or delete controls

  @w2 @edge-case
  Scenario: Show an empty stock workspace with a create path
    Given no materials exist yet and an authorized inventory manager is signed in
    When they open Stock > Materials
    Then they see an empty state explaining that no materials exist and a clear New material action, while a supervisor sees the same empty state without the action

  @w3 @edge-case
  Scenario: Adjust stock with a required reason
    Given MAT-THREAD-COTTON-20 has a derived level of 60 kg at MAIN
    When an authorized manager posts an ADJUSTMENT with delta -5 kg and reason "cycle count variance"
    Then the derived level becomes 55 kg and the movement stores the signed delta and reason

  @w3 @edge-case
  Scenario: Reject an adjustment without a reason
    Given MAT-THREAD-COTTON-20 has a derived level of 60 kg at MAIN
    When an authorized manager posts an ADJUSTMENT with delta +2 kg and no reason
    Then the request fails with a typed reason error and no movement is stored

  @w3 @edge-case
  Scenario: Reject an issue that would make the balance negative
    Given MAT-THREAD-COTTON-20 has a derived level of 10 kg at MAIN
    When an authorized manager posts an ISSUE of 11 kg at MAIN
    Then the request fails with a typed insufficient-stock error, the derived level remains 10 kg, and no movement is stored

  @w3
  Scenario: Keep stock levels scoped by location
    Given MAT-THREAD-COTTON-20 has a RECEIPT of 100 kg at MAIN and a RECEIPT of 40 kg at SECONDARY
    When an authorized user reads stock levels
    Then MAIN shows 100 kg and SECONDARY shows 40 kg as separate balances for the same material

  @w3 @edge-case
  Scenario: Prevent deleting a material that has movements
    Given MAT-THREAD-COTTON-20 has at least one stock movement
    When an authorized manager tries to delete MAT-THREAD-COTTON-20
    Then the request fails with a typed conflict explaining that materials with movements must be deactivated, and the material remains readable

  @w3
  Scenario: Deny stock manage actions without the manage grant
    Given a user can view stock but lacks the stock manage grant
    When they try to create a material or post a movement
    Then the request is denied with the same access-denied contract used by other protected sections and no stock data changes
