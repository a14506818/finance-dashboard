import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { StockQuote } from '@/lib/types';
import { TAIWAN_SYMBOL_MAP, TAIWAN_STOCKS } from '@/lib/constants';

// Build reverse map: TWSE key → display name
const KEY_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(TAIWAN_SYMBOL_MAP).map(([_sym, meta]) => [meta.key, meta.name])
);
// Build reverse map: TWSE key → display symbol
const KEY_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(TAIWAN_SYMBOL_MAP).map(([sym, meta]) => [meta.key, sym])
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  // Accept comma-separated TWSE keys, or fall back to dashboard defaults
  const twseKeys = symbolsParam
    ? symbolsParam.split(',').map((s) => s.trim()).filter(Boolean)
    : TAIWAN_STOCKS;

  const exCh = twseKeys.join('%7C'); // URL-encode |
  const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exCh}&json=1&delay=0`;

  try {
    const res = await fetch(url, {
      headers: {
        Referer: 'https://mis.twse.com.tw/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `TWSE returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const msgArray: Record<string, string>[] = data?.msgArray ?? [];

    const quotes: StockQuote[] = msgArray.map((item) => {
      const code = item.c ?? '';           // e.g. "0050"
      const exchange = item.ex ?? 'tse';  // "tse" or "otc"
      const twseKey = `${exchange}_${code}.tw`;
      const rawPrice = item.z ?? '-';
      const prevClose = parseFloat(item.y ?? '0');
      const marketClosed = rawPrice === '-' || rawPrice === '';
      const price = marketClosed ? prevClose : parseFloat(rawPrice);
      const change = price - prevClose;
      const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

      return {
        symbol: KEY_TO_SYMBOL[twseKey] ?? code,
        name: item.n ?? KEY_TO_NAME[twseKey] ?? code,
        price,
        previousClose: prevClose,
        change,
        changePercent,
        currency: 'TWD',
        marketClosed,
        timestamp: item.t,
      };
    });

    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[taiwan-stocks]', err);
    return NextResponse.json(
      { error: 'Failed to fetch TWSE data' },
      { status: 502 }
    );
  }
}
