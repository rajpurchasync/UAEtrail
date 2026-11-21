import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { formatExploreEventDateLabel, formatExploreTime, isGeographyMapSource } from '@uaetrail/shared-types';
import { buildDiscoveryListMeta, discoveryCardIsAvailabilityPin } from '../discovery/discoveryCardModel';
import { ACTIVITY_TYPE_LABELS, type ActivityType } from '../config/activityTypes';
import { resolveListFeedPosterRequirementLabels } from './listFeedPosterStandard';

export type BrowsePosterMetaPart = { key: string; label: string };

/** Small eye row — venue / meeting place name. */
export const resolveBrowsePosterPlaceLine = (card: DiscoveryCardModel): string | null => {
  if (card.source === 'activity' || discoveryCardIsAvailabilityPin(card)) {
    const activity = card.activity;
    const fromActivity =
      activity?.locationName?.trim() ||
      activity?.meetingPoint?.trim() ||
      activity?.startPoint?.trim() ||
      null;
    if (fromActivity) return fromActivity;
  }

  if (card.subtitle?.trim()) return card.subtitle.trim();
  const locationDetail = card.sections.details.find((d) => d.icon === 'location');
  if (locationDetail?.label?.trim()) return locationDetail.label.trim();
  return card.venueHint?.trim() ?? null;
};

/** Large overlay title — social list title or catalog headline. */
export const resolveBrowsePosterTitle = (card: DiscoveryCardModel): string => {
  const { highlightName, suffix, activityHighlight, dateHighlight } = card.sections;
  if (highlightName) {
    return [highlightName, suffix, activityHighlight, dateHighlight].filter(Boolean).join('');
  }
  return card.listTitle || card.headline;
};

export type ListFeedPosterTitleLines = {
  line1: string;
  line2: string | null;
};

/** List poster overlay — max 4 words, 2 words per row. */
export const formatListFeedPosterTitleLines = (
  title: string,
  maxWords = 4,
  wordsPerLine = 2
): ListFeedPosterTitleLines => {
  const words = title.trim().split(/\s+/).filter(Boolean).slice(0, maxWords);
  if (words.length === 0) {
    return { line1: title.trim(), line2: null };
  }
  const line1 = words.slice(0, wordsPerLine).join(' ');
  const line2 =
    words.length > wordsPerLine ? words.slice(wordsPerLine, maxWords).join(' ') : null;
  return { line1, line2 };
};

/** Poster overlay headline — outing title / place name (not "Host is going …"). */
export const resolveBrowsePosterHeroTitle = (card: DiscoveryCardModel): string => {
  const activityTitle = card.activity?.title?.trim();
  if (activityTitle) return activityTitle;

  if (isGeographyMapSource(card.source) || card.source === 'shop' || card.source === 'agency') {
    const headline = card.headline?.trim();
    if (headline) return headline.split(' - ')[0]?.trim() || headline;
  }

  if (card.sections.activityHighlight?.trim()) {
    return [card.sections.activityHighlight.trim(), card.sections.dateHighlight?.trim()]
      .filter(Boolean)
      .join(' ');
  }

  if (card.routeLabel?.trim()) return card.routeLabel.trim();

  const headlineLead = card.headline?.split(' - ')[0]?.trim();
  if (headlineLead && !card.sections.highlightName) return headlineLead;

  return placeLineFallback(card) ?? card.listTitle.trim();
};

const placeLineFallback = (card: DiscoveryCardModel): string | null => {
  return resolveBrowsePosterPlaceLine(card);
};

export type BrowsePosterScheduleGrid = {
  dateLabel: string | null;
  timeLabel: string | null;
  spotsLabel: string | null;
  priceLabel: string | null;
};

const splitWhenDateAndTime = (when: string): { date: string; time: string | null } => {
  const atIdx = when.lastIndexOf(' at ');
  if (atIdx > 0) {
    return { date: when.slice(0, atIdx).trim(), time: when.slice(atIdx + 4).trim() };
  }
  return { date: when.trim(), time: null };
};

const formatListFeedDate = (date?: string | null): string | null =>
  formatExploreEventDateLabel(date);

const formatListFeedTime = (time?: string | null): string | null => formatExploreTime(time);

const withStartsTimePrefix = (time: string | null): string | null => {
  if (!time?.trim()) return null;
  if (/^starts\s/i.test(time.trim())) return time.trim();
  return `Starts ${time.trim()}`;
};

const resolveListFeedPriceLabel = (card: DiscoveryCardModel): string | null => {
  const activityPrice = card.activity?.price;
  if (activityPrice != null && activityPrice <= 0) return 'Free';
  if (card.price?.kind === 'free') return 'Free';

  if (activityPrice != null && activityPrice > 0) {
    return `AED ${activityPrice}`;
  }

  const badge = card.price?.badge?.trim();
  if (badge) {
    const match = badge.match(/AED\s*(\d+(?:\.\d+)?)/i);
    if (match) return `AED ${match[1]}`;
    if (/^free$/i.test(badge)) return 'Free';
  }

  return null;
};

const resolveListFeedSpotsLabel = (card: DiscoveryCardModel): string | null => {
  if (card.source !== 'activity' && !discoveryCardIsAvailabilityPin(card)) return null;

  const activity = card.activity;
  if (activity && card.source === 'activity') {
    const avail = activity.slotsAvailable;
    if (typeof avail === 'number' && avail >= 0) {
      return `${avail} spot${avail === 1 ? '' : 's'}`;
    }
  }

  if (card.spotsLabel?.trim()) {
    const match = card.spotsLabel.match(/(\d+)\s*spots?/i);
    return match ? `${match[1]} spots` : card.spotsLabel.trim();
  }

  return null;
};

/** Two-row overlay: date | time · spots | price (list feed poster). */
export const resolveBrowsePosterScheduleGrid = (card: DiscoveryCardModel): BrowsePosterScheduleGrid => {
  const dateSource = card.activity?.date ?? card.sections.listWhen ?? null;
  let dateLabel = formatListFeedDate(card.activity?.date ?? null);

  if (!dateLabel && typeof dateSource === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateSource)) {
    dateLabel = formatListFeedDate(dateSource);
  }

  let timeLabel =
    formatListFeedTime(card.activity?.time ?? null) ??
    card.sections.details.find((d) => d.icon === 'time')?.label?.trim() ??
    null;

  if (!timeLabel) {
    const listWhen = card.sections.listWhen?.trim();
    if (listWhen?.includes('·')) {
      const segment = listWhen.split('·').pop()?.trim();
      if (segment) timeLabel = segment;
    }
  }

  if (timeLabel?.includes(' at ')) {
    const split = splitWhenDateAndTime(timeLabel);
    timeLabel = split.time ?? timeLabel;
  }

  if (timeLabel && (card.source === 'activity' || discoveryCardIsAvailabilityPin(card))) {
    timeLabel = withStartsTimePrefix(timeLabel);
  }

  const spotsLabel = resolveListFeedSpotsLabel(card);

  const priceLabel = resolveListFeedPriceLabel(card);

  return { dateLabel, timeLabel, spotsLabel, priceLabel };
};

/** List feed overlay — no extra label chips (minimal card). */
export const resolveBrowsePosterAudienceLabels = (_card: DiscoveryCardModel): string[] => [];

/** Date · time · price · spots — one fact per segment for poster overlay. */
export const resolveBrowsePosterScheduleFacts = (card: DiscoveryCardModel): string[] => {
  const facts: string[] = [];
  const when = card.whenLabel ?? card.sections.listWhen;
  if (when?.trim()) facts.push(when.trim());

  const timeDetail = card.sections.details.find((d) => d.icon === 'time');
  if (timeDetail?.label?.trim()) {
    const timeLabel = timeDetail.label.trim();
    if (!facts.some((f) => f.includes(timeLabel))) facts.push(timeLabel);
  }

  if (card.price?.badge?.trim()) facts.push(card.price.badge.trim());

  const spotsFact = resolveListFeedSpotsLabel(card);
  if (spotsFact) facts.push(spotsFact);

  if (facts.length === 0) {
    const meta = buildDiscoveryListMeta(card);
    if (meta?.trim()) facts.push(meta.trim());
  }

  return facts;
};

export const resolveBrowsePosterMetaParts = (card: DiscoveryCardModel): BrowsePosterMetaPart[] => {
  const parts: BrowsePosterMetaPart[] = [];
  const when = card.whenLabel ?? card.sections.listWhen;
  if (when?.trim()) parts.push({ key: 'when', label: when.trim() });

  const timeDetail = card.sections.details.find((d) => d.icon === 'time');
  if (timeDetail?.label?.trim() && !when?.includes(timeDetail.label)) {
    parts.push({ key: 'time', label: timeDetail.label.trim() });
  }

  if (card.price?.badge) parts.push({ key: 'price', label: card.price.badge });

  const meta = buildDiscoveryListMeta(card);
  if (meta && !parts.some((p) => meta.includes(p.label))) {
    parts.push({ key: 'meta', label: meta });
  }

  if (card.spotsLabel && card.source === 'activity') {
    parts.push({ key: 'spots', label: card.spotsLabel });
  }

  return parts.slice(0, 5);
};

/** Outing kind for posters — Hiking, Camping, Event, etc. (not Trip / Spot chips). */
export const resolveBrowsePosterActivityTypeLabel = (card: DiscoveryCardModel): string | null => {
  const activityType = card.activity?.activityType;
  if (activityType && activityType in ACTIVITY_TYPE_LABELS) {
    return ACTIVITY_TYPE_LABELS[activityType as ActivityType];
  }
  if (card.kind === 'hiking' || card.kind === 'camping' || card.kind === 'event') {
    return ACTIVITY_TYPE_LABELS[card.kind as ActivityType];
  }
  if (card.kind === 'rideshare') return 'Rideshare';
  if (discoveryCardIsAvailabilityPin(card) && card.sections.activityHighlight?.trim()) {
    const word = card.sections.activityHighlight.trim().split(/\s+/)[0];
    if (word) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
  return null;
};

/** Audience / policy tags — women only, pets welcome, etc. */
export const resolveBrowsePosterRequirementLabels = resolveListFeedPosterRequirementLabels;

/** Category feed overlay chips — source + kind + requirements. */
export const resolveBrowsePosterLabels = (card: DiscoveryCardModel): string[] => {
  const labels: string[] = [];
  if (card.source === 'activity') labels.push('Trip');
  if (discoveryCardIsAvailabilityPin(card)) labels.push('Looking for');
  if (isGeographyMapSource(card.source)) labels.push('Spot');
  if (card.source === 'shop') labels.push('Shop');
  const typeLabel = resolveBrowsePosterActivityTypeLabel(card);
  if (typeLabel) labels.push(typeLabel);
  const requirementLabels = resolveListFeedPosterRequirementLabels(card);
  if (requirementLabels.length) {
    labels.push(...requirementLabels.slice(0, 2));
  }
  return [...new Set(labels)].slice(0, 4);
};
