import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  async open(): Promise<void> {
    await this.page.goto('/index.html');
    await expect(this.page.locator('.card-title').first()).toBeVisible();
  }

  async openLoginModal(): Promise<void> {
    await this.loginNav.click();
    await expect(this.page.locator('#logInModal')).toBeVisible();
  }

  async openProduct(name: string): Promise<void> {
    await this.page.getByRole('link', { name, exact: true }).click();
    await expect(this.page.getByRole('heading', { name })).toBeVisible();
  }
}
