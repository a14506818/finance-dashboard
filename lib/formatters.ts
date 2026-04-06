export function formatPrice(price: number, currency = 'USD'): string {
  if (currency === 'TWD') {
    return `NT$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)}`;
  }
  // For crypto with very small prices, show more decimals
  const decimals = price < 1 ? 6 : price < 100 ? 4 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);
}

export function formatChange(change: number, currency = 'USD'): string {
  if (currency === 'TWD') {
    const prefix = change >= 0 ? '+' : '-';
    return `${prefix}NT$${Math.abs(change).toFixed(2)}`;
  }
  const prefix = change >= 0 ? '+' : '';
  const decimals = Math.abs(change) < 1 ? 4 : 2;
  return `${prefix}${change.toFixed(decimals)}`;
}

export function formatPercent(percent: number): string {
  const prefix = percent >= 0 ? '+' : '';
  return `${prefix}${percent.toFixed(2)}%`;
}
