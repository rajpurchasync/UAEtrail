import {
  resolveActivityEngagementMapPeekActionsBase,
  resolveActivityEngagementMapPeekStrips,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import { activityPeekHasMapWireActions } from '../activity/activityPeekEngagement';
import { mapViewerAccessToExplorePeekDetail, type ExplorePeekDetailAccess } from './mapViewerAccessToUi';
import { discoveryCardIsSeeking, type DiscoveryCardModel } from '../discovery/discoveryCardModel';

export type { ExplorePeekDetailAccess };

export const discoveryCardIsHostedPlanPeek = (card: DiscoveryCardModel): boolean =>
  card.source === 'activity' || discoveryCardIsSeeking(card);

const discoveryCardIsCommerceCatalogPeek = (card: DiscoveryCardModel): boolean =>
  card.source === 'shop' || card.source === 'agency';

/** Map peek title/footer — requires API `viewerAccess` on hosted rows; catalog uses wire or public defaults. */
export const resolvePeekDetailAccess = (
  card: DiscoveryCardModel,
  options: {
    isGuest: boolean;
    joinStateLoading?: boolean;
  }
): ExplorePeekDetailAccess | null => {
  const href = card.path?.trim();
  if (!href) return null;

  // Map enrich already resolved gates — do not hide detail / secondary links while join context loads.
  if (options.joinStateLoading && !activityPeekHasMapWireActions(card)) {
    if (card.viewerAccess?.canOpenDetailPage === false) {
      return { kind: 'members_only' };
    }
    if (card.viewerAccess && discoveryCardIsHostedPlanPeek(card)) {
      return mapViewerAccessToExplorePeekDetail(card.viewerAccess, href);
    }
    return { kind: 'link', href };
  }

  if (!discoveryCardIsHostedPlanPeek(card)) {
    if (card.viewerAccess) {
      return mapViewerAccessToExplorePeekDetail(card.viewerAccess, href);
    }
    if (options.isGuest && discoveryCardIsCommerceCatalogPeek(card)) {
      return { kind: 'guest_gate' };
    }
    return { kind: 'link', href };
  }

  if (!card.viewerAccess) {
    if (options.isGuest && !discoveryCardIsHostedPlanPeek(card)) {
      return { kind: 'guest_gate' };
    }
    return { kind: 'link', href };
  }

  return mapViewerAccessToExplorePeekDetail(card.viewerAccess, href);
};

/** Host-owned private plan just published — peek should match API host access until map refetch. */
export const hostPublishedActivityPeekAccess = (
  joinMode: ActivityViewerAccessDTO['joinMode']
): ActivityViewerAccessDTO => ({
  exposure: 'full',
  level: 'host',
  gateReason: null,
  canViewFullActivity: true,
  canOpenDetailPage: true,
  joinMode,
  canAccessCrewSurfaces: true,
  mapPeekActions: resolveActivityEngagementMapPeekActionsBase({
    viewerAccess: {
      exposure: 'full',
      level: 'host',
      gateReason: null,
      canViewFullActivity: true,
      canOpenDetailPage: true,
      joinMode,
      canAccessCrewSurfaces: true,
      mapPeekActions: [],
      entitlements: undefined,
    },
    isHostUser: true,
    activityPublished: true,
    joinMode,
    myParticipation: null,
    myRequest: null,
  }),
  mapPeekStrips: resolveActivityEngagementMapPeekStrips({
    viewerAccess: {
      exposure: 'full',
      level: 'host',
      gateReason: null,
      canViewFullActivity: true,
      canOpenDetailPage: true,
      joinMode,
      canAccessCrewSurfaces: true,
      mapPeekActions: [],
      entitlements: undefined,
    },
    isHostUser: true,
    activityPublished: true,
    joinMode,
    myParticipation: null,
    myRequest: null,
  }),
});
