import React from 'react';

function IndicatorCard({ label, children, loading }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: '9px', fontFamily: 'Orbitron', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      {loading ? <div className="skeleton" style={{ height: '30px' }} /> : children}
    </div>
  );
}

function ValueBadge({ value, color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
      <span style={{ fontFamily: 'Space Mono', fontSize: '16px', color }}>{value}</span>
      {label && <span style={{ fontSize: '10px', color, opacity: 0.7 }}>{label}</span>}
    </div>
  );
}

function MiniBar({ value, min, max, color }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div style={{ height: '3px', background: 'var(--bg-secondary)', borderRadius: '2px', marginTop: '6px' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
    </div>
  );
}

export default function Indicators({ indicators }) {
  const loading = !indicators;
  const ind = indicators || {};
  const { rsi, macd, bb, stoch, atr, adx, currentPrice } = ind;

  const rsiColor = !rsi ? '#6b90b8' : rsi > 70 ? '#ff3d6b' : rsi < 30 ? '#00e5a0' : '#ffb020';
  const rsiLabel = !rsi ? '—' : rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';

  const macdColor = !macd ? '#6b90b8' : macd.histogram > 0 ? '#00e5a0' : '#ff3d6b';
  const macdLabel = !macd ? '—' : macd.histogram > 0 ? 'Bullish' : 'Bearish';

  const stochColor = !stoch ? '#6b90b8' : stoch.k > 80 ? '#ff3d6b' : stoch.k < 20 ? '#00e5a0' : '#ffb020';
  const stochLabel = !stoch ? '—' : stoch.k > 80 ? 'Overbought' : stoch.k < 20 ? 'Oversold' : 'Neutral';

  const adxStrength = !adx ? '—' : adx.adx > 50 ? 'Very Strong' : adx.adx > 25 ? 'Trending' : 'Weak';
  const adxColor = !adx ? '#6b90b8' : adx.adx > 25 ? '#2d8cff' : '#6b90b8';

  const atrPct = currentPrice && atr ? (atr / currentPrice * 100).toFixed(2) : null;
  const volatilityLabel = !atrPct ? '—' : atrPct > 5 ? 'High' : atrPct > 2 ? 'Medium' : 'Low';
  const atrColor = !atrPct ? '#6b90b8' : atrPct > 5 ? '#ff3d6b' : atrPct > 2 ? '#ffb020' : '#00e5a0';

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Technical Indicators</span>
      </div>
      <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <IndicatorCard label="RSI (14)" loading={loading}>
          <ValueBadge value={rsi ? rsi.toFixed(1) : '—'} color={rsiColor} label={rsiLabel} />
          {rsi && <MiniBar value={rsi} min={0} max={100} color={rsiColor} />}
          {rsi && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>0</span>
              <span style={{ fontSize: '9px', color: '#ffb020' }}>30 — 70</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>100</span>
            </div>
          )}
        </IndicatorCard>

        <IndicatorCard label="MACD (12,26,9)" loading={loading}>
          {macd && (
            <>
              <ValueBadge value={macd.histogram > 0 ? '+' + macd.histogram.toFixed(4) : macd.histogram.toFixed(4)} color={macdColor} label={macdLabel} />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'Space Mono' }}>
                Line: {macd.macd.toFixed(4)} · Sig: {macd.signal.toFixed(4)}
              </div>
            </>
          )}
        </IndicatorCard>

        <IndicatorCard label="Bollinger Bands (20,2)" loading={loading}>
          {bb && (
            <>
              <div style={{ display: 'flex', gap: '6px', fontSize: '10px', fontFamily: 'Space Mono' }}>
                <span style={{ color: '#9b7cfc' }}>↑{bb.upper > 1000 ? bb.upper.toFixed(0) : bb.upper.toFixed(4)}</span>
                <span style={{ color: 'var(--text-muted)' }}>~{bb.middle > 1000 ? bb.middle.toFixed(0) : bb.middle.toFixed(4)}</span>
                <span style={{ color: '#9b7cfc' }}>↓{bb.lower > 1000 ? bb.lower.toFixed(0) : bb.lower.toFixed(4)}</span>
              </div>
              {bb.squeeze && (
                <div style={{ fontSize: '10px', color: 'var(--accent-amber)', marginTop: '4px' }}>⚡ Squeeze detected</div>
              )}
            </>
          )}
        </IndicatorCard>

        <IndicatorCard label="Stochastic (14,3,3)" loading={loading}>
          {stoch && (
            <>
              <ValueBadge value={stoch.k.toFixed(1)} color={stochColor} label={stochLabel} />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'Space Mono' }}>
                %K: {stoch.k.toFixed(1)} · %D: {stoch.d.toFixed(1)}
              </div>
              <MiniBar value={stoch.k} min={0} max={100} color={stochColor} />
            </>
          )}
        </IndicatorCard>

        <IndicatorCard label="ATR (14)" loading={loading}>
          {atr && (
            <>
              <ValueBadge value={atr > 1000 ? atr.toFixed(0) : atr.toFixed(4)} color={atrColor} label={volatilityLabel} />
              {atrPct && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {atrPct}% of price · Volatility: <span style={{ color: atrColor }}>{volatilityLabel}</span>
                </div>
              )}
            </>
          )}
        </IndicatorCard>

        <IndicatorCard label="ADX (14)" loading={loading}>
          {adx && (
            <>
              <ValueBadge value={adx.adx.toFixed(1)} color={adxColor} label={adxStrength} />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'Space Mono' }}>
                +DI: <span style={{ color: '#00e5a0' }}>{adx.pdi.toFixed(1)}</span> · -DI: <span style={{ color: '#ff3d6b' }}>{adx.ndi.toFixed(1)}</span>
              </div>
              <MiniBar value={adx.adx} min={0} max={100} color={adxColor} />
            </>
          )}
        </IndicatorCard>
      </div>
    </div>
  );
}
