@ui
Feature: Cart checkout
  As a signed-in shopper
  I want to add products to my cart and place an order
  So that I can complete a purchase

  Background:
    Given I am signed in to DemoBlaze

  @smoke @positive @regression
  Scenario: Place an order for a single product
    When I add the "Samsung galaxy s6" to my cart
    Then my cart should contain "Samsung galaxy s6"
    When I place the order using the "valid order" billing details
    Then I should see an order confirmation
    And the confirmation should show the purchased amount

  @positive @regression
  Scenario: Cart total reflects every item added
    When I add the following products to my cart:
      | Samsung galaxy s6 |
      | Nokia lumia 1520  |
    Then my cart total should equal the sum of the item prices

  @negative @validation @regression
  Scenario: Reject an order that is missing the name and card
    Given I have "Samsung galaxy s6" in my cart
    When I try to place the order using the "missing name and card" billing details
    Then I should see an order alert saying "Please fill out Name and Creditcard."
    And the order dialog should remain open
