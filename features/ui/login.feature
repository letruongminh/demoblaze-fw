@ui
Feature: Account login
  As a returning shopper
  I want to sign in to the DemoBlaze store
  So that my cart and orders are tied to my account

  Background:
    Given I am on the DemoBlaze home page

  @smoke @positive @regression
  Scenario: Sign in with valid credentials
    When I sign in with my registered account
    Then I should be greeted by name in the navigation
    And the login option should no longer be available

  @negative @regression
  Scenario: Reject a registered user who types the wrong password
    When I attempt to sign in using the "wrong password" dataset
    Then I should see a login alert saying "Wrong password."
    And I should remain signed out

  @negative @regression
  Scenario: Reject a user that does not exist
    When I attempt to sign in using the "unknown user" dataset
    Then I should see a login alert saying "User does not exist."
    And I should remain signed out

  @negative @validation @regression
  Scenario: Require both username and password
    When I attempt to sign in using the "empty credentials" dataset
    Then I should see a login alert saying "Please fill out Username and Password."
    And I should remain signed out
