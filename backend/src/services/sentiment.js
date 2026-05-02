import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });

export async function getSentiment() {
  const cacheKey = 'sentiment_fng';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const resp = await axios.get('https://api.alternative.me/fng/?limit=7', { timeout: 8000 });
    if (resp.data && resp.data.data) {
      const current = resp.data.data[0];
      const history = resp.data.data;
      const result = {
        value: parseInt(current.value),
        label: current.value_classification,
        timestamp: current.timestamp,
        history: history.map(d => ({
          value: parseInt(d.value),
          label: d.value_classification,
          timestamp: d.timestamp,
        })),
      };
      cache.set(cacheKey, result);
      return result;
    }
    throw new Error('Invalid FNG response');
  } catch (e) {
    console.warn('Fear & Greed API failed, using simulated');
    const value = Math.floor(Math.random() * 40 + 45);
    const labels = ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'];
    const label = value < 25 ? labels[0] : value < 45 ? labels[1] : value < 55 ? labels[2] : value < 75 ? labels[3] : labels[4];
    return {
      value,
      label,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      history: Array.from({ length: 7 }, (_, i) => ({
        value: Math.floor(Math.random() * 40 + 40),
        label: 'Neutral',
        timestamp: Math.floor((Date.now() - i * 86400000) / 1000).toString(),
      })),
    };
  }
}
