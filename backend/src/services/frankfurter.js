import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 });

export async function getForex() {
  const cacheKey = 'forex_rates';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const resp = await axios.get('https://api.frankfurter.app/latest', {
      params: { from: 'USD', to: 'EUR,GBP,JPY,CHF,AUD,CAD,CNY' },
      timeout: 8000,
    });
    const rates = resp.data.rates;
    const result = {
      EURUSD: +(1 / rates.EUR).toFixed(5),
      GBPUSD: +(1 / rates.GBP).toFixed(5),
      USDJPY: +rates.JPY.toFixed(3),
      USDCHF: +rates.CHF.toFixed(5),
      AUDUSD: +(1 / rates.AUD).toFixed(5),
      USDCAD: +rates.CAD.toFixed(5),
      USDCNY: +rates.CNY.toFixed(4),
      timestamp: Date.now(),
    };
    cache.set(cacheKey, result);
    return result;
  } catch (e) {
    console.warn('Frankfurter API failed, using simulated forex');
    return {
      EURUSD: 1.0852, GBPUSD: 1.2645, USDJPY: 149.52,
      USDCHF: 0.9012, AUDUSD: 0.6534, USDCAD: 1.3612, USDCNY: 7.2341,
      timestamp: Date.now(),
    };
  }
}
