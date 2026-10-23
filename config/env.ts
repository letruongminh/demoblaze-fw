import * as dotenv from 'dotenv';

// Load a local .env if present. Values already in the real environment win,
// so CI (which injects real env vars) is never overridden by a committed file.
dotenv.config();

function readString(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw !== undefined && raw.trim() !== '' ? raw.trim() : fallback;
}

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number, received "${raw}".`);
  }
  return value;
}

function readOptional(name: string): string | undefined {
  const raw = process.env[name];
  return raw !== undefined && raw.trim() !== '' ? raw.trim() : undefined;
}

/**
 * Single source of truth for every tunable parameter. Each value has a sensible
 * default so the suite runs with zero configuration, and every one can be
 * overridden from the environment (locally via `.env`, in CI via workflow inputs).
 */
export const config = {
  /** Base URL of the DemoBlaze web UI. */
  baseURL: readString('BASE_URL', 'https://www.demoblaze.com'),
  /** Base URL of the DemoBlaze REST API. */
  apiURL: readString('API_URL', 'https://api.demoblaze.com'),
  /** Parallel Playwright workers. */
  workers: readInt('WORKERS', 3),
  /** Retries for a failing test (defaults to 2 on CI, 0 locally). */
  retries: readInt('RETRIES', process.env.CI ? 2 : 0),

  /** Optional fixed primary account. When unset, the suite self-registers one. */
  account: {
    username: readOptional('DEMOBLAZE_USER'),
    password: readOptional('DEMOBLAZE_PASS'),
  },

  /** Performance-journey parameters. */
  performance: {
    /** How many times the login -> add to cart -> place order journey is sampled. */
    iterations: readInt('PERF_ITERATIONS', 3),
    /** Product used for the journey. */
    product: readString('PERF_PRODUCT', 'Samsung galaxy s6'),
    /** Per-step budgets (milliseconds) asserted against the median sample. */
    budgetsMs: {
      login: readInt('PERF_LOGIN_MS', 6_000),
      addToCart: readInt('PERF_ADDCART_MS', 6_000),
      placeOrder: readInt('PERF_ORDER_MS', 8_000),
      total: readInt('PERF_TOTAL_MS', 18_000),
    },
  },
} as const;

export type AppConfig = typeof config;
