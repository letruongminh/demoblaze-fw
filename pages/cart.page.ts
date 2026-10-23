import { expect, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  readonly rows: Locator = this.page.locator('#tbodyid tr');
  readonly total: Locator = this.page.locator('#totalp');
  readonly placeOrderButton: Locator = this.page.getByRole('button', { name: 'Place Order' });

  async open(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async waitForItem(name: string): Promise<void> {
    await expect(this.rowByName(name)).toBeVisible();
  }

  async displayedTotal(): Promise<number> {
    await expect(this.total).not.toHaveText('');
    return Number((await this.total.textContent())?.trim());
  }

  async sumOfRowPrices(): Promise<number> {
    const count = await this.rows.count();
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const priceCell = this.rows.nth(i).locator('td').nth(2);
      sum += Number((await priceCell.textContent())?.trim());
    }
    return sum;
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
    await expect(this.page.locator('#orderModal')).toBeVisible();
  }
}
