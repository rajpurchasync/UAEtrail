import type { ReactNode } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import {
  FACILITY_PEEK_FOOTER_UPDATE,
  FACILITY_PEEK_FOOTER_VIEW_DETAILS,
} from '../../../../content/facilityPeekCopy';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { ActivityPeekFooterIcon } from '../activity/ActivityPeekFooterIcon';
import { FACILITY_DETAIL_REPORT_SECTION_ID } from '../../../../facility/facilityDetailAnchors';
import type { PlaceKind } from '@uaetrail/shared-types';

const COMMERCIAL_FACILITY_KINDS = new Set<PlaceKind>([
  'grocery',
  'food',
  'gas_station',
  'outdoor_shop',
]);

const facilitySupportsConditionUpdate = (card: DiscoveryCardModel): boolean =>
  !COMMERCIAL_FACILITY_KINDS.has(card.kind as PlaceKind);

export type FacilityPeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
};

const PeekFooterLinkTile = ({
  to,
  icon,
  label,
  ariaLabel,
  onBeforeNavigate,
}: {
  to: string;
  icon: ReactNode;
  label: ReactNode;
  ariaLabel: string;
  onBeforeNavigate?: () => void;
}) => (
  <Link
    to={to}
    className={EXPLORE_PEEK_CTA.peekTile}
    aria-label={ariaLabel}
    onClick={() => onBeforeNavigate?.()}
  >
    {icon}
    <span className="max-w-full px-0.5">{label}</span>
  </Link>
);

export const FacilityPeekActions = ({
  card,
  onClose,
  onGuestGatedAction,
}: FacilityPeekActionsProps) => {
  const location = useLocation();
  const detailPath = card.path?.trim();
  if (!detailPath) return null;

  const showUpdate = facilitySupportsConditionUpdate(card);
  const updatePath = showUpdate
    ? `${detailPath}#${FACILITY_DETAIL_REPORT_SECTION_ID}`
    : detailPath;

  const viewDetailsLabel = (
    <>
      <ActivityPeekFooterIcon icon={FileText} />
      <span>{FACILITY_PEEK_FOOTER_VIEW_DETAILS}</span>
    </>
  );

  return (
    <div className={`grid gap-1.5 ${showUpdate ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <PeekDetailLink
        card={card}
        label={viewDetailsLabel}
        className={EXPLORE_PEEK_CTA.peekTile}
        onGuestGatedAction={onGuestGatedAction}
        onBeforeNavigate={onClose}
        linkState={mapPeekDetailNavState(location)}
        ariaLabel={FACILITY_PEEK_FOOTER_VIEW_DETAILS}
      />
      {showUpdate ? (
        <PeekFooterLinkTile
          to={updatePath}
          icon={<ActivityPeekFooterIcon icon={RefreshCw} />}
          label={FACILITY_PEEK_FOOTER_UPDATE}
          ariaLabel={FACILITY_PEEK_FOOTER_UPDATE}
          onBeforeNavigate={onClose}
        />
      ) : null}
    </div>
  );
};
