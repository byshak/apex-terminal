import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { computeAllIndicators, EMAArray, SMA } from '../utils/indicators.js';

export default function Chart({ candles, asset, currentPrice }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [overlays, setOverlays] = useState({ SMA20: true, EMA9: false, BB: false });
  const [localCandles, setLocalCandles] = useState([]);
  const [days, setDays] = useState(30);

  const dayMap = { '1H': 1, '4H': 7, '1D': 30, '1W': 90, '1M': 365 };

  useEffect(() => {
    if (candles && candles.length > 0) {
      setLocalCandles(candles);
    }
  }, [candles]);

  useEffect(() => {
    if (!asset) return;
    const d = dayMap[timeframe] || 30;
    setDays(d);
    api.getOHLCV(asset.symbol, d).then(data => {
      if (data && data.length > 0) setLocalCandles(data);
    }).catch(console.warn);
  }, [asset, timeframe]);

  useEffect(() => {
    if (!canvasRef.current || !localCandles.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const PRICE_H = H * 0.75;
    const VOL_H = H * 0.18;
    const PAD = { top: 20, right: 60, bottom: 8, left: 10 };
    const chartW = W - PAD.left - PAD.right;

    // Background
    ctx.fillStyle = '#0e1628';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(45,140,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = PAD.top + (PRICE_H - PAD.top) * (i / 5);
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
    }

    const closes = localCandles.map(c => c.close);
    const highs = localCandles.map(c => c.high);
    const lows = localCandles.map(c => c.low);
    const vols = localCandles.map(c => c.volume || 0);

    const priceMin = Math.min(...lows) * 0.998;
    const priceMax = Math.max(...highs) * 1.002;
    const volMax = Math.max(...vols) * 1.1 || 1;

    const priceY = (p) => PAD.top + (PRICE_H - PAD.top) * (1 - (p - priceMin) / (priceMax - priceMin));
    const volY = (v) => PRICE_H + VOL_H - VOL_H * (v / volMax);

    const n = localCandles.length;
    const candleW = Math.max(1, chartW / n * 0.7);
    const step = chartW / n;

    const xOf = (i) => PAD.left + i * step + step * 0.5;

    // Draw volume bars
    localCandles.forEach((c, i) => {
      const x = xOf(i);
      const isBull = c.close >= c.open;
      ctx.fillStyle = isBull ? 'rgba(0,229,160,0.25)' : 'rgba(255,61,107,0.25)';
      const top = volY(c.volume);
      const bot = PRICE_H + VOL_H;
      ctx.fillRect(x - candleW / 2, top, candleW, bot - top);
    });

    // SMA20 overlay
    if (overlays.SMA20) {
      const smaVals = closes.map((_, i) => {
        if (i < 19) return null;
        const slice = closes.slice(i - 19, i + 1);
        return slice.reduce((a, b) => a + b, 0) / 20;
      });
      ctx.strokeStyle = '#ffb020';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      let started = false;
      smaVals.forEach((v, i) => {
        if (v === null) return;
        const x = xOf(i), y = priceY(v);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // EMA9 overlay
    if (overlays.EMA9) {
      const emaArr = EMAArray(closes, 9);
      ctx.strokeStyle = '#9b7cfc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      emaArr.forEach((v, i) => {
        const x = xOf(i), y = priceY(v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Bollinger Bands overlay
    if (overlays.BB && closes.length >= 20) {
      const period = 20;
      const upper = [], lower = [], middle = [];
      for (let i = period - 1; i < closes.length; i++) {
        const slice = closes.slice(i - period + 1, i + 1);
        const m = slice.reduce((a, b) => a + b, 0) / period;
        const std = Math.sqrt(slice.reduce((acc, p) => acc + Math.pow(p - m, 2), 0) / period);
        upper.push({ i, v: m + 2 * std });
        lower.push({ i, v: m - 2 * std });
        middle.push({ i, v: m });
      }
      const drawLine = (arr, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        arr.forEach(({ i, v }, idx) => {
          const x = xOf(i), y = priceY(v);
          idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
      };
      drawLine(upper, 'rgba(155,124,252,0.5)');
      drawLine(lower, 'rgba(155,124,252,0.5)');
      drawLine(middle, 'rgba(155,124,252,0.3)');

      // Fill between bands
      ctx.beginPath();
      upper.forEach(({ i, v }, idx) => {
        const x = xOf(i), y = priceY(v);
        idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      lower.slice().reverse().forEach(({ i, v }) => {
        ctx.lineTo(xOf(i), priceY(v));
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(155,124,252,0.04)';
      ctx.fill();
    }

    // Candlesticks
    localCandles.forEach((c, i) => {
      const x = xOf(i);
      const isBull = c.close >= c.open;
      const color = isBull ? '#00e5a0' : '#ff3d6b';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceY(c.high));
      ctx.lineTo(x, priceY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = priceY(Math.max(c.open, c.close));
      const bodyBot = priceY(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      ctx.fillStyle = isBull ? '#00e5a0' : '#ff3d6b';
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    });

    // Price axis labels
    ctx.fillStyle = '#3a5878';
    ctx.font = '10px Space Mono';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 5; i++) {
      const pct = 1 - i / 5;
      const price = priceMin + (priceMax - priceMin) * pct;
      const y = PAD.top + (PRICE_H - PAD.top) * (i / 5);
      ctx.fillText(price > 1000 ? price.toFixed(0) : price.toFixed(4), W - PAD.right + 4, y + 3);
    }

    // Separator line between price & volume
    ctx.strokeStyle = 'rgba(45,140,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PRICE_H);
    ctx.lineTo(W - PAD.right, PRICE_H);
    ctx.stroke();

  }, [localCandles, overlays]);

  const toggleOverlay = (key) => setOverlays(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="panel" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: '13px', color: 'var(--text-primary)' }}>
            {asset?.symbol || '—'}
          </span>
          {currentPrice && (
            <span style={{ fontFamily: 'Space Mono', fontSize: '15px', color: 'var(--accent-green)' }}>
              ${currentPrice > 1000 ? currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : currentPrice.toFixed(4)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['1H','4H','1D','1W','1M'].map(tf => (
            <button key={tf} className={`btn ${timeframe === tf ? 'active' : ''}`} onClick={() => setTimeframe(tf)}>
              {tf}
            </button>
          ))}
          <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
          {Object.keys(overlays).map(key => (
            <button key={key} className={`btn ${overlays[key] ? 'active' : ''}`} onClick={() => toggleOverlay(key)}>
              {key}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: '320px' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        {localCandles.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '13px',
          }}>
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
}
