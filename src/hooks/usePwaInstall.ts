import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { detectMobileWebPlatform, isPwaInstalled } from '../utils/pwa';
import {
  getDeferredPwaInstallPrompt,
  subscribePwaInstallPrompt,
  triggerPwaInstall,
} from '../utils/pwaInstallPrompt';

export function usePwaInstall() {
  const [installed, setInstalled] = useState(() => isPwaInstalled());
  const [canPromptInstall, setCanPromptInstall] = useState(() => getDeferredPwaInstallPrompt() != null);
  const [installing, setInstalling] = useState(false);

  const platform = detectMobileWebPlatform();
  const isNativeShell = Capacitor.isNativePlatform();

  const refresh = useCallback(() => {
    setInstalled(isPwaInstalled());
    setCanPromptInstall(getDeferredPwaInstallPrompt() != null);
  }, []);

  useEffect(() => {
    refresh();
    return subscribePwaInstallPrompt(refresh);
  }, [refresh]);

  useEffect(() => {
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

  const install = useCallback(async () => {
    setInstalling(true);
    try {
      const outcome = await triggerPwaInstall();
      refresh();
      return outcome;
    } finally {
      setInstalling(false);
    }
  }, [refresh]);

  const showInstallOffer =
    !isNativeShell && !installed && (platform === 'android' || platform === 'ios');

  return {
    platform,
    installed,
    canPromptInstall,
    installing,
    install,
    showInstallOffer,
    isNativeShell,
  };
}
