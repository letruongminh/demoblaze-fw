import { APIRequestContext } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';
import { HomePage } from '../pages/home.page';
import { LoginModal } from '../pages/login.modal';
import { ProductPage } from '../pages/product.page';
import { CartPage } from '../pages/cart.page';
import { OrderModal } from '../pages/order.modal';
import { DemoblazeApi } from '../support/api-client';
import { Credentials, generateCredentials } from '../support/credentials';
import { config } from '../config/env';
import { StepTimings } from '../support/perf';

/** State shared between the steps of a single API scenario. */
export interface ApiState {
  status?: number;
  body?: string;
  json?: unknown;
  token?: string;
  account?: Credentials;
  cartItemId?: string;
}

export interface World {
  /** Last native browser alert captured by a UI step. */
  lastAlert?: string;
  /** Working state for API scenarios. */
  api: ApiState;
  /** Collected samples for the performance journey. */
  perf: StepTimings[];
}

type Fixtures = {
  homePage: HomePage;
  loginModal: LoginModal;
  productPage: ProductPage;
  cartPage: CartPage;
  orderModal: OrderModal;
  world: World;
  shopper: Credentials;
  /** A request context pinned to the DemoBlaze REST API for @api scenarios. */
  api: APIRequestContext;
};

export const test = base.extend<Fixtures>({
  world: async ({}, use) => {
    await use({ api: {}, perf: [] });
  },
  api: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: config.apiURL });
    await use(context);
    await context.dispose();
  },
  shopper: async ({}, use) => {
    const creds = generateCredentials();
    const api = await DemoblazeApi.create();
    try {
      await api.signup(creds.username, creds.password);
    } finally {
      await api.dispose();
    }
    await use(creds);
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginModal: async ({ page }, use) => {
    await use(new LoginModal(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  orderModal: async ({ page }, use) => {
    await use(new OrderModal(page));
  },
});

export const { Given, When, Then } = createBdd(test);
