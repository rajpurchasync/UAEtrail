import type {
  ActivityViewerAccessDTO,
  ExploreCardKind,
  ExploreCardSource,
  ExploreLinkedRideshareDTO,
  ExploreMapItemDTO,
  ExploreMapPersonDTO,
  ExplorePlanComposeIntent,
  OutingCategory,
  ParticipantPreviewDTO,
} from '@uaetrail/shared-types';
import { buildExploreCardPresentation, resolveExploreFeaturedPerson } from '@uaetrail/shared-types';
import {
  buildExploreRouteLabel,
  buildExploreWhenSegment,
  type ExploreCardSections,
} from './exploreCopy';
import { resolveExplorePrice, type ExplorePriceInfo } from './explorePriceLabel';
import { enrichExploreActivityRequirementBadges } from './exploreRequirementBadges';
import { exploreMapItemSharePath } from './routing';
import { resolveExploreCoverImage } from './exploreCoverImage';

export type { ExploreCardKind, ExploreCardSource } from '@uaetrail/shared-types';

export type ExploreCardTone = ExploreCardKind;

export interface ExploreCardModel {
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
  showHostActions?: boolean;
  /** Requester viewing their own active demand pin. */
  showDemandOwnerActions?: boolean;
  /** Hiking / camping / activity demand — host can publish a linked rideshare offer. */
  showDemandLinkRideshare?: boolean;
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
  requirementBadges?: string[];
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  linkedRideshares?: ExploreLinkedRideshareDTO[];
  /** From `GET /explore/map` for activity/demand rows (per viewer). */
  viewerAccess?: ActivityViewerAccessDTO | null;
}

const resolveCoverImage = (item: ExploreMapItemDTO): string | null =>
  resolveExploreCoverImage(
    item.locationCard?.images?.[0],
    item.image,
    item.activity?.bannerUrl,
    item.activity?.images?.[0]
  );

const LIST_META_ICONS = new Set(['location', 'time', 'spots']);
const LIST_META_ROUTE_SOURCES = new Set<ExploreCardModel['source']>(['demand']);

/** Compact second line for list rows (where · when · spots — not duplicate activity title). */
export const buildExploreListMeta = (card: ExploreCardModel): string | null => {
  if (card.source === 'shop' || card.source === 'agency' || card.source === 'venue') {
    return null;
  }
  const allowRoute = LIST_META_ROUTE_SOURCES.has(card.source) || card.kind === 'rideshare';
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

export const buildExploreCardModel = (item: ExploreMapItemDTO): ExploreCardModel => {
  const presentation = item.presentation ?? buildExploreCardPresentation(item);
  const kind = presentation.kind;
  const source = presentation.source;
  const featuredPerson = item.featuredPerson ?? presentation.featuredPerson ?? resolveExploreFeaturedPerson(item);
  const isRideshare = kind === 'rideshare';
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;
  const routeLabel = presentation.routeLabel ?? buildExploreRouteLabel(fromLabel, toLabel, kind);
  const whenSuffix =
    source === 'demand' ? 'flexible' : kind === 'rideshare' ? 'fixed' : null;
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
      (source === 'demand' && Boolean(item.requesterUserId)),
    websiteUrl: item.websiteUrl ?? null,
    contactPhone: item.contactPhone ?? null,
    shareTitle: headline,
    sharePath:
      activity?.joinMode === 'private' && activity.id
        ? `/activity/${activity.id}`
        : exploreMapItemSharePath(item.id),
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
    reviewPath: catalogSource ? `${item.path}#reviews` : null,
    locationId: item.locationCard?.id ?? null,
    activityId: item.activity?.id ?? null,
    participantIntentId: item.participantIntentId ?? null,
    outingCategory: item.outingCategory ?? null,
    composeIntent: item.composeIntent ?? null,
    merchantId: item.merchantId ?? null,
    tenantId: item.tenantId ?? null,
    profileUserId: featuredPerson?.userId ?? item.requesterUserId ?? item.activity?.hostUserId ?? null,
    featuredPerson,
    childFriendly: item.locationCard?.childFriendly ?? false,
    difficulty: item.locationCard?.difficulty ?? null,
    surfaceTypes: item.locationCard?.surfaceType ?? [],
    requirementBadges: enrichExploreActivityRequirementBadges(activity?.requirements, {
      kind,
      rideshareEnabled: Boolean(
        source === 'activity' &&
          kind !== 'rideshare' &&
          (item.rideshareEnabled ??
            activity?.rideshareEnabled ??
            (item.linkedRideshareActivities?.length ?? 0) > 0)
      ),
      venueDifficulty: item.locationCard?.difficulty ?? null,
    }),
    mapLatitude: item.latitude ?? null,
    mapLongitude: item.longitude ?? null,
    linkedRideshares:
      item.linkedRideshareActivities && item.linkedRideshareActivities.length > 0
        ? item.linkedRideshareActivities
        : undefined,
    viewerAccess: item.viewerAccess ?? null,
  };
};

export const exploreCardToneClass: Record<ExploreCardTone, string> = {
  hiking: 'bg-emerald-50 text-emerald-900',
  camping: 'bg-amber-50 text-amber-900',
  event: 'bg-violet-50 text-violet-900',
  shop: 'bg-rose-50 text-rose-900',
  agency: 'bg-indigo-50 text-indigo-900',
  rideshare: 'bg-sky-50 text-sky-900',
};

export const exploreCardToneTextClass: Record<ExploreCardTone, string> = {
  hiking: 'text-emerald-800',
  camping: 'text-amber-800',
  event: 'text-violet-800',
  shop: 'text-rose-800',
  agency: 'text-indigo-800',
  rideshare: 'text-sky-800',
};

export const exploreCardHasMapCoords = (card: ExploreCardModel): boolean =>
  card.mapLatitude != null && card.mapLongitude != null;

/** Peek body already shows “Get Directions” on the location row. */
export const exploreCardShowsInlineDirections = (card: ExploreCardModel): boolean =>
  exploreCardHasMapCoords(card) &&
  card.sections.details.some((detail) => detail.icon === 'location');

/** Footer peek row already includes directions (join activities, shops with review CTAs). */
export const exploreCardPeekFooterHasDirections = (card: ExploreCardModel): boolean => {
  if (!exploreCardHasMapCoords(card) || exploreCardShowsInlineDirections(card)) return false;
  if (card.source === 'venue') return true;
  if (card.showJoinActions) return true;
  if (card.source === 'shop' && card.reviewPath) return true;
  return false;
};

/** Extra directions row in peek body — only when not inline and not in footer. */
export const exploreCardShowPeekBodyDirections = (card: ExploreCardModel): boolean =>
  exploreCardHasMapCoords(card) &&
  !exploreCardShowsInlineDirections(card) &&
  !exploreCardPeekFooterHasDirections(card);

export type ExploreFavoriteTarget = {
  locationId?: string;
  activityId?: string;
  participantIntentId?: string;
  merchantId?: string;
  tenantId?: string;
  profileUserId?: string;
  alertOnMatch?: boolean;
  watchOutingCategory?: OutingCategory | null;
  watchLatitude?: number | null;
  watchLongitude?: number | null;
};

const outingCategoryFromCardKind = (card: ExploreCardModel): OutingCategory | null => {
  if (card.outingCategory) return card.outingCategory;
  if (card.kind === 'rideshare') return 'rideshare';
  if (card.kind === 'hiking' || card.kind === 'camping') return card.kind;
  if (card.kind === 'event') return card.source === 'venue' ? 'events' : 'events';
  return null;
};

const watchMetaFromCard = (card: ExploreCardModel) => ({
  alertOnMatch: true,
  watchOutingCategory: outingCategoryFromCardKind(card),
  watchLatitude: card.mapLatitude ?? null,
  watchLongitude: card.mapLongitude ?? null,
});

/** Resolve which favorite key applies to this explore card. */
export const resolveExploreFavoriteTarget = (card: ExploreCardModel): ExploreFavoriteTarget | null => {
  const watch = watchMetaFromCard(card);
  if (card.source === 'activity' && card.activityId) return { activityId: card.activityId, ...watch };
  // Demand = public participation on Explore — not wishlist saves (see `src/trips/favoriteDemandBookmark.ts`).
  if (card.source === 'demand') return null;
  if (card.source === 'venue' && card.locationId) return { locationId: card.locationId, ...watch };
  if (card.source === 'shop' || card.source === 'agency') {
    if (card.merchantId) return { merchantId: card.merchantId, ...watch };
    if (card.tenantId) return { tenantId: card.tenantId, ...watch };
  }
  return null;
};
