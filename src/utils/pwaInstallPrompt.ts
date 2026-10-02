/** Chromium `beforeinstallprompt` — not in all TS lib versions. */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Capture the install prompt once per page load (call from main entry). */
export function initPwaInstallPromptCapture(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (event) => {
    // On Android, never intercept — in-app prompt() often shows “cannot be installed” (esp. Edge).
    // Let the browser handle install via ⋮ / ≡ menu when criteria are met.
    if (/Android/i.test(navigator.userAgent)) return;

    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export function getDeferredPwaInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function subscribePwaInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function triggerPwaInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    return 'unavailable';
  }

  const prompt = deferredPrompt;
  if (!prompt) return 'unavailable';

  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  deferredPrompt = null;
  notifyListeners();
  return outcome;
}
