@api
Feature: Catalog API
  As a client of the DemoBlaze platform
  I want the catalog endpoints to return correct product data
  So that storefronts and integrations can list and look up products

  @smoke @positive @regression
  Scenario: List every product in the catalog
    When I request the product catalog
    Then the catalog should contain at least 9 products
    And every product should expose an id, a title and a price

  @positive @regression
  Scenario: Filter products by category
    When I request products in the "phone" category
    Then every returned product should belong to the "phone" category

  @positive @regression
  Scenario: Fetch a single product by id
    When I request the product with id 1
    Then the product title should be "Samsung galaxy s6"

  @negative @regression
  Scenario: Fetching an unknown product returns an error
    When I request the product with id 999999
    Then the API should respond with the error "Not found."
