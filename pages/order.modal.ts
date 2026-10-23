import { expect, Locator, Page } from '@playwright/test';
import { captureAlert } from '../support/dialogs';
import { BillingDetails } from '../data/checkout';

export class OrderModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly name: Locator;
  readonly country: Locator;
  readonly city: Locator;
  readonly card: Locator;
  readonly month: Locator;
  readonly year: Locator;
  readonly purchaseButton: Locator;
  readonly confirmation: Locator;
  readonly confirmationTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#orderModal');
    this.name = page.locator('#name');
    this.country = page.locator('#country');
    this.city = page.locator('#city');
    this.card = page.locator('#card');
    this.month = page.locator('#month');
    this.year = page.locator('#year');
    this.purchaseButton = this.modal.getByRole('button', { name: 'Purchase' });
    this.confirmation = page.locator('.sweet-alert');
    this.confirmationTitle = page.locator('.sweet-alert h2');
  }

  async fill(details: BillingDetails): Promise<void> {
    await this.name.fill(details.name);
    await this.country.fill(details.country);
    await this.city.fill(details.city);
    await this.card.fill(details.card);
    await this.month.fill(details.month);
    await this.year.fill(details.year);
  }

  async purchaseExpectingConfirmation(details: BillingDetails): Promise<void> {
    await this.fill(details);
    await this.purchaseButton.click();
    await expect(this.confirmation).toBeVisible();
  }

  async purchaseExpectingAlert(details: BillingDetails): Promise<string> {
    await this.fill(details);
    return captureAlert(this.page, () => this.purchaseButton.click());
  }

  async confirmationText(): Promise<string> {
    return (await this.confirmation.textContent())?.trim() ?? '';
  }

  async isOpen(): Promise<boolean> {
    return this.modal.isVisible();
  }
}
