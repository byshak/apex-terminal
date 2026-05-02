let ws = null;
const listeners = new Set();
let reconnectTimer = null;
let connected = false;

export function connectWS(onMessage) {
  listeners.add(onMessage);

  if (!ws || ws.readyState > 1) {
    initWS();
  }

  return () => {
    listeners.delete(onMessage);
  };
}

function initWS() {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${location.host}/ws`;

  try {
    ws = new WebSocket(url);

    ws.onopen = () => {
      connected = true;
      clearTimeout(reconnectTimer);
      listeners.forEach(fn => fn({ type: 'CONNECTED' }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        listeners.forEach(fn => fn(data));
      } catch {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      connected = false;
      listeners.forEach(fn => fn({ type: 'DISCONNECTED' }));
      reconnectTimer = setTimeout(initWS, 3000);
    };
  } catch (e) {
    reconnectTimer = setTimeout(initWS, 5000);
  }
}

export function getConnectionState() {
  return connected;
}
