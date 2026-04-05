export function formatPrice(price: number, currency = 'USD'): string {
  if (currency === 'TWD') {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
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
  const prefix = change >= 0 ? '+' : '';
  if (currency === 'TWD') {
    return `${prefix}${change.toFixed(2)}`;
  }
  const decimals = Math.abs(change) < 1 ? 4 : 2;
  return `${prefix}${change.toFixed(decimals)}`;
}

export function formatPercent(percent: number): string {
  const prefix = percent >= 0 ? '+' : '';
  return `${prefix}${percent.toFixed(2)}%`;
}
