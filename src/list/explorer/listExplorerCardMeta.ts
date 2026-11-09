import {
  formatExploreTime,
  isGeographyMapSource,
  resolveActivityPublisherChip,
} from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { listExplorerIsThisWeekSectionDate } from './listExplorerDateSections';

const LIST_ROW_MONTHS = [
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

const LIST_ROW_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const SOLD_OUT = /sold\s*out/i;
const AED_IN_BADGE = /AED\s*[\d.]+(?:\/seat)?/i;

export type ListExplorerCardMeta = {
  title: string;
  hostName: string | null;
  hostAvatar: string | null;
  price: string | null;
  location: string | null;
  when: string | null;
  whenDay: string | null;
  whenDate: string | null;
  whenTime: string | null;
  soldOut: boolean;
  dateIso: string | null;
};

/** Host-provided outing/place name — not the social “X is going Hiking on Saturday” headline. */
export const listExplorerCardTitle = (card: DiscoveryCardModel): string => {
  const activityTitle = card.activity?.title?.trim();
  if (activityTitle) return activityTitle;
  if (isGeographyMapSource(card.source) || card.source === 'shop' || card.source === 'agency') {
    const headline = card.headline?.trim();
    if (headline) return headline.split(' - ')[0]?.trim() || headline;
    return card.listTitle.trim();
  }
  return card.routeLabel?.trim() || card.sections.activityHighlight?.trim() || card.listTitle.trim();
};

export const listExplorerHostName = (card: DiscoveryCardModel): string | null =>
  card.listHost?.trim() ||
  card.featuredPerson?.displayName?.trim() ||
  card.sections.hostName?.trim() ||
  null;

export const listExplorerPriceLabel = (card: DiscoveryCardModel): string | null => {
  const price = card.price;
  if (!price) return null;
  if (price.kind === 'free') return 'Free';
  const aed = price.badge.match(AED_IN_BADGE);
  if (aed) return aed[0].replace(/\s+/g, ' ');
  return price.badge;
};

export const listExplorerCardDateIso = (card: DiscoveryCardModel): string | null => {
  const rawDate = card.scheduleDate?.trim() || card.activity?.date?.trim() || '';
  return /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : null;
};

/** List row date column — always `Fri 20 Nov 26`; prefix `This` for “This Week” section dates. */
export const formatListExplorerRowDateLabel = (
  iso: string | null,
  now: Date = new Date()
): string | null => {
  if (!iso?.trim()) return null;
  const target = new Date(`${iso.trim().slice(0, 10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const weekday = LIST_ROW_WEEKDAYS[target.getDay()] ?? '';
  const day = String(target.getDate()).padStart(2, '0');
  const month = LIST_ROW_MONTHS[target.getMonth()] ?? '';
  const showYear = target.getFullYear() !== now.getFullYear();
  const yearSuffix = showYear ? ` ${String(target.getFullYear()).slice(-2)}` : '';
  const core = `${weekday} ${day} ${month}${yearSuffix}`;

  if (listExplorerIsThisWeekSectionDate(iso, now)) return `This ${core}`;
  return core;
};

const splitExploreWhenLabel = (when: string | null): { date: string; time: string | null } | null => {
  if (!when?.trim()) return null;
  const atIdx = when.lastIndexOf(' at ');
  if (atIdx > 0) {
    return { date: when.slice(0, atIdx).trim(), time: when.slice(atIdx + 4).trim() };
  }
  return { date: when.trim(), time: null };
};

const listExplorerEventTimeLabel = (card: DiscoveryCardModel): string | null => {
  const fromWhen = splitExploreWhenLabel(card.whenLabel?.trim() || null);
  if (fromWhen?.time) return fromWhen.time;
  const raw = card.activity?.time?.trim();
  if (!raw) return null;
  return formatExploreTime(raw) ?? raw;
};

/** Thumbnail poster — weekday, calendar date, and clock on separate lines. */
export const listExplorerThumbWhenLines = (
  card: DiscoveryCardModel,
  now: Date = new Date()
): { day: string; date: string; time: string | null } | null => {
  const iso = listExplorerCardDateIso(card);
  const time = listExplorerEventTimeLabel(card);
  if (!iso) {
    const fromWhen = splitExploreWhenLabel(card.whenLabel?.trim() || null);
    if (!fromWhen?.date && !time) return null;
    return { day: '', date: fromWhen?.date ?? '', time };
  }
  const target = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) {
    return time ? { day: '', date: '', time } : null;
  }
  const weekday = LIST_ROW_WEEKDAYS[target.getDay()] ?? '';
  const dayNum = String(target.getDate()).padStart(2, '0');
  const month = LIST_ROW_MONTHS[target.getMonth()] ?? '';
  const showYear = target.getFullYear() !== now.getFullYear();
  const yearSuffix = showYear ? ` ${String(target.getFullYear()).slice(-2)}` : '';
  let dateLine = `${dayNum} ${month}${yearSuffix}`;
  if (listExplorerIsThisWeekSectionDate(iso, now)) dateLine = `This ${dateLine}`;
  if (!weekday && !dateLine && !time) return null;
  return { day: weekday, date: dateLine, time };
};

/** Date/time column for list rows — full date from ISO; time from explore when label. */
export const listExplorerRowWhenDisplay = (
  card: DiscoveryCardModel,
  now: Date = new Date()
): { date: string; time: string | null } | null => {
  const iso = listExplorerCardDateIso(card);
  const when = card.whenLabel?.trim() || null;
  const fromWhen = splitExploreWhenLabel(when);
  const date = formatListExplorerRowDateLabel(iso, now) ?? fromWhen?.date ?? null;
  const time = fromWhen?.time ?? null;
  if (!date && !time) return null;
  return { date: date ?? '', time };
};

export const listExplorerCardMeta = (card: DiscoveryCardModel): ListExplorerCardMeta => {
  const dateIso = listExplorerCardDateIso(card);
  const soldOut =
    card.activity?.slotsAvailable === 0 || SOLD_OUT.test(card.spotsLabel ?? '');
  const location = card.venueHint?.trim() || card.subtitle?.trim() || null;
  const isEvent = card.source === 'activity';
  const publisher = isEvent
    ? resolveActivityPublisherChip({
        publishingProfileKind: card.activity?.publishingProfileKind,
        tenantName: card.activity?.tenantName,
        tenantLogoUrl: card.activity?.tenantLogoUrl,
        hostName: listExplorerHostName(card),
        hostAvatar: card.hostAvatar?.trim() || card.featuredPerson?.avatarUrl?.trim() || null,
        listHost: card.listHost,
      })
    : null;
  const whenLines = isEvent ? listExplorerThumbWhenLines(card) : null;
  return {
    title: listExplorerCardTitle(card),
    hostName: publisher?.name ?? null,
    hostAvatar: publisher?.avatarUrl ?? null,
    price: isEvent ? listExplorerPriceLabel(card) : null,
    location,
    when: card.whenLabel?.trim() || null,
    whenDay: whenLines?.day?.trim() ? whenLines.day : null,
    whenDate: whenLines?.date?.trim() ? whenLines.date : null,
    whenTime: whenLines?.time ?? null,
    soldOut,
    dateIso,
  };
};
