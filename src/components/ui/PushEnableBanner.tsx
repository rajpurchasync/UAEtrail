import { Bell, X } from 'lucide-react';
import { usePushEnablePrompt } from '../../hooks/usePushEnablePrompt';

interface PushEnableBannerProps {
  context?: 'join' | 'general';
  className?: string;
}

/** In-page card for notifications — use {@link ActivityDetailMobileFooter} on mobile sticky chrome. */
export const PushEnableBanner = ({ context = 'general', className = '' }: PushEnableBannerProps) => {
  const { visible, loading, status, dismiss, enable } = usePushEnablePrompt();

  if (!visible) return null;

  const copy =
    context === 'join'
      ? 'Turn on notifications so you never miss activity chat, approvals, and reminders.'
      : 'Enable notifications for activity updates and messages.';

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
