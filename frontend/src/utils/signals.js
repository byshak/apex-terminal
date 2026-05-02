export function generateSignal(indicators, sentimentScore = 0) {
  if (!indicators) return null;
  const { rsi, macd, bb, adx, sr, sma20, sma50, ema9, currentPrice } = indicators;

  let score = 0;
  const reasons = [];

  // RSI (15%)
  if (rsi < 30) { score += 15; reasons.push(`RSI ${rsi.toFixed(1)} — Oversold, bullish reversal likely`); }
  else if (rsi < 45) { score += 8; reasons.push(`RSI ${rsi.toFixed(1)} — Below neutral, mild bullish bias`); }
  else if (rsi > 70) { score -= 15; reasons.push(`RSI ${rsi.toFixed(1)} — Overbought, bearish reversal risk`); }
  else if (rsi > 55) { score -= 8; reasons.push(`RSI ${rsi.toFixed(1)} — Above neutral, mild bearish bias`); }
  else { reasons.push(`RSI ${rsi.toFixed(1)} — Neutral zone`); }

  // MACD crossover (20%)
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    score += macd.histogram > 0.001 * currentPrice ? 20 : 10;
    reasons.push(`MACD bullish crossover — Histogram positive at ${macd.histogram.toFixed(4)}`);
  } else if (macd.histogram < 0) {
    score -= macd.histogram < -0.001 * currentPrice ? 20 : 10;
    reasons.push(`MACD bearish crossover — Histogram negative at ${macd.histogram.toFixed(4)}`);
  }

  // Bollinger Bands (15%)
  const bbPos = (currentPrice - bb.lower) / (bb.upper - bb.lower);
  if (bbPos < 0.2) { score += 15; reasons.push(`Price near lower Bollinger Band (${(bbPos*100).toFixed(0)}%) — Potential bounce`); }
  else if (bbPos > 0.8) { score -= 15; reasons.push(`Price near upper Bollinger Band (${(bbPos*100).toFixed(0)}%) — Potential rejection`); }
  else if (bb.squeeze) { reasons.push(`BB Squeeze detected — Breakout imminent, direction unknown`); }
  else { reasons.push(`Price at ${(bbPos*100).toFixed(0)}% of Bollinger Band range`); }

  // ADX trend strength (10%)
  if (adx.adx > 25) {
    const trending = adx.pdi > adx.ndi ? 10 : -10;
    score += trending;
    reasons.push(`ADX ${adx.adx.toFixed(1)} — Strong trend, ${adx.pdi > adx.ndi ? '+DI dominant (bullish)' : '-DI dominant (bearish)'}`);
  } else {
    reasons.push(`ADX ${adx.adx.toFixed(1)} — Weak trend, range-bound market`);
  }

  // EMA alignment (15%)
  if (ema9 && sma20 && sma50) {
    if (currentPrice > ema9 && ema9 > sma20 && sma20 > sma50) {
      score += 15;
      reasons.push(`EMA alignment bullish — Price > EMA9 > SMA20 > SMA50`);
    } else if (currentPrice < ema9 && ema9 < sma20 && sma20 < sma50) {
      score -= 15;
      reasons.push(`EMA alignment bearish — Price < EMA9 < SMA20 < SMA50`);
    } else {
      reasons.push(`EMAs mixed — No clear trend alignment`);
    }
  }

  // Support/Resistance (15%)
  if (sr.support.length && sr.resistance.length) {
    const nearestSupport = sr.support[0];
    const nearestResistance = sr.resistance[0];
    const distToSupport = Math.abs(currentPrice - nearestSupport) / currentPrice;
    const distToResistance = Math.abs(nearestResistance - currentPrice) / currentPrice;
    if (distToSupport < 0.02) { score += 15; reasons.push(`Price near key support $${nearestSupport.toFixed(2)} — Strong buy zone`); }
    else if (distToResistance < 0.02) { score -= 15; reasons.push(`Price near key resistance $${nearestResistance.toFixed(2)} — Potential rejection`); }
    else if (distToSupport < distToResistance) { score += 7; reasons.push(`Closer to support ($${nearestSupport.toFixed(2)}) than resistance ($${nearestResistance.toFixed(2)})`); }
    else { score -= 7; reasons.push(`Closer to resistance ($${nearestResistance.toFixed(2)}) than support ($${nearestSupport.toFixed(2)})`); }
  }

  // News sentiment (10%)
  const sentWeight = Math.min(Math.abs(sentimentScore), 100) / 100 * 10;
  if (sentimentScore > 20) { score += sentWeight; reasons.push(`News sentiment ${sentimentScore > 60 ? 'strongly ' : ''}bullish (+${sentimentScore.toFixed(0)})`); }
  else if (sentimentScore < -20) { score -= sentWeight; reasons.push(`News sentiment ${sentimentScore < -60 ? 'strongly ' : ''}bearish (${sentimentScore.toFixed(0)})`); }

  // Normalize score to -100..100
  score = Math.max(-100, Math.min(100, score));
  const confidence = Math.abs(score);

  let signal, color;
  if (score >= 60) { signal = 'STRONG BUY'; color = '#00e5a0'; }
  else if (score >= 25) { signal = 'BUY'; color = '#00e5a0'; }
  else if (score <= -60) { signal = 'STRONG SELL'; color = '#ff3d6b'; }
  else if (score <= -25) { signal = 'SELL'; color = '#ff3d6b'; }
  else { signal = 'HOLD'; color = '#ffb020'; }

  const atrValue = indicators.atr || currentPrice * 0.02;
  const isBullish = score > 0;
  const entry = currentPrice;
  const sl = isBullish ? entry - atrValue * 1.5 : entry + atrValue * 1.5;
  const tp1 = isBullish ? entry + atrValue * 2 : entry - atrValue * 2;
  const tp2 = isBullish ? entry + atrValue * 3.5 : entry - atrValue * 3.5;
  const riskReward = Math.abs(tp1 - entry) / Math.abs(entry - sl);

  const period = confidence > 60 ? '2-5 days' : confidence > 30 ? '1-3 days' : 'Intraday';

  return { signal, color, score, confidence, entry, sl, tp1, tp2, riskReward, reasons, period };
}

export function scoreSentiment(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const bullish = ['surge','rally','breakout','bull','growth','record','adoption','partnership','upgrade','beat','profit','soar','gain','climb','rise','pump','moon','breakthrough','positive'];
  const bearish = ['crash','plunge','bear','selloff','recession','decline','loss','bankruptcy','ban','hack','fear','weak','miss','downgrade','drop','fall','dump','negative','warning','collapse'];
  let score = 0;
  bullish.forEach(w => { if (lower.includes(w)) score += 15; });
  bearish.forEach(w => { if (lower.includes(w)) score -= 15; });
  return Math.max(-100, Math.min(100, score));
}
