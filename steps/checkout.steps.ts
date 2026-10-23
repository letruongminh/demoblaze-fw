import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { Given, When, Then } from './fixtures';
import { HomePage } from '../pages/home.page';
import { ProductPage } from '../pages/product.page';
import { billingDataset } from '../data/checkout';

async function addProduct(homePage: HomePage, productPage: ProductPage, name: string): Promise<void> {
  await homePage.open();
  await homePage.openProduct(name);
  const alert = await productPage.addToCart();
  expect(alert).toContain('Product added');
}

Given('I am signed in to DemoBlaze', async ({ homePage, loginModal, shopper }) => {
  await homePage.open();
  await homePage.openLoginModal();
  await loginModal.loginExpectingSuccess(shopper.username, shopper.password);
});

When('I add the {string} to my cart', async ({ homePage, productPage }, name: string) => {
  await addProduct(homePage, productPage, name);
});

Given('I have {string} in my cart', async ({ homePage, productPage }, name: string) => {
  await addProduct(homePage, productPage, name);
});

When('I add the following products to my cart:', async ({ homePage, productPage }, table: DataTable) => {
  for (const [name] of table.raw()) {
    await addProduct(homePage, productPage, name);
  }
});

Then('my cart should contain {string}', async ({ cartPage }, name: string) => {
  await cartPage.open();
  await cartPage.waitForItem(name);
});

Then('my cart total should equal the sum of the item prices', async ({ cartPage }) => {
  await cartPage.open();
  await expect(cartPage.rows).toHaveCount(2);
  const total = await cartPage.displayedTotal();
  const sum = await cartPage.sumOfRowPrices();
  expect(total).toBe(sum);
});

When('I place the order using the {string} billing details', async ({ cartPage, orderModal }, dataset: string) => {
  await cartPage.open();
  await cartPage.placeOrder();
  await orderModal.purchaseExpectingConfirmation(billingDataset(dataset));
});

When('I try to place the order using the {string} billing details', async ({ cartPage, orderModal, world }, dataset: string) => {
  await cartPage.open();
  await cartPage.placeOrder();
  world.lastAlert = await orderModal.purchaseExpectingAlert(billingDataset(dataset));
});

Then('I should see an order confirmation', async ({ orderModal }) => {
  await expect(orderModal.confirmationTitle).toHaveText('Thank you for your purchase!');
});

Then('the confirmation should show the purchased amount', async ({ orderModal }) => {
  expect(await orderModal.confirmationText()).toContain('Amount');
});

Then('I should see an order alert saying {string}', async ({ world }, expected: string) => {
  expect(world.lastAlert).toBe(expected);
});

Then('the order dialog should remain open', async ({ orderModal }) => {
  expect(await orderModal.isOpen()).toBe(true);
});
