import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/** Routes native deep links (App Links / Universal Links) into React Router. */
export const NativeDeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const toAppPath = (url: string): string | null => {
      try {
        const parsed = new URL(url);
        const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        if (path && path !== '/') return path;
      } catch {
        if (url.startsWith('/')) return url;
      }
      return null;
    };

    const handleOpen = (url: string) => {
      const path = toAppPath(url);
      if (path) navigate(path, { replace: false });
    };

    void App.getLaunchUrl().then((result) => {
      if (result?.url) handleOpen(result.url);
    });

    const sub = App.addListener('appUrlOpen', (event) => {
      handleOpen(event.url);
    });

    return () => {
      void sub.then((listener) => listener.remove());
    };
  }, [navigate]);

  return null;
};
