/**
 * Currency Service - ExchangeRate-API Integration
 * Converts GBP and EUR to USD with 24-hour caching
 */

const API_KEY = 'f51793adf9d3c8de77732b07';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';
const CACHE_KEY = 'exchangeRates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Fallback rates if API fails
const FALLBACK_RATES: ExchangeRates = {
  GBP: 0.79,  // 1 USD = 0.79 GBP
  EUR: 0.92,  // 1 USD = 0.92 EUR
  CHF: 0.88,  // 1 USD = 0.88 CHF
  USD: 1,
};

export interface ExchangeRates {
  GBP: number;
  EUR: number;
  CHF: number;
  USD: number;
  [key: string]: number;
}

interface CachedRates {
  rates: ExchangeRates;
  timestamp: number;
}

// In-memory cache for current session
let memoryCache: CachedRates | null = null;

/**
 * Get cached rates from localStorage
 */
const getCachedRates = (): CachedRates | null => {
  // First check memory cache
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
    return memoryCache;
  }

  // Then check localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedRates = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Error reading cached rates:', error);
  }
  return null;
};

/**
 * Save rates to cache
 */
const setCachedRates = (rates: ExchangeRates): void => {
  const cached: CachedRates = {
    rates,
    timestamp: Date.now(),
  };
  memoryCache = cached;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn('Error saving rates to cache:', error);
  }
};

/**
 * Fetch fresh exchange rates from API
 */
const fetchRates = async (): Promise<ExchangeRates> => {
  try {
    const response = await fetch(`${BASE_URL}/${API_KEY}/latest/USD`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.result === 'success' && data.conversion_rates) {
      const rates: ExchangeRates = {
        GBP: data.conversion_rates.GBP || FALLBACK_RATES.GBP,
        EUR: data.conversion_rates.EUR || FALLBACK_RATES.EUR,
        CHF: data.conversion_rates.CHF || FALLBACK_RATES.CHF,
        USD: 1,
      };

      console.log('Exchange rates fetched:', rates);
      setCachedRates(rates);
      return rates;
    }

    throw new Error('Invalid API response');
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    console.log('Using fallback rates');
    return FALLBACK_RATES;
  }
};

/**
 * Get current exchange rates (from cache or API)
 */
export const getExchangeRates = async (): Promise<ExchangeRates> => {
  const cached = getCachedRates();
  if (cached) {
    return cached.rates;
  }
  return fetchRates();
};

/**
 * Get exchange rates synchronously (uses cache or fallback)
 */
export const getExchangeRatesSync = (): ExchangeRates => {
  const cached = getCachedRates();
  return cached?.rates || FALLBACK_RATES;
};

/**
 * Convert amount from source currency to USD
 */
export const convertToUSD = (amount: number, fromCurrency: string): number => {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === 'USD') return amount;

  const rates = getExchangeRatesSync();
  const rate = rates[fromCurrency.toUpperCase()];

  if (!rate || rate === 0) {
    console.warn(`Unknown currency: ${fromCurrency}, using fallback`);
    return amount; // Return original if unknown currency
  }

  // rate is USD→fromCurrency, so to get fromCurrency→USD we divide
  return amount / rate;
};

/**
 * Convert amount from source currency to USD (async version)
 */
export const convertToUSDAsync = async (amount: number, fromCurrency: string): Promise<number> => {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === 'USD') return amount;

  const rates = await getExchangeRates();
  const rate = rates[fromCurrency.toUpperCase()];

  if (!rate || rate === 0) {
    console.warn(`Unknown currency: ${fromCurrency}, using fallback`);
    return amount;
  }

  return amount / rate;
};

/**
 * Format amount as USD currency string
 */
export const formatUSD = (amount: number, showCents: boolean = false): string => {
  if (!amount || isNaN(amount)) return '$0';

  const rounded = showCents ? amount : Math.round(amount);

  if (rounded >= 1000000) {
    return `$${(rounded / 1000000).toFixed(1)}M`;
  }

  return `$${rounded.toLocaleString('en-US', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  })}`;
};

/**
 * Convert and format in one step
 */
export const convertAndFormatUSD = (amount: number, fromCurrency: string, showCents: boolean = false): string => {
  const usdAmount = convertToUSD(amount, fromCurrency);
  return formatUSD(usdAmount, showCents);
};

/**
 * Initialize exchange rates on app load
 * Call this early in your app to pre-fetch rates
 */
export const initializeExchangeRates = async (): Promise<void> => {
  try {
    await getExchangeRates();
    console.log('Exchange rates initialized');
  } catch (error) {
    console.error('Failed to initialize exchange rates:', error);
  }
};

/**
 * Get the current exchange rate for a specific currency
 */
export const getRate = (currency: string): number => {
  const rates = getExchangeRatesSync();
  return rates[currency.toUpperCase()] || 1;
};

/**
 * Check if rates are cached and fresh
 */
export const hasValidCache = (): boolean => {
  return getCachedRates() !== null;
};

export default {
  getExchangeRates,
  getExchangeRatesSync,
  convertToUSD,
  convertToUSDAsync,
  formatUSD,
  convertAndFormatUSD,
  initializeExchangeRates,
  getRate,
  hasValidCache,
};
