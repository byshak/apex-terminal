import React, { useMemo } from 'react';
import { generateSignal } from '../utils/signals.js';

export default function SignalEngine({ indicators, sentiment, currentPrice }) {
  const sentimentScore = sentiment?.value ? (sentiment.value - 50) * 2 : 0;
  const signal = useMemo(() => generateSignal(indicators, sentimentScore), [indicators, sentimentScore]);

  if (!signal) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Signal Engine</span></div>
        <div style={{ padding: '16px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '20px', marginBottom: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  const formatPrice = (p) => p > 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 2 }) : p?.toFixed(4);

  return (
    <div className="panel fade-in-up">
      <div className="panel-header">
        <span className="panel-title">Signal Engine</span>
        <div style={{
          fontFamily: 'Orbitron', fontSize: '11px', fontWeight: 700,
          color: signal.color, padding: '3px 10px', borderRadius: '4px',
          background: signal.color + '22', border: `1px solid ${signal.color}44`,
          letterSpacing: '0.5px',
        }}>{signal.signal}</div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Confidence bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Confidence</span>
            <span style={{ fontFamily: 'Space Mono', fontSize: '12px', color: signal.color }}>{signal.confidence.toFixed(0)}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${signal.confidence}%`, height: '100%',
              background: `linear-gradient(90deg, ${signal.color}88, ${signal.color})`,
              borderRadius: '3px', transition: 'width 0.8s ease',
              boxShadow: `0 0 8px ${signal.color}66`,
            }} />
          </div>
        </div>

        {/* Price levels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {[
            { label: 'Entry', value: signal.entry, color: 'var(--accent-blue)' },
            { label: 'Stop Loss', value: signal.sl, color: 'var(--accent-red)' },
            { label: 'TP1', value: signal.tp1, color: 'var(--accent-green)' },
            { label: 'TP2', value: signal.tp2, color: 'var(--accent-green)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--bg-secondary)', borderRadius: '5px', padding: '7px 9px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontFamily: 'Space Mono', fontSize: '11px', color }}>${formatPrice(value)}</div>
            </div>
          ))}
        </div>

        {/* R:R and period */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1, background: 'var(--bg-secondary)', borderRadius: '5px', padding: '7px 9px',
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Risk:Reward</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: '13px', color: 'var(--accent-amber)', marginTop: '2px' }}>1:{signal.riskReward.toFixed(2)}</div>
          </div>
          <div style={{
            flex: 1, background: 'var(--bg-secondary)', borderRadius: '5px', padding: '7px 9px',
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Hold Period</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{signal.period}</div>
          </div>
        </div>

        {/* Reasons */}
        <div>
          <div style={{ fontSize: '9px', fontFamily: 'Orbitron', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>SIGNAL REASONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {signal.reasons.map((r, i) => (
              <div key={i} style={{
                fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 8px',
                background: 'var(--bg-secondary)', borderRadius: '4px',
                borderLeft: `2px solid ${signal.color}66`,
              }}>
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
