import type { Candle, SymbolInfo, Ticker24h, Timeframe } from "./types";

const BASE = "https://api.binance.com/api/v3";

/** Returns NY offset in seconds (UTC-4 EDT or UTC-5 EST) */
function nyOffsetSeconds(utcMs: number): number {
  const d = new Date(utcMs);
  const year = d.getUTCFullYear();
  // EDT starts 2nd Sunday of March, EST starts 1st Sunday of November
  const edtStart = new Date(Date.UTC(year, 2, 8)); // March 8 (earliest 2nd Sunday)
  edtStart.setUTCDate(8 + ((7 - edtStart.getUTCDay()) % 7));
  const estStart = new Date(Date.UTC(year, 10, 1)); // Nov 1 (earliest 1st Sunday)
  estStart.setUTCDate(1 + ((7 - estStart.getUTCDay()) % 7));
  const isEDT = d >= edtStart && d < estStart;
  return isEDT ? -4 * 3600 : -5 * 3600;
}

function toNYTimestamp(utcMs: number): number {
  return Math.floor(utcMs / 1000) + nyOffsetSeconds(utcMs);
}

export async function fetchKlines(
  symbol: string,
  interval: Timeframe,
  limit = 1000,
): Promise<Candle[]> {
  const url = `${BASE}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`klines ${res.status}`);
  const data = (await res.json()) as unknown[][];
  return data.map((k) => ({
    time: toNYTimestamp(k[0] as number),
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
    isFinal: true,
  }));
}

export async function fetchTicker24h(symbol: string): Promise<Ticker24h> {
  const url = `${BASE}/ticker/24hr?symbol=${symbol.toUpperCase()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`ticker ${res.status}`);
  const t = await res.json();
  return {
    symbol: t.symbol,
    lastPrice: parseFloat(t.lastPrice),
    priceChange: parseFloat(t.priceChange),
    priceChangePercent: parseFloat(t.priceChangePercent),
    highPrice: parseFloat(t.highPrice),
    lowPrice: parseFloat(t.lowPrice),
    volume: parseFloat(t.volume),
    quoteVolume: parseFloat(t.quoteVolume),
  };
}

export async function fetchTickers24h(symbols: string[]): Promise<Ticker24h[]> {
  const arr = JSON.stringify(symbols.map((s) => s.toUpperCase()));
  const url = `${BASE}/ticker/24hr?symbols=${encodeURIComponent(arr)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`tickers ${res.status}`);
  const data = await res.json();
  return data.map((t: Record<string, string>) => ({
    symbol: t.symbol,
    lastPrice: parseFloat(t.lastPrice),
    priceChange: parseFloat(t.priceChange),
    priceChangePercent: parseFloat(t.priceChangePercent),
    highPrice: parseFloat(t.highPrice),
    lowPrice: parseFloat(t.lowPrice),
    volume: parseFloat(t.volume),
    quoteVolume: parseFloat(t.quoteVolume),
  }));
}

let cachedSymbols: SymbolInfo[] | null = null;
export async function fetchExchangeSymbols(): Promise<SymbolInfo[]> {
  if (cachedSymbols) return cachedSymbols;
  const res = await fetch(`${BASE}/exchangeInfo`, { cache: "force-cache" });
  if (!res.ok) throw new Error(`exchangeInfo ${res.status}`);
  const data = await res.json();
  cachedSymbols = data.symbols
    .filter(
      (s: { status: string; quoteAsset: string }) =>
        s.status === "TRADING" && s.quoteAsset === "USDT",
    )
    .map((s: { symbol: string; baseAsset: string; quoteAsset: string; status: string }) => ({
      symbol: s.symbol,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
      status: s.status,
    }));
  return cachedSymbols!;
}
