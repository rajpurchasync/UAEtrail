import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { getFirstName } from '../utils/userDisplay';
import { formatDate } from '../utils';
import type { ExploreCardKind, ExploreCardSource } from './exploreCardModel';

export const MAP_FILTER_EMOJI = {
  hiking: '🥾',
  camping: '🏕️',
  event: '🏃',
  shop: '🛍️',
  agency: '🏢',
  carpool: '🚗',
} as const;

export const resolveMapPinEmoji = (
  kind: ExploreCardKind,
  source: ExploreCardSource = 'activity',
  carpoolEndpoint?: 'from' | 'to'
): string => {
  if (source === 'activity' && kind === 'carpool' && carpoolEndpoint === 'to') return '🏁';

  if (source === 'venue') {
    if (kind === 'hiking') return '⛰️';
    if (kind === 'camping') return '⛺';
    if (kind === 'event') return '🏃';
    return '📍';
  }

  if (source === 'shop') return '🛍️';
  if (source === 'agency') return '🏢';
  if (source === 'demand') return '🙋';

  if (kind === 'carpool') return '🚗';
  if (kind === 'hiking') return '🥾';
  if (kind === 'camping') return '🏕️';
  if (kind === 'event') return '🏃';
  if (kind === 'shop') return '🛍️';
  if (kind === 'agency') return '🏢';
  return '📍';
};

export const formatWeekdayDate = (date?: string | null): string => {
  if (!date) return '';
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return date;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return formatDate(date);
};

export const formatRelativeDayShort = (date?: string | null): string => {
  const label = formatWeekdayDate(date);
  if (label === 'Today') return 'Today';
  if (label === 'Tomorrow') return 'Tmr';
  return label;
};

export interface ExploreHeadlineInput {
  source: ExploreCardSource;
  kind: ExploreCardKind;
  title: string;
  hostName?: string | null;
  date?: string | null;
  fromLabel?: string | null;
  toLabel?: string | null;
  participantName?: string | null;
}

export const exploreHeadline = (input: ExploreHeadlineInput): string => {
  const host = getFirstName(input.hostName || 'Host');
  const dateLabel = formatWeekdayDate(input.date);

  if (input.source === 'venue') {
    if (input.kind === 'hiking') return 'Hiking Spot';
    if (input.kind === 'camping') return 'Camping Spot';
    return input.title;
  }

  if (input.source === 'shop' || input.source === 'agency') {
    return input.title;
  }

  if (input.source === 'demand') {
    return input.title;
  }

  if (input.kind === 'carpool') {
    const from = input.fromLabel || 'Pickup';
    const to = input.toLabel || 'Destination';
    return dateLabel
      ? `${host} is carpooling ${from} → ${to} on ${dateLabel}`
      : `${host} is carpooling ${from} → ${to}`;
  }

  if (input.kind === 'event') {
    return dateLabel
      ? `${host} is hosting “${input.title}” on ${dateLabel}`
      : `${host} is hosting “${input.title}”`;
  }

  if (input.kind === 'hiking') {
    return dateLabel ? `${host} is going Hiking on ${dateLabel}` : `${host} is going Hiking`;
  }

  if (input.kind === 'camping') {
    return dateLabel ? `${host} is going Camping on ${dateLabel}` : `${host} is going Camping`;
  }

  return input.title;
};

export const exploreSubtitle = (item: ExploreMapItemDTO, kind: ExploreCardKind, source: ExploreCardSource): string | null => {
  if (source === 'venue') return item.title;
  if (source === 'demand') {
    const parts = [formatWeekdayDate(item.date), item.time].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : item.subtitle ?? null;
  }
  if (source === 'shop' || source === 'agency') return item.subtitle ?? null;
  if (kind === 'carpool') return item.subtitle ?? null;
  return item.subtitle ?? item.activity?.locationName ?? null;
};

export const exploreSpotsLabel = (item: ExploreMapItemDTO): string | null => {
  if (item.source === 'demand') {
    const size = item.slotsTotal ?? 0;
    if (size <= 1) return '1 person looking';
    return `${size} people looking`;
  }
  if (item.source !== 'activity') return null;
  const total = item.slotsTotal ?? 0;
  const available = item.slotsAvailable ?? 0;
  const going = Math.max(total - available, item.participantPreviews?.length ?? 0);
  if (going > 0 && available > 0) return `${going} going · ${available} left`;
  if (going > 0) return `${going} going`;
  if (total > 0) return `${total} spots`;
  return null;
};

export const explorePrimaryCtaLabel = (
  source: ExploreCardSource,
  options?: { websiteUrl?: string | null }
): string => {
  if (source === 'demand') return 'Close';
  if (source === 'shop') return options?.websiteUrl ? 'Visit website' : 'View shop';
  if (source === 'agency') return 'View agency';
  if (source === 'activity') return 'Request to join';
  return 'View details';
};

export const exploreSecondaryCtaLabel = (source: ExploreCardSource): string | null => {
  if (source === 'activity') return 'View details';
  return null;
};

export const exploreDemandHint = (): string =>
  'Community request — hosts can post a matching trip from the map. Direct join coming soon.';

export const exploreShopHint = (): string =>
  'Outdoor gear shop — visit their website or get directions from the map pin.';

export const exploreAgencyHint = (): string => 'Licensed tour operator — view trips and contact details.';

export const exploreVenueHint = (source: ExploreCardSource, kind: ExploreCardKind): string | null => {
  if (source === 'demand') return exploreDemandHint();
  if (source === 'shop') return exploreShopHint();
  if (source === 'agency') return exploreAgencyHint();
  if (source !== 'venue') return null;
  if (kind === 'hiking') return 'Trail or outdoor spot';
  if (kind === 'camping') return 'Camping location';
  return 'Outdoor spot';
};
