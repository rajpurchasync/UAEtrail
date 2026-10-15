import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import { Car } from 'lucide-react';
import { buildActivityDetailPageShellCard } from '../../../activity/detail/activityDetailPageShellCard';
import {
  extractActivityTransportReachLines,
  formatActivityAccessibleBySummary,
} from '../../../activity/activityDetailReachBy';
import { resolveActivityMapPeekStrips } from '../../../activity/activityPeekEngagement';
import {
  ActivityPeekLinkedTransport,
  activityPeekHasLinkedTransportAffordance,
} from '../../../explore/ui/peek/activity/ActivityPeekLinkedTransport';
import { ORGANIZE_LINK_RIDESHARE_LABEL } from '../../../explore/createFlowCopy';
import { activityDetailPath } from '../../../config/routingCatalog';
import { navigateToAuthGate } from '../../../utils/authReturnContext';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { DirectionsControl } from '../../ui';

import {
  ACTIVITY_CONSUMER_SECTION_LABEL,
  ACTIVITY_CONSUMER_SECTION_SHELL,
} from './activityDetailConsumerSectionShell';

type ActivityTransportStripProps = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  wireStrips?: ActivityEngagementStripsDTO | null;
  joinUiState: JoinRequestUiState;
  requiresSignIn?: boolean;
  onOfferLinkedRideshare?: () => void;
};

/** Transport from organize capture + linked rideshare (peek parity) + host offer flow. */
export const ActivityTransportStrip = ({
  activity,
  viewerAccess,
  wireStrips,
  joinUiState,
  requiresSignIn = false,
  onOfferLinkedRideshare,
}: ActivityTransportStripProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const card = useMemo(
    () =>
      buildActivityDetailPageShellCard({
        activity,
        viewerAccess,
        wireStrips,
      }),
    [activity, viewerAccess, wireStrips]
  );

  const accessibleBy = formatActivityAccessibleBySummary(activity.requirements);
  const reachLines = extractActivityTransportReachLines(activity.requirements);
  const strips = resolveActivityMapPeekStrips(card, joinUiState);
  const entitlements = viewerAccess?.entitlements;
  const showOfferTransport =
    Boolean(onOfferLinkedRideshare) &&
    (strips.showOfferRideInLogistics ||
      Boolean(entitlements?.canOfferTransport) ||
      Boolean(entitlements?.canAddLinkedRide));
  const hasRideshareAffordance = activityPeekHasLinkedTransportAffordance(card);
  const accessLat =
    activity.startLat ??
    activity.meetingLat ??
    activity.parkingLat ??
    activity.displayLatitude ??
    activity.location?.latitude ??
    null;
  const accessLng =
    activity.startLng ??
    activity.meetingLng ??
    activity.parkingLng ??
    activity.displayLongitude ??
    activity.location?.longitude ??
    null;
  const hasDirections = accessLat != null && accessLng != null;
  const showSection = Boolean(
    accessibleBy ||
      reachLines.length > 0 ||
      hasRideshareAffordance ||
      showOfferTransport ||
      hasDirections
  );

  if (!showSection) return null;

  const onGuestGatedAction = requiresSignIn
    ? () =>
        navigateToAuthGate(navigate, location, {
          returnPath: activityDetailPath(activity.id),
        })
    : undefined;

  const onOpenLinkedActivity = (exploreItemId: string) => {
    const activityId = exploreItemId.startsWith('activity:')
      ? exploreItemId.slice('activity:'.length)
      : exploreItemId;
    navigate(activityDetailPath(activityId));
  };

  return (
    <section id="activity-detail-transport" className={ACTIVITY_CONSUMER_SECTION_SHELL} aria-label="Transport">
      <div className={ACTIVITY_CONSUMER_SECTION_LABEL}>
        <Car className="h-3.5 w-3.5" aria-hidden />
        Transport
      </div>
      <div className="space-y-2">
        {accessibleBy ? (
          <p className="text-sm text-neutral-800">
            <span className="font-semibold text-neutral-900">Accessible by:</span> {accessibleBy}
          </p>
        ) : null}
        {reachLines.length > 0 ? (
          <ul className="space-y-1 text-sm text-neutral-800">
            {reachLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {hasRideshareAffordance ? (
          <ActivityPeekLinkedTransport card={card} onOpenLinkedPin={onOpenLinkedActivity} />
        ) : null}
        {showOfferTransport ? (
          <button
            type="button"
            onClick={onGuestGatedAction ?? onOfferLinkedRideshare}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-sky-900 active:bg-sky-50"
          >
            {ORGANIZE_LINK_RIDESHARE_LABEL}
          </button>
        ) : null}
        {hasDirections ? (
          <DirectionsControl
            lat={accessLat as number}
            lng={accessLng as number}
            variant="link"
            className="text-sm font-semibold text-emerald-800"
            label="Get directions"
            showAppPickerAffordance={false}
            showLeadingIcon
          />
        ) : null}
      </div>
    </section>
  );
};
