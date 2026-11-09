import type { ParticipationMode } from '@uaetrail/shared-types';
import { Link, useLocation } from 'react-router-dom';
import { UserRoundPlus } from 'lucide-react';

import { GUEST_OUTING_SIGN_UP_CTA, PRODUCT_JOIN_CTA } from '../../content/productNorthStar';
import {
  guestBrowseGateCopy,
  type GuestBrowseGateIntent,
} from '../../content/guestBrowseGateCopy';
import type { GuestJoinSheetIntent } from '../../content/guestJoinCopy';
import { buildAuthGateUrls } from '../../utils/authReturnContext';
import { AppButtonLink } from '../../components/mobile/AppButton';

type ExploreGuestSignInCardProps = {
  intent: GuestBrowseGateIntent;
  activityTitle?: string;
  joinIntent?: GuestJoinSheetIntent;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  className?: string;
  compact?: boolean;
  /** Overrides current URL when returning after auth (e.g. activity detail + join resume). */
  authReturnPath?: string;
  authFocusSelector?: string;
  /** Activity detail page — preview framing instead of generic “not signed in”. */
  detailPreview?: boolean;
};

/** Standard gate for guests — map peek, browse list, who's going, join flows. */
export const ExploreGuestSignInCard = ({
  intent,
  activityTitle,
  joinIntent = 'activity',
  participationMode,
  requirements,
  className = '',
  compact = false,
  authReturnPath,
  authFocusSelector,
  detailPreview = false,
}: ExploreGuestSignInCardProps) => {
  const location = useLocation();
  const returnPath = authReturnPath ?? `${location.pathname}${location.search}`;
  const { signInHref, signUpHref } = buildAuthGateUrls(location, {
    returnPath,
    focusSelector: authFocusSelector,
  });
  const copy = guestBrowseGateCopy(
    intent,
    intent === 'join-activity'
      ? {
          intent: joinIntent,
          participationMode,
          requirements,
          activityTitle,
          detailPreview,
        }
      : intent === 'place-detail'
        ? { activityTitle }
        : undefined
  );
  const signUpCtaLabel = intent === 'join-activity' ? GUEST_OUTING_SIGN_UP_CTA : PRODUCT_JOIN_CTA;

  return (
    <div
      className={`rounded-xl border border-neutral-200/90 bg-white px-3.5 py-3 shadow-[0_2px_12px_rgba(15,23,42,.06)] dark:border-neutral-700 dark:bg-neutral-900/90 ${
        compact ? '' : 'sm:px-4 sm:py-3.5'
      } ${className}`}
      role="region"
      aria-labelledby="guest-gate-title"
    >
      <div className={`flex gap-3 ${compact ? 'flex-col' : 'flex-col sm:flex-row sm:items-center sm:justify-between'}`}>
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            aria-hidden
          >
            <UserRoundPlus className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 text-start">
            <p
              id="guest-gate-title"
              className={`font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 ${
                compact ? 'text-sm' : 'text-[15px]'
              }`}
            >
              {copy.title}
            </p>
            <p
              className={`mt-0.5 leading-snug text-neutral-600 dark:text-neutral-300 ${
                compact ? 'line-clamp-3 text-xs' : 'line-clamp-2 text-xs sm:text-[13px]'
              }`}
            >
              {copy.body}
            </p>
          </div>
        </div>
        <div
          className={`flex shrink-0 flex-col gap-1 ${compact ? 'w-full' : 'w-full sm:min-w-[10.5rem] sm:items-stretch'}`}
        >
          <AppButtonLink
            to={signUpHref}
            fullWidth
            className={`ios-btn text-center ${compact ? 'py-2.5 text-sm' : 'py-2.5 text-sm'}`}
          >
            {signUpCtaLabel}
          </AppButtonLink>
          <Link
            to={signInHref}
            className="py-1 text-center text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
