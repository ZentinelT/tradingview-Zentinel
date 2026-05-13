"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Timeframe } from "@/lib/binance/types";

export type IndicatorKey =
  | "ema20"
  | "ema50"
  | "ema200"
  | "rsi"
  | "macd"
  | "volume";

export type DrawingTool = "cursor" | "hline" | "measure" | "eraser";

export const TIMEZONES = [
  { label: "UTC",              value: "UTC" },
  { label: "New York (ET)",    value: "America/New_York" },
  { label: "Chicago (CT)",     value: "America/Chicago" },
  { label: "Los Angeles (PT)", value: "America/Los_Angeles" },
  { label: "São Paulo",        value: "America/Sao_Paulo" },
  { label: "Córdoba / Buenos Aires", value: "America/Argentina/Cordoba" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Frankfurt (CET)",  value: "Europe/Berlin" },
  { label: "Dubai (GST)",      value: "Asia/Dubai" },
  { label: "Mumbai (IST)",     value: "Asia/Kolkata" },
  { label: "Singapore (SGT)",  value: "Asia/Singapore" },
  { label: "Tokyo (JST)",      value: "Asia/Tokyo" },
  { label: "Sydney (AEST)",    value: "Australia/Sydney" },
] as const;

export type TimezoneValue = typeof TIMEZONES[number]["value"];

export interface PriceLine {
  id: string;
  symbol: string;
  price: number;
}

export interface IndicatorConfig {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
}

export const DEFAULT_CONFIG: IndicatorConfig = {
  ema20: 20,
  ema50: 50,
  ema200: 200,
  rsi: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
};

export const INDICATOR_COLORS: Record<IndicatorKey, string> = {
  ema20: "#ffb74d",
  ema50: "#2962ff",
  ema200: "#ab47bc",
  rsi: "#ab47bc",
  macd: "#2962ff",
  volume: "#787b86",
};

export const DEFAULT_WATCHLIST = [
  // Índices (ETFs)
  "SPY",
  "QQQ",
  "DIA",
  "EWG",
  "EWU",
  // Forex
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  // Commodity
  "XAU/USD",
  "XAG/USD",
  // Crypto
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
];

interface ChartState {
  symbol: string;
  timeframe: Timeframe;
  /** Indicator is added to the chart (appears in pill + renders unless hidden) */
  indicators: Record<IndicatorKey, boolean>;
  /** Indicator is hidden (eye icon off) — kept in pill list, just not rendered */
  hidden: Record<IndicatorKey, boolean>;
  /** Periods and parameters for each indicator */
  config: IndicatorConfig;
  watchlist: string[];

  timezone: TimezoneValue;

  // Ephemeral UI state (not persisted)
  tool: DrawingTool;
  priceLines: PriceLine[];
  symbolDialogOpen: boolean;
  /** Which indicator's settings dialog is open (null = closed) */
  settingsTarget: IndicatorKey | null;

  // Actions
  setTimezone: (tz: TimezoneValue) => void;
  setSymbol: (s: string) => void;
  setTimeframe: (t: Timeframe) => void;
  toggleIndicator: (key: IndicatorKey) => void;
  removeIndicator: (key: IndicatorKey) => void;
  toggleHidden: (key: IndicatorKey) => void;
  setConfig: (patch: Partial<IndicatorConfig>) => void;
  addToWatchlist: (s: string) => void;
  removeFromWatchlist: (s: string) => void;
  setTool: (t: DrawingTool) => void;
  addPriceLine: (price: number, symbol: string) => void;
  clearPriceLines: (symbol?: string) => void;
  setSymbolDialogOpen: (v: boolean) => void;
  setSettingsTarget: (k: IndicatorKey | null) => void;
}

export const useChartStore = create<ChartState>()(
  persist(
    (set) => ({
      symbol: "BTCUSDT",
      timeframe: "15m" as Timeframe,
      timezone: "UTC" as TimezoneValue,
      indicators: {
        ema20: true,
        ema50: true,
        ema200: false,
        rsi: true,
        macd: false,
        volume: true,
      },
      hidden: {
        ema20: false,
        ema50: false,
        ema200: false,
        rsi: false,
        macd: false,
        volume: false,
      },
      config: { ...DEFAULT_CONFIG },
      watchlist: DEFAULT_WATCHLIST,
      tool: "cursor",
      priceLines: [],
      symbolDialogOpen: false,
      settingsTarget: null,

      setTimezone: (timezone) => set({ timezone }),
      setSymbol: (symbol) => set({ symbol }),
      setTimeframe: (timeframe) => set({ timeframe }),
      toggleIndicator: (key) =>
        set((s) => ({
          indicators: { ...s.indicators, [key]: !s.indicators[key] },
          // When re-adding, ensure not hidden
          hidden: !s.indicators[key]
            ? { ...s.hidden, [key]: false }
            : s.hidden,
        })),
      removeIndicator: (key) =>
        set((s) => ({
          indicators: { ...s.indicators, [key]: false },
          hidden: { ...s.hidden, [key]: false },
        })),
      toggleHidden: (key) =>
        set((s) => ({ hidden: { ...s.hidden, [key]: !s.hidden[key] } })),
      setConfig: (patch) =>
        set((s) => ({ config: { ...s.config, ...patch } })),
      addToWatchlist: (s) =>
        set((state) => ({
          watchlist: state.watchlist.includes(s)
            ? state.watchlist
            : [...state.watchlist, s],
        })),
      removeFromWatchlist: (s) =>
        set((state) => ({
          watchlist: state.watchlist.filter((x) => x !== s),
        })),
      setTool: (tool) => set({ tool }),
      addPriceLine: (price, symbol) =>
        set((state) => ({
          priceLines: [
            ...state.priceLines,
            {
              id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random()}`,
              symbol,
              price,
            },
          ],
        })),
      clearPriceLines: (symbol) =>
        set((state) => ({
          priceLines: symbol
            ? state.priceLines.filter((p) => p.symbol !== symbol)
            : [],
        })),
      setSymbolDialogOpen: (symbolDialogOpen) => set({ symbolDialogOpen }),
      setSettingsTarget: (settingsTarget) => set({ settingsTarget }),
    }),
    {
      name: "tv-gratis-chart-state",
      partialize: (s) => ({
        symbol: s.symbol,
        timeframe: s.timeframe,
        timezone: s.timezone,
        indicators: s.indicators,
        hidden: s.hidden,
        config: s.config,
        watchlist: s.watchlist,
      }),
    },
  ),
);
