import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { detectAndroidWebBrowser, resolveAndroidInstallSteps, resolveIosInstallSteps } from '../utils/pwaInstallGuide';
import { detectMobileWebPlatform, isPwaInstalled, type AndroidWebBrowser, type MobileWebPlatform } from '../utils/pwa';

export function usePhoneAppInstall() {
  const [installed, setInstalled] = useState(() => isPwaInstalled());

  const platform: MobileWebPlatform = detectMobileWebPlatform();
  const androidBrowser: AndroidWebBrowser | null =
    platform === 'android' ? detectAndroidWebBrowser() : null;
  const isNativeShell = Capacitor.isNativePlatform();

  const refresh = useCallback(() => {
    setInstalled(isPwaInstalled());
  }, []);

  useEffect(() => {
    refresh();
    const onDisplayModeChange = () => refresh();
    const queries = ['(display-mode: standalone)', '(display-mode: minimal-ui)', '(display-mode: fullscreen)'];
    for (const query of queries) {
      window.matchMedia(query).addEventListener('change', onDisplayModeChange);
    }
    return () => {
      for (const query of queries) {
        window.matchMedia(query).removeEventListener('change', onDisplayModeChange);
      }
    };
  }, [refresh]);

  const iosGuide = { steps: resolveIosInstallSteps() };
  const androidGuide =
    platform === 'android' && androidBrowser
      ? resolveAndroidInstallSteps(androidBrowser)
      : resolveAndroidInstallSteps('chrome');

  return {
    platform,
    androidBrowser,
    installed,
    isNativeShell,
    iosGuide,
    androidGuide,
  };
}
