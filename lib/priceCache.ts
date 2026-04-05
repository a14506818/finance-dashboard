/**
 * Lightweight localStorage cache for last-known asset prices.
 * Used as SWR fallbackData so the UI shows stale prices instead of zeros
 * when APIs are temporarily unreachable.
 */

export const PRICE_CACHE_KEYS = {
  crypto: 'fdash_pcache_crypto', // Record<id, Record<field, number>>  (CoinGecko raw)
  usMap:  'fdash_pcache_us',     // Record<symbol, StockQuote>
  twMap:  'fdash_pcache_tw',     // Record<symbol, StockQuote>
  fxRate: 'fdash_pcache_fx',     // number  (usdToTwd)
} as const;

export function readCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore quota errors — cache is best-effort
  }
}
