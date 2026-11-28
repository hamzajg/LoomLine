# auth-and-app-shell — specifications by example
# Scenario tags @w<N> map items to delivery waves (see WAVES.md / BACKLOG.md).

Feature: Identity, access control, and the application shell

  # --- Wave 1: the application shell -------------------------------------

  @w1 @happy-path
  Scenario: Shell renders navigation for a signed-in user
    Given an authenticated user is in the application
    When the shell is displayed
    Then the header shows the product brand and the current user
    And the sidebar lists the product's sections
    And the content area shows the current screen

  @w1 @responsive
  Scenario: Sidebar collapses on a narrow viewport
    Given an authenticated user is in the application
    When the viewport is narrowed to a phone-sized width
    Then the sidebar is hidden and a toggle control is shown in the header
    When the user activates the toggle
    Then the sidebar opens as a drawer over the content
    And the content remains readable

  @w1 @accessibility
  Scenario: Shell controls are keyboard operable
    Given an authenticated user is in the application
    When the user navigates using only the keyboard
    Then the sidebar toggle and each navigation item can be focused in order
    And each control exposes an accessible name and its expanded or selected state
    And a visible focus indicator is shown on the focused control

  # --- Wave 2: accounts and authentication -------------------------------

  @w2 @auth @redirect
  Scenario: Unauthenticated visitor is redirected to sign-in
    Given a visitor has no active session
    When the visitor requests an application route
    Then the visitor is sent to the sign-in screen
    And the originally requested route is not shown

  @w2 @auth @happy-path
  Scenario: Valid credentials sign a user in
    Given a user exists with a known username and password
    When the user submits the correct username and password
    Then a session is established
    And the user lands in the shell
    And the header shows the user's display name

  @w2 @auth @failure
  Scenario: Invalid credentials are rejected
    Given a visitor is on the sign-in screen
    When the visitor submits an unknown username or a wrong password
    Then sign-in is rejected with a single generic message
    And no session is created
    And the message does not reveal which field was wrong

  @w2 @auth
  Scenario: Signing out ends the session
    Given a user is signed in
    When the user signs out
    Then the session is terminated
    And requesting a protected route redirects to sign-in again

  @w2 @auth @api
  Scenario: API rejects a request without a session
    Given no valid session exists
    When a request is made to a protected API endpoint
    Then the API responds with status 401
    And no state is changed

  # --- Wave 3: role-based access -----------------------------------------

  @w3 @rbac @navigation
  Scenario: Navigation is limited to the role's sections
    Given a signed-in user whose role grants only some sections
    When the shell is displayed
    Then the sidebar lists exactly the granted sections
    And sections the role does not grant are not shown

  @w3 @rbac @routing
  Scenario: Access-denied state for an ungranted route
    Given a signed-in user whose role does not grant a section
    When the user requests that section's route directly
    Then an access-denied state is shown
    And the section's content is not rendered

  @w3 @rbac @api
  Scenario: API rejects an out-of-role action
    Given a signed-in user whose role does not permit an action
    When the user calls the API endpoint for that action
    Then the API responds with status 403
    And the action does not execute

  @w3 @rbac @admin
  Scenario: Administrator creates a user with a role
    Given an administrator is signed in
    When the administrator creates a user and assigns a role
    Then the new user can sign in
    And the new user sees exactly the access the assigned role grants

  @w4 @responsive @accessibility
  Scenario: Navigation drawer moves focus in and returns it on close
    Given a narrow viewport where the sidebar is a header-toggled drawer
    When the user opens the drawer
    Then focus moves to the drawer's first control
    And Tab stays inside the drawer while the page behind is blocked
    When the user dismisses the drawer with Escape
    Then focus returns to the header toggle

  # --- Wave 5: design-system pass (ADR 0014) ----------------------------

  @w5 @accessibility
  Scenario: Skip link reaches the main content
    Given an authenticated user is in the application
    When the user activates the skip link
    Then focus moves to the main content landmark
    And the skip link is the first focusable control in the shell

  @w5 @accessibility @design-tokens
  Scenario: Shell text tokens meet AA contrast
    Given the shell uses the shared design tokens
    Then the subtle text token meets 4.5:1 on every surface token
    And the accent foreground token meets 4.5:1 on the accent fill
    And text selection uses a token rather than a browser default
