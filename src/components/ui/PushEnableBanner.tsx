import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { registerPushNotifications } from '../../utils/push';

const DISMISS_KEY = 'uaetrail:push-enable-dismissed';

const isPushGranted = (): boolean =>
  typeof Notification !== 'undefined' && Notification.permission === 'granted';

interface PushEnableBannerProps {
  context?: 'join' | 'general';
  className?: string;
}

/** Lightweight prompt to enable web push (e.g. after joining a trip). */
export const PushEnableBanner = ({ context = 'general', className = '' }: PushEnableBannerProps) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1' || isPushGranted();
    } catch {
      return isPushGranted();
    }
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (dismissed || typeof Notification === 'undefined') return null;

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
      return;
    }
    setStatus('Could not enable notifications on this device.');
  };

  const copy =
    context === 'join'
      ? 'Turn on notifications so you never miss trip chat, approvals, and reminders.'
      : 'Enable notifications for trip updates and messages.';

  return (
    <div className={`relative rounded-2xl border border-sky-200 bg-sky-50/90 p-4 pr-10 ${className}`}>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-full p-1.5 text-sky-700/70 hover:bg-sky-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="flex items-center gap-2 text-sm font-semibold text-sky-950">
        <Bell className="h-4 w-4 shrink-0" aria-hidden />
        Stay in the loop
      </p>
      <p className="mt-1 text-sm text-sky-900/85">{copy}</p>
      {status && <p className="mt-2 text-xs text-sky-800">{status}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={() => void enable()}
        className="mt-3 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {loading ? 'Enabling…' : 'Enable notifications'}
      </button>
    </div>
  );
};
