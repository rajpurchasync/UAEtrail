import type {
  ActivityViewerAccessDTO,
  ExploreActivityMode,
  ExploreDestinationLensStatsDTO,
  DiscoveryCardKind,
  DiscoveryCardSource,
  ExploreLinkedRideshareDTO,
  ExploreMapItemDTO,
  ExploreMapPersonDTO,
  ExploreMapComposeIntent,
  OutingCategory,
  ParticipantPreviewDTO,
  CatalogProfileExposure,
} from '@uaetrail/shared-types';
import {
  activityJoinIsFull,
  buildDiscoveryCardPresentation,
  canonicalizeMapComposeIntent,
  exploreMapItemIsAvailabilityCatalog,
  exploreMapItemIsRetiredSeekingActivity,
  isGeographyMapSource,
  isPeekOnlyCatalogProfile,
  memberProfilePath,
  placeDetailPathForId,
  resolveActivityPublisherProfilePath,
  resolveExploreFeaturedPerson,
} from '@uaetrail/shared-types';
import { groupRegionTextAtBrowseFilterLevel } from '../config/groupRegionFilter';
import {
  buildExploreRouteLabel,
  buildExploreWhenSegment,
  type DiscoveryCardSections,
} from '../explore/exploreCopy';
import { resolveExplorePrice, type ExplorePriceInfo } from '../explore/explorePriceLabel';
import { enrichExploreActivityRequirementBadges } from '../explore/exploreRequirementBadges';
import { exploreMapItemSharePath } from '../explore/routing';
import { resolveExploreCoverImage } from '../explore/exploreCoverImage';

export type { DiscoveryCardKind, DiscoveryCardSource } from '@uaetrail/shared-types';

export type DiscoveryCardTone = DiscoveryCardKind;

/** Discovery projection for map pins, list rows, and peek chrome. */
export interface DiscoveryCardModel {
  id: string;
  path: string;
  source: DiscoveryCardSource;
  kind: DiscoveryCardKind;
  tone: DiscoveryCardTone;
  emoji: string;
  headline: string;
  listTitle: string;
  listHost: string | null;
  subtitle: string | null;
  price: ExplorePriceInfo | null;
  spotsLabel: string | null;
  venueHint: string | null;
  showJoinHint: boolean;
  primaryCta: string;
  secondaryCta: string | null;
  showJoinActions: boolean;
  websiteUrl?: string | null;
  contactPhone?: string | null;
  shareTitle: string;
  /** Map peek deep link (`/explore?pin=…`) — safe to share as a guest. */
  sharePath: string;
  shareText?: string | null;
  requesterUserId?: string | null;
  routeLabel?: string | null;
  whenLabel?: string | null;
  /** Outing day `YYYY-MM-DD`, when the plan has one. */
  scheduleDate?: string | null;
  sections: DiscoveryCardSections;
  hostAvatar?: string | null;
  participantPreviews?: ParticipantPreviewDTO[];
  activity?: ExploreMapItemDTO['activity'];
  coverImage?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  reviewPath?: string | null;
  catalogProfileExposure?: CatalogProfileExposure | null;
  locationId?: string | null;
  /** Place catalog type when known (`locationCard.activityType`) — not the outing type. */
  locationActivityType?: 'hiking' | 'camping' | 'event' | null;
  activityId?: string | null;
  outingCategory?: OutingCategory | null;
  composeIntent?: ExploreMapComposeIntent | null;
  merchantId?: string | null;
  tenantId?: string | null;
  profileUserId?: string | null;
  featuredPerson?: ExploreMapPersonDTO | null;
  childFriendly?: boolean;
  difficulty?: 'easy' | 'moderate' | 'hard' | null;
  surfaceTypes?: string[];
  /** Trail/camp catalog — emirate or area label for list venue posters. */
  venueRegion?: string | null;
  venueAccessibility?: 'car-accessible' | 'remote' | null;
  venueHasParking?: boolean;
  venueDistanceKm?: number | null;
  venueElevationM?: number | null;
  venueDurationHours?: number | null;
  venueCampingType?: 'self-guided' | 'operator-led' | null;
  venueMaxGroupSize?: number | null;
  /** Linked place facility chips (toilet, …) — not a full amenity directory on activity cards. */
  venueAmenityLabels?: string[];
  requirementBadges?: string[];
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  linkedRideshares?: ExploreLinkedRideshareDTO[];
  /** Guest from `GET /explore/map`; signed-in from `GET /me/discover/overlay`. */
  viewerAccess?: ActivityViewerAccessDTO | null;
  activityMode?: ExploreActivityMode | null;
  destinationId?: string | null;
  destinationSlug?: string | null;
  /** Curated destination display name when `destinationId` is set. */
  destinationName?: string | null;
  /** Catalog place-hub bucket (`locations.placeHubLabel`). */
  placeHubLabel?: string | null;
  /** Curated Area guide name when `destinationId` is set. */
  destinationLensStats?: ExploreDestinationLensStatsDTO | null;
  /** Hosted outings at this venue — list venue posters (`buildListFeedCards`). */
  venueUpcomingOutingCount?: number;
  venueNextOutingIso?: string | null;
  venueNextOutingPath?: string | null;
  venueNextOutingExploreItemId?: string | null;
  /** Denormalised geo tree — map/list filters and L2 location links. */
  geoRef?: import('@uaetrail/shared-types').GeoRef | null;
}

const resolveCoverImage = (item: ExploreMapItemDTO): string | null =>
  resolveExploreCoverImage(
    item.locationCard?.images?.[0],
    item.image,
    item.activity?.bannerUrl,
    item.activity?.images?.[0]
  );

const LIST_META_ICONS = new Set(['location', 'time', 'spots']);
/** Fixed Find crew pin (`source: availability`) — not legacy `activityMode: seeking` activities. */
export const discoveryCardIsAvailabilityPin = (card: Pick<DiscoveryCardModel, 'source'>): boolean =>
  card.source === 'availability';

/** Map/list peek uses `resolveActivityPeekEngagement` (hosted + M0 seeking). */
export const discoveryCardUsesActivityPeekEngagement = (
  card: Pick<DiscoveryCardModel, 'source'>
): boolean => card.source === 'activity';

/** Compact second line for list rows (where · when · spots — not duplicate activity title). */
export const buildDiscoveryListMeta = (card: DiscoveryCardModel): string | null => {
  if (card.source === 'shop' || card.source === 'agency' || isGeographyMapSource(card.source)) {
    return null;
  }
  const allowRoute = discoveryCardIsAvailabilityPin(card) || card.kind === 'rideshare';
  const labels = card.sections.details
    .filter(
      (detail) =>
        LIST_META_ICONS.has(detail.icon) ||
        (allowRoute && detail.icon === 'route' && detail.label !== 'Rideshare available')
    )
    .map((detail) => detail.label)
    .filter(Boolean);
  if (labels.length > 0) return labels.join(' · ');
  return null;
};

export const buildDiscoveryCardModel = (item: ExploreMapItemDTO): DiscoveryCardModel => {
  const presentation = item.date
    ? buildDiscoveryCardPresentation(item)
    : (item.presentation ?? buildDiscoveryCardPresentation(item));
  const kind = presentation.kind;
  const source = presentation.source;
  const featuredPerson = item.featuredPerson ?? presentation.featuredPerson ?? resolveExploreFeaturedPerson(item);
  const isRideshare = kind === 'rideshare';
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;
  const routeLabel = presentation.routeLabel ?? buildExploreRouteLabel(fromLabel, toLabel, kind);
  const retiredSeekingActivity = exploreMapItemIsRetiredSeekingActivity(item);
  const availability = exploreMapItemIsAvailabilityCatalog(item);
  const whenSuffix = kind === 'rideshare' || availability ? 'fixed' : null;
  const whenLabel =
    presentation.whenLabel ??
    buildExploreWhenSegment(
      item.date,
      item.time ?? activity?.time ?? null,
      whenSuffix,
      item.endDate ?? activity?.endDate ?? null,
      item.endTime ?? activity?.endTime ?? null
    );

  const headline = presentation.headline;
  const sections = presentation.sections;
  const subtitle = presentation.subtitle;

  const price =
    source === 'activity'
      ? resolveExplorePrice({
          isRideshare,
          price: activity?.price ?? null,
          rideshareFree: activity?.rideshareFree ?? null,
          ridesharePriceAed: activity?.ridesharePriceAed ?? null,
          priceLabel: item.priceLabel ?? null,
          priceDisplay: item.priceDisplay ?? null,
        })
      : null;

  const catalogSource = isGeographyMapSource(source) || source === 'shop' || source === 'agency';

  return {
    id: item.id,
    path: item.path,
    source,
    kind,
    tone: isRideshare ? 'rideshare' : kind,
    emoji: presentation.emoji,
    headline,
    listTitle: presentation.listTitle,
    listHost: presentation.listHost,
    subtitle,
    price,
    spotsLabel: presentation.spotsLabel,
    venueHint: presentation.venueHint,
    showJoinHint: false,
    primaryCta: presentation.primaryCta,
    secondaryCta: presentation.secondaryCta,
    showJoinActions:
      !availability &&
      !retiredSeekingActivity &&
      source === 'activity' &&
      Boolean(activity),
    websiteUrl: item.websiteUrl ?? null,
    contactPhone: item.contactPhone ?? null,
    shareTitle: headline,
    sharePath:
      activity?.joinMode === 'private' && activity.id
        ? `/activity/${activity.id}`
        : exploreMapItemSharePath(item.id),
    shareText: presentation.shareText,
    requesterUserId: featuredPerson?.userId ?? null,
    routeLabel,
    whenLabel,
    scheduleDate: item.date?.trim().slice(0, 10) || activity?.date?.trim().slice(0, 10) || null,
    sections,
    hostAvatar: featuredPerson?.avatarUrl ?? null,
    participantPreviews: item.participantPreviews,
    activity,
    coverImage: resolveCoverImage(item),
    averageRating: item.averageRating ?? null,
    reviewCount: item.reviewCount ?? 0,
    reviewPath:
      catalogSource && !isPeekOnlyCatalogProfile(item.catalogProfileExposure)
        ? `${item.path}#reviews`
        : null,
    catalogProfileExposure: item.catalogProfileExposure ?? null,
    locationId: item.locationCard?.id ?? item.activity?.locationId ?? null,
    locationActivityType: item.locationCard?.activityType ?? null,
    activityId: item.activity?.id ?? null,
    outingCategory: item.outingCategory ?? null,
    composeIntent: canonicalizeMapComposeIntent(item.composeIntent) ?? null,
    merchantId: item.merchantId ?? null,
    tenantId: item.tenantId ?? item.activity?.tenantId ?? null,
    profileUserId: featuredPerson?.userId ?? item.activity?.hostUserId ?? null,
    featuredPerson,
    childFriendly: item.locationCard?.childFriendly ?? false,
    difficulty: item.locationCard?.difficulty ?? null,
    surfaceTypes: item.locationCard?.surfaceType ?? [],
    venueRegion:
      groupRegionTextAtBrowseFilterLevel(item.groupRegionLevels) ??
      groupRegionTextAtBrowseFilterLevel(item.locationCard?.groupRegionLevels) ??
      groupRegionTextAtBrowseFilterLevel(item.activity?.groupRegionLevels) ??
      item.locationCard?.region ??
      item.activity?.region ??
      null,
    venueAccessibility: item.locationCard?.accessibility ?? null,
    venueHasParking: Boolean(
      item.locationCard?.parkingPoint?.trim() ||
        (item.locationCard?.parkingLat != null && item.locationCard?.parkingLng != null)
    ),
    venueDistanceKm: item.locationCard?.distance ?? null,
    venueElevationM: item.locationCard?.elevation ?? null,
    venueDurationHours: item.locationCard?.duration ?? null,
    venueCampingType: item.locationCard?.campingType ?? null,
    venueMaxGroupSize: item.locationCard?.maxGroupSize ?? null,
    venueAmenityLabels: item.locationCard?.amenityLabels?.length
      ? [...new Set(item.locationCard.amenityLabels.map((l) => l.trim()).filter(Boolean))]
      : undefined,
    requirementBadges: [
      ...(availability ? ['Available'] : []),
      ...enrichExploreActivityRequirementBadges(activity?.requirements, {
        kind: kind === 'destination' ? 'event' : kind,
        rideshareEnabled: Boolean(
          source === 'activity' &&
            kind !== 'rideshare' &&
            (item.rideshareEnabled ??
              activity?.rideshareEnabled ??
              (item.linkedRideshareActivities?.length ?? 0) > 0)
        ),
        venueDifficulty: item.locationCard?.difficulty ?? null,
        childFriendly: Boolean(item.locationCard?.childFriendly),
      }),
    ],
    mapLatitude:
      item.latitude ?? activity?.displayLatitude ?? activity?.locationLatitude ?? null,
    mapLongitude:
      item.longitude ?? activity?.displayLongitude ?? activity?.locationLongitude ?? null,
    destinationId: item.destinationId ?? null,
    destinationSlug: item.destinationSlug ?? null,
    destinationName: item.destinationName ?? null,
    placeHubLabel: item.placeHubLabel ?? null,
    destinationLensStats: item.destinationLensStats ?? null,
    geoRef: item.geoRef ?? item.activity?.geoRef ?? null,
    linkedRideshares:
      item.linkedRideshareActivities && item.linkedRideshareActivities.length > 0
        ? item.linkedRideshareActivities
        : undefined,
    viewerAccess: item.viewerAccess ?? null,
    activityMode:
      item.activityMode ?? (source === 'activity' && !retiredSeekingActivity ? 'hosted' : null),
  };
};

export const discoveryCardToneClass: Record<DiscoveryCardTone, string> = {
  hiking: 'bg-emerald-50 text-emerald-900',
  camping: 'bg-amber-50 text-amber-900',
  event: 'bg-violet-50 text-violet-900',
  shop: 'bg-rose-50 text-rose-900',
  agency: 'bg-indigo-50 text-indigo-900',
  rideshare: 'bg-sky-50 text-sky-900',
  destination: 'bg-slate-50 text-slate-900',
};

export const discoveryCardToneTextClass: Record<DiscoveryCardTone, string> = {
  hiking: 'text-emerald-800',
  camping: 'text-amber-800',
  event: 'text-violet-800',
  shop: 'text-rose-800',
  agency: 'text-indigo-800',
  rideshare: 'text-sky-800',
  destination: 'text-slate-800',
};

export const discoveryCardHasMapCoords = (card: DiscoveryCardModel): boolean =>
  card.mapLatitude != null && card.mapLongitude != null;

const discoveryCardHostUserId = (card: DiscoveryCardModel): string | null =>
  card.activity?.hostUserId ??
  card.featuredPerson?.userId ??
  card.requesterUserId ??
  card.profileUserId ??
  null;

/** Consumer detail for the venue/spot line on poster banners (trail, camp, activity, shop). */
export const resolveDiscoveryCardLocationDetailPath = (card: DiscoveryCardModel): string => {
  if (isGeographyMapSource(card.source)) return card.path;
  if (card.source === 'activity' && card.locationId) {
    // Never use the outing type — an event hosted at a camp must not open `/venue/{campId}`.
    return placeDetailPathForId(card.locationId, card.locationActivityType);
  }
  return card.path;
};

/** Profile href for the host / requester row on explore cards and map peek. */
export const resolveDiscoveryCardHostProfilePath = (card: DiscoveryCardModel): string | null => {
  if (card.source === 'activity' && card.activity) {
    return resolveActivityPublisherProfilePath({
      publishingProfileKind: card.activity.publishingProfileKind ?? 'community',
      tenantSlug: card.activity.tenantSlug,
      hostUserId: discoveryCardHostUserId(card),
    });
  }
  return memberProfilePath(card.featuredPerson?.userId ?? card.requesterUserId);
};

/** Activity peek — signed-in members may open host profile; guests sign up first. */
export const discoveryCardCanOpenHostProfile = (
  card: DiscoveryCardModel,
  options: { isGuest: boolean }
): boolean => {
  if (card.source === 'activity') return !options.isGuest;
  if (!card.viewerAccess?.entitlements) return true;
  return card.viewerAccess.entitlements.canViewHostProfileBeforeJoin;
};

/** Scheduled activities — no directions on map peek (venues/shops keep them). */
export const discoveryCardPeekShowsDirections = (card: DiscoveryCardModel): boolean =>
  card.source !== 'activity';

/** Activity peek — no place/operator follow (venues and shops keep follow). */
export const discoveryCardPeekShowsFollow = (card: DiscoveryCardModel): boolean =>
  card.source !== 'activity';

/** Hosted activity with a capacity cap and no open spots left. */
export const discoveryCardActivityJoinIsFull = (card: DiscoveryCardModel): boolean =>
  activityJoinIsFull({
    slotsTotal: card.activity?.slotsTotal,
    slotsAvailable: card.activity?.slotsAvailable,
  });

export const discoveryCardActivityShowsPeekSpots = (card: DiscoveryCardModel): boolean =>
  (card.activity?.slotsTotal ?? 0) > 0 && Boolean(card.sections.partyLabel);

/** Peek body already shows “Get Directions” on the location row. */
export const discoveryCardShowsInlineDirections = (card: DiscoveryCardModel): boolean =>
  discoveryCardPeekShowsDirections(card) &&
  discoveryCardHasMapCoords(card) &&
  card.sections.details.some((detail) => detail.icon === 'location');

/** Peek action row already includes directions (join activities, shops with review CTAs). */
export const discoveryCardPeekActionsHasDirections = (card: DiscoveryCardModel): boolean => {
  if (!discoveryCardHasMapCoords(card) || discoveryCardShowsInlineDirections(card)) return false;
  if (isGeographyMapSource(card.source)) return true;
  if (card.showJoinActions && card.source !== 'activity') return true;
  if (card.source === 'shop' && card.reviewPath) return true;
  return false;
};

/** Extra directions row in peek body — only when not inline and not in peek actions. */
export const discoveryCardShowPeekBodyDirections = (card: DiscoveryCardModel): boolean =>
  discoveryCardPeekShowsDirections(card) &&
  discoveryCardHasMapCoords(card) &&
  !discoveryCardShowsInlineDirections(card) &&
  !discoveryCardPeekActionsHasDirections(card);

export type ExploreEntityFollowPayload = {
  locationId?: string;
  tenantId?: string;
  merchantId?: string;
};

/** Resolve place / host team / shop follow target for this explore card. */
export const resolveExploreEntityFollowTarget = (
  card: DiscoveryCardModel
): ExploreEntityFollowPayload | null => {
  if (discoveryCardIsAvailabilityPin(card)) return null;
  if (isGeographyMapSource(card.source) && card.locationId) return { locationId: card.locationId };
  if (card.source === 'activity') {
    if (card.locationId) return { locationId: card.locationId };
    if (card.tenantId) return { tenantId: card.tenantId };
    return null;
  }
  if (card.source === 'shop' || card.source === 'agency') {
    if (card.merchantId) return { merchantId: card.merchantId };
    if (card.tenantId) return { tenantId: card.tenantId };
  }
  return null;
};

export type ExploreWishlistTarget = {
  locationId?: string;
  destinationId?: string;
  activityId?: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
};

const outingCategoryFromCardKind = (card: DiscoveryCardModel): OutingCategory | null => {
  if (card.outingCategory) return card.outingCategory;
  if (card.kind === 'rideshare') return 'rideshare';
  if (card.kind === 'hiking' || card.kind === 'camping') return card.kind;
  if (card.kind === 'event') return 'events';
  return null;
};

const watchMetaFromCard = (card: DiscoveryCardModel) => ({
  alertOnMatch: true,
  watchOutingCategory: outingCategoryFromCardKind(card),
  watchLatitude: card.mapLatitude ?? null,
  watchLongitude: card.mapLongitude ?? null,
});

/** Wishlist = private venue, area, or activity save — not demand, shops, or people (use Follow). */
export const resolveExploreWishlistTarget = (card: DiscoveryCardModel): ExploreWishlistTarget | null => {
  const watch = watchMetaFromCard(card);
  if (discoveryCardIsAvailabilityPin(card)) return null;
  if (card.source === 'activity' && card.activityId) return { activityId: card.activityId, ...watch };
  if (card.kind === 'destination' && card.destinationId) return { destinationId: card.destinationId, ...watch };
  if (isGeographyMapSource(card.source) && card.locationId) return { locationId: card.locationId, ...watch };
  return null;
};
