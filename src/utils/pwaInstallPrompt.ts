export const PWA_INSTALL_AVAILABLE_EVENT = 'uaetrail-install-available';
export const PWA_INSTALL_DONE_EVENT = 'uaetrail-app-installed';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type InstallWindow = Window & {
  __uaeTrailDeferredInstall?: BeforeInstallPromptEvent | null;
};

function installWindow(): InstallWindow | null {
  if (typeof window === 'undefined') return null;
  return window as InstallWindow;
}

export function readDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return installWindow()?.__uaeTrailDeferredInstall ?? null;
}

export function hasAndroidInstallPrompt(): boolean {
  const event = readDeferredInstallPrompt();
  return Boolean(event && typeof event.prompt === 'function');
}

/** Store the Chromium install event (Chrome and Edge on Android both fire this). */
export function stashAndroidInstallPrompt(event: BeforeInstallPromptEvent): void {
  const win = installWindow();
  if (!win) return;
  win.__uaeTrailDeferredInstall = event;
  win.dispatchEvent(new Event(PWA_INSTALL_AVAILABLE_EVENT));
}

export function clearAndroidInstallPrompt(): void {
  const win = installWindow();
  if (!win) return;
  win.__uaeTrailDeferredInstall = null;
  win.dispatchEvent(new Event(PWA_INSTALL_AVAILABLE_EVENT));
}

/**
 * Open the native install dialog. Must be called from a click handler so
 * Chrome and Edge still treat it as a user gesture. Returns false when the
 * browser has not offered install yet (caller should show the manual steps).
 */
export function promptAndroidInstall(): boolean {
  const win = installWindow();
  const event = win?.__uaeTrailDeferredInstall;
  if (!win || !event || typeof event.prompt !== 'function') return false;

  win.__uaeTrailDeferredInstall = null;
  win.dispatchEvent(new Event(PWA_INSTALL_AVAILABLE_EVENT));

  try {
    void Promise.resolve(event.prompt())
      .then(() => event.userChoice)
      .then((choice) => {
        if (choice?.outcome === 'accepted') {
          win.dispatchEvent(new Event(PWA_INSTALL_DONE_EVENT));
        }
      })
      .catch(() => {
        /* The browser menu already consumed the prompt, or the user dismissed it. */
      });
    return true;
  } catch {
    win.__uaeTrailDeferredInstall = event;
    win.dispatchEvent(new Event(PWA_INSTALL_AVAILABLE_EVENT));
    return false;
  }
}
