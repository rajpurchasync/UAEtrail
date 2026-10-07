import type { ExploreCardModel } from '../explore/exploreCardModel';
import { buildExploreListMeta } from '../explore/exploreCardModel';

export type BrowsePosterMetaPart = { key: string; label: string };

/** Small eye row — venue / meeting place name. */
export const resolveBrowsePosterPlaceLine = (card: ExploreCardModel): string | null => {
  if (card.subtitle?.trim()) return card.subtitle.trim();
  const locationDetail = card.sections.details.find((d) => d.icon === 'location');
  if (locationDetail?.label?.trim()) return locationDetail.label.trim();
  return card.venueHint?.trim() ?? null;
};

/** Large overlay title — social list title or catalog headline. */
export const resolveBrowsePosterTitle = (card: ExploreCardModel): string => {
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
    const fallback = title.trim() || 'Outdoor plan';
    return { line1: fallback, line2: null };
  }
  const line1 = words.slice(0, wordsPerLine).join(' ');
  const line2 =
    words.length > wordsPerLine ? words.slice(wordsPerLine, maxWords).join(' ') : null;
  return { line1, line2 };
};

/** Poster overlay headline — outing title / place name (not "Host is going …"). */
export const resolveBrowsePosterHeroTitle = (card: ExploreCardModel): string => {
  const activityTitle = card.activity?.title?.trim();
  if (activityTitle) return activityTitle;

  if (card.source === 'venue' || card.source === 'shop' || card.source === 'agency') {
    const headline = card.headline?.trim();
    if (headline) return headline.split(' - ')[0]?.trim() || headline;
  }

  if (card.sections.activityHighlight?.trim()) {
    return [card.sections.activityHighlight.trim(), card.sections.dateHighlight?.trim()]
      .filter(Boolean)
      .join('');
  }

  if (card.routeLabel?.trim()) return card.routeLabel.trim();

  const headlineLead = card.headline?.split(' - ')[0]?.trim();
  if (headlineLead && !card.sections.highlightName) return headlineLead;

  return placeLineFallback(card) ?? 'Outdoor plan';
};

const placeLineFallback = (card: ExploreCardModel): string | null => {
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

const formatListFeedDate = (date?: string | null): string | null => {
  if (!date?.trim()) return null;
  const target = new Date(`${date.trim()}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatListFeedTime = (time?: string | null): string | null => {
  if (!time?.trim()) return null;
  const [h, m] = time.trim().split(':');
  const hour = Number(h);
  const minute = Number(m);
  if (!Number.isFinite(hour)) return time.trim();
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return minute > 0 ? `${h12}:${String(minute).padStart(2, '0')} ${period}` : `${h12} ${period}`;
};

const withStartsTimePrefix = (time: string | null): string | null => {
  if (!time?.trim()) return null;
  if (/^starts\s/i.test(time.trim())) return time.trim();
  return `Starts ${time.trim()}`;
};

const resolveListFeedPriceLabel = (card: ExploreCardModel): string | null => {
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

/** Two-row overlay: date | time · spots | price (list feed poster). */
export const resolveBrowsePosterScheduleGrid = (card: ExploreCardModel): BrowsePosterScheduleGrid => {
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

  if (timeLabel && (card.source === 'activity' || card.source === 'demand')) {
    timeLabel = withStartsTimePrefix(timeLabel);
  }

  let spotsLabel: string | null = null;
  if (card.spotsLabel?.trim() && (card.source === 'activity' || card.source === 'demand')) {
    const match = card.spotsLabel.match(/(\d+)\s*spots?/i);
    spotsLabel = match ? `${match[1]} spots` : card.spotsLabel.trim();
  }

  const priceLabel = resolveListFeedPriceLabel(card);

  return { dateLabel, timeLabel, spotsLabel, priceLabel };
};

/** List feed overlay — no extra label chips (minimal card). */
export const resolveBrowsePosterAudienceLabels = (_card: ExploreCardModel): string[] => [];

/** Date · time · price · spots — one fact per segment for poster overlay. */
export const resolveBrowsePosterScheduleFacts = (card: ExploreCardModel): string[] => {
  const facts: string[] = [];
  const when = card.whenLabel ?? card.sections.listWhen;
  if (when?.trim()) facts.push(when.trim());

  const timeDetail = card.sections.details.find((d) => d.icon === 'time');
  if (timeDetail?.label?.trim()) {
    const timeLabel = timeDetail.label.trim();
    if (!facts.some((f) => f.includes(timeLabel))) facts.push(timeLabel);
  }

  if (card.price?.badge?.trim()) facts.push(card.price.badge.trim());

  if (card.spotsLabel?.trim() && (card.source === 'activity' || card.source === 'demand')) {
    facts.push(card.spotsLabel.trim());
  }

  if (facts.length === 0) {
    const meta = buildExploreListMeta(card);
    if (meta?.trim()) facts.push(meta.trim());
  }

  return facts;
};

export const resolveBrowsePosterMetaParts = (card: ExploreCardModel): BrowsePosterMetaPart[] => {
  const parts: BrowsePosterMetaPart[] = [];
  const when = card.whenLabel ?? card.sections.listWhen;
  if (when?.trim()) parts.push({ key: 'when', label: when.trim() });

  const timeDetail = card.sections.details.find((d) => d.icon === 'time');
  if (timeDetail?.label?.trim() && !when?.includes(timeDetail.label)) {
    parts.push({ key: 'time', label: timeDetail.label.trim() });
  }

  if (card.price?.badge) parts.push({ key: 'price', label: card.price.badge });

  const meta = buildExploreListMeta(card);
  if (meta && !parts.some((p) => meta.includes(p.label))) {
    parts.push({ key: 'meta', label: meta });
  }

  if (card.spotsLabel && card.source === 'activity') {
    parts.push({ key: 'spots', label: card.spotsLabel });
  }

  return parts.slice(0, 5);
};

export const resolveBrowsePosterLabels = (card: ExploreCardModel): string[] => {
  const labels: string[] = [];
  if (card.source === 'activity') labels.push('Trip');
  if (card.source === 'demand') labels.push('Looking for');
  if (card.source === 'venue') labels.push('Spot');
  if (card.source === 'shop') labels.push('Shop');
  if (card.kind === 'hiking') labels.push('Hiking');
  if (card.kind === 'camping') labels.push('Camping');
  if (card.kind === 'rideshare') labels.push('Rideshare');
  if (card.kind === 'event') labels.push('Event');
  if (card.requirementBadges?.length) {
    labels.push(...card.requirementBadges.slice(0, 2));
  }
  return [...new Set(labels)].slice(0, 4);
};
