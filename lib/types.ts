export interface UserProfile {
  nickname: string;        // 暱稱
  bio: string;             // 一句話介紹
  investStartDate: string; // YYYY-MM-DD，可為空字串
  avatarEmoji: string;     // 選中的 emoji
  avatarColor: string;     // 頭像背景色 hex
}

export interface AppSettings {
  preferredCurrency: 'USD' | 'TWD';
  hideAmounts: boolean;
  dashboardSymbols: {
    taiwan: string[];   // display symbols e.g. ['0050', '0056']
    us: string[];       // e.g. ['VOO', 'QQQ']
    crypto: string[];   // CoinGecko IDs e.g. ['bitcoin', 'ethereum']
  };
  profile: UserProfile;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  marketClosed?: boolean;
  timestamp?: string;
}

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  usd: number;
  usd_24h_change: number;
}

export interface FearGreedData {
  value: number;
  value_classification: string;
  timestamp: string;
}

// Portfolio
export type MarketType = 'crypto' | 'us' | 'taiwan' | 'manual' | 'cash';

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  date?: string;            // YYYY-MM-DD, optional
  quantity: number;
  price: number;            // price per unit
  currency: 'USD' | 'TWD';
}

export interface Position {
  id: string;
  symbol: string;           // display name for manual, ticker for others
  market: MarketType;
  quantity: number;
  targetPercent?: number;             // optional: now managed at category level
  manualValue?: number;               // manual/cash only: directly entered value
  manualCurrency?: 'USD' | 'TWD';    // manual/cash only: currency of manualValue
  category?: MarketType;             // manual only: override which category bucket to use
  twExchange?: 'tse' | 'otc';       // taiwan only: 上市(tse) or 上櫃(otc)
  lots?: Transaction[];              // transaction records (not used for cash)
}

export interface ValuatedPosition {
  position: Position;
  name: string;            // display name from price API
  price: number;
  currency: string;
  valuation: number;       // quantity × price normalized to USD
  valuationTWD: number;    // same value in TWD
  percent: number;         // % of total portfolio
  costBasis?: number;        // total buy cost in USD (from transactions)
  realizedPL?: number;       // proceeds from sells - cost of sold units (USD)
  unrealizedPL?: number;     // current valuation - remaining cost basis (USD)
  unrealizedPLPercent?: number;
  unrealizedPLTWD?: number;
}

export interface CategoryConfig {
  market: MarketType;
  name: string;
  targetPercent: number;
}

export interface CategorySummary {
  market: MarketType;
  name: string;
  targetPercent: number;
  items: ValuatedPosition[];
  categoryValuation: number;
  categoryValuationTWD: number;
  categoryPercent: number;
  diff: number;                      // categoryPercent - targetPercent
  categoryCostBasis?: number;        // sum of costBasis (USD), only if any item has lots
  categoryUnrealizedPL?: number;     // sum of unrealizedPL (USD)
  categoryUnrealizedPLTWD?: number;
}
