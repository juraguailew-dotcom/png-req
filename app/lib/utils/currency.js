export const currency = {
  code: 'PGK',
  symbol: 'K',
  name: 'Papua New Guinea Kina',
};

export function formatCurrency(amount) {
  return `${currency.symbol}${Number(amount).toFixed(2)}`;
}

export function parseCurrency(value) {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}
