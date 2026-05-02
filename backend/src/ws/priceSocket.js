import { WebSocketServer } from 'ws';
import { getPrices } from '../services/coingecko.js';

const ALL_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'EURUSD', 'GBPUSD', 'USDJPY', 'GOLD', 'SILVER'];

export function initPriceSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('WebSocket server initialized on /ws');

  let lastPrices = {};

  function broadcast(data) {
    const msg = JSON.stringify(data);
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        try { client.send(msg); } catch (e) {}
      }
    });
  }

  async function tick() {
    try {
      const prices = await getPrices(ALL_SYMBOLS);
      const updates = {};

      for (const [sym, info] of Object.entries(prices)) {
        const prev = lastPrices[sym];
        const direction = prev ? (info.price > prev ? 'up' : info.price < prev ? 'down' : 'flat') : 'flat';
        updates[sym] = { ...info, direction };
      }

      lastPrices = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, v.price]));

      broadcast({ type: 'PRICE_UPDATE', data: updates, timestamp: Date.now() });
    } catch (e) {
      console.warn('WS tick error:', e.message);
    }
  }

  // Initial tick then every 10 seconds
  tick();
  const interval = setInterval(tick, 10000);

  wss.on('connection', (ws, req) => {
    console.log('WS client connected');

    // Send current prices immediately on connect
    if (Object.keys(lastPrices).length > 0) {
      const initial = {};
      for (const [sym, price] of Object.entries(lastPrices)) {
        initial[sym] = { symbol: sym, price, direction: 'flat', type: 'CRYPTO' };
      }
      ws.send(JSON.stringify({ type: 'PRICE_UPDATE', data: initial, timestamp: Date.now() }));
    }

    ws.on('error', () => {});
    ws.on('close', () => console.log('WS client disconnected'));
  });

  wss.on('close', () => clearInterval(interval));
}
