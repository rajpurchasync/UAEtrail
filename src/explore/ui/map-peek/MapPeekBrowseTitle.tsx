import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { EXPLORE_TYPE } from '../../../config/exploreTheme';
import { browseCardTitle } from '../../../list/browse/browseCardMeta';
import type { ExplorePeekDetailAccess } from '../../../access/resolvePeekDetailAccess';
import type { MapPeekDetailNavState } from '../../mapPeekDetailNavState';
import { PeekDetailLink } from './PeekDetailLink';

export type MapPeekBrowseTitleProps = {
  card: DiscoveryCardModel;
  detailAccess: ExplorePeekDetailAccess | null;
  onGuestGatedDetail?: () => void;
  onBeforeDetailNavigate?: () => void;
  detailLinkState?: MapPeekDetailNavState;
  joinStateLoading?: boolean;
  compact?: boolean;
};

/** Map peek title — outing/place name (same as list thumbnail), not social headline. */
export const MapPeekBrowseTitle = ({
  card,
  detailAccess,
  onGuestGatedDetail,
  onBeforeDetailNavigate,
  detailLinkState,
  joinStateLoading = false,
  compact = true,
}: MapPeekBrowseTitleProps) => {
  const title = browseCardTitle(card);
  const textClass = compact
    ? `line-clamp-2 text-[14px] font-bold leading-normal ${EXPLORE_TYPE.title}`
    : `line-clamp-2 text-base font-bold leading-snug ${EXPLORE_TYPE.title}`;

  if (detailAccess?.kind === 'link') {
    return (
      <PeekDetailLink
        card={card}
        label={title}
        className={`block text-left hover:underline decoration-neutral-400/60 underline-offset-2 ${textClass}`}
        hrefOverride={detailAccess.href}
        joinStateLoading={joinStateLoading}
        onGuestGatedAction={onGuestGatedDetail}
        onBeforeNavigate={onBeforeDetailNavigate}
        linkState={detailLinkState}
      />
    );
  }

  if (detailAccess?.kind === 'guest_gate' && onGuestGatedDetail) {
    return (
      <button type="button" onClick={onGuestGatedDetail} className={`text-left ${textClass}`}>
        {title}
      </button>
    );
  }

  if (detailAccess?.kind === 'profile_gate' || detailAccess?.kind === 'upgrade_gate') {
    return (
      <PeekDetailLink
        card={card}
        label={title}
        className={`block text-left hover:underline decoration-neutral-400/60 underline-offset-2 ${textClass}`}
        joinStateLoading={joinStateLoading}
        onGuestGatedAction={onGuestGatedDetail}
        onBeforeNavigate={onBeforeDetailNavigate}
        linkState={detailLinkState}
      />
    );
  }

  return <h2 className={textClass}>{title}</h2>;
};
