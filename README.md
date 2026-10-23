# DemoBlaze Test Automation Framework

End-to-end test automation for the [DemoBlaze](https://www.demoblaze.com/) store, written in
**Playwright + TypeScript** with a **BDD / Gherkin** layer ([`playwright-bdd`](https://vitalets.github.io/playwright-bdd/)),
the **Page Object Model (POM)**, **Allure reporting**, and **GitHub Actions CI/CD**.

It covers four test types from one toolchain:

| Type | What it exercises | Tag | Script |
| --- | --- | --- | --- |
| **UI** | Browser journeys: login + cart checkout, with edge cases | `@ui` | `npm run test:ui` |
| **API** | DemoBlaze REST endpoints: auth, catalog, cart, with edge cases | `@api` | `npm run test:api` |
| **Regression** | The stable UI + API suite as one selection | `@regression` | `npm run test:regression` |
| **Performance** | A timed `login → add to cart → place order` journey vs. budgets | `@performance` | `npm run test:performance` |

Every suite shares the same page objects, fixtures, data and reporting, and each scenario
includes **typical and edge-case** coverage with explicit validations.

---

## Why this stack (rationale)

| Choice | Why |
| --- | --- |
| **BDD / Gherkin** | `.feature` files are the executable requirements. Scenarios read as plain behaviour, so coverage is reviewable by non-developers, and steps stay reusable. API and performance suites are expressed in Gherkin too, so all four test types share one language. |
| **`playwright-bdd` runner** | Runs Gherkin on the native Playwright runner, keeping auto-waiting, tracing, retries, parallel workers and fixtures instead of hand-wiring a browser lifecycle. |
| **Page Object Model** | Selectors and UI mechanics live in `pages/` and are injected into steps as fixtures. A selector change touches one file. |
| **Centralised config** | Every tunable (URLs, workers, retries, performance budgets) lives in `config/env.ts` with a default and an env override, so nothing is hard-coded and CI can parameterise runs. |
| **Allure reporting** | A rich, historical report (steps, attachments, severity, trends) published as a live GitHub Pages URL per run, on top of Playwright's own HTML report. |
| **API-assisted setup** | Accounts are provisioned through the site's signup API, so the suite is self-contained and CI-ready with no manual steps and no committed secrets. |

---

## Prerequisites

- **Node.js 18+** and npm.
- **Java 8+** - only to *view* Allure reports (`allure generate`/`serve`). Running tests does not need it.
- Network access to `demoblaze.com` and `api.demoblaze.com` (the suite drives the live site).

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Download the Chromium browser (one-time)
npx playwright install chromium

# 3. Run everything (UI + API + regression + performance)
npm test

# 4. Open the Allure report
npm run report:allure
```

`npm test` runs **`bddgen`** (generates Playwright specs from the `.feature` files) and then
**`playwright test`**. A global setup auto-registers an account first.

> **Always launch via the npm scripts** - they run `bddgen` first. Running `npx playwright test`
> directly can execute **stale** generated specs after you change features or steps.

### Scripts

| Command | What it does |
| --- | --- |
| `npm test` | Generate from features, then run **all** scenarios |
| `npm run test:ui` | Only `@ui` scenarios |
| `npm run test:api` | Only `@api` scenarios |
| `npm run test:regression` | Only `@regression` scenarios |
| `npm run test:performance` | Only the `@performance` journey |
| `npm run test:smoke` | Only `@smoke` scenarios |
| `npm run test:negative` | Only `@negative` scenarios |
| `npm run test:headed` | Run with a visible browser |
| `npm run open` | Open the interactive Playwright UI runner |
| `npm run typecheck` | Type-check the whole project (`tsc --noEmit`) |
| `npm run report` | Open the last Playwright HTML report |
| `npm run report:allure` | Build **and serve** the Allure report |
| `npm run allure:generate` | Build the static Allure report into `allure-report/` |
| `npm run allure:open` | Open a previously generated Allure report |
| `npm run allure:clean` | Remove `allure-results/` and `allure-report/` |

---

## Configuration

All parameters have defaults and can be overridden via the environment (copy `.env.example`
to `.env`, or set them in CI). See `config/env.ts`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `https://www.demoblaze.com` | Web UI under test |
| `API_URL` | `https://api.demoblaze.com` | REST API under test |
| `WORKERS` | `3` | Parallel Playwright workers |
| `RETRIES` | `2` on CI, `0` locally | Retries per failing test |
| `DEMOBLAZE_USER` / `DEMOBLAZE_PASS` | *(auto-registered)* | Use a fixed primary account instead of registering one |
| `PERF_ITERATIONS` | `3` | Times the purchase journey is sampled |
| `PERF_PRODUCT` | `Samsung galaxy s6` | Product used in the journey |
| `PERF_LOGIN_MS` | `6000` | Median budget for the login step |
| `PERF_ADDCART_MS` | `6000` | Median budget for add-to-cart |
| `PERF_ORDER_MS` | `8000` | Median budget for place-order |
| `PERF_TOTAL_MS` | `18000` | Median budget for the whole journey |

---

## Reporting (Allure)

- The Allure reporter is wired into `playwright.config.ts` alongside Playwright's HTML + list
  reporters. Traces, screenshots and videos (on failure) are attached automatically.
- The performance journey attaches a **timing table** (median / p95 / min / max vs. budget) to
  its report and prints it to the console/CI log.
- Build and view locally: `npm run report:allure`.
- In CI, the report is published to **GitHub Pages** on every push to `main`
  (`https://letruongminh.github.io/demoblaze-fw/`) with **trend history** retained across runs,
  and is also uploaded as a downloadable workflow artifact.

---

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`, and on demand:

- **Steps:** install → `bddgen` → run the selected suite → generate the Allure report (restoring
  previous history) → upload artifacts → publish to GitHub Pages.
- **Manual runs:** use **Run workflow** (`workflow_dispatch`) to choose `testType`
  (`all` / `ui` / `api` / `regression` / `performance` / `smoke`) and the number of `workers`.

**One-time setup:** enable Pages for the repo (**Settings → Pages → Source: `gh-pages` branch**).
The first `main` build creates the branch; subsequent builds update the live report.

---

## Project structure

```
demoblaze-fw/
├── config/
│   └── env.ts                # Centralised, env-overridable parameters
├── features/                 # Gherkin specs, organised by test type
│   ├── ui/                   #   @ui  - browser journeys
│   │   ├── login.feature
│   │   └── checkout.feature
│   ├── api/                  #   @api - REST endpoints
│   │   ├── auth.feature
│   │   ├── catalog.feature
│   │   └── cart.feature
│   └── performance/          #   @performance - timed purchase journey
│       └── purchase-journey.feature
├── steps/                    # Step definitions + Playwright fixtures
│   ├── fixtures.ts           #   POM + API context + accounts as fixtures
│   ├── login.steps.ts
│   ├── checkout.steps.ts
│   ├── api.steps.ts
│   └── performance.steps.ts
├── pages/                    # Page Object Model: all selectors and UI actions
│   ├── base.page.ts
│   ├── home.page.ts
│   ├── login.modal.ts
│   ├── product.page.ts
│   ├── cart.page.ts
│   └── order.modal.ts
├── data/                     # Named, reusable test data
│   ├── users.ts
│   └── checkout.ts
├── support/                  # Setup and utilities
│   ├── api-client.ts         #   DemoBlaze API client
│   ├── credentials.ts        #   Generates / stores accounts
│   ├── dialogs.ts            #   Native alert capture helper
│   ├── perf.ts               #   Timing math + report table
│   └── global-setup.ts       #   Auto-registers the primary account
├── .github/workflows/ci.yml  # CI/CD: run suites + publish Allure to Pages
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Scenarios

### UI (`features/ui/`)
- **Login:** valid credentials *(typical)*; wrong password, unknown user, empty fields *(edge/validation)*.
- **Checkout:** place an order *(typical)*; cart total equals the sum of row prices *(typical)*;
  missing name and card keeps the dialog open with a validation alert *(validation)*.

### API (`features/api/`)
- **Auth:** register + authenticate *(typical)*; duplicate registration, wrong password, unknown
  user *(edge)*; empty credentials return a server error *(documented defect)*.
- **Catalog:** list all products and validate their shape *(typical)*; filter by category *(typical)*;
  fetch one product by id *(typical)*; unknown id returns `Not found.` *(edge)*.
- **Cart:** add a product and confirm it is listed *(typical)*; delete is acknowledged by the API
  *(documented defect - see below)*.

### Performance (`features/performance/`)
- **Purchase journey:** runs `login → add to cart → place order` `PERF_ITERATIONS` times, asserts
  the **median** of each step and the total against configurable budgets, and attaches the full
  timing breakdown to Allure.

---

## Known DemoBlaze platform quirks (handled explicitly)

The tests were verified against the live backend, which has real defects. Rather than hide them,
the suite documents them so assertions stay honest and non-flaky:

- **`/addtocart`** only persists an item when `prod_id` is sent as a **string** and `flag: true`.
- **`/deletecart`** replies `"Item deleted."` but does **not** remove the item server-side. The
  cart suite asserts the contract response only and does not assert removal.
- **Empty login/signup credentials** return a raw **500** page instead of a validation message.
  The API suite asserts the 5xx failure mode explicitly.

---

## Design decisions

- **POM as fixtures** so steps read cleanly and nothing manages the browser lifecycle by hand.
- **Parallel-safe by isolation:** the cart is server-side per account, so checkout and performance
  iterations each register their own throwaway account instead of sharing mutable state.
- **Native alerts** (sync and AJAX) are handled by a single `captureAlert` helper.
- **Resilient assertions:** cart totals are summed from on-page prices; performance uses the
  median across samples so a single slow run does not flake the budget.
- **Verified against the live site:** every selector, alert string and API shape was confirmed on
  demoblaze.com before being asserted.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Steps show as *undefined* / a fixture is `undefined` | Stale generated specs. Run via the npm scripts (they run `bddgen` first). |
| `No credentials found at .auth/credentials.json` | Global setup did not run. Use the npm scripts, or check access to `api.demoblaze.com`. |
| `allure: command not found` or report won't build | Install **Java 8+**; the `allure` binary ships via `allure-commandline`. |
| Timeouts on navigation | The live site is slow or unreachable. Re-run; check connectivity. |
| Browser not installed | Run `npx playwright install chromium`. |
