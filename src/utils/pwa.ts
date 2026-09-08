type PwaDisplayMode = 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser' | 'window-controls-overlay';

/** True when the app runs as an installed PWA or native shell (no browser chrome). */
function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;

  const standaloneMq = window.matchMedia('(display-mode: standalone)').matches;
  const minimalUiMq = window.matchMedia('(display-mode: minimal-ui)').matches;
  const fullscreenMq = window.matchMedia('(display-mode: fullscreen)').matches;
  const iosStandalone = 'standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone;

  return standaloneMq || minimalUiMq || fullscreenMq || Boolean(iosStandalone);
}

function readDisplayMode(): PwaDisplayMode {
  if (typeof window === 'undefined') return 'browser';

  const modes: PwaDisplayMode[] = [
    'window-controls-overlay',
    'standalone',
    'minimal-ui',
    'fullscreen',
    'browser',
  ];

  return modes.find((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) ?? 'browser';
}

/** Expose display mode on <html> for CSS hooks and keep it in sync. */
export function initPwaDisplayMode(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const apply = () => {
    const mode = readDisplayMode();
    const installed = isStandaloneDisplayMode();

    root.dataset.displayMode = mode;
    root.dataset.pwaInstalled = installed ? 'true' : 'false';
  };

  apply();

  const mediaQueries = [
    '(display-mode: standalone)',
    '(display-mode: minimal-ui)',
    '(display-mode: fullscreen)',
    '(display-mode: window-controls-overlay)',
  ];

  for (const query of mediaQueries) {
    window.matchMedia(query).addEventListener('change', apply);
  }
}

/** Register the service worker for PWA install and web push. */
export function registerAppServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* non-fatal — push registration retries on user action */
    });
  });
}
