# DemoBlaze Playwright BDD Automation

End-to-end UI automation for the [DemoBlaze](https://www.demoblaze.com/) store, written in
**Playwright + TypeScript** with a **BDD / Gherkin** layer ([`playwright-bdd`](https://vitalets.github.io/playwright-bdd/))
and the **Page Object Model (POM)**.

It automates the two core journeys requested, each with typical **and** edge-case coverage:

1. **Logging in** with valid credentials, plus wrong password, unknown user, and empty-field validation.
2. **Adding to cart and placing an order**, plus a cart-total check and purchase-form validation.

---

## Why this stack (rationale)

| Choice | Why |
| --- | --- |
| **BDD / Gherkin** | The `.feature` files are the executable requirements. Each scenario reads as plain behaviour (`Given I am signed in … When I place the order … Then I should see an order confirmation`), so non-developers can read and review coverage, and the steps stay reusable across scenarios. |
| **`playwright-bdd` runner** | Runs Gherkin on top of the native Playwright runner, so we keep auto-waiting, tracing, the HTML report, retries, parallel workers, and fixtures, instead of hand-wiring a browser lifecycle as classic Cucumber requires. |
| **Page Object Model** | UI structure (selectors, modal/dialog mechanics) lives in `pages/` and is injected into steps as fixtures. Steps describe intent; pages know the DOM. A selector change touches one file. |
| **Data in a separate folder** | Credentials and billing inputs live in `data/` and are referenced from the features by **name** (`"valid order"`, `"wrong password"`). Features stay declarative; test data changes without touching specs or pages. |
| **API-assisted setup** | DemoBlaze needs a registered account to log in. Rather than hardcode credentials, the suite registers accounts through the site's signup API, so it is self-contained and CI-ready on any machine with **no manual step and no committed secrets**. |

---

## Prerequisites

- **Node.js 18+** and npm.
- Network access to `demoblaze.com` and `api.demoblaze.com` (the tests drive the live site).

---

## How to run the demo scripts

```bash
# 1. Install dependencies
npm install

# 2. Download the Chromium browser (one-time)
npx playwright install chromium

# 3. Run the full suite
npm test
```

`npm test` runs **`bddgen`** (which generates Playwright specs from the `.feature` files) and then
**`playwright test`**. The global setup auto-registers an account first, then the 7 scenarios run
in parallel. Expected output:

```
[global-setup] Registered a fresh DemoBlaze account: qa_demo_…
Running 7 tests using 5 workers
  ✓  … Account login › Sign in with valid credentials
  ✓  … Cart checkout › Place an order for a single product
  … (7 total)
  7 passed
```

After a run, open the HTML report with `npm run report`.

> **Note:** Always launch via the npm scripts (they run `bddgen` first). Running `npx playwright test`
> on its own can execute **stale** generated specs after you have changed features or step fixtures.

### npm scripts

| Command | What it does |
| --- | --- |
| `npm test` | Generate from features, then run **all** scenarios |
| `npm run test:headed` | Same, with a visible browser |
| `npm run test:ui` | Open the interactive Playwright UI runner |
| `npm run test:smoke` | Run only `@smoke` scenarios |
| `npm run test:negative` | Run only `@negative` scenarios |
| `npm run report` | Open the last HTML report |

---

## Project structure

```
demoblaze-pw/
├── features/                 # Gherkin specs: the executable requirements
│   ├── login.feature
│   └── checkout.feature
├── steps/                    # Glue: step definitions + Playwright fixtures
│   ├── fixtures.ts           #   POM + accounts wired in as test fixtures
│   ├── login.steps.ts
│   └── checkout.steps.ts
├── pages/                    # Page Object Model: all selectors and UI actions
│   ├── base.page.ts          #   Shared navigation bar (every page extends it)
│   ├── home.page.ts
│   ├── login.modal.ts
│   ├── product.page.ts
│   ├── cart.page.ts
│   └── order.modal.ts
├── data/                     # Test data, kept out of specs and pages
│   ├── users.ts              #   Primary user + named login datasets
│   └── checkout.ts           #   Billing datasets
├── support/                  # Setup and utilities
│   ├── api-client.ts         #   DemoBlaze signup/login API client
│   ├── credentials.ts        #   Generates / stores accounts
│   ├── dialogs.ts            #   Native alert capture helper
│   └── global-setup.ts       #   Auto-registers the primary account before the run
├── playwright.config.ts      # Runner config, BDD wiring, global setup
├── tsconfig.json
└── package.json
```

**Why it is split this way:** each layer has one responsibility and one reason to change.

- `features/`: **what** the system should do (behaviour), owned by whoever defines requirements.
- `steps/`: **translates** each Gherkin line into actions, and injects page objects as fixtures.
- `pages/`: **how** to drive the UI (selectors, dialogs). The only layer that knows the DOM.
- `data/`: **the inputs**, named and reusable, so the same step runs many cases.
- `support/`: **setup and plumbing** (accounts, API, dialog handling) that scenarios should not repeat.

---

## How credentials are handled

DemoBlaze login needs real registered accounts, and the site scopes the **cart to the account**
on the server. Two complementary mechanisms keep the suite self-contained and parallel-safe:

- **Primary account (global setup).** A global setup runs once before the suite and, by default,
  **registers a fresh unique account** via the signup API, verifies it with a real login, and
  stores it in `.auth/credentials.json` (git-ignored). The login scenarios use it, since they
  only authenticate and never touch the cart, so sharing one account is safe.
- **Per-scenario shopper accounts (fixture).** Each checkout scenario auto-registers its own
  throwaway account through the `shopper` fixture, so every cart is isolated and the scenarios
  run fully in parallel without colliding.

The password encoding mirrors the site's own `b64EncodeUnicode`, so an account created via the
API authenticates exactly as one created through the UI.

To use your own primary account instead, copy `.env.example` to `.env` and set `DEMOBLAZE_USER` /
`DEMOBLAZE_PASS`; the global setup will use those and skip registration.

---

## Scenarios

### `features/login.feature`
- **Sign in with valid credentials:** greeted by name, login option gone. *(typical)*
- **Wrong password:** alert `Wrong password.`, still signed out. *(edge)*
- **Unknown user:** alert `User does not exist.`, still signed out. *(edge)*
- **Empty fields:** alert `Please fill out Username and Password.` *(validation)*

### `features/checkout.feature`
- **Place an order for a single product:** add to cart, order, confirmation shown. *(typical)*
- **Cart total reflects every item added:** total equals the sum of row prices. *(typical)*
- **Missing name and card:** alert `Please fill out Name and Creditcard.`, dialog stays open. *(validation)*

---

## Design decisions and notes

- **POM as fixtures:** page objects are injected through Playwright fixtures, so steps read
  cleanly (`{ homePage, cartPage }`) and nothing manages browser lifecycle by hand.
- **Parallel-safe by isolation:** because the cart is server-side per account, checkout scenarios
  each register their own account rather than resetting shared state, which keeps the suite
  deterministic under parallel workers.
- **Native alerts:** DemoBlaze raises native `alert()` dialogs, some synchronously (client-side
  validation) and some from AJAX callbacks. A single `captureAlert` helper accepts the dialog
  inside the handler, which works for both kinds and lets assertions check the exact message.
- **Resilient totals:** the cart-total check sums the on-page row prices instead of hardcoding a
  figure, so it stays correct if catalogue prices change.
- **Verified against the live site:** every selector, alert string, and API shape was confirmed
  on demoblaze.com before being asserted, rather than assumed.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Steps show as *undefined* or a fixture is `undefined` | Generated specs are stale. Run via `npm test` (it runs `bddgen` first), not `npx playwright test` directly. |
| `No credentials found at .auth/credentials.json` | The global setup did not run. Use the npm scripts so `globalSetup` executes, or check network access to `api.demoblaze.com`. |
| Timeouts on navigation | The live site is slow or unreachable. Re-run; check connectivity to `demoblaze.com`. |
| Browser not installed | Run `npx playwright install chromium`. |
