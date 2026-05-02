import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 });

export async function getCalendar() {
  const cacheKey = 'economic_calendar';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const events = [
    { id: 1, title: 'US CPI Data Release', impact: 'HIGH', currency: 'USD', time: new Date(now.getTime() + 3600000 * 2).toISOString(), forecast: '3.2%', previous: '3.4%', actual: null },
    { id: 2, title: 'Fed Interest Rate Decision', impact: 'HIGH', currency: 'USD', time: new Date(now.getTime() + 3600000 * 8).toISOString(), forecast: '5.25%', previous: '5.25%', actual: null },
    { id: 3, title: 'ECB Press Conference', impact: 'HIGH', currency: 'EUR', time: new Date(now.getTime() + 3600000 * 12).toISOString(), forecast: null, previous: null, actual: null },
    { id: 4, title: 'UK Unemployment Rate', impact: 'MEDIUM', currency: 'GBP', time: new Date(now.getTime() + 3600000 * 18).toISOString(), forecast: '4.2%', previous: '4.1%', actual: null },
    { id: 5, title: 'US Initial Jobless Claims', impact: 'MEDIUM', currency: 'USD', time: new Date(now.getTime() + 3600000 * 22).toISOString(), forecast: '215K', previous: '222K', actual: null },
    { id: 6, title: 'Japan GDP Growth Rate', impact: 'MEDIUM', currency: 'JPY', time: new Date(now.getTime() + 3600000 * 26).toISOString(), forecast: '0.4%', previous: '-0.1%', actual: null },
    { id: 7, title: 'German ZEW Economic Sentiment', impact: 'MEDIUM', currency: 'EUR', time: new Date(now.getTime() + 3600000 * 30).toISOString(), forecast: '35.0', previous: '31.7', actual: null },
    { id: 8, title: 'US NFP Employment Change', impact: 'HIGH', currency: 'USD', time: new Date(now.getTime() + 3600000 * 48).toISOString(), forecast: '180K', previous: '216K', actual: null },
    { id: 9, title: 'Canada Retail Sales', impact: 'LOW', currency: 'CAD', time: new Date(now.getTime() + 3600000 * 52).toISOString(), forecast: '0.5%', previous: '0.3%', actual: null },
    { id: 10, title: 'Australia RBA Rate Decision', impact: 'HIGH', currency: 'AUD', time: new Date(now.getTime() + 3600000 * 60).toISOString(), forecast: '4.35%', previous: '4.35%', actual: null },
  ];

  cache.set(cacheKey, events);
  return events;
}
