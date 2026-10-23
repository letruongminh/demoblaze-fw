import { test as base, createBdd } from 'playwright-bdd';
import { HomePage } from '../pages/home.page';
import { LoginModal } from '../pages/login.modal';
import { ProductPage } from '../pages/product.page';
import { CartPage } from '../pages/cart.page';
import { OrderModal } from '../pages/order.modal';
import { DemoblazeApi } from '../support/api-client';
import { Credentials, generateCredentials } from '../support/credentials';

export interface World {
  lastAlert?: string;
}

type Fixtures = {
  homePage: HomePage;
  loginModal: LoginModal;
  productPage: ProductPage;
  cartPage: CartPage;
  orderModal: OrderModal;
  world: World;
  shopper: Credentials;
};

export const test = base.extend<Fixtures>({
  world: async ({}, use) => {
    await use({});
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
