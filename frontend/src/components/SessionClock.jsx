import React, { useState, useEffect } from 'react';

const SESSIONS = [
  { name: 'Sydney',   openHour: 21, closeHour: 6,  tz: 'Australia/Sydney', color: '#9b7cfc' },
  { name: 'Tokyo',    openHour: 23, closeHour: 8,  tz: 'Asia/Tokyo',       color: '#ffb020' },
  { name: 'London',   openHour: 7,  closeHour: 16, tz: 'Europe/London',    color: '#2d8cff' },
  { name: 'New York', openHour: 12, closeHour: 21, tz: 'America/New_York', color: '#00e5a0' },
];

function isOpen(session) {
  const now = new Date();
  const h = now.getUTCHours();
  const { openHour, closeHour } = session;
  if (openHour < closeHour) return h >= openHour && h < closeHour;
  return h >= openHour || h < closeHour;
}

function secondsUntil(targetHour) {
  const now = new Date();
  const target = new Date();
  target.setUTCHours(targetHour, 0, 0, 0);
  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
  return Math.floor((target - now) / 1000);
}

function fmtCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function SessionClock() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const openSessions = SESSIONS.filter(isOpen);
  const overlap = openSessions.length >= 2;

  return (
    <div className="panel" style={{ flexShrink: 0 }}>
      <div className="panel-header">
        <span className="panel-title">Market Sessions</span>
        {overlap && (
          <span style={{
            fontSize: '9px', fontFamily: 'Orbitron', letterSpacing: '0.5px',
            color: 'var(--accent-amber)', background: 'rgba(255,176,32,0.1)',
            padding: '2px 6px', borderRadius: '3px',
          }}>OVERLAP</span>
        )}
      </div>
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {SESSIONS.map(s => {
          const open = isOpen(s);
          const secs = secondsUntil(open ? s.closeHour : s.openHour);
          return (
            <div key={s.name} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', borderRadius: '5px',
              background: open ? `${s.color}11` : 'var(--bg-card)',
              border: `1px solid ${open ? s.color + '44' : 'var(--border)'}`,
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: open ? s.color : 'var(--text-muted)',
                animation: open ? 'pulse-dot 1.5s infinite' : 'none',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: open ? s.color : 'var(--text-secondary)', fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>
                  {open ? 'Closes in' : 'Opens in'} {fmtCountdown(secs)}
                </div>
              </div>
              <span style={{
                fontSize: '9px', fontFamily: 'Orbitron', letterSpacing: '0.5px',
                color: open ? s.color : 'var(--text-muted)',
              }}>{open ? 'OPEN' : 'CLOSED'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
