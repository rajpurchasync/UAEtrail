import type { ExploreMapItemDTO, ParticipantPreviewDTO } from '@uaetrail/shared-types';
import {
  buildExploreCardSections,
  buildExploreRouteLabel,
  buildExploreWhenSegment,
  exploreHeadline,
  explorePrimaryCtaLabel,
  exploreSecondaryCtaLabel,
  exploreSpotsLabel,
  exploreSubtitle,
  exploreVenueHint,
  resolveMapPinEmoji,
  sanitizeExploreLocation,
  type ExploreCardSections,
} from './exploreCopy';
import { resolveExplorePrice, type ExplorePriceInfo } from './explorePriceLabel';

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
}

const isCarpoolItem = (item: ExploreMapItemDTO): boolean =>
  item.kind === 'carpool' || item.activity?.activityType === 'carpool';

const resolveCardKind = (item: ExploreMapItemDTO): ExploreCardKind => {
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'agency') return 'agency';
  if (item.kind === 'carpool' || isCarpoolItem(item)) return 'carpool';
  return item.kind as ExploreCardKind;
};

const resolveCardSource = (item: ExploreMapItemDTO): ExploreCardSource => {
  if (item.source === 'demand') return 'demand';
  if (item.source === 'venue') return 'venue';
  if (item.source === 'shop') return 'shop';
  if (item.source === 'agency') return 'agency';
  return 'activity';
};

/** Compact second line for list rows. */
export const buildExploreListMeta = (card: ExploreCardModel): string | null => {
  if (card.source === 'shop') {
    return card.sections.aboutLine ?? card.subtitle ?? null;
  }
  const labels = card.sections.details.map((detail) => detail.label).filter(Boolean);
  if (labels.length > 0) return labels.join(' · ');
  if (card.source === 'agency') {
    return card.sections.aboutLine ?? card.subtitle ?? null;
  }
  return null;
};

export const buildExploreCardModel = (item: ExploreMapItemDTO): ExploreCardModel => {
  const kind = resolveCardKind(item);
  const source = resolveCardSource(item);
  const isCarpool = kind === 'carpool';
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;
  const routeLabel = buildExploreRouteLabel(fromLabel, toLabel, kind);
  const whenSuffix =
    source === 'demand' ? 'flexible' : kind === 'carpool' ? 'fixed' : null;
  const whenLabel = buildExploreWhenSegment(
    item.date,
    item.time ?? activity?.time ?? null,
    whenSuffix
  );
  const location = sanitizeExploreLocation(
    item.subtitle?.trim() ||
      activity?.locationName?.trim() ||
      activity?.meetingPoint?.trim() ||
      null
  );
  const subtitle = exploreSubtitle(item, kind, source);

  const headlineInput = {
    source,
    kind,
    title: item.title,
    hostName: item.hostName,
    location,
    subtitle,
    about: item.about ?? null,
    date: item.date,
    time: item.time ?? activity?.time ?? null,
    fromLabel,
    toLabel,
    slotsAvailable: item.slotsAvailable,
    slotsTotal: item.slotsTotal,
    participantCount: item.participantPreviews?.length ?? 0,
  };

  const headline = exploreHeadline(headlineInput);

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

  const sections = buildExploreCardSections(headlineInput);

  return {
    id: item.id,
    path: item.path,
    source,
    kind,
    tone: isCarpool ? 'carpool' : kind,
    emoji: resolveMapPinEmoji(kind, source),
    headline,
    listTitle: headline,
    listHost: item.hostName ?? null,
    subtitle: exploreSubtitle(item, kind, source),
    price,
    spotsLabel: exploreSpotsLabel(item),
    venueHint: exploreVenueHint(source, kind),
    showJoinHint: false,
    primaryCta: explorePrimaryCtaLabel(source, { websiteUrl: item.websiteUrl }),
    secondaryCta: exploreSecondaryCtaLabel(source),
    showJoinActions:
      (source === 'activity' && Boolean(activity)) ||
      (source === 'demand' && Boolean(item.requesterUserId)),
    websiteUrl: item.websiteUrl ?? null,
    contactPhone: item.contactPhone ?? null,
    shareTitle: headline,
    sharePath: item.path,
    shareText: [routeLabel, whenLabel].filter(Boolean).join(' · ') || item.subtitle || null,
    requesterUserId: item.requesterUserId ?? null,
    routeLabel,
    whenLabel,
    sections,
    hostAvatar: item.hostAvatar ?? null,
    participantPreviews: item.participantPreviews,
    activity,
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
