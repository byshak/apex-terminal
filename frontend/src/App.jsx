import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import Watchlist from './components/Watchlist.jsx';
import Chart from './components/Chart.jsx';
import Indicators from './components/Indicators.jsx';
import SignalEngine from './components/SignalEngine.jsx';
import NewsSentiment from './components/NewsSentiment.jsx';
import RiskCalculator from './components/RiskCalculator.jsx';
import Portfolio from './components/Portfolio.jsx';
import SessionClock from './components/SessionClock.jsx';
import { connectWS } from './services/websocket.js';
import { api } from './services/api.js';
import { computeAllIndicators } from './utils/indicators.js';

const WATCHLIST_SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO' },
  { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO' },
  { symbol: 'SOL', name: 'Solana', type: 'CRYPTO' },
  { symbol: 'BNB', name: 'BNB', type: 'CRYPTO' },
  { symbol: 'XRP', name: 'XRP', type: 'CRYPTO' },
  { symbol: 'EURUSD', name: 'EUR/USD', type: 'FOREX' },
  { symbol: 'GBPUSD', name: 'GBP/USD', type: 'FOREX' },
  { symbol: 'USDJPY', name: 'USD/JPY', type: 'FOREX' },
  { symbol: 'GOLD', name: 'Gold', type: 'COMMODITY' },
  { symbol: 'SILVER', name: 'Silver', type: 'COMMODITY' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAsset, setSelectedAsset] = useState(WATCHLIST_SYMBOLS[0]);
  const [prices, setPrices] = useState({});
  const [candles, setCandles] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // WebSocket
  useEffect(() => {
    const unsub = connectWS((msg) => {
      if (msg.type === 'CONNECTED') setConnected(true);
      if (msg.type === 'DISCONNECTED') setConnected(false);
      if (msg.type === 'PRICE_UPDATE') {
        setPrices(prev => ({ ...prev, ...msg.data }));
      }
    });
    return unsub;
  }, []);

  // Load initial prices
  useEffect(() => {
    api.getPrices(WATCHLIST_SYMBOLS.map(s => s.symbol))
      .then(data => setPrices(prev => ({ ...prev, ...data })))
      .catch(console.warn)
      .finally(() => setLoading(false));

    api.getSentiment().then(setSentiment).catch(console.warn);
  }, []);

  // Load candles when asset changes
  useEffect(() => {
    if (!selectedAsset) return;
    api.getOHLCV(selectedAsset.symbol, 60)
      .then(data => {
        setCandles(data);
        setIndicators(computeAllIndicators(data));
      })
      .catch(console.warn);
  }, [selectedAsset]);

  const handleAssetSelect = useCallback((asset) => {
    setSelectedAsset(asset);
  }, []);

  const currentPrice = prices[selectedAsset?.symbol]?.price || candles[candles.length - 1]?.close;

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '48px 1fr',
      gridTemplateColumns: '260px 1fr 280px',
      height: '100vh',
      overflow: 'hidden',
      gap: 0,
    }}>
      {/* Header - spans all columns */}
      <div style={{ gridColumn: '1 / -1', gridRow: '1' }}>
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          connected={connected}
        />
      </div>

      {/* Left sidebar */}
      <div style={{
        gridColumn: '1',
        gridRow: '2',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
        overflowY: 'auto',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <SessionClock />
        <Watchlist
          symbols={WATCHLIST_SYMBOLS}
          prices={prices}
          selectedAsset={selectedAsset}
          onSelect={handleAssetSelect}
          loading={loading}
        />
      </div>

      {/* Center main area */}
      <div style={{
        gridColumn: '2',
        gridRow: '2',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
        overflowY: 'auto',
      }}>
        {activeTab === 'dashboard' && (
          <>
            <Chart
              candles={candles}
              asset={selectedAsset}
              currentPrice={currentPrice}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Indicators indicators={indicators} />
              <SignalEngine indicators={indicators} sentiment={sentiment} currentPrice={currentPrice} />
            </div>
          </>
        )}
        {activeTab === 'portfolio' && <Portfolio prices={prices} />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'alerts' && <AlertsView />}
      </div>

      {/* Right panel */}
      <div style={{
        gridColumn: '3',
        gridRow: '2',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
        overflowY: 'auto',
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <NewsSentiment asset={selectedAsset} sentiment={sentiment} />
        <RiskCalculator currentPrice={currentPrice} asset={selectedAsset} />
      </div>
    </div>
  );
}

function CalendarView() {
  const [events, setEvents] = React.useState([]);
  React.useEffect(() => {
    api.getCalendar().then(setEvents).catch(console.warn);
  }, []);
  const impactColor = { HIGH: 'var(--accent-red)', MEDIUM: 'var(--accent-amber)', LOW: 'var(--accent-green)' };
  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header"><span className="panel-title">Economic Calendar</span></div>
      <div style={{ padding: '8px' }}>
        {events.map(ev => (
          <div key={ev.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px', marginBottom: '4px',
            background: 'var(--bg-card)', borderRadius: '6px',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: impactColor[ev.impact] || 'var(--text-muted)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{ev.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Space Mono', marginTop: '2px' }}>
                {new Date(ev.time).toLocaleString()} · {ev.currency}
                {ev.forecast && ` · Forecast: ${ev.forecast}`}
                {ev.previous && ` · Prev: ${ev.previous}`}
              </div>
            </div>
            <span style={{
              fontSize: '10px', padding: '2px 6px', borderRadius: '3px',
              background: impactColor[ev.impact] + '22',
              color: impactColor[ev.impact],
              fontFamily: 'Orbitron', letterSpacing: '0.5px',
            }}>{ev.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsView() {
  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header"><span className="panel-title">Price Alerts</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', fontSize: '13px' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</div>
        <div>No alerts configured</div>
        <div style={{ fontSize: '11px', marginTop: '6px' }}>Price alert system coming soon</div>
      </div>
    </div>
  );
}
