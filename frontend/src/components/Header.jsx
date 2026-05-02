import React, { useState, useEffect } from 'react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'calendar', label: 'Calendar' },
];

export default function Header({ activeTab, onTabChange, connected }) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      height: '48px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '24px',
      userSelect: 'none',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'Orbitron',
        fontWeight: 900,
        fontSize: '14px',
        letterSpacing: '2px',
        color: 'var(--accent-blue)',
        whiteSpace: 'nowrap',
        textShadow: '0 0 20px rgba(45,140,255,0.5)',
      }}>
        APEX<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> TERMINAL</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            style={{ fontFamily: 'DM Sans', fontSize: '12px', padding: '4px 14px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'Space Mono', fontSize: '11px', color: 'var(--text-muted)' }}>
          {utcTime}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
            animation: connected ? 'pulse-dot 1.5s infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'Orbitron', fontSize: '9px', letterSpacing: '1px',
            color: connected ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
}
