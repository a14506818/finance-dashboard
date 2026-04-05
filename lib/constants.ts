import type { MarketType, CategoryConfig } from './types';

// Taiwan stocks shown on main dashboard (TWSE query keys)
export const TAIWAN_STOCKS = ['tse_0050.tw', 'tse_0056.tw'];

// US stocks — ^VIX is added automatically by useStockFearGreed
export const US_STOCKS = ['VOO', 'QQQ'];

// CoinGecko IDs and display symbols
export const CRYPTO_IDS = ['bitcoin', 'ethereum', 'cardano'];

export const CRYPTO_META: Record<string, { symbol: string; name: string }> = {
  bitcoin:  { symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { symbol: 'ETH', name: 'Ethereum' },
  cardano:  { symbol: 'ADA', name: 'Cardano' },
};

// Reverse lookup: display symbol → CoinGecko id
export const CRYPTO_SYMBOL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(CRYPTO_META).map(([id, meta]) => [meta.symbol, id])
);

// Taiwan display symbol → TWSE/OTC query key + display name
export const TAIWAN_SYMBOL_MAP: Record<string, { key: string; name: string }> = {
  '0050':  { key: 'tse_0050.tw',   name: '元大台灣50' },
  '0056':  { key: 'tse_0056.tw',   name: '元大高股息' },
  '006208':{ key: 'tse_006208.tw', name: '富邦台50' },
  '2330':  { key: 'tse_2330.tw',   name: '台積電' },
  '6936':  { key: 'otc_6936.tw',   name: '精拓科' },
  '6446':  { key: 'tse_6446.tw',   name: '藥華藥' },
  '4951':  { key: 'otc_4951.tw',   name: '精拓科技' },
};

// Dashboard default Taiwan stocks
export const TAIWAN_STOCKS_DEFAULT = ['0050', '0056'];

// Donut chart color palette
export const CHART_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

// Stable colors per market type (for category-level charts)
export const CATEGORY_COLORS: Record<MarketType, string> = {
  crypto:  '#3b82f6',  // blue
  us:      '#22c55e',  // green
  taiwan:  '#f59e0b',  // amber
  cash:    '#14b8a6',  // teal
  manual:  '#8b5cf6',  // purple
};

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { market: 'crypto',  name: '虛擬貨幣', targetPercent: 0 },
  { market: 'us',      name: '美股',     targetPercent: 0 },
  { market: 'taiwan',  name: '台股',     targetPercent: 0 },
  { market: 'cash',    name: '現金',     targetPercent: 0 },
  { market: 'manual',  name: '其他',     targetPercent: 0 },
];

// Mask for hidden monetary amounts
export const AMOUNT_MASK = '••••';

// Avatar emoji options (fixed set)
export const AVATAR_EMOJIS = [
  // 動物
  '🐻','🐼','🦊','🦁','🐯','🐺','🐸','🐨',
  '🦄','🐲','🦅','🦉','🦋','🐧','🐬','🐙',
  '🦈','🦝','🦔','🐿️','🦜','🦚','🦭','🐳',
  // 自然 / 元素 / 物件
  '🌙','🌊','🔥','⚡','🌿','🍀','🌸','🌻',
  '❄️','🌈','⭐','🪐','💎','🚀','🎯','🎲',
  '🏔️','🌋','🎸','🎹','📈','⚔️','🛡️','🧩',
] as const;

// Avatar background colors
export const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
] as const;

// Auto-refresh intervals (ms)
export const REFRESH_INTERVALS = {
  TAIWAN_STOCKS:  60_000,
  US_STOCKS:      60_000,
  CRYPTO_PRICES:  60_000,
  CRYPTO_FNG:    300_000,
  STOCK_FNG:      60_000,
} as const;
