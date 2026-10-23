/**
 * Small, dependency-free timing utilities for the performance journey.
 * Everything is computed from an array of per-iteration samples.
 */

export interface StepTimings {
  login: number;
  addToCart: number;
  placeOrder: number;
  total: number;
}

export type Step = keyof StepTimings;

export const STEPS: Step[] = ['login', 'addToCart', 'placeOrder', 'total'];

/** Nearest-rank percentile (p in 0..100). Returns 0 for an empty set. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  const index = Math.min(Math.max(rank - 1, 0), sorted.length - 1);
  return sorted[index];
}

export function median(values: number[]): number {
  return percentile(values, 50);
}

export interface StepSummary {
  median: number;
  p95: number;
  min: number;
  max: number;
}

export function summarize(samples: StepTimings[], step: Step): StepSummary {
  const values = samples.map((s) => s[step]);
  return {
    median: median(values),
    p95: percentile(values, 95),
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
}

const ms = (value: number): string => `${Math.round(value)} ms`;

/** A Markdown timing table, attached to the Allure/HTML report. */
export function timingTable(samples: StepTimings[], budgets: Record<Step, number>): string {
  const header = '| Step | Median | p95 | Min | Max | Budget | Verdict |';
  const divider = '| --- | ---: | ---: | ---: | ---: | ---: | :---: |';
  const rows = STEPS.map((step) => {
    const s = summarize(samples, step);
    const budget = budgets[step];
    const verdict = s.median <= budget ? 'PASS' : 'FAIL';
    return `| ${step} | ${ms(s.median)} | ${ms(s.p95)} | ${ms(s.min)} | ${ms(s.max)} | ${ms(budget)} | ${verdict} |`;
  });
  const perIteration = samples
    .map(
      (s, i) =>
        `- iteration ${i + 1}: login ${ms(s.login)}, addToCart ${ms(s.addToCart)}, placeOrder ${ms(
          s.placeOrder,
        )}, total ${ms(s.total)}`,
    )
    .join('\n');
  return [
    `Samples: ${samples.length}`,
    '',
    header,
    divider,
    ...rows,
    '',
    'Per-iteration detail:',
    perIteration,
  ].join('\n');
}
