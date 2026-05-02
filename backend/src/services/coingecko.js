import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 30 });

const CG_BASE = 'https://api.coingecko.com/api/v3';

const COIN_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
};

function simulatedPrice(symbol) {
  const bases = {
    BTC: 67000, ETH: 3500, SOL: 180, BNB: 420, XRP: 0.62,
    ADA: 0.48, DOGE: 0.16, AVAX: 38, DOT: 8.5, MATIC: 0.9,
    EURUSD: 1.085, GBPUSD: 1.265, USDJPY: 149.5, GOLD: 2340, SILVER: 28.5,
    AAPL: 185, MSFT: 415, GOOGL: 175, TSLA: 175, NVDA: 875,
  };
  const base = bases[symbol] || 100;
  const variation = (Math.random() - 0.5) * 0.02;
  return +(base * (1 + variation)).toFixed(symbol === 'USDJPY' ? 2 : 4);
}

function simulatedChange() {
  return +((Math.random() - 0.45) * 8).toFixed(2);
}

export async function getPrices(symbols) {
  const cacheKey = `prices_${symbols.join('_')}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const cryptoSymbols = symbols.filter(s => COIN_MAP[s]);
  const otherSymbols = symbols.filter(s => !COIN_MAP[s]);

  let result = {};

  // Fetch crypto from CoinGecko
  if (cryptoSymbols.length > 0) {
    try {
      const ids = cryptoSymbols.map(s => COIN_MAP[s]).join(',');
      const resp = await axios.get(`${CG_BASE}/simple/price`, {
        params: { ids, vs_currencies: 'usd', include_24hr_change: true },
        timeout: 8000,
      });
      for (const sym of cryptoSymbols) {
        const id = COIN_MAP[sym];
        if (resp.data[id]) {
          result[sym] = {
            symbol: sym,
            price: resp.data[id].usd,
            change24h: resp.data[id].usd_24h_change?.toFixed(2) || simulatedChange(),
            type: 'CRYPTO',
          };
        }
      }
    } catch (e) {
      console.warn('CoinGecko failed, using simulated data');
      for (const sym of cryptoSymbols) {
        result[sym] = {
          symbol: sym,
          price: simulatedPrice(sym),
          change24h: simulatedChange(),
          type: 'CRYPTO',
        };
      }
    }
  }

  // Simulated data for non-crypto
  for (const sym of otherSymbols) {
    const type = ['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCHF'].includes(sym) ? 'FOREX'
                : ['GOLD','SILVER'].includes(sym) ? 'COMMODITY' : 'STOCK';
    result[sym] = {
      symbol: sym,
      price: simulatedPrice(sym),
      change24h: simulatedChange(),
      type,
    };
  }

  cache.set(cacheKey, result);
  return result;
}

export async function getOHLCV(symbol, days = 30) {
  const cacheKey = `ohlcv_${symbol}_${days}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const coinId = COIN_MAP[symbol];

  if (coinId) {
    try {
      const resp = await axios.get(`${CG_BASE}/coins/${coinId}/ohlc`, {
        params: { vs_currency: 'usd', days },
        timeout: 10000,
      });
      const candles = resp.data.map(([ts, o, h, l, c]) => ({
        time: Math.floor(ts / 1000),
        open: o, high: h, low: l, close: c,
        volume: Math.random() * 1000000000,
      }));
      cache.set(cacheKey, candles, 60);
      return candles;
    } catch (e) {
      console.warn(`CoinGecko OHLCV failed for ${symbol}, using simulated`);
    }
  }

  // Generate realistic simulated OHLCV
  const basePrice = simulatedPrice(symbol);
  const candles = [];
  let price = basePrice * 0.85;
  const now = Math.floor(Date.now() / 1000);
  const interval = 86400;

  for (let i = days; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * 0.04;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);
    candles.push({
      time: now - i * interval,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 500000000 + 100000000),
    });
    price = close;
  }

  cache.set(cacheKey, candles, 60);
  return candles;
}
