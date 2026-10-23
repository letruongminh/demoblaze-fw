import { Page } from '@playwright/test';

export async function captureAlert(page: Page, trigger: () => Promise<void>): Promise<string> {
  let message = '';
  const handled = new Promise<void>((resolve) => {
    page.once('dialog', async (dialog) => {
      message = dialog.message();
      try {
        await dialog.accept();
      } finally {
        resolve();
      }
    });
  });
  await trigger();
  await handled;
  return message;
}
