import { expect, Locator, Page } from '@playwright/test';
import { captureAlert } from '../support/dialogs';

export class LoginModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#logInModal');
    this.username = page.locator('#loginusername');
    this.password = page.locator('#loginpassword');
    this.submitButton = this.modal.getByRole('button', { name: 'Log in' });
  }

  private async fill(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async loginExpectingSuccess(username: string, password: string): Promise<void> {
    await this.fill(username, password);
    await this.submitButton.click();
    await expect(this.page.locator('#nameofuser')).toBeVisible();
  }

  async loginExpectingAlert(username: string, password: string): Promise<string> {
    await this.fill(username, password);
    return captureAlert(this.page, () => this.submitButton.click());
  }
}
