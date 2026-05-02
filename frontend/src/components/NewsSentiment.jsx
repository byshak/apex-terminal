import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { scoreSentiment } from '../utils/signals.js';

function sentimentLabel(score) {
  if (score >= 60) return { label: 'VERY BULLISH', color: '#00e5a0' };
  if (score >= 20) return { label: 'BULLISH', color: '#00e5a0' };
  if (score <= -60) return { label: 'VERY BEARISH', color: '#ff3d6b' };
  if (score <= -20) return { label: 'BEARISH', color: '#ff3d6b' };
  return { label: 'NEUTRAL', color: '#ffb020' };
}

export default function NewsSentiment({ asset, sentiment }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  const fetchNews = useCallback(() => {
    if (!asset) return;
    setLoading(true);
    const topic = asset.symbol === 'BTC' ? 'bitcoin' : asset.symbol === 'ETH' ? 'ethereum' : asset.name;
    api.getNews(topic, 8)
      .then(articles => {
        setNews(articles.slice(0, 6));
        const scores = articles.map(a => scoreSentiment(a.title));
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        setOverallScore(avg);
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [asset]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const { label, color } = sentimentLabel(overallScore);
  const barPct = (overallScore + 100) / 2;
  const fngValue = sentiment?.value || 50;
  const fngLabel = sentiment?.label || 'Neutral';
  const fngColor = fngValue >= 60 ? '#00e5a0' : fngValue >= 45 ? '#ffb020' : '#ff3d6b';

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="panel" style={{ flexShrink: 0 }}>
      <div className="panel-header">
        <span className="panel-title">News & Sentiment</span>
        <button className="btn" onClick={fetchNews} style={{ fontSize: '10px', padding: '2px 8px' }}>↻</button>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Fear & Greed */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '6px',
          border: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px' }}>FEAR & GREED INDEX</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: '20px', color: fngColor, lineHeight: 1 }}>{fngValue}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Orbitron', fontSize: '10px', color: fngColor }}>{fngLabel}</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>Crypto market mood</div>
          </div>
        </div>

        {/* News sentiment bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>News Sentiment</span>
            <span style={{ fontFamily: 'Orbitron', fontSize: '9px', color, letterSpacing: '0.5px' }}>{label}</span>
          </div>
          <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${barPct}%`, height: '100%',
              background: `linear-gradient(90deg, #ff3d6b, #ffb020, #00e5a0)`,
              borderRadius: '3px',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
            <span style={{ fontSize: '9px', color: '#ff3d6b' }}>Bearish</span>
            <span style={{ fontSize: '9px', color: '#00e5a0' }}>Bullish</span>
          </div>
        </div>

        {/* News headlines */}
        <div>
          <div style={{ fontSize: '9px', fontFamily: 'Orbitron', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>HEADLINES</div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '42px', marginBottom: '4px' }} />
            ))
          ) : news.map((article, i) => {
            const score = scoreSentiment(article.title);
            const artColor = score > 20 ? 'var(--accent-green)' : score < -20 ? 'var(--accent-red)' : 'var(--text-muted)';
            const artLabel = score > 20 ? '↑' : score < -20 ? '↓' : '→';
            return (
              <a key={i} href={article.url !== '#' ? article.url : undefined}
                target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  padding: '7px 9px', marginBottom: '4px',
                  background: 'var(--bg-card)', borderRadius: '5px',
                  border: '1px solid var(--border)',
                  cursor: article.url !== '#' ? 'pointer' : 'default',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ color: artColor, fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{artLabel}</span>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {article.title.length > 70 ? article.title.slice(0, 70) + '…' : article.title}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {article.source} · {timeAgo(article.publishedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
