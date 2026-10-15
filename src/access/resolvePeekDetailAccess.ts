import {
  resolveActivityEngagementMapPeekActionsBase,
  resolveActivityEngagementMapPeekStrips,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import { activityPeekHasMapWireActions } from '../activity/activityPeekEngagement';
import { mapViewerAccessToExplorePeekDetail, type ExplorePeekDetailAccess } from './mapViewerAccessToUi';
import { exploreCardIsSeeking, type ExploreCardModel } from '../explore/exploreCardModel';

export type { ExplorePeekDetailAccess };

export const exploreCardIsHostedPlanPeek = (card: ExploreCardModel): boolean =>
  card.source === 'activity' || exploreCardIsSeeking(card);

const exploreCardIsCommerceCatalogPeek = (card: ExploreCardModel): boolean =>
  card.source === 'shop' || card.source === 'agency';

/** Map peek title/footer — requires API `viewerAccess` on hosted rows; catalog uses wire or public defaults. */
export const resolvePeekDetailAccess = (
  card: ExploreCardModel,
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
    if (card.viewerAccess && exploreCardIsHostedPlanPeek(card)) {
      return mapViewerAccessToExplorePeekDetail(card.viewerAccess, href);
    }
    return { kind: 'link', href };
  }

  if (!exploreCardIsHostedPlanPeek(card)) {
    if (card.viewerAccess) {
      return mapViewerAccessToExplorePeekDetail(card.viewerAccess, href);
    }
    if (options.isGuest && exploreCardIsCommerceCatalogPeek(card)) {
      return { kind: 'guest_gate' };
    }
    return { kind: 'link', href };
  }

  if (!card.viewerAccess) {
    if (options.isGuest && !exploreCardIsHostedPlanPeek(card)) {
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
