export const currency = {
  code: 'PGK',
  symbol: 'K',
  name: 'Papua New Guinea Kina',
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `${currency.symbol}${currencyFormatter.format(value)}`;
}

export function parseCurrency(value) {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}
