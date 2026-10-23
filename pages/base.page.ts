import { Locator, Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly loginNav: Locator;
  readonly signUpNav: Locator;
  readonly logoutNav: Locator;
  readonly userGreeting: Locator;
  readonly cartNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginNav = page.locator('#login2');
    this.signUpNav = page.locator('#signin2');
    this.logoutNav = page.locator('#logout2');
    this.userGreeting = page.locator('#nameofuser');
    this.cartNav = page.getByRole('link', { name: 'Cart' });
  }

  async goToCart(): Promise<void> {
    await this.cartNav.click();
    await this.page.waitForURL(/cart\.html/);
  }

  async greetingText(): Promise<string> {
    return (await this.userGreeting.textContent())?.trim() ?? '';
  }
}
