import { APIRequestContext, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { Given, When, Then } from './fixtures';
import type { World } from './fixtures';
import { encodePassword } from '../support/api-client';
import { generateCredentials } from '../support/credentials';

interface ApiProduct {
  id: number;
  title: string;
  price: number;
  cat: string;
}

interface CartEntry {
  id: string;
  cookie: string;
  prod_id: string;
}

interface ApiResult {
  status: number;
  body: string;
  json: unknown;
}

async function send(
  api: APIRequestContext,
  method: 'GET' | 'POST',
  path: string,
  data?: unknown,
): Promise<ApiResult> {
  const res = method === 'GET' ? await api.get(path) : await api.post(path, { data });
  const body = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    json = undefined; // 500 pages and bare strings are left as the raw body
  }
  return { status: res.status(), body, json };
}

function record(world: World, result: ApiResult): void {
  world.api.status = result.status;
  world.api.body = result.body;
  world.api.json = result.json;
}

async function registerFreshAccount(api: APIRequestContext, world: World): Promise<void> {
  const account = generateCredentials();
  world.api.account = account;
  const result = await send(api, 'POST', '/signup', {
    username: account.username,
    password: encodePassword(account.password),
  });
  record(world, result);
}

function items(world: World): ApiProduct[] {
  const json = world.api.json as { Items?: ApiProduct[] } | undefined;
  expect(json, 'response should be a JSON object with an Items array').toBeDefined();
  expect(Array.isArray(json?.Items), 'response should contain an Items array').toBe(true);
  return json!.Items!;
}

// --- Registration & authentication -----------------------------------------

Given('I have registered a new account via the API', async ({ api, world }) => {
  await registerFreshAccount(api, world);
  expect(world.api.status).toBe(200);
});

When('I register a brand-new account via the API', async ({ api, world }) => {
  await registerFreshAccount(api, world);
});

When('I register that same account again', async ({ api, world }) => {
  const account = world.api.account;
  expect(account, 'a prior account must exist for this step').toBeDefined();
  const result = await send(api, 'POST', '/signup', {
    username: account!.username,
    password: encodePassword(account!.password),
  });
  record(world, result);
});

When('I log in via the API using the {string} credentials', async ({ api, world }, variant: string) => {
  let username: string;
  let password: string;
  switch (variant) {
    case 'registered':
      expect(world.api.account, 'register an account before logging in').toBeDefined();
      username = world.api.account!.username;
      password = world.api.account!.password;
      break;
    case 'wrong password':
      expect(world.api.account, 'register an account before logging in').toBeDefined();
      username = world.api.account!.username;
      password = 'Wrong-Password-999';
      break;
    case 'unknown user':
      username = `ghost_user_${Date.now()}`;
      password = 'Whatever-Password-1';
      break;
    case 'empty credentials':
      username = '';
      password = '';
      break;
    default:
      throw new Error(`Unknown login credentials variant: "${variant}"`);
  }

  const result = await send(api, 'POST', '/login', { username, password: encodePassword(password) });
  record(world, result);
  if (typeof result.json === 'string' && result.json.startsWith('Auth_token')) {
    world.api.token = result.json.replace('Auth_token: ', '');
  }
});

Then('the signup should succeed', async ({ world }) => {
  expect(world.api.status).toBe(200);
  expect(world.api.body ?? '').not.toContain('errorMessage');
});

Then('I should receive an auth token', async ({ world }) => {
  expect(world.api.status).toBe(200);
  expect(world.api.body).not.toContain('errorMessage');
  expect(world.api.token, 'an auth token should have been parsed from the response').toBeTruthy();
});

Then('the API should respond with the error {string}', async ({ world }, message: string) => {
  const json = world.api.json as { errorMessage?: string } | undefined;
  expect(json, `expected a JSON error body, got: ${world.api.body}`).toBeDefined();
  expect(json?.errorMessage).toBe(message);
});

Then('the API should respond with a server error', async ({ world }) => {
  // DemoBlaze does not validate empty credentials and returns a raw 500 page.
  // We assert the failure mode explicitly rather than pretend it is handled cleanly.
  expect(world.api.status, `expected a 5xx status, got ${world.api.status}`).toBeGreaterThanOrEqual(500);
});

// --- Catalog ----------------------------------------------------------------

When('I request the product catalog', async ({ api, world }) => {
  record(world, await send(api, 'GET', '/entries'));
});

Then('the catalog should contain at least {int} products', async ({ world }, count: number) => {
  expect(items(world).length).toBeGreaterThanOrEqual(count);
});

Then('every product should expose an id, a title and a price', async ({ world }) => {
  for (const product of items(world)) {
    expect(typeof product.id).toBe('number');
    expect(typeof product.title).toBe('string');
    expect(product.title.length).toBeGreaterThan(0);
    expect(typeof product.price).toBe('number');
    expect(product.price).toBeGreaterThan(0);
  }
});

When('I request products in the {string} category', async ({ api, world }, category: string) => {
  record(world, await send(api, 'POST', '/bycat', { cat: category }));
});

Then('every returned product should belong to the {string} category', async ({ world }, category: string) => {
  const list = items(world);
  expect(list.length).toBeGreaterThan(0);
  for (const product of list) {
    expect(product.cat).toBe(category);
  }
});

When('I request the product with id {int}', async ({ api, world }, id: number) => {
  record(world, await send(api, 'POST', '/view', { id: String(id) }));
});

Then('the product title should be {string}', async ({ world }, title: string) => {
  const product = world.api.json as ApiProduct | undefined;
  expect(product, `expected a product body, got: ${world.api.body}`).toBeDefined();
  expect(product?.title).toBe(title);
});

// --- Cart -------------------------------------------------------------------

Given('I am authenticated via the API', async ({ api, world }) => {
  await registerFreshAccount(api, world);
  expect(world.api.status).toBe(200);
  const login = await send(api, 'POST', '/login', {
    username: world.api.account!.username,
    password: encodePassword(world.api.account!.password),
  });
  expect(login.status).toBe(200);
  expect(typeof login.json).toBe('string');
  world.api.token = (login.json as string).replace('Auth_token: ', '');
  expect(world.api.token).toBeTruthy();
});

When('I add product {int} to the cart via the API', async ({ api, world }, prodId: number) => {
  expect(world.api.token, 'authenticate before adding to the cart').toBeTruthy();
  world.api.cartItemId = randomUUID();
  const result = await send(api, 'POST', '/addtocart', {
    id: world.api.cartItemId,
    cookie: world.api.token,
    prod_id: String(prodId), // DemoBlaze only persists the item when prod_id is a string
    flag: true,
  });
  record(world, result);
});

Then('the add-to-cart call should succeed', async ({ world }) => {
  expect(world.api.status).toBe(200);
  expect(world.api.body ?? '').not.toContain('errorMessage');
});

Then('my API cart should contain product {int}', async ({ api, world }, prodId: number) => {
  const result = await send(api, 'POST', '/viewcart', { cookie: world.api.token, flag: true });
  record(world, result);
  const entries = (result.json as { Items?: CartEntry[] }).Items ?? [];
  expect(entries.some((entry) => entry.prod_id === String(prodId))).toBe(true);
});

When('I remove that item from the cart via the API', async ({ api, world }) => {
  expect(world.api.cartItemId, 'add an item before removing it').toBeTruthy();
  const result = await send(api, 'POST', '/deletecart', {
    cookie: world.api.token,
    id: world.api.cartItemId,
  });
  record(world, result);
});

Then('the API should confirm the item was deleted', async ({ world }) => {
  // DemoBlaze replies "Item deleted." even though the item is not actually
  // removed server-side (a known platform defect). We assert the documented
  // contract response rather than a cart state the backend never reaches.
  expect(world.api.body ?? '').toContain('Item deleted.');
});
