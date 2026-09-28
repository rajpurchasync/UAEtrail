import type { ExploreMapItemDTO, ExploreMapPersonDTO, ParticipantPreviewDTO } from '@uaetrail/shared-types';
import { buildExploreCardPresentation, resolveExploreFeaturedPerson } from '@uaetrail/shared-types';
import {
  buildExploreRouteLabel,
  buildExploreWhenSegment,
  type ExploreCardSections,
} from './exploreCopy';
import { resolveExplorePrice, type ExplorePriceInfo } from './explorePriceLabel';
import { enrichExploreActivityRequirementBadges } from './exploreRequirementBadges';

export type ExploreCardKind = 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'carpool';
export type ExploreCardSource = 'activity' | 'venue' | 'shop' | 'agency' | 'demand';

export type ExploreCardTone = 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'carpool';

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
  websiteUrl?: string | null;
  contactPhone?: string | null;
  shareTitle: string;
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
}

const resolveCoverImage = (item: ExploreMapItemDTO): string | null =>
  item.image ??
  item.locationCard?.images?.[0] ??
  item.activity?.bannerUrl ??
  item.activity?.images?.[0] ??
  null;

/** Compact second line for list rows. */
export const buildExploreListMeta = (card: ExploreCardModel): string | null => {
  if (card.source === 'shop' || card.source === 'agency' || card.source === 'venue') {
    return null;
  }
  const labels = card.sections.details.map((detail) => detail.label).filter(Boolean);
  if (labels.length > 0) return labels.join(' · ');
  return null;
};

export const buildExploreCardModel = (item: ExploreMapItemDTO): ExploreCardModel => {
  const presentation = item.presentation ?? buildExploreCardPresentation(item);
  const kind = presentation.kind;
  const source = presentation.source;
  const featuredPerson = item.featuredPerson ?? presentation.featuredPerson ?? resolveExploreFeaturedPerson(item);
  const isCarpool = kind === 'carpool';
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;
  const routeLabel = presentation.routeLabel ?? buildExploreRouteLabel(fromLabel, toLabel, kind);
  const whenSuffix =
    source === 'demand' ? 'flexible' : kind === 'carpool' ? 'fixed' : null;
  const whenLabel =
    presentation.whenLabel ??
    buildExploreWhenSegment(item.date, item.time ?? activity?.time ?? null, whenSuffix);

  const headline = presentation.headline;
  const sections = presentation.sections;
  const subtitle = presentation.subtitle;

  const price =
    source === 'activity'
      ? resolveExplorePrice({
          isCarpool,
          price: activity?.price ?? null,
          carPoolFree: activity?.carPoolFree ?? null,
          carPoolPriceAed: activity?.carPoolPriceAed ?? null,
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
    tone: isCarpool ? 'carpool' : kind,
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
    sharePath: item.path,
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
    merchantId: item.merchantId ?? null,
    tenantId: item.tenantId ?? null,
    profileUserId: featuredPerson?.userId ?? item.requesterUserId ?? item.activity?.hostUserId ?? null,
    featuredPerson,
    childFriendly: item.locationCard?.childFriendly ?? false,
    difficulty: item.locationCard?.difficulty ?? null,
    surfaceTypes: item.locationCard?.surfaceType ?? [],
    requirementBadges: enrichExploreActivityRequirementBadges(activity?.requirements, {
      kind,
      carPoolEnabled: Boolean(activity?.carPoolEnabled),
    }),
    mapLatitude: item.latitude ?? null,
    mapLongitude: item.longitude ?? null,
  };
};

export const exploreCardToneClass: Record<ExploreCardTone, string> = {
  hiking: 'bg-emerald-50 text-emerald-700',
  camping: 'bg-amber-50 text-amber-700',
  event: 'bg-violet-50 text-violet-700',
  shop: 'bg-rose-50 text-rose-700',
  agency: 'bg-indigo-50 text-indigo-700',
  carpool: 'bg-sky-50 text-sky-700',
};

export const exploreCardToneTextClass: Record<ExploreCardTone, string> = {
  hiking: 'text-emerald-700',
  camping: 'text-amber-700',
  event: 'text-violet-700',
  shop: 'text-rose-700',
  agency: 'text-indigo-700',
  carpool: 'text-sky-700',
};

export type ExploreFavoriteTarget = {
  locationId?: string;
  merchantId?: string;
  tenantId?: string;
  profileUserId?: string;
};

/** Resolve which favorite key applies to this explore card. */
export const resolveExploreFavoriteTarget = (card: ExploreCardModel): ExploreFavoriteTarget | null => {
  if (card.source === 'venue' && card.locationId) return { locationId: card.locationId };
  if (card.source === 'shop') {
    if (card.merchantId) return { merchantId: card.merchantId };
    if (card.tenantId) return { tenantId: card.tenantId };
  }
  if (card.profileUserId) return { profileUserId: card.profileUserId };
  return null;
};
