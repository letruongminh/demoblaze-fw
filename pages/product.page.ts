import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { captureAlert } from '../support/dialogs';

export class ProductPage extends BasePage {
  readonly addToCartButton: Locator = this.page.getByRole('link', { name: 'Add to cart' });

  async addToCart(): Promise<string> {
    return captureAlert(this.page, () => this.addToCartButton.click());
  }
}
