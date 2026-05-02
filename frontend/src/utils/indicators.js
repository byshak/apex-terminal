export function SMA(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function EMA(prices, period) {
  if (prices.length < period) return null;
  const mult = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * mult + ema * (1 - mult);
  }
  return ema;
}

export function EMAArray(prices, period) {
  if (prices.length < period) return [];
  const mult = 2 / (period + 1);
  const result = [];
  let ema = prices[0];
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) { result.push(ema); continue; }
    ema = prices[i] * mult + ema * (1 - mult);
    result.push(ema);
  }
  return result;
}

export function RSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const delta = prices[i] - prices[i - 1];
    if (delta > 0) gains += delta;
    else losses += Math.abs(delta);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function MACD(prices, fast = 12, slow = 26, signal = 9) {
  if (prices.length < slow + signal) return { macd: 0, signal: 0, histogram: 0 };
  const emaFastArr = EMAArray(prices, fast);
  const emaSlowArr = EMAArray(prices, slow);
  const len = Math.min(emaFastArr.length, emaSlowArr.length);
  const macdLine = [];
  for (let i = 0; i < len; i++) {
    macdLine.push(emaFastArr[i] - emaSlowArr[i]);
  }
  const signalLine = EMAArray(macdLine, signal);
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  return {
    macd: lastMacd,
    signal: lastSignal,
    histogram: lastMacd - lastSignal,
  };
}

export function BollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) return { upper: 0, middle: 0, lower: 0, squeeze: false };
  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, p) => acc + Math.pow(p - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  const upper = middle + stdDev * std;
  const lower = middle - stdDev * std;
  const bandwidth = (upper - lower) / middle;
  return { upper, middle, lower, std, bandwidth, squeeze: bandwidth < 0.02 };
}

export function ATR(highs, lows, closes, period = 14) {
  if (closes.length < period + 1) return 0;
  const trueRanges = [];
  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(hl, hpc, lpc));
  }
  return EMA(trueRanges, period) || trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function Stochastic(highs, lows, closes, k = 14, d = 3) {
  if (closes.length < k) return { k: 50, d: 50 };
  const kValues = [];
  for (let i = k - 1; i < closes.length; i++) {
    const lowestLow = Math.min(...lows.slice(i - k + 1, i + 1));
    const highestHigh = Math.max(...highs.slice(i - k + 1, i + 1));
    const denom = highestHigh - lowestLow;
    kValues.push(denom === 0 ? 50 : 100 * (closes[i] - lowestLow) / denom);
  }
  const dVal = kValues.slice(-d).reduce((a, b) => a + b, 0) / d;
  return { k: kValues[kValues.length - 1], d: dVal };
}

export function ADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2) return { adx: 25, pdi: 20, ndi: 20 };
  const plusDM = [], minusDM = [], trueRanges = [];

  for (let i = 1; i < closes.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(hl, hpc, lpc));
  }

  const atr = EMA(trueRanges, period) || 1;
  const pdi = 100 * (EMA(plusDM, period) || 0) / atr;
  const ndi = 100 * (EMA(minusDM, period) || 0) / atr;
  const dxArr = [];
  for (let i = 0; i < Math.min(plusDM.length, minusDM.length); i++) {
    const sumDI = pdi + ndi;
    if (sumDI === 0) { dxArr.push(0); continue; }
    dxArr.push(100 * Math.abs(pdi - ndi) / sumDI);
  }
  const adx = EMA(dxArr, period) || 25;
  return { adx, pdi, ndi };
}

export function SupportResistance(closes, neighbors = 3) {
  const supports = [], resistances = [];
  for (let i = neighbors; i < closes.length - neighbors; i++) {
    const slice = closes.slice(i - neighbors, i + neighbors + 1);
    const price = closes[i];
    if (price === Math.min(...slice)) supports.push(price);
    if (price === Math.max(...slice)) resistances.push(price);
  }
  supports.sort((a, b) => b - a);
  resistances.sort((a, b) => b - a);
  return {
    support: [...new Set(supports.map(p => +p.toFixed(2)))].slice(0, 3),
    resistance: [...new Set(resistances.map(p => +p.toFixed(2)))].slice(0, 3),
  };
}

export function computeAllIndicators(candles) {
  if (!candles || candles.length < 30) return null;
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  const rsi = RSI(closes);
  const macd = MACD(closes);
  const bb = BollingerBands(closes);
  const atr = ATR(highs, lows, closes);
  const stoch = Stochastic(highs, lows, closes);
  const adx = ADX(highs, lows, closes);
  const sr = SupportResistance(closes);
  const sma20 = SMA(closes, 20);
  const sma50 = SMA(closes, 50);
  const ema9 = EMA(closes, 9);
  const currentPrice = closes[closes.length - 1];

  return { rsi, macd, bb, atr, stoch, adx, sr, sma20, sma50, ema9, currentPrice };
}
