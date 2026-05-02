const BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : '/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  getPrices: (symbols) => get(`/prices?symbols=${symbols.join(',')}`),
  getOHLCV: (symbol, days) => get(`/ohlcv?symbol=${symbol}&days=${days}`),
  getNews: (topic, limit = 10) => get(`/news?topic=${encodeURIComponent(topic)}&limit=${limit}`),
  getSentiment: () => get('/sentiment'),
  getCalendar: () => get('/calendar'),
  getForex: () => get('/forex'),
};
