import { expect } from '@playwright/test';
import { performance } from 'node:perf_hooks';
import { When, Then } from './fixtures';
import { HomePage } from '../pages/home.page';
import { LoginModal } from '../pages/login.modal';
import { ProductPage } from '../pages/product.page';
import { CartPage } from '../pages/cart.page';
import { OrderModal } from '../pages/order.modal';
import { DemoblazeApi } from '../support/api-client';
import { generateCredentials } from '../support/credentials';
import { billingDataset } from '../data/checkout';
import { config } from '../config/env';
import { StepTimings, STEPS, summarize, timingTable } from '../support/perf';

async function measure<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = performance.now();
  const value = await fn();
  return [value, performance.now() - start];
}

/** Runs one full, isolated login -> add to cart -> place order journey and times each step. */
async function runJourney(browser: import('@playwright/test').Browser): Promise<StepTimings> {
  // API-assisted setup: register a throwaway account so each journey has a clean cart.
  const creds = generateCredentials();
  const api = await DemoblazeApi.create();
  try {
    await api.signup(creds.username, creds.password);
  } finally {
    await api.dispose();
  }

  const context = await browser.newContext({ baseURL: config.baseURL });
  const page = await context.newPage();
  try {
    const home = new HomePage(page);
    const loginModal = new LoginModal(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const orderModal = new OrderModal(page);

    await home.open();
    const journeyStart = performance.now();

    const [, login] = await measure(async () => {
      await home.openLoginModal();
      await loginModal.loginExpectingSuccess(creds.username, creds.password);
    });

    const [, addToCart] = await measure(async () => {
      await home.openProduct(config.performance.product);
      const alert = await productPage.addToCart();
      expect(alert).toContain('Product added');
    });

    const [, placeOrder] = await measure(async () => {
      await cartPage.open();
      await cartPage.waitForItem(config.performance.product);
      await cartPage.placeOrder();
      await orderModal.purchaseExpectingConfirmation(billingDataset('valid order'));
    });

    const total = performance.now() - journeyStart;
    return { login, addToCart, placeOrder, total };
  } finally {
    await context.close();
  }
}

When(
  'I run the purchase journey for the configured number of iterations',
  async ({ browser, world, $testInfo }) => {
    for (let i = 0; i < config.performance.iterations; i++) {
      world.perf.push(await runJourney(browser));
    }

    const report = timingTable(world.perf, config.performance.budgetsMs);
    await $testInfo.attach('performance-timings', {
      body: report,
      contentType: 'text/markdown',
    });
    // Surfaced in the console/list reporter too, so a CI log shows the numbers.
    console.log(`\n[performance] login -> add to cart -> place order\n${report}\n`);
  },
);

Then('every performance step should meet its median budget', async ({ world }) => {
  expect(world.perf.length, 'at least one journey must have been sampled').toBeGreaterThan(0);
  for (const step of STEPS) {
    const { median } = summarize(world.perf, step);
    const budget = config.performance.budgetsMs[step];
    expect(
      median,
      `median ${step} duration ${Math.round(median)}ms exceeded the ${budget}ms budget`,
    ).toBeLessThanOrEqual(budget);
  }
});

Then('the performance report should include every iteration', async ({ world }) => {
  expect(world.perf.length).toBe(config.performance.iterations);
});
