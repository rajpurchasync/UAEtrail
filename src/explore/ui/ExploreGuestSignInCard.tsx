import { Link, useLocation } from 'react-router-dom';
import type { ParticipationMode } from '@uaetrail/shared-types';
import { joinAuthPath } from '../../config/platform';
import { PRODUCT_JOIN_CTA } from '../../content/productNorthStar';
import {
  guestBrowseGateCopy,
  type GuestBrowseGateIntent,
} from '../../content/guestBrowseGateCopy';
import type { GuestJoinSheetIntent } from '../../content/guestJoinCopy';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { AppButtonLink } from '../../components/mobile/AppButton';

type ExploreGuestSignInCardProps = {
  intent: GuestBrowseGateIntent;
  activityTitle?: string;
  joinIntent?: GuestJoinSheetIntent;
  participationMode?: ParticipationMode | null;
  requirements?: string[] | null;
  className?: string;
  compact?: boolean;
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
}: ExploreGuestSignInCardProps) => {
  const location = useLocation();
  const joinHref = joinAuthPath(`${location.pathname}${location.search}`);
  const { href: signInHref } = buildSignInRedirect(location);
  const copy = guestBrowseGateCopy(
    intent,
    intent === 'join-activity'
      ? { intent: joinIntent, participationMode, requirements, activityTitle }
      : undefined
  );

  return (
    <div
      className={`rounded-2xl border border-emerald-100/90 bg-gradient-to-b from-emerald-50/90 to-white px-4 text-center shadow-sm ${
        compact ? 'py-5' : 'py-7'
      } ${className}`}
    >
      <h3 className={`font-bold tracking-tight text-neutral-900 ${compact ? 'text-base' : 'text-lg'}`}>
        {copy.title}
      </h3>
      <p className={`mt-2 leading-relaxed text-neutral-600 ${compact ? 'text-xs' : 'text-sm'}`}>
        {copy.body}
      </p>
      <div className={`space-y-1.5 ${compact ? 'mt-4' : 'mt-5'}`}>
        <AppButtonLink to={joinHref} fullWidth>
          {PRODUCT_JOIN_CTA}
        </AppButtonLink>
        <Link
          to={signInHref}
          className="block py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-700"
        >
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
};
