import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { joinAuthPath } from '../../config/platform';
import { hasSeenExploreCoach } from '../../explore/exploreOnboarding';
import { useAuth } from '../../context/AuthContext';

const DISMISS_KEY = 'uaetrail:explore-guest-join-dismissed';

/** Dismissible prompt for guests to sign up before requesting activities. */
export const ExploreGuestJoinBanner = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (user || dismissed || !hasSeenExploreCoach()) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const joinHref = joinAuthPath(`${location.pathname}${location.search}`);

  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-[calc(var(--safe-bottom)+4.75rem)] z-[1100] lg:hidden">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-white/95 px-4 py-3 shadow-lg shadow-emerald-900/10 backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-900">Join to connect and go together</p>
          <p className="mt-0.5 text-[12px] leading-snug text-neutral-500">
            Browse free. Sign up to join outings or post what you&apos;re looking for.
          </p>
          <Link
            to={joinHref}
            className="mt-2 inline-flex min-h-[36px] items-center rounded-xl bg-emerald-600 px-3.5 text-[13px] font-semibold text-white active:bg-emerald-700"
          >
            Join free
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 active:bg-neutral-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
