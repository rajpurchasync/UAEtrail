import { useState } from 'react';
import { registerPushNotifications } from '../utils/push';

const DISMISS_KEY = 'uaetrail:push-enable-dismissed';

const isPushGranted = (): boolean =>
  typeof Notification !== 'undefined' && Notification.permission === 'granted';

export const usePushEnablePrompt = () => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1' || isPushGranted();
    } catch {
      return isPushGranted();
    }
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const visible = !dismissed && typeof Notification !== 'undefined';

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const enable = async () => {
    setLoading(true);
    setStatus(null);
    const ok = await registerPushNotifications();
    setLoading(false);
    if (ok) {
      setStatus('Notifications enabled.');
      setDismissed(true);
      return true;
    }
    setStatus('Could not enable notifications on this device.');
    return false;
  };

  return { visible, loading, status, dismiss, enable };
};
