import { Router } from 'express';
import { getPrices } from '../services/coingecko.js';
import { getOHLCV } from '../services/coingecko.js';
import { getForex } from '../services/frankfurter.js';
import { getNews } from '../services/gdelt.js';
import { getSentiment } from '../services/sentiment.js';
import { getCalendar } from '../services/calendar.js';

const router = Router();

router.get('/prices', async (req, res) => {
  try {
    const symbols = (req.query.symbols || 'BTC,ETH,EURUSD,AAPL,GOLD').split(',');
    const data = await getPrices(symbols);
    res.json(data);
  } catch (e) {
    console.error('prices error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/ohlcv', async (req, res) => {
  try {
    const { symbol = 'BTC', days = 30 } = req.query;
    const data = await getOHLCV(symbol, parseInt(days));
    res.json(data);
  } catch (e) {
    console.error('ohlcv error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/news', async (req, res) => {
  try {
    const { topic = 'bitcoin', limit = 10 } = req.query;
    const data = await getNews(topic, parseInt(limit));
    res.json(data);
  } catch (e) {
    console.error('news error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/sentiment', async (req, res) => {
  try {
    const data = await getSentiment();
    res.json(data);
  } catch (e) {
    console.error('sentiment error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/calendar', async (req, res) => {
  try {
    const data = await getCalendar();
    res.json(data);
  } catch (e) {
    console.error('calendar error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/forex', async (req, res) => {
  try {
    const data = await getForex();
    res.json(data);
  } catch (e) {
    console.error('forex error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
