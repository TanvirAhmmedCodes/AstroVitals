/**
 * Real-time SSE subscriber for AstroVitals telemetry stream
 * Connects to /api/v1/vitals/live?astronaut_id={astronautId}
 * Supports both local dev proxy and production remote base URL
 */
export function connectVitalsSSE(astronautId, onMessage, onError) {
  let isCleanedUp = false;
  let es = null;
  let reconnectTimeout = null;

  function getSSEUrl() {
    const rawBase = import.meta.env.VITE_API_BASE_URL || '';
    if (rawBase) {
      // Auto-detect secure protocol if running on HTTPS
      let base = rawBase.replace(/\/$/, '');
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && base.startsWith('http:')) {
        base = base.replace('http:', 'https:');
      }
      return `${base}/api/v1/vitals/live?astronaut_id=${astronautId}`;
    }
    return `/api/v1/vitals/live?astronaut_id=${astronautId}`;
  }

  function connect() {
    if (isCleanedUp) return;

    const url = getSSEUrl();
    try {
      es = new EventSource(url);

      es.onopen = () => {
        console.log(`[SSE] Linked to live telemetry: ${url}`);
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (onMessage) onMessage(parsed);
        } catch (err) {
          console.error('[SSE] Failed to parse frame:', err);
        }
      };

      es.onerror = (err) => {
        if (isCleanedUp) return;
        console.warn('[SSE] Telemetry connection lost. Reconnecting in 3s...', err);
        if (onError) onError(err);
        if (es) {
          es.close();
          es = null;
        }
        reconnectTimeout = setTimeout(connect, 3000);
      };
    } catch (err) {
      console.error('[SSE] Initialization error:', err);
      reconnectTimeout = setTimeout(connect, 3000);
    }
  }

  connect();

  // Teardown closure
  return () => {
    isCleanedUp = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (es) {
      es.close();
      es = null;
    }
    console.log(`[SSE] Disconnected vitals stream for ${astronautId}`);
  };
}
