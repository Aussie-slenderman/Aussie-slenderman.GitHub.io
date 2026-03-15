import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getQuotes } from '../services/stockApi';

/**
 * Polls REST quotes for a list of symbols every 15 seconds.
 * Also updates the Zustand quotes store.
 */
export function useStockPrices(symbols: string[]) {
  const { setQuotes, quotes } = useAppStore();
  const symbolKey = symbols.join(',');

  useEffect(() => {
    if (!symbols.length) return;

    let cancelled = false;

    const fetch = async () => {
      const data = await getQuotes(symbols);
      if (!cancelled) setQuotes(data);
    };

    fetch();
    const interval = setInterval(fetch, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [symbolKey]);

  return quotes;
}

/**
 * Returns the quote for a single symbol from the store.
 */
export function useQuote(symbol: string) {
  const quotes = useAppStore(s => s.quotes);
  useStockPrices([symbol]);
  return quotes[symbol] ?? null;
}
