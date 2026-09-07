import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  exploreHeadline,
  explorePrimaryCtaLabel,
  exploreSecondaryCtaLabel,
  exploreSpotsLabel,
  exploreSubtitle,
  exploreVenueHint,
  resolveMapPinEmoji,
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
  subtitle: string | null;
  price: ExplorePriceInfo | null;
  spotsLabel: string | null;
  venueHint: string | null;
  showJoinHint: boolean;
  primaryCta: string;
  secondaryCta: string | null;
  showJoinActions: boolean;
  activity?: ExploreMapItemDTO['activity'];
}

export const isCarpoolItem = (item: ExploreMapItemDTO): boolean =>
  item.kind === 'carpool' ||
  item.activity?.activityType === 'carpool' ||
  Boolean(item.carPoolEnabled ?? item.activity?.carPoolEnabled);

export const resolveCardKind = (item: ExploreMapItemDTO): ExploreCardKind => {
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'agency') return 'agency';
  if (item.kind === 'carpool' || isCarpoolItem(item)) return 'carpool';
  return item.kind as ExploreCardKind;
};

export const resolveCardSource = (item: ExploreMapItemDTO): ExploreCardSource => {
  if (item.source === 'demand') return 'demand';
  if (item.source === 'venue') return 'venue';
  if (item.source === 'shop') return 'shop';
  if (item.source === 'agency') return 'agency';
  return 'activity';
};

export const buildExploreCardModel = (item: ExploreMapItemDTO): ExploreCardModel => {
  const kind = resolveCardKind(item);
  const source = resolveCardSource(item);
  const isCarpool = kind === 'carpool';
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;

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

  return {
    id: item.id,
    path: item.path,
    source,
    kind,
    tone: isCarpool ? 'carpool' : kind,
    emoji: resolveMapPinEmoji(kind, source),
    headline: exploreHeadline({
      source,
      kind,
      title: item.title,
      hostName: item.hostName,
      date: item.date,
      fromLabel,
      toLabel,
    }),
    subtitle: exploreSubtitle(item, kind, source),
    price,
    spotsLabel: exploreSpotsLabel(item),
    venueHint: exploreVenueHint(source, kind),
    showJoinHint: source === 'activity',
    primaryCta: explorePrimaryCtaLabel(source),
    secondaryCta: exploreSecondaryCtaLabel(source),
    showJoinActions: source === 'activity' && Boolean(activity),
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
