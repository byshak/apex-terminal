import React, { useState, useMemo } from 'react';

export default function RiskCalculator({ currentPrice, asset }) {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPct, setRiskPct] = useState(2);
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [direction, setDirection] = useState('LONG');

  const entryPrice = parseFloat(entry) || currentPrice || 0;
  const slPrice = parseFloat(stopLoss) || 0;

  const calc = useMemo(() => {
    if (!entryPrice || !slPrice || !accountSize || !riskPct) return null;
    const dollarRisk = accountSize * (riskPct / 100);
    const priceDiff = Math.abs(entryPrice - slPrice);
    if (priceDiff === 0) return null;
    const positionSize = dollarRisk / priceDiff;
    const positionValue = positionSize * entryPrice;
    const leverage = positionValue / accountSize;
    const tp1Price = direction === 'LONG'
      ? entryPrice + priceDiff * 2
      : entryPrice - priceDiff * 2;
    const rr = Math.abs(tp1Price - entryPrice) / priceDiff;
    const riskLevel = leverage > 10 ? 'HIGH' : leverage > 3 ? 'MEDIUM' : 'LOW';
    const riskColor = { HIGH: '#ff3d6b', MEDIUM: '#ffb020', LOW: '#00e5a0' }[riskLevel];
    return { dollarRisk, positionSize, positionValue, leverage, tp1Price, rr, riskLevel, riskColor };
  }, [entryPrice, slPrice, accountSize, riskPct, direction]);

  const fmt = (n, d = 2) => n?.toLocaleString('en-US', { maximumFractionDigits: d }) || '—';

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Risk Calculator</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['LONG','SHORT'].map(d => (
            <button key={d} className={`btn ${direction === d ? 'active' : ''}`}
              onClick={() => setDirection(d)}
              style={{ color: d === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '10px' }}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Size ($)</div>
            <input type="number" value={accountSize} onChange={e => setAccountSize(+e.target.value)} placeholder="10000" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Risk %</div>
            <input type="number" value={riskPct} onChange={e => setRiskPct(+e.target.value)} placeholder="2" min="0.1" max="100" step="0.1" />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Entry Price</div>
            <input type="number" value={entry} onChange={e => setEntry(e.target.value)} placeholder={currentPrice?.toFixed(2) || '0'} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Stop Loss</div>
            <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="Stop price" />
          </div>
        </div>

        {calc && (
          <>
            {/* Risk meter */}
            <div style={{
              padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '6px',
              border: `1px solid ${calc.riskColor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Risk Level</span>
              <span style={{
                fontFamily: 'Orbitron', fontSize: '10px', color: calc.riskColor,
                background: calc.riskColor + '22', padding: '2px 8px', borderRadius: '3px',
              }}>{calc.riskLevel}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {[
                { label: 'Dollar Risk', value: `$${fmt(calc.dollarRisk)}`, color: 'var(--accent-red)' },
                { label: 'Position Size', value: `${fmt(calc.positionSize, 4)} ${asset?.symbol || ''}`, color: 'var(--text-primary)' },
                { label: 'Position Value', value: `$${fmt(calc.positionValue)}`, color: 'var(--text-primary)' },
                { label: 'Leverage', value: `${fmt(calc.leverage, 1)}x`, color: calc.riskColor },
                { label: 'TP1 Target', value: `$${fmt(calc.tp1Price)}`, color: 'var(--accent-green)' },
                { label: 'Risk:Reward', value: `1:${fmt(calc.rr)}`, color: 'var(--accent-amber)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: '7px 9px', background: 'var(--bg-secondary)', borderRadius: '5px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '11px', color }}>{value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {!calc && (
          <div style={{
            padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px',
            background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)',
          }}>
            Enter entry & stop loss prices to calculate position
          </div>
        )}
      </div>
    </div>
  );
}
