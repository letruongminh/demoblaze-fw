export interface BillingDetails {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

const datasets: Record<string, BillingDetails> = {
  'valid order': {
    name: 'Jordan Fields',
    country: 'United States',
    city: 'Austin',
    card: '4111111111111111',
    month: '11',
    year: '2027',
  },
  'missing name and card': {
    name: '',
    country: 'United States',
    city: 'Austin',
    card: '',
    month: '11',
    year: '2027',
  },
};

export function billingDataset(name: string): BillingDetails {
  const data = datasets[name];
  if (!data) {
    throw new Error(`Unknown billing dataset: "${name}"`);
  }
  return data;
}
