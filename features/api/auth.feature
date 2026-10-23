@api
Feature: Account API
  As a client of the DemoBlaze platform
  I want the signup and login endpoints to behave correctly
  So that accounts can be provisioned and authenticated programmatically

  @smoke @positive @regression
  Scenario: Register and authenticate a new account
    When I register a brand-new account via the API
    Then the signup should succeed
    When I log in via the API using the "registered" credentials
    Then I should receive an auth token

  @negative @regression
  Scenario: Reject a duplicate registration
    Given I have registered a new account via the API
    When I register that same account again
    Then the API should respond with the error "This user already exist."

  @negative @regression
  Scenario Outline: Reject an invalid login
    Given I have registered a new account via the API
    When I log in via the API using the "<variant>" credentials
    Then the API should respond with the error "<message>"

    Examples:
      | variant        | message              |
      | wrong password | Wrong password.      |
      | unknown user   | User does not exist. |

  @negative @validation
  Scenario: Empty credentials are not validated and trigger a server error
    When I log in via the API using the "empty credentials" credentials
    Then the API should respond with a server error
