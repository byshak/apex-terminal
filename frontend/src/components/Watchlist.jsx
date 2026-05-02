import React, { useState, useEffect, useRef } from 'react';

const GROUPS = ['CRYPTO', 'FOREX', 'COMMODITY', 'STOCK'];

function Sparkline({ prices = [], color = '#2d8cff' }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 60, h = 20;
  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssetRow({ info, price, selected, onClick }) {
  const prevPrice = useRef(null);
  const [flashClass, setFlashClass] = useState('');
  const priceHistory = useRef([]);

  useEffect(() => {
    if (price?.price) {
      priceHistory.current = [...priceHistory.current.slice(-13), price.price];
    }
  }, [price]);

  useEffect(() => {
    if (price?.price && prevPrice.current !== null) {
      const dir = price.price > prevPrice.current ? 'flash-up' : price.price < prevPrice.current ? 'flash-down' : '';
      if (dir) {
        setFlashClass(dir);
        setTimeout(() => setFlashClass(''), 600);
      }
    }
    prevPrice.current = price?.price || null;
  }, [price?.price]);

  const change = price?.change24h;
  const isPos = change >= 0;
  const changeColor = isPos ? 'var(--accent-green)' : 'var(--accent-red)';

  const formatPrice = (p) => {
    if (!p) return '—';
    if (p > 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (p > 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  return (
    <div
      className={flashClass}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 10px', borderRadius: '5px', cursor: 'pointer',
        background: selected ? 'rgba(45,140,255,0.1)' : 'transparent',
        border: `1px solid ${selected ? 'rgba(45,140,255,0.3)' : 'transparent'}`,
        transition: 'all 0.15s ease',
        marginBottom: '2px',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-card)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', fontFamily: 'Orbitron', color: 'var(--accent-blue)' }}>{info.symbol.slice(0, 2)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{info.symbol}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.name}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'Space Mono', fontSize: '11px', color: 'var(--text-primary)' }}>
          {formatPrice(price?.price)}
        </div>
        <div style={{ fontFamily: 'Space Mono', fontSize: '10px', color: changeColor }}>
          {change !== undefined ? `${isPos ? '+' : ''}${Number(change).toFixed(2)}%` : '—'}
        </div>
      </div>
      <Sparkline prices={priceHistory.current} color={isPos ? 'var(--accent-green)' : 'var(--accent-red)'} />
    </div>
  );
}

export default function Watchlist({ symbols, prices, selectedAsset, onSelect, loading }) {
  const grouped = GROUPS.map(g => ({
    group: g,
    items: symbols.filter(s => s.type === g),
  })).filter(g => g.items.length > 0);

  return (
    <div className="panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <span className="panel-title">Watchlist</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>{symbols.length} assets</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '44px', marginBottom: '4px' }} />
          ))
        ) : (
          grouped.map(({ group, items }) => (
            <div key={group}>
              <div style={{
                fontSize: '9px', fontFamily: 'Orbitron', letterSpacing: '1.5px',
                color: 'var(--text-muted)', padding: '8px 4px 4px',
                borderBottom: '1px solid var(--border)', marginBottom: '4px',
              }}>{group}</div>
              {items.map(info => (
                <AssetRow
                  key={info.symbol}
                  info={info}
                  price={prices[info.symbol]}
                  selected={selectedAsset?.symbol === info.symbol}
                  onClick={() => onSelect(info)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
