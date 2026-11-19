# article-catalogue — specifications by example
# Scenario tags @w<N> map items to delivery waves (see WAVES.md / BACKLOG.md).

Feature: article-catalogue

  @w1 @happy-path
  Scenario: Create an article
    Given a client and the size types "EU" and "UK" exist
    When the planner creates an article with reference "ART-100", label "Cotton tee", that client, size type "EU" and unit "piece"
    Then the article is stored and returned by the article list

  @w1 @happy-path
  Scenario: Update a colour
    Given a colour with code "NV" and label "Noir"
    When the planner updates its label to "Black"
    Then the colour list shows code "NV" with label "Black"

  @w1 @happy-path
  Scenario: Delete a size
    Given a size "XXL" of type "EU" that no order references
    When the planner deletes it
    Then the size no longer appears in the size list

  @w1 @happy-path
  Scenario: Search catalogue entries
    Given articles "ART-100 Cotton tee" and "ART-200 Wool coat"
    When the planner searches articles for "coat"
    Then only "ART-200 Wool coat" is returned

  @w1 @edge-case
  Scenario: Reject a duplicate article reference
    Given an article with reference "ART-100"
    When the planner creates another article with reference "art-100"
    Then the request fails with a duplicate error and nothing is stored

  @w1 @edge-case
  Scenario: Reject an article with an unknown client
    Given no client with a given id
    When the planner creates an article referencing that client id
    Then the request fails with a validation error naming the client field

  @w1 @edge-case
  Scenario: Reject deleting an article referenced by an order
    Given an article used by at least one order
    When the planner deletes the article
    Then the request fails with an in-use conflict and the article remains

  @w1 @edge-case
  Scenario: Reject deleting a colour used in an order breakdown
    Given a colour referenced by an order quantity line
    When the planner deletes the colour
    Then the request fails with an in-use conflict and the colour remains

  @w1 @access
  Scenario: View catalogue without manage rights
    Given a supervisor (production view, no manage)
    When they list articles, colours and sizes
    Then all entries are returned and no write is possible

  @w1 @access
  Scenario: Deny catalogue writes to a viewer
    Given a supervisor
    When they try to create an article
    Then the request is denied with 403

  @w2 @happy-path
  Scenario: Browse the catalogue in the UI
    Given a signed-in planner
    When they open the catalogue section
    Then articles, colours and sizes are listed with search

  @w2 @happy-path
  Scenario: Create an entry from the UI
    Given a planner on the catalogue page
    When they fill the colour form (code, label) and save
    Then the new colour appears in the list without a reload of other data

  @w2 @edge-case
  Scenario: Show a validation error in the UI
    Given a planner creating an article with a duplicate reference
    When they save
    Then the form shows the server's error and keeps the entered values

  @w2 @access
  Scenario: Read-only catalogue for a supervisor
    Given a signed-in supervisor
    When they open the catalogue
    Then lists are visible and create/edit/delete controls are absent
