@performance
Feature: Purchase journey performance
  As a performance-conscious team
  I want the core purchase journey to stay within time budgets
  So that latency regressions in login, cart or checkout are caught early

  Scenario: The login to order journey stays within its performance budget
    When I run the purchase journey for the configured number of iterations
    Then every performance step should meet its median budget
    And the performance report should include every iteration
