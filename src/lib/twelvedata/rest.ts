import type { Candle, Timeframe } from "@/lib/binance/types";

const BASE = "https://api.twelvedata.com";
const API_KEY = "2451433d5f6a414f821726ddb5970b62";

// Map Binance-style timeframes to Twelve Data intervals
const TF_MAP: Record<string, string> = {
  "1m": "1min",
  "2m": "2min",
  "3m": "3min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
  "1w": "1week",
};

// These symbols come from Twelve Data (indices/forex), not Binance
export const TD_SYMBOLS: Record<string, string> = {
  // Índices (ETFs equivalentes - plan gratis)
  "SPY": "S&P 500",
  "QQQ": "Nasdaq 100",
  "DIA": "Dow Jones",
  "EWG": "DAX",
  "EWU": "FTSE 100",
  // Forex
  "EUR/USD": "EUR/USD",
  "GBP/USD": "GBP/USD",
  "USD/JPY": "USD/JPY",
  "AUD/USD": "AUD/USD",
  "USD/CAD": "USD/CAD",
  // Commodities
  "XAU/USD": "Gold",
  "XAG/USD": "Silver",
};

export function isTwelveDataSymbol(symbol: string): boolean {
  return symbol in TD_SYMBOLS;
}

export async function fetchTDKlines(
  symbol: string,
  interval: Timeframe,
  outputsize = 500,
): Promise<Candle[]> {
  const tdInterval = TF_MAP[interval] ?? "15min";
  const url = `${BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`twelvedata ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message);

  // Twelve Data returns newest first — reverse to get oldest first
  const values: Array<{ datetime: string; open: string; high: string; low: string; close: string; volume?: string }> =
    data.values ?? [];
  return values.reverse().map((v) => ({
    time: Math.floor(new Date(v.datetime).getTime() / 1000),
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: v.volume ? parseFloat(v.volume) : 0,
    isFinal: true,
  }));
}

export async function fetchTDQuote(symbol: string): Promise<{ price: number; change: number; pct: number } | null> {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status === "error") return null;
  return {
    price: parseFloat(data.close),
    change: parseFloat(data.change),
    pct: parseFloat(data.percent_change),
  };
}
