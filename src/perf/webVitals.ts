const SAMPLE_RATE = 0.08;
const DETAIL_PATH =
  /^\/(activity|place|facility|trail|camp|geo|plan\/today)(\/|$)/;
const SESSION_KEY = 'uaetrail-vitals-detail';

type VitalPayload = {
  n: string;
  v: number;
  path: string;
  d: string;
  conn: string;
};

const shouldReport = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const firstDetail =
    DETAIL_PATH.test(path) && sessionStorage.getItem(SESSION_KEY) !== '1';
  if (firstDetail) {
    sessionStorage.setItem(SESSION_KEY, '1');
    return true;
  }
  return Math.random() < SAMPLE_RATE;
};

const connectionType = (): string => {
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return conn?.effectiveType ?? '';
};

const deviceClass = (): string => {
  const w = window.innerWidth;
  if (w < 768) return 'phone';
  if (w < 1024) return 'tablet';
  return 'desktop';
};

const postVital = (payload: VitalPayload): void => {
  const body = JSON.stringify(payload);
  const url = '/api/vitals';
  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    /* fall through */
  }
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'omit',
  }).catch(() => {
    /* non-blocking RUM */
  });
};

const observe = (type: string, name: string, pick: (entry: PerformanceEntry) => number | null): void => {
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const value = pick(entry);
        if (value == null || !Number.isFinite(value)) continue;
        postVital({
          n: name,
          v: Math.round(value * 1000) / 1000,
          path: window.location.pathname.slice(0, 200),
          d: deviceClass(),
          conn: connectionType(),
        });
      }
    });
    po.observe({ type, buffered: true } as PerformanceObserverInit);
  } catch {
    /* observer unsupported */
  }
};

/** Sampled RUM for LCP / CLS / INP. First paint of a detail route always reports once per session. */
export const initWebVitalsRum = (): void => {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
  if (!shouldReport()) return;
  observe('largest-contentful-paint', 'LCP', (e) => (e as PerformanceEntry & { startTime: number }).startTime);
  observe('layout-shift', 'CLS', (e) => {
    const shift = e as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
    if (shift.hadRecentInput) return null;
    return typeof shift.value === 'number' ? shift.value : null;
  });
  observe('event', 'INP', (e) => {
    const ev = e as PerformanceEntry & { duration?: number; name?: string };
    if (ev.name === 'first-input') return ev.duration ?? null;
    return typeof ev.duration === 'number' && ev.duration >= 40 ? ev.duration : null;
  });
};
