import type {
  ActivityViewerAccessDTO,
  ExploreActivityMode,
  ExploreAreaLensStatsDTO,
  ExploreCardKind,
  ExploreCardSource,
  ExploreLinkedRideshareDTO,
  ExploreMapItemDTO,
  ExploreMapPersonDTO,
  ExplorePlanComposeIntent,
  OutingCategory,
  ParticipantPreviewDTO,
  CatalogProfileExposure,
} from '@uaetrail/shared-types';
import {
  buildExploreCardPresentation,
  exploreMapItemIsSeeking,
  isPeekOnlyCatalogProfile,
  memberProfilePath,
  resolveActivityPublisherProfilePath,
  resolveExploreFeaturedPerson,
} from '@uaetrail/shared-types';
import { groupRegionTextAtBrowseFilterLevel } from '../config/groupRegionFilter';
import {
  buildExploreRouteLabel,
  buildExploreWhenSegment,
  type ExploreCardSections,
} from '../explore/exploreCopy';
import { resolveExplorePrice, type ExplorePriceInfo } from '../explore/explorePriceLabel';
import { enrichExploreActivityRequirementBadges } from '../explore/exploreRequirementBadges';
import { exploreMapItemSharePath } from '../explore/routing';
import { resolveExploreCoverImage } from '../explore/exploreCoverImage';

export type { ExploreCardKind, ExploreCardSource } from '@uaetrail/shared-types';

export type ExploreCardTone = ExploreCardKind;

/** Discovery projection for map pins, list rows, and peek chrome. */
export interface DiscoveryCardModel {
  id: string;
  path: string;
  source: ExploreCardSource;
  kind: ExploreCardKind;
  tone: ExploreCardTone;
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
  sections: ExploreCardSections;
  hostAvatar?: string | null;
  participantPreviews?: ParticipantPreviewDTO[];
  activity?: ExploreMapItemDTO['activity'];
  coverImage?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  reviewPath?: string | null;
  catalogProfileExposure?: CatalogProfileExposure | null;
  locationId?: string | null;
  activityId?: string | null;
  participantIntentId?: string | null;
  outingCategory?: OutingCategory | null;
  composeIntent?: ExplorePlanComposeIntent | null;
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
  requirementBadges?: string[];
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  linkedRideshares?: ExploreLinkedRideshareDTO[];
  /** From `GET /explore/map` for activity/demand rows (per viewer). */
  viewerAccess?: ActivityViewerAccessDTO | null;
  activityMode?: ExploreActivityMode | null;
  areaId?: string | null;
  areaSlug?: string | null;
  areaName?: string | null;
  areaLensStats?: ExploreAreaLensStatsDTO | null;
}

/** @deprecated Prefer {@link DiscoveryCardModel}. */
export type ExploreCardModel = DiscoveryCardModel;

const resolveCoverImage = (item: ExploreMapItemDTO): string | null =>
  resolveExploreCoverImage(
    item.locationCard?.images?.[0],
    item.image,
    item.activity?.bannerUrl,
    item.activity?.images?.[0]
  );

const LIST_META_ICONS = new Set(['location', 'time', 'spots']);
/** Seeking pins — same rules as `exploreMapItemIsSeeking` on map wire. */
export const discoveryCardIsSeeking = (
  card: Pick<
    DiscoveryCardModel,
    'source' | 'composeIntent' | 'participantIntentId' | 'id' | 'activityMode'
  >
): boolean => exploreMapItemIsSeeking(card);

/** @deprecated Use {@link discoveryCardIsSeeking}. */
export const exploreCardIsSeeking = discoveryCardIsSeeking;

/** Map/list peek uses `resolveActivityPeekEngagement` (hosted + M0 seeking). */
export const discoveryCardUsesActivityPeekEngagement = (
  card: Pick<DiscoveryCardModel, 'source'>
): boolean => card.source === 'activity';

/** Compact second line for list rows (where · when · spots — not duplicate activity title). */
export const buildDiscoveryListMeta = (card: DiscoveryCardModel): string | null => {
  if (card.source === 'shop' || card.source === 'agency' || card.source === 'venue') {
    return null;
  }
  const allowRoute = discoveryCardIsSeeking(card) || card.kind === 'rideshare';
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

/** @deprecated Use {@link buildDiscoveryListMeta}. */
export const buildExploreListMeta = buildDiscoveryListMeta;

export const buildDiscoveryCardModel = (item: ExploreMapItemDTO): DiscoveryCardModel => {
  const presentation = item.presentation ?? buildExploreCardPresentation(item);
  const kind = presentation.kind;
  const source = exploreMapItemIsSeeking(item) ? 'activity' : presentation.source;
  const featuredPerson = item.featuredPerson ?? presentation.featuredPerson ?? resolveExploreFeaturedPerson(item);
  const isRideshare = kind === 'rideshare';
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;
  const routeLabel = presentation.routeLabel ?? buildExploreRouteLabel(fromLabel, toLabel, kind);
  const seeking = exploreMapItemIsSeeking(item);
  const whenSuffix = seeking ? 'flexible' : kind === 'rideshare' ? 'fixed' : null;
  const whenLabel =
    presentation.whenLabel ??
    buildExploreWhenSegment(item.date, item.time ?? activity?.time ?? null, whenSuffix);

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

  const catalogSource = source === 'venue' || source === 'shop' || source === 'agency';

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
      (source === 'activity' && Boolean(activity)) ||
      (seeking && Boolean(item.requesterUserId)),
    websiteUrl: item.websiteUrl ?? null,
    contactPhone: item.contactPhone ?? null,
    shareTitle: headline,
    sharePath:
      activity?.joinMode === 'private' && activity.id
        ? `/activity/${activity.id}`
        : exploreMapItemSharePath(item.id, {
            activityId: seeking ? activity?.id : undefined,
            intentId: seeking ? item.participantIntentId ?? undefined : undefined,
          }),
    shareText: presentation.shareText,
    requesterUserId: featuredPerson?.userId ?? item.requesterUserId ?? null,
    routeLabel,
    whenLabel,
    sections,
    hostAvatar: featuredPerson?.avatarUrl ?? item.hostAvatar ?? null,
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
    activityId: item.activity?.id ?? null,
    /** Manage/deeplink only for legacy seeking rows without a published activity id. */
    participantIntentId:
      seeking && !activity?.id ? item.participantIntentId ?? null : null,
    outingCategory: item.outingCategory ?? null,
    composeIntent: item.composeIntent ?? null,
    merchantId: item.merchantId ?? null,
    tenantId: item.tenantId ?? item.activity?.tenantId ?? null,
    profileUserId: featuredPerson?.userId ?? item.requesterUserId ?? item.activity?.hostUserId ?? null,
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
    requirementBadges: [
      ...(exploreMapItemIsSeeking(item) ? ['Seeking'] : []),
      ...enrichExploreActivityRequirementBadges(activity?.requirements, {
        kind: kind === 'area' ? 'event' : kind,
        rideshareEnabled: Boolean(
          source === 'activity' &&
            kind !== 'rideshare' &&
            (item.rideshareEnabled ??
              activity?.rideshareEnabled ??
              (item.linkedRideshareActivities?.length ?? 0) > 0)
        ),
        venueDifficulty: item.locationCard?.difficulty ?? null,
      }),
    ],
    mapLatitude:
      item.latitude ?? activity?.displayLatitude ?? activity?.locationLatitude ?? null,
    mapLongitude:
      item.longitude ?? activity?.displayLongitude ?? activity?.locationLongitude ?? null,
    areaId: item.areaId ?? null,
    areaSlug: item.areaSlug ?? null,
    areaName: item.areaName ?? null,
    areaLensStats: item.areaLensStats ?? null,
    linkedRideshares:
      item.linkedRideshareActivities && item.linkedRideshareActivities.length > 0
        ? item.linkedRideshareActivities
        : undefined,
    viewerAccess: item.viewerAccess ?? null,
    activityMode: item.activityMode ?? (seeking ? 'seeking' : source === 'activity' ? 'hosted' : null),
  };
};

/** @deprecated Use {@link buildDiscoveryCardModel}. */
export const buildExploreCardModel = buildDiscoveryCardModel;

export const discoveryCardToneClass: Record<ExploreCardTone, string> = {
  hiking: 'bg-emerald-50 text-emerald-900',
  camping: 'bg-amber-50 text-amber-900',
  event: 'bg-violet-50 text-violet-900',
  shop: 'bg-rose-50 text-rose-900',
  agency: 'bg-indigo-50 text-indigo-900',
  rideshare: 'bg-sky-50 text-sky-900',
  area: 'bg-slate-50 text-slate-900',
};

/** @deprecated Use {@link discoveryCardToneClass}. */
export const exploreCardToneClass = discoveryCardToneClass;

export const discoveryCardToneTextClass: Record<ExploreCardTone, string> = {
  hiking: 'text-emerald-800',
  camping: 'text-amber-800',
  event: 'text-violet-800',
  shop: 'text-rose-800',
  agency: 'text-indigo-800',
  rideshare: 'text-sky-800',
  area: 'text-slate-800',
};

/** @deprecated Use {@link discoveryCardToneTextClass}. */
export const exploreCardToneTextClass = discoveryCardToneTextClass;

export const discoveryCardHasMapCoords = (card: DiscoveryCardModel): boolean =>
  card.mapLatitude != null && card.mapLongitude != null;

/** @deprecated Use {@link discoveryCardHasMapCoords}. */
export const exploreCardHasMapCoords = discoveryCardHasMapCoords;

const discoveryCardHostUserId = (card: DiscoveryCardModel): string | null =>
  card.activity?.hostUserId ??
  card.featuredPerson?.userId ??
  card.requesterUserId ??
  card.profileUserId ??
  null;

/** Profile href for the host / requester row on explore cards and map peek. */
export const resolveExploreCardHostProfilePath = (card: ExploreCardModel): string | null => {
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
export const exploreCardCanOpenHostProfile = (
  card: ExploreCardModel,
  options: { isGuest: boolean }
): boolean => {
  if (card.source === 'activity') return !options.isGuest;
  if (!card.viewerAccess?.entitlements) return true;
  return card.viewerAccess.entitlements.canViewHostProfileBeforeJoin;
};

/** Scheduled activities — no directions on map peek (venues/shops keep them). */
export const exploreCardPeekShowsDirections = (card: ExploreCardModel): boolean =>
  card.source !== 'activity';

/** Activity peek — no place/operator follow (venues and shops keep follow). */
export const exploreCardPeekShowsFollow = (card: ExploreCardModel): boolean =>
  card.source !== 'activity';

/** Hosted activity with a capacity cap and no open spots left. */
export const exploreCardActivityJoinIsFull = (card: ExploreCardModel): boolean => {
  const total = card.activity?.slotsTotal ?? 0;
  if (total <= 0) return false;
  const available = card.activity?.slotsAvailable;
  if (available == null) return false;
  return available <= 0;
};

export const exploreCardActivityShowsPeekSpots = (card: ExploreCardModel): boolean =>
  (card.activity?.slotsTotal ?? 0) > 0 && Boolean(card.sections.partyLabel);

/** Peek body already shows “Get Directions” on the location row. */
export const exploreCardShowsInlineDirections = (card: ExploreCardModel): boolean =>
  exploreCardPeekShowsDirections(card) &&
  exploreCardHasMapCoords(card) &&
  card.sections.details.some((detail) => detail.icon === 'location');

/** Peek action row already includes directions (join activities, shops with review CTAs). */
export const exploreCardPeekActionsHasDirections = (card: ExploreCardModel): boolean => {
  if (!exploreCardHasMapCoords(card) || exploreCardShowsInlineDirections(card)) return false;
  if (card.source === 'venue') return true;
  if (card.showJoinActions && card.source !== 'activity') return true;
  if (card.source === 'shop' && card.reviewPath) return true;
  return false;
};

/** Extra directions row in peek body — only when not inline and not in peek actions. */
export const exploreCardShowPeekBodyDirections = (card: ExploreCardModel): boolean =>
  exploreCardPeekShowsDirections(card) &&
  exploreCardHasMapCoords(card) &&
  !exploreCardShowsInlineDirections(card) &&
  !exploreCardPeekActionsHasDirections(card);

export type ExploreEntityFollowPayload = {
  locationId?: string;
  tenantId?: string;
  merchantId?: string;
};

/** Resolve place / host team / shop follow target for this explore card. */
export const resolveExploreEntityFollowTarget = (
  card: ExploreCardModel
): ExploreEntityFollowPayload | null => {
  if (exploreCardIsSeeking(card)) return null;
  if (card.source === 'venue' && card.locationId) return { locationId: card.locationId };
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
  activityId?: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
};

const outingCategoryFromCardKind = (card: ExploreCardModel): OutingCategory | null => {
  if (card.outingCategory) return card.outingCategory;
  if (card.kind === 'rideshare') return 'rideshare';
  if (card.kind === 'hiking' || card.kind === 'camping') return card.kind;
  if (card.kind === 'event') return 'events';
  return null;
};

const watchMetaFromCard = (card: ExploreCardModel) => ({
  alertOnMatch: true,
  watchOutingCategory: outingCategoryFromCardKind(card),
  watchLatitude: card.mapLatitude ?? null,
  watchLongitude: card.mapLongitude ?? null,
});

/** Wishlist = private venue or activity save — not demand, shops, or people (use Follow). */
export const resolveExploreWishlistTarget = (card: ExploreCardModel): ExploreWishlistTarget | null => {
  const watch = watchMetaFromCard(card);
  if (exploreCardIsSeeking(card)) return null;
  if (card.source === 'activity' && card.activityId) return { activityId: card.activityId, ...watch };
  if (card.source === 'venue' && card.locationId) return { locationId: card.locationId, ...watch };
  return null;
};
