import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { loginDataset, validUser } from '../data/users';

Given('I am on the DemoBlaze home page', async ({ homePage }) => {
  await homePage.open();
});

When('I sign in with my registered account', async ({ homePage, loginModal }) => {
  const user = validUser();
  await homePage.openLoginModal();
  await loginModal.loginExpectingSuccess(user.username, user.password);
});

When('I attempt to sign in using the {string} dataset', async ({ homePage, loginModal, world }, dataset: string) => {
  const input = loginDataset(dataset);
  await homePage.openLoginModal();
  world.lastAlert = await loginModal.loginExpectingAlert(input.username, input.password);
});

Then('I should be greeted by name in the navigation', async ({ homePage }) => {
  const user = validUser();
  await expect(homePage.userGreeting).toBeVisible();
  await expect(homePage.userGreeting).toHaveText(`Welcome ${user.username}`);
});

Then('the login option should no longer be available', async ({ homePage }) => {
  await expect(homePage.loginNav).toBeHidden();
});

Then('I should see a login alert saying {string}', async ({ world }, expected: string) => {
  expect(world.lastAlert).toBe(expected);
});

Then('I should remain signed out', async ({ homePage }) => {
  await expect(homePage.loginNav).toBeVisible();
  await expect(homePage.userGreeting).toBeHidden();
});
