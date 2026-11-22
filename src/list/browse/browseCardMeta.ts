import { isGeographyMapSource, resolveActivityPublisherChip } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { browseCatalogHeaderLocationLine } from './browseCatalogLabels';

const BROWSE_ROW_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const BROWSE_ROW_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const SOLD_OUT = /sold\s*out/i;
const AED_IN_BADGE = /AED\s*[\d.]+(?:\/seat)?/i;

export type BrowseCardMeta = {
  title: string;
  hostName: string | null;
  hostAvatar: string | null;
  price: string | null;
  location: string | null;
  when: string | null;
  soldOut: boolean;
  dateIso: string | null;
};

/** Host-provided outing/place name — not the social “X is going Hiking on Saturday” headline. */
export const browseCardTitle = (card: DiscoveryCardModel): string => {
  const activityTitle = card.activity?.title?.trim();
  if (activityTitle) return activityTitle;
  if (isGeographyMapSource(card.source) || card.source === 'shop' || card.source === 'agency') {
    const headline = card.headline?.trim();
    if (headline) return headline.split(' - ')[0]?.trim() || headline;
    return card.listTitle.trim();
  }
  return card.routeLabel?.trim() || card.sections.activityHighlight?.trim() || card.listTitle.trim();
};

export const browseCardHostName = (card: DiscoveryCardModel): string | null =>
  card.listHost?.trim() ||
  card.featuredPerson?.displayName?.trim() ||
  card.sections.hostName?.trim() ||
  null;

export const browseCardPriceLabel = (card: DiscoveryCardModel): string | null => {
  const price = card.price;
  if (!price) return null;
  if (price.kind === 'free') return 'Free';
  const aed = price.badge.match(AED_IN_BADGE);
  if (aed) return aed[0].replace(/\s+/g, ' ');
  return price.badge;
};

/** Thumb hero foot — Free vs Paid (amount stays in detail / meta elsewhere). */
export const browseCardListHeroPriceLabel = (card: DiscoveryCardModel): string | null => {
  if (card.source !== 'activity') return null;
  const price = card.price;
  if (!price) return null;
  return price.kind === 'free' ? 'Free' : 'Paid';
};

export const browseCardDateIso = (card: DiscoveryCardModel): string | null => {
  const rawDate = card.scheduleDate?.trim() || card.activity?.date?.trim() || '';
  return /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : null;
};

/** Browse list row date column — `Fri 20 Nov 26` (calendar labels, no “This week” prefix). */
export const formatBrowseRowDateLabel = (iso: string | null): string | null => {
  if (!iso?.trim()) return null;
  const target = new Date(`${iso.trim().slice(0, 10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const weekday = BROWSE_ROW_WEEKDAYS[target.getDay()] ?? '';
  const day = String(target.getDate()).padStart(2, '0');
  const month = BROWSE_ROW_MONTHS[target.getMonth()] ?? '';
  const year = String(target.getFullYear()).slice(-2);
  return `${weekday} ${day} ${month} ${year}`;
};

const splitExploreWhenLabel = (when: string | null): { date: string; time: string | null } | null => {
  if (!when?.trim()) return null;
  const atIdx = when.lastIndexOf(' at ');
  if (atIdx > 0) {
    return { date: when.slice(0, atIdx).trim(), time: when.slice(atIdx + 4).trim() };
  }
  return { date: when.trim(), time: null };
};

/** Date/time column for browse list rows — full date from ISO; time from explore when label. */
export const browseRowWhenDisplay = (
  card: DiscoveryCardModel,
  _now: Date = new Date()
): { date: string; time: string | null } | null => {
  const iso = browseCardDateIso(card);
  const when = card.whenLabel?.trim() || null;
  const fromWhen = splitExploreWhenLabel(when);
  const date = formatBrowseRowDateLabel(iso) ?? fromWhen?.date ?? null;
  const time = fromWhen?.time ?? null;
  if (!date && !time) return null;
  return { date: date ?? '', time };
};

export const browseCardMeta = (card: DiscoveryCardModel): BrowseCardMeta => {
  const dateIso = browseCardDateIso(card);
  const soldOut =
    card.activity?.slotsAvailable === 0 || SOLD_OUT.test(card.spotsLabel ?? '');
  const catalogPlace = isGeographyMapSource(card.source) || card.source === 'shop';
  const location = catalogPlace
    ? browseCatalogHeaderLocationLine(card)
    : card.venueHint?.trim() || card.subtitle?.trim() || null;
  const isEvent = card.source === 'activity';
  const publisher = isEvent
    ? resolveActivityPublisherChip({
        publishingProfileKind: card.activity?.publishingProfileKind,
        tenantName: card.activity?.tenantName,
        tenantLogoUrl: card.activity?.tenantLogoUrl,
        hostName: browseCardHostName(card),
        hostAvatar: card.hostAvatar?.trim() || card.featuredPerson?.avatarUrl?.trim() || null,
        listHost: card.listHost,
      })
    : null;
  return {
    title: browseCardTitle(card),
    hostName: publisher?.name ?? null,
    hostAvatar: publisher?.avatarUrl ?? null,
    price: isEvent ? browseCardPriceLabel(card) : null,
    location,
    when: card.whenLabel?.trim() || null,
    soldOut,
    dateIso,
  };
};