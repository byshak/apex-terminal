import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const STORAGE_KEY = 'apex_portfolio_positions';

function loadPositions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function savePositions(positions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

const COLORS = ['#2d8cff','#00e5a0','#ff3d6b','#ffb020','#9b7cfc','#06d6a0','#ef476f','#ffd166','#118ab2'];

export default function Portfolio({ prices }) {
  const [positions, setPositions] = useState(loadPositions);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: '', direction: 'LONG', entry: '', qty: '', date: new Date().toISOString().slice(0,10) });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => { savePositions(positions); }, [positions]);

  const getPrice = (symbol) => {
    const p = prices[symbol];
    return p?.price || 0;
  };

  const enriched = positions.map(pos => {
    const currentP = getPrice(pos.symbol);
    const entry = parseFloat(pos.entry);
    const qty = parseFloat(pos.qty);
    const pnl = pos.direction === 'LONG'
      ? (currentP - entry) * qty
      : (entry - currentP) * qty;
    const pnlPct = entry ? (pnl / (entry * qty)) * 100 : 0;
    const value = currentP * qty;
    return { ...pos, currentP, pnl, pnlPct, value };
  });

  const totalValue = enriched.reduce((s, p) => s + p.value, 0);
  const totalPnl = enriched.reduce((s, p) => s + p.pnl, 0);
  const totalCost = positions.reduce((s, p) => s + parseFloat(p.entry) * parseFloat(p.qty), 0);
  const totalReturn = totalCost ? (totalPnl / totalCost) * 100 : 0;

  useEffect(() => {
    if (!chartRef.current || enriched.length === 0) return;
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels: enriched.map(p => p.symbol),
        datasets: [{
          data: enriched.map(p => Math.max(0, p.value)),
          backgroundColor: enriched.map((_, i) => COLORS[i % COLORS.length] + 'cc'),
          borderColor: enriched.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#6b90b8', font: { size: 11 } } },
        },
      },
    });
    return () => chartInstance.current?.destroy();
  }, [enriched]);

  const addPosition = () => {
    if (!form.symbol || !form.entry || !form.qty) return;
    const pos = { ...form, id: Date.now() };
    setPositions(prev => [...prev, pos]);
    setForm({ symbol: '', direction: 'LONG', entry: '', qty: '', date: new Date().toISOString().slice(0,10) });
    setShowForm(false);
  };

  const removePosition = (id) => setPositions(prev => prev.filter(p => p.id !== id));

  const fmt = (n, d = 2) => n?.toLocaleString('en-US', { maximumFractionDigits: d }) || '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
      {/* Summary */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Portfolio</span>
          <button className="btn" onClick={() => setShowForm(s => !s)}>+ Position</button>
        </div>
        <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Total Value', value: `$${fmt(totalValue)}`, color: 'var(--text-primary)' },
            { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${fmt(totalPnl)}`, color: totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
            { label: 'Return', value: `${totalReturn >= 0 ? '+' : ''}${fmt(totalReturn)}%`, color: totalReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-card)', borderRadius: '6px', padding: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontFamily: 'Space Mono', fontSize: '14px', color, marginTop: '4px' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="panel fade-in-up">
          <div className="panel-header"><span className="panel-title">Add Position</span></div>
          <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Symbol</div>
              <input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} placeholder="BTC" />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Direction</div>
              <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                <option>LONG</option><option>SHORT</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Entry Price</div>
              <input type="number" value={form.entry} onChange={e => setForm(f => ({ ...f, entry: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Quantity</div>
              <input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date</div>
              <input type="text" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={addPosition} style={{
                width: '100%', padding: '7px', background: 'rgba(45,140,255,0.15)',
                border: '1px solid var(--accent-blue)', color: 'var(--accent-blue)',
                borderRadius: '4px', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '11px',
              }}>ADD</button>
            </div>
          </div>
        </div>
      )}

      {/* Allocation chart */}
      {enriched.length > 0 && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Allocation</span></div>
          <div style={{ padding: '10px', height: '180px' }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      )}

      {/* Positions table */}
      <div className="panel" style={{ flex: 1 }}>
        <div className="panel-header"><span className="panel-title">Open Positions</span></div>
        {enriched.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No positions. Add one above.
          </div>
        ) : (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {enriched.map(pos => (
              <div key={pos.id} style={{
                padding: '10px', background: 'var(--bg-card)', borderRadius: '6px',
                border: '1px solid var(--border)',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                gap: '8px', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '12px', color: 'var(--text-primary)' }}>{pos.symbol}</div>
                  <div style={{ fontSize: '9px', color: pos.direction === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{pos.direction}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Entry</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '11px', color: 'var(--text-secondary)' }}>${fmt(parseFloat(pos.entry))}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Current</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '11px', color: 'var(--text-primary)' }}>${fmt(pos.currentP)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>P&L</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: '11px', color: pos.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {pos.pnl >= 0 ? '+' : ''}${fmt(pos.pnl)} ({pos.pnl >= 0 ? '+' : ''}{fmt(pos.pnlPct)}%)
                  </div>
                </div>
                <button onClick={() => removePosition(pos.id)} style={{
                  background: 'none', border: '1px solid var(--accent-red)', color: 'var(--accent-red)',
                  borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px',
                }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
