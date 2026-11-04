import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { detectAndroidWebBrowser, resolveAndroidInstallSteps, resolveIosInstallSteps } from '../utils/pwaInstallGuide';
import { detectMobileWebPlatform, isPwaInstalled, type AndroidWebBrowser, type MobileWebPlatform } from '../utils/pwa';
import {
  hasAndroidInstallPrompt,
  PWA_INSTALL_AVAILABLE_EVENT,
  PWA_INSTALL_DONE_EVENT,
  promptAndroidInstall,
  stashAndroidInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../utils/pwaInstallPrompt';

export function usePhoneAppInstall() {
  const [installed, setInstalled] = useState(() => isPwaInstalled());
  const [installReady, setInstallReady] = useState(() => hasAndroidInstallPrompt());
  const [secureContext, setSecureContext] = useState(() =>
    typeof window === 'undefined' ? true : window.isSecureContext
  );

  const platform: MobileWebPlatform = detectMobileWebPlatform();
  const androidBrowser: AndroidWebBrowser | null =
    platform === 'android' ? detectAndroidWebBrowser() : null;
  const isNativeShell = Capacitor.isNativePlatform();

  const refresh = useCallback(() => {
    setInstalled(isPwaInstalled());
  }, []);

  useEffect(() => {
    refresh();
    setSecureContext(window.isSecureContext);
    const onDisplayModeChange = () => refresh();
    const onInstallAvailable = () => setInstallReady(hasAndroidInstallPrompt());
    const onInstalled = () => {
      setInstalled(true);
      setInstallReady(false);
    };
    const onBeforeInstall = (event: Event) => {
      if (!hasAndroidInstallPrompt()) {
        stashAndroidInstallPrompt(event as BeforeInstallPromptEvent);
      }
      onInstallAvailable();
    };
    const queries = ['(display-mode: standalone)', '(display-mode: minimal-ui)', '(display-mode: fullscreen)'];
    for (const query of queries) {
      window.matchMedia(query).addEventListener('change', onDisplayModeChange);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener(PWA_INSTALL_AVAILABLE_EVENT, onInstallAvailable);
    window.addEventListener(PWA_INSTALL_DONE_EVENT, onInstalled);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      for (const query of queries) {
        window.matchMedia(query).removeEventListener('change', onDisplayModeChange);
      }
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener(PWA_INSTALL_AVAILABLE_EVENT, onInstallAvailable);
      window.removeEventListener(PWA_INSTALL_DONE_EVENT, onInstalled);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [refresh]);

  const iosGuide = { steps: resolveIosInstallSteps() };
  const androidGuide = resolveAndroidInstallSteps(androidBrowser ?? 'chrome', secureContext);

  return {
    platform,
    androidBrowser,
    installed,
    isNativeShell,
    secureContext,
    installReady: installReady && secureContext,
    promptInstall: promptAndroidInstall,
    iosGuide,
    androidGuide,
  };
}
