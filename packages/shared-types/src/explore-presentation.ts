import { isRolePlaceholderDisplayName, HOST_FALLBACK_DISPLAY_NAME } from './host-display.js';
import {
  resolveActivityHeadlinePersonName,
  resolveActivityPublisherRowPrimaryName,
} from './activity-actor-display.js';
import {
  explorePersonFirstName,
  explorePersonHeadlineName,
  formatExplorePersonDisplayName,
  resolveExploreFeaturedPerson,
  type ExploreFeaturedPersonInput,
  type ExploreMapPersonDTO,
} from './explore-person.js';
import type { PublishingProfileKind } from './publishing-profile-kind.js';
import { isGenericSeekingTitle, type SeekingTitleKind } from './seeking-titles.js';
import { activityJoinIsFull } from './activity-availability.js';
import {
  activityJoinCtaLabel,
  resolveParticipationMode,
  type ParticipationMode,
} from './activity-participation-mode.js';
import { exploreMapItemIsSeeking } from './explore-activity-mode.js';
import type { ExploreActivityMode } from './explore-activity-mode.js';
import {
  facilityPlaceKindPinEmoji,
  isFacilityPlaceKind,
  outdoorPlaceKindPinEmoji,
  type PlaceKind,
} from './place-kind.js';
import {
  FACILITY_MAP_SOURCE,
  PLACE_MAP_SOURCE,
  isFacilityMapSource,
  isGeographyMapSource,
  isPlaceMapSource,
  normalizeExploreMapSource,
  type ExploreMapSourceWire,
} from './wire-lexicon.js';

export type DiscoveryCardSource = ExploreMapSourceWire;

export {
  FACILITY_MAP_SOURCE,
  PLACE_MAP_SOURCE,
  isFacilityMapSource,
  isGeographyMapSource,
  isPlaceMapSource,
  normalizeExploreMapSource,
};

/** @deprecated Use {@link PLACE_MAP_SOURCE}. */
export const CATALOG_PLACE_MAP_SOURCE = PLACE_MAP_SOURCE;
/** @deprecated Use {@link isGeographyMapSource} (place + facility) or {@link isPlaceMapSource}. */
export const isCatalogPlaceMapSource = isGeographyMapSource;
export type DiscoveryCardKind = 'hiking' | 'camping' | 'event' | 'rideshare' | 'shop' | 'agency' | 'area';

export type DiscoveryCardBuildInput = {
  id: string;
  kind: DiscoveryCardKind | 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'rideshare';
  source: DiscoveryCardSource;
  activityMode?: ExploreActivityMode | null;
  participantIntentId?: string | null;
  title: string;
  subtitle?: string | null;
  featuredPerson?: ExploreMapPersonDTO | null;
  hostName?: string | null;
  hostAvatar?: string | null;
  requesterUserId?: string | null;
  date?: string | null;
  time?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  slotsAvailable?: number;
  slotsTotal?: number;
  participantPreviews?: Array<{ id: string; name: string; avatar?: string | null }>;
  about?: string | null;
  fromLabel?: string | null;
  toLabel?: string | null;
  websiteUrl?: string | null;
  shopPresence?: 'physical' | 'online' | null;
  activity?: {
    hostName?: string | null;
    hostUserId?: string | null;
    createdByName?: string | null;
    tenantName?: string | null;
    publishingProfileKind?: PublishingProfileKind | null;
    locationName?: string | null;
    meetingPoint?: string | null;
    startPoint?: string | null;
    time?: string | null;
    endDate?: string | null;
    endTime?: string | null;
    activityType?: string;
    requirements?: string[] | null;
    participationMode?: ParticipationMode | null;
    rideshareEnabled?: boolean;
  } | null;
  placeKind?: PlaceKind | null;
};

const itemParticipationMode = (item: DiscoveryCardBuildInput): ParticipationMode =>
  resolveParticipationMode(item.activity?.participationMode, item.activity?.requirements);

const PLACEHOLDER_FIRST_NAMES = new Set(['pending', 'user', 'guest', 'account', 'new']);

const formatRequesterDisplayName = (name?: string | null, email?: string | null): string => {
  const trimmed = name?.trim();
  if (!trimmed) return email ? email.split('@')[0] : 'Community member';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return trimmed;
  if (PLACEHOLDER_FIRST_NAMES.has(parts[0].toLowerCase())) return 'Community member';
  return trimmed;
};

const resolveExploreHostLabel = (options: {
  hostName?: string | null;
  participantName?: string | null;
  tenantName?: string | null;
}): string => {
  const host = options.hostName?.trim();
  if (host && !isRolePlaceholderDisplayName(host)) return formatExplorePersonDisplayName(host);
  const requester = options.participantName?.trim();
  if (requester && !isRolePlaceholderDisplayName(requester)) return formatExplorePersonDisplayName(requester);
  return HOST_FALLBACK_DISPLAY_NAME;
};

/** Hosted / scheduled hikes and hiking map filter. */
export const HIKING_ACTIVITY_EMOJI = '🥾';

/** Trail & hiking locations in lists and legend (map uses SVG venue chips, not this emoji). */
export const HIKING_VENUE_EMOJI = '⛰️';

/** Scheduled camping activities on the map. */
export const CAMPING_ACTIVITY_EMOJI = '🏕️';

/** Camping locations on the map. */
export const CAMPING_VENUE_EMOJI = '⛺';

/** “Looking for” / participant demand pins (hand raised). */
export const SEEKING_EMOJI = '🙋';

/** Explore map chrome — places / venue catalog layer (trails, spots, shops). */
export const EXPLORE_PLACES_LAYER_EMOJI = '📍';

/** UAE country filter pill — use with `font-emoji` so flags render on Windows. */
export const UAE_FLAG_EMOJI = '🇦🇪';

/** Scheduled rideshare activities and ride requests. */
export const RIDESHARE_EMOJI = '🚗';

/** Shop listings on the map. */
export const SHOP_MAP_EMOJI = '🛍️';

export const MAP_FILTER_EMOJI = {
  hiking: HIKING_ACTIVITY_EMOJI,
  camping: CAMPING_ACTIVITY_EMOJI,
  event: '🏃',
  shop: SHOP_MAP_EMOJI,
  agency: '🏢',
  rideshare: RIDESHARE_EMOJI,
} as const;

export const MAP_LAYER_FILTER_EMOJI = {
  others: '🏃',
  shops: SHOP_MAP_EMOJI,
} as const;

/** Resolve map item source; falls back to id prefix when source is missing from cache/API. */
export const resolveExploreItemSource = (
  item: Pick<DiscoveryCardBuildInput, 'id' | 'source' | 'activityMode' | 'participantIntentId'>
): DiscoveryCardSource => {
  const { id, source } = item;
  if (exploreMapItemIsSeeking(item)) return 'activity';
  if (
    source === 'activity' ||
    isGeographyMapSource(source) ||
    source === 'shop' ||
    source === 'agency' ||
    source === 'area'
  ) {
    return normalizeExploreMapSource(source);
  }
  if (id.startsWith('area:')) return 'area';
  if (id.startsWith('facility:')) return FACILITY_MAP_SOURCE;
  if (id.startsWith('place:') || id.startsWith('venue:')) return PLACE_MAP_SOURCE;
  if (id.startsWith('shop:')) return 'shop';
  if (id.startsWith('agency:')) return 'agency';
  return 'activity';
};

/** Map pin emoji source — id prefix wins so venues are never mis-tagged. */
export const resolveMapPinItemSource = (
  item: Pick<DiscoveryCardBuildInput, 'id' | 'source' | 'activityMode' | 'participantIntentId'>
): DiscoveryCardSource => {
  const { id } = item;
  if (id.startsWith('area:')) return 'area';
  if (id.startsWith('facility:')) return FACILITY_MAP_SOURCE;
  if (id.startsWith('place:') || id.startsWith('venue:')) return PLACE_MAP_SOURCE;
  if (id.startsWith('shop:')) return 'shop';
  if (id.startsWith('agency:')) return 'agency';
  return resolveExploreItemSource(item);
};

export const resolveMapPinEmoji = (
  kind: DiscoveryCardKind,
  source: DiscoveryCardSource = 'activity',
  _rideshareEndpoint?: 'from' | 'to',
  placeKind?: PlaceKind,
  seeking?: boolean
): string => {
  if (placeKind && isFacilityPlaceKind(placeKind)) {
    return facilityPlaceKindPinEmoji(placeKind);
  }
  if (placeKind === 'outdoor_other') {
    return outdoorPlaceKindPinEmoji();
  }

  if (isFacilityMapSource(source) || isPlaceMapSource(source)) {
    if (kind === 'hiking') return HIKING_VENUE_EMOJI;
    if (kind === 'camping') return CAMPING_VENUE_EMOJI;
    if (kind === 'event') return '🏃';
    return '📍';
  }

  if (source === 'shop') return SHOP_MAP_EMOJI;
  if (source === 'agency') return '🏢';
  if (seeking) {
    if (kind === 'rideshare') return RIDESHARE_EMOJI;
    return SEEKING_EMOJI;
  }

  if (kind === 'rideshare') return RIDESHARE_EMOJI;
  if (kind === 'hiking') return HIKING_ACTIVITY_EMOJI;
  if (kind === 'camping') return CAMPING_ACTIVITY_EMOJI;
  if (kind === 'event') return '🏃';
  if (kind === 'shop') return SHOP_MAP_EMOJI;
  if (kind === 'agency') return '🏢';
  return '📍';
};

interface ExploreHeadlineInput extends ExploreFeaturedPersonInput {
  source: DiscoveryCardSource;
  /** Set when wire uses `activity` + `activityMode: seeking` (not legacy `source: demand`). */
  isSeekingPin?: boolean;
  kind: DiscoveryCardKind;
  title: string;
  hostName?: string | null;
  tenantName?: string | null;
  location?: string | null;
  subtitle?: string | null;
  about?: string | null;
  date?: string | null;
  time?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  fromLabel?: string | null;
  toLabel?: string | null;
  participantName?: string | null;
  slotsAvailable?: number;
  slotsTotal?: number;
  participantCount?: number;
  activity?: DiscoveryCardBuildInput['activity'];
}

const headlineIsSeeking = (input: ExploreHeadlineInput): boolean =>
  input.isSeekingPin === true || exploreMapItemIsSeeking(input);

const joinExploreParts = (...parts: (string | null | undefined)[]): string =>
  parts.filter((part): part is string => Boolean(part?.trim())).join(' - ');

const isLegacyAutoTitle = (title: string, kind: DiscoveryCardKind): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (kind === 'hiking' && /^hiking\b/i.test(trimmed)) return true;
  if (kind === 'camping' && /^camping\b/i.test(trimmed)) return true;
  if (kind === 'rideshare' && (/^carpool\b/i.test(trimmed) || /^rideshare\b/i.test(trimmed))) return true;
  return false;
};

const mapSeekingTitleKind = (kind: DiscoveryCardKind): SeekingTitleKind => {
  if (kind === 'hiking' || kind === 'camping' || kind === 'rideshare' || kind === 'event') {
    return kind;
  }
  return 'other';
};

const fallbackSeekingTitlePhrase = (kind: DiscoveryCardKind): string => {
  switch (kind) {
    case 'hiking':
      return 'for a hike';
    case 'camping':
      return 'camping';
    case 'event':
      return 'to an outdoor event';
    case 'rideshare':
      return 'on a shared ride';
    default:
      return 'outdoors';
  }
};

/** Turn a user title into a mid-sentence phrase, e.g. "See sunrise at Kite Beach" → "to see sunrise at Kite Beach". */
export const formatSeekingTitlePhrase = (title: string, kind: DiscoveryCardKind): string => {
  const trimmed = title.trim();
  if (!trimmed || isLegacyAutoTitle(trimmed, kind)) return fallbackSeekingTitlePhrase(kind);

  const lower = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  if (/^(to|for|on|at|in)\s/i.test(trimmed)) return lower;
  if (/^(see|watch|join|run|hike|camp|explore|visit|go|climb|kayak|surf|meet|catch|enjoy)\b/i.test(trimmed)) {
    return `to ${lower}`;
  }
  return `to ${lower}`;
};

const seekingKindLabel = (kind: DiscoveryCardKind): string => {
  switch (kind) {
    case 'rideshare':
      return 'Rideshare';
    case 'hiking':
      return 'Hiking';
    case 'camping':
      return 'Camping';
    case 'event':
      return 'Other Outdoors';
    default:
      return 'company';
  }
};

/** Prefer the seeker's own words; fall back to the seeking type label when title is generic. */
const resolveSeekingActivityHighlight = (title: string, kind: DiscoveryCardKind): string => {
  const trimmed = title.trim();
  if (trimmed && !isGenericSeekingTitle(trimmed, mapSeekingTitleKind(kind))) {
    return trimmed;
  }
  return seekingKindLabel(kind);
};

const EXPLORE_EVENT_MONTHS = [
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

const EXPLORE_EVENT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const exploreScheduleDayStart = (value: Date): Date => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** Short weekday within the next 6 days (`Sat`); otherwise weekday plus `Sat 09 Nov 26`. */
export const formatExploreEventDateLabel = (
  date?: string | null,
  now: Date = new Date()
): string | null => {
  if (!date?.trim()) return null;
  const target = new Date(`${date.trim().slice(0, 10)}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const today = exploreScheduleDayStart(now);
  const targetDay = exploreScheduleDayStart(target);
  const diff = Math.round((targetDay.getTime() - today.getTime()) / 86400000);
  const weekday = EXPLORE_EVENT_WEEKDAYS[target.getDay()] ?? '';

  if (diff >= 0 && diff <= 6) return weekday;

  const day = String(target.getDate()).padStart(2, '0');
  const month = EXPLORE_EVENT_MONTHS[target.getMonth()] ?? '';
  const year = String(target.getFullYear()).slice(-2);
  return `${weekday} ${day} ${month} ${year}`;
};

/** Schedule chip — same rule as `formatExploreEventDateLabel`. */
export const formatExploreRelativeScheduleLabel = (
  date?: string | null,
  now: Date = new Date()
): string | null => formatExploreEventDateLabel(date, now);

export const formatExploreDayShort = (
  date?: string | null,
  now: Date = new Date()
): string | null => formatExploreEventDateLabel(date, now);

/** Stamp without weekday — e.g. `08 Nov 26` (reviews, member history). */
export const formatExploreCalendarDateShort = (value?: string | null): string | null => {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const parsed = new Date(trimmed.includes('T') ? trimmed : `${trimmed.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = EXPLORE_EVENT_MONTHS[parsed.getMonth()] ?? '';
  const year = String(parsed.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
};

/** Mid-sentence day phrase for card titles, e.g. " on Sat", " on Sat 09 Nov 26". */
export const formatExploreDayForHeadline = (
  date?: string | null,
  now: Date = new Date()
): string | null => {
  const label = formatExploreEventDateLabel(date, now);
  return label ? ` on ${label}` : null;
};

export type ExploreClockStyle = '12' | '24';

let exploreClockStyle: ExploreClockStyle = '12';

/** Display preference from app settings (`/settings`). Defaults to 12-hour with AM/PM. */
export const setExploreClockStyle = (style: ExploreClockStyle): void => {
  exploreClockStyle = style;
};

export const getExploreClockStyle = (): ExploreClockStyle => exploreClockStyle;

/** Always includes minutes. 12-hour times include AM/PM (`7:00 AM`). */
export const formatExploreTime = (
  time?: string | null,
  clock: ExploreClockStyle = exploreClockStyle
): string | null => {
  if (!time?.trim()) return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time.trim();

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) return time.trim();

  const minuteText = String(minutes).padStart(2, '0');
  if (clock === '24') return `${String(hours).padStart(2, '0')}:${minuteText}`;

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minuteText} ${period}`;
};

/** Clock time for a timestamp, using the display preference (`7:00 AM` or `07:00`). */
export const formatExploreClockFromDate = (
  date: Date,
  clock: ExploreClockStyle = exploreClockStyle
): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return formatExploreTime(`${hours}:${minutes}`, clock) ?? '';
};

export const buildExploreWhenSegment = (
  date?: string | null,
  time?: string | null,
  suffix?: 'flexible' | 'fixed' | null,
  endDate?: string | null,
  endTime?: string | null
): string | null => {
  const startYmd = date?.trim().slice(0, 10);
  const endYmd = endDate?.trim().slice(0, 10);
  const day =
    startYmd && endYmd && endYmd > startYmd
      ? formatExploreDayRangeForList(date, endDate)?.replace(' – ', ' to ')
      : formatExploreDayShort(date);
  const clock = formatExploreClockRangeForList(time, endTime) ?? formatExploreTime(time);
  let segment: string | null = null;

  if (day && clock) segment = `${day} at ${clock}`;
  else if (day) segment = day;
  else if (clock) segment = clock;

  if (!segment) return null;
  if (suffix === 'flexible') return `${segment} (flexible)`;
  if (suffix === 'fixed') return `${segment} (fixed)`;
  return segment;
};

const splitCombinedRideshareRoute = (
  value: string
): { fromLabel: string; toLabel: string } | null => {
  const parts = value
    .split(/\s*(?:→|->)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  return { fromLabel: parts[0], toLabel: parts[parts.length - 1] };
};

/** Undo legacy rows that stored `A → B` in both meetingPoint and startPoint. */
export const normalizeRideshareRouteLabels = (
  fromLabel?: string | null,
  toLabel?: string | null
): { fromLabel: string | null; toLabel: string | null } => {
  const from = fromLabel?.trim() || null;
  const to = toLabel?.trim() || null;

  if (!from && !to) return { fromLabel: null, toLabel: null };

  if (from && !to) {
    const split = splitCombinedRideshareRoute(from);
    if (split) return split;
    return { fromLabel: from, toLabel: null };
  }

  if (!from && to) {
    const split = splitCombinedRideshareRoute(to);
    if (split) return split;
    return { fromLabel: null, toLabel: to };
  }

  if (from && to && from === to) {
    const split = splitCombinedRideshareRoute(from);
    if (split) return split;
    return { fromLabel: from, toLabel: to };
  }

  if (from) {
    const splitFrom = splitCombinedRideshareRoute(from);
    if (splitFrom && (to === from || to === splitFrom.fromLabel || to === splitFrom.toLabel)) {
      return splitFrom;
    }
  }

  if (to) {
    const splitTo = splitCombinedRideshareRoute(to);
    if (splitTo && (from === to || from === splitTo.fromLabel || from === splitTo.toLabel)) {
      return splitTo;
    }
  }

  return { fromLabel: from, toLabel: to };
};

export const buildExploreRouteLabel = (
  fromLabel?: string | null,
  toLabel?: string | null,
  kind?: DiscoveryCardKind
): string | null => {
  if (kind !== 'rideshare') return null;
  const { fromLabel: from, toLabel: to } = normalizeRideshareRouteLabels(fromLabel, toLabel);
  if (!from || !to || from === to) return null;
  return `${from} to ${to}`;
};

export const buildExploreSpotsSegment = (
  slotsAvailable?: number,
  slotsTotal?: number
): string | null => {
  const count = (slotsAvailable ?? 0) > 0 ? slotsAvailable! : slotsTotal ?? 0;
  if (count <= 0) return null;
  return `${count} spots`;
};

/** Peek / list capacity — filled seats or spots out of total (e.g. `3/5`). */
export const buildExplorePeekSpotsLabel = (
  slotsAvailable?: number | null,
  slotsTotal?: number | null,
  participantCount?: number | null
): string | null => {
  const total = slotsTotal ?? 0;
  if (total <= 0) return null;
  const available = slotsAvailable ?? total;
  let filled = Math.max(0, total - available);
  if (filled === 0 && (participantCount ?? 0) > 0) {
    filled = Math.min(participantCount ?? 0, total);
  }
  return `${filled}/${total}`;
};

/** Activity detail key facts — open spots remaining (e.g. `19 of 20 spots left`). */
export const buildActivitySpotsLeftLabel = (
  slotsAvailable?: number | null,
  slotsTotal?: number | null,
  opts?: { participantCount?: number | null; countsGoing?: number | null }
): string | null => {
  const total = slotsTotal ?? 0;
  if (total <= 0) return null;
  const available = slotsAvailable ?? total;
  let filled = Math.max(0, total - available);
  const fromCounts = opts?.countsGoing ?? 0;
  const fromParticipants = opts?.participantCount ?? 0;
  if (filled === 0 && (fromCounts > 0 || fromParticipants > 0)) {
    filled = Math.min(Math.max(fromCounts, fromParticipants), total);
  } else {
    filled = Math.min(Math.max(filled, fromCounts, fromParticipants), total);
  }
  const left = Math.max(0, total - filled);
  return `${left} of ${total} spots left`;
};

/** Hide raw map-pin coordinate labels from card copy. */
export const sanitizeExploreLocation = (label?: string | null): string | null => {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  if (/^[\d.-]+,\s*[\d.-]+$/.test(trimmed)) return null;
  if (/map spot/i.test(trimmed) && /[\d.-]+/.test(trimmed)) return null;
  return trimmed;
};

const formatExploreDayRangeForList = (
  startDate?: string | null,
  endDate?: string | null
): string | null => {
  const start = startDate ? formatExploreEventDateLabel(startDate) : null;
  if (!start) return null;
  const end = endDate?.trim().slice(0, 10);
  const startYmd = startDate?.trim().slice(0, 10);
  if (!end || !startYmd || end === startYmd) return start;
  const endLabel = formatExploreEventDateLabel(end);
  return endLabel && endLabel !== start ? `${start} – ${endLabel}` : start;
};

const formatExploreClockRangeForList = (
  startTime?: string | null,
  endTime?: string | null
): string | null => {
  const start = formatExploreTime(startTime);
  if (!start) return null;
  const end = formatExploreTime(endTime?.trim().slice(0, 5));
  if (!end || end === start) return start;
  return `${start} – ${end}`;
};

export const buildExploreListWhen = (
  date?: string | null,
  time?: string | null,
  endDate?: string | null,
  endTime?: string | null
): string | null => {
  const day = formatExploreDayRangeForList(date, endDate);
  const clock = formatExploreClockRangeForList(time, endTime);
  if (!day) return clock ?? formatExploreTime(time);
  return clock ? `${day} · ${clock}` : day;
};

const buildExploreListGoingLabel = (
  input: ExploreHeadlineInput & { participantCount?: number }
): string | null => {
  if (headlineIsSeeking(input)) {
    const count = input.slotsTotal ?? 0;
    return count > 0 ? `${count} going` : null;
  }
  if (input.source !== 'activity') return null;

  const filled = Math.max(
    input.participantCount ?? 0,
    (input.slotsTotal ?? 0) - (input.slotsAvailable ?? 0)
  );
  if (filled > 0) return `${filled} going`;

  const open = input.slotsAvailable ?? input.slotsTotal ?? 0;
  return open > 0 ? `${open} spots` : null;
};

const exploreHostLabel = (input: ExploreHeadlineInput): string =>
  resolveExploreHostLabel({
    hostName: input.hostName,
    participantName: input.participantName,
    tenantName: input.tenantName,
  });

const resolveHeadlinePerson = (input: ExploreHeadlineInput): ExploreMapPersonDTO | null =>
  input.featuredPerson ?? resolveExploreFeaturedPerson(input);

const activityActorNameInput = (input: ExploreHeadlineInput) => ({
  publishingProfileKind: input.activity?.publishingProfileKind,
  tenantName: input.activity?.tenantName ?? input.tenantName,
  hostName: input.activity?.hostName ?? input.hostName,
  createdByName: input.activity?.createdByName,
  featuredPerson: resolveHeadlinePerson(input),
});

const seekingPersonLabel = (input: ExploreHeadlineInput, form: 'peek' | 'headline'): string => {
  const person = resolveHeadlinePerson(input);
  if (person && !isRolePlaceholderDisplayName(person.displayName)) {
    return form === 'peek' ? explorePersonFirstName(person) : explorePersonHeadlineName(person);
  }
  const raw = input.activity?.createdByName ?? input.hostName;
  const formatted = formatRequesterDisplayName(raw);
  if (form === 'peek') {
    const first = formatted.split(/\s+/).filter(Boolean)[0];
    return first && !isRolePlaceholderDisplayName(first) ? first : formatted;
  }
  return formatted;
};

/** Person label for headlines — always a member name, never operator brand. */
const exploreHeadlinePersonLabel = (input: ExploreHeadlineInput): string => {
  if (headlineIsSeeking(input)) {
    return seekingPersonLabel(input, 'headline');
  }
  if (input.source === 'activity') {
    return resolveActivityHeadlinePersonName(activityActorNameInput(input));
  }
  const person = resolveHeadlinePerson(input);
  if (person) return formatExplorePersonDisplayName(person.displayName);
  return exploreHostLabel(input);
};

const buildExploreListTitle = (input: ExploreHeadlineInput): string => {
  if (isGeographyMapSource(input.source) || input.source === 'shop' || input.source === 'agency') {
    return input.title.trim() || 'Listing';
  }

  if (headlineIsSeeking(input)) {
    const user = exploreHeadlinePersonLabel(input);
    const trimmed = input.title.trim();
    if (trimmed && !isGenericSeekingTitle(trimmed, mapSeekingTitleKind(input.kind))) {
      return trimmed;
    }
    return `${resolveSeekingActivityHighlight(input.title, input.kind)} · ${user}`;
  }

  if (input.kind === 'rideshare') {
    const dest = input.toLabel?.trim();
    const day = formatExploreDayForHeadline(input.date);
    if (dest) return `Rideshare to ${dest}${day ?? ''}`;
    return `Rideshare${day ?? ''}`;
  }

  const host = exploreHeadlinePersonLabel(input);
  const day = formatExploreDayForHeadline(input.date);
  return `${host} is going ${seekingKindLabel(input.kind)}${day ?? ''}`;
};

export const exploreHeadline = (input: ExploreHeadlineInput): string => {
  if (isGeographyMapSource(input.source) || input.source === 'shop' || input.source === 'agency') {
    return input.title.trim() || 'Listing';
  }

  const route = buildExploreRouteLabel(input.fromLabel, input.toLabel, input.kind);
  const whenSuffix =
    headlineIsSeeking(input) ? 'flexible' : input.kind === 'rideshare' ? 'fixed' : null;
  const when = buildExploreWhenSegment(
    input.date,
    input.time,
    whenSuffix,
    input.endDate,
    input.endTime
  );
  const location = sanitizeExploreLocation(input.location);

  if (headlineIsSeeking(input)) {
    const user = exploreHeadlinePersonLabel(input);
    const day = formatExploreDayForHeadline(input.date);
    const activityLabel = resolveSeekingActivityHighlight(input.title, input.kind);
    const lead = `${user} is looking for ${activityLabel}${day ?? ''}`;
    return joinExploreParts(lead, route ?? location, when);
  }

  if (input.kind === 'rideshare') {
    const host = exploreHeadlinePersonLabel(input);
    const day = formatExploreDayForHeadline(input.date);
    return joinExploreParts(`${host} is offering Rideshare${day ?? ''}`, route, when);
  }

  if (
    input.source === 'activity' &&
    input.kind === 'event' &&
    resolveParticipationMode(input.activity?.participationMode, input.activity?.requirements) === 'rsvp'
  ) {
    const when = buildExploreWhenSegment(
      input.date,
      input.time,
      null,
      input.endDate,
      input.endTime
    );
    if (when) return `I'm going · ${when}`;
    const day = formatExploreDayForHeadline(input.date);
    return day ? `I'm going${day}` : "I'm going";
  }

  const host = exploreHeadlinePersonLabel(input);
  const day = formatExploreDayForHeadline(input.date);
  const spots =
    input.source === 'activity'
      ? buildExploreSpotsSegment(input.slotsAvailable, input.slotsTotal)
      : null;
  return joinExploreParts(`${host} is going ${seekingKindLabel(input.kind)}${day ?? ''}`, location, when, spots);
};

export type DiscoveryCardDetailIcon = 'location' | 'time' | 'spots' | 'route' | 'price';

export interface DiscoveryCardDetail {
  icon: DiscoveryCardDetailIcon;
  label: string;
}

export interface DiscoveryCardSections {
  plainTitle?: string | null;
  highlightName?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  titleText?: string | null;
  hostName?: string | null;
  activityHighlight?: string | null;
  dateHighlight?: string | null;
  partyLabel?: string | null;
  aboutLine?: string | null;
  listTitle: string;
  listWhen: string | null;
  listGoing: string | null;
  details: DiscoveryCardDetail[];
}

const finishDiscoveryCardSections = (
  input: ExploreHeadlineInput,
  sections: Omit<DiscoveryCardSections, 'listTitle' | 'listWhen' | 'listGoing'> & {
    participantCount?: number;
  }
): DiscoveryCardSections => {
  const { participantCount, ...rest } = sections;
  return {
    ...rest,
    listTitle: buildExploreListTitle(input),
    listWhen: buildExploreListWhen(input.date, input.time, input.endDate, input.endTime),
    listGoing: buildExploreListGoingLabel({ ...input, participantCount }),
  };
};

export const buildDiscoveryCardSections = (input: ExploreHeadlineInput): DiscoveryCardSections => {
  const details: DiscoveryCardDetail[] = [];
  const push = (icon: DiscoveryCardDetailIcon, label?: string | null) => {
    if (label?.trim()) details.push({ icon, label: label.trim() });
  };

  if (isGeographyMapSource(input.source) || input.source === 'shop' || input.source === 'agency') {
    push('location', input.subtitle);
    return finishDiscoveryCardSections(input, {
      plainTitle: exploreHeadline(input),
      aboutLine: input.about?.trim() || null,
      details,
    });
  }

  const route = buildExploreRouteLabel(input.fromLabel, input.toLabel, input.kind);
  const whenSuffix =
    headlineIsSeeking(input) ? 'flexible' : input.kind === 'rideshare' ? 'fixed' : null;
  const when = buildExploreWhenSegment(
    input.date,
    input.time,
    whenSuffix,
    input.endDate,
    input.endTime
  );
  const spots =
    input.source === 'activity' && !headlineIsSeeking(input) && input.kind !== 'rideshare'
      ? buildExploreSpotsSegment(input.slotsAvailable, input.slotsTotal)
      : null;
  const partyLabel = buildExplorePeekSpotsLabel(
    input.slotsAvailable,
    input.slotsTotal,
    input.participantCount
  );
  const location = sanitizeExploreLocation(input.location);

  if (headlineIsSeeking(input)) {
    const user = seekingPersonLabel(input, 'peek');
    push('route', route);
    push('location', input.kind !== 'rideshare' ? location : null);
    push('time', when);

    return finishDiscoveryCardSections(input, {
      highlightName: user,
      suffix: ' is looking for ',
      activityHighlight: resolveSeekingActivityHighlight(input.title, input.kind),
      dateHighlight: formatExploreDayForHeadline(input.date),
      details,
      partyLabel,
    });
  }

  if (input.kind === 'rideshare') {
    const host = exploreHeadlinePersonLabel(input);
    push('route', route);
    push('time', when);

    return finishDiscoveryCardSections(input, {
      highlightName: host,
      suffix: ' is offering ',
      activityHighlight: 'Rideshare',
      dateHighlight: formatExploreDayForHeadline(input.date),
      details,
      partyLabel,
    });
  }

  const host = exploreHeadlinePersonLabel(input);
  const activityTitle = input.title.trim();

  push('location', location);
  push('time', when);
  push('spots', spots);
  if (input.source === 'activity' && input.activity?.rideshareEnabled) {
    push('route', 'Rideshare available');
  }
  if (activityTitle && !isLegacyAutoTitle(activityTitle, input.kind)) {
    push('route', activityTitle);
  }

  return finishDiscoveryCardSections(input, {
    highlightName: host,
    suffix: ' is going ',
    activityHighlight: seekingKindLabel(input.kind),
    dateHighlight: formatExploreDayForHeadline(input.date),
    details,
    participantCount: input.participantCount,
    partyLabel,
  });
};

export const exploreSubtitle = (
  item: DiscoveryCardBuildInput,
  kind: DiscoveryCardKind,
  source: DiscoveryCardSource
): string | null => {
  if (isGeographyMapSource(source)) return item.subtitle?.trim() || null;
  if (exploreMapItemIsSeeking(item)) {
    if (kind === 'rideshare') return null;
    return item.subtitle?.trim() || null;
  }
  if (source === 'shop' || source === 'agency') return item.subtitle ?? null;
  return item.subtitle ?? item.activity?.locationName ?? null;
};

export const exploreSpotsLabel = (item: DiscoveryCardBuildInput): string | null => {
  if (exploreMapItemIsSeeking(item)) return null;
  if (item.source !== 'activity') return null;
  return buildExploreSpotsSegment(item.slotsAvailable, item.slotsTotal);
};

export const explorePrimaryCtaLabel = (
  source: DiscoveryCardSource,
  options?: {
    participationMode?: ParticipationMode | null;
    requirements?: string[] | null;
    seeking?: boolean;
    slotsTotal?: number | null;
    slotsAvailable?: number | null;
    requiresSignIn?: boolean;
    price?: number | null;
    pricingMode?: import('./activity-pricing.js').ActivityPricingMode | null;
  }
): string => {
  if (options?.seeking) return 'Request to join';
  if (source === 'shop') return 'View shop';
  if (source === 'agency') return 'View agency';
  if (source === 'activity') {
    return activityJoinCtaLabel({
      participationMode: options?.participationMode,
      requirements: options?.requirements,
      isFull: activityJoinIsFull({
        slotsTotal: options?.slotsTotal,
        slotsAvailable: options?.slotsAvailable,
      }),
      requiresSignIn: options?.requiresSignIn,
      price: options?.price,
      pricingMode: options?.pricingMode,
    });
  }
  return 'View details';
};

export const exploreSecondaryCtaLabel = (
  source: DiscoveryCardSource,
  options?: { websiteUrl?: string | null; seeking?: boolean }
): string | null => {
  if (source === 'activity' && !options?.seeking) return 'View details';
  if (options?.seeking) return 'Message';
  if (source === 'shop' && options?.websiteUrl) return 'Visit website';
  return null;
};

const exploreAgencyHint = (): string => 'Outdoor host on UAE Trail — see plans and connect.';

export const exploreVenueHint = (
  source: DiscoveryCardSource,
  kind: DiscoveryCardKind,
  shopPresence?: 'physical' | 'online' | null,
  seeking?: boolean
): string | null => {
  if (seeking) return null;
  if (source === 'shop') {
    return shopPresence === 'online' ? 'Online gear partner' : 'Gear shop on the map';
  }
  if (source === 'agency') return exploreAgencyHint();
  if (!isGeographyMapSource(source)) return null;
  if (kind === 'hiking') return 'Hiking trail location';
  if (kind === 'camping') return 'Camping location';
  return 'Event location';
};

export interface DiscoveryCardPresentationDTO {
  kind: DiscoveryCardKind;
  source: DiscoveryCardSource;
  emoji: string;
  headline: string;
  listTitle: string;
  listHost: string | null;
  featuredPerson?: ExploreMapPersonDTO | null;
  subtitle: string | null;
  spotsLabel: string | null;
  venueHint: string | null;
  primaryCta: string;
  secondaryCta: string | null;
  shareText: string | null;
  routeLabel: string | null;
  whenLabel: string | null;
  sections: DiscoveryCardSections;
}

const isRideshareExploreItem = (item: DiscoveryCardBuildInput): boolean =>
  item.kind === 'rideshare' || item.activity?.activityType === 'rideshare';

const resolveDiscoveryCardKind = (item: DiscoveryCardBuildInput): DiscoveryCardKind => {
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'agency') return 'agency';
  if (isRideshareExploreItem(item)) return 'rideshare';
  return item.kind as DiscoveryCardKind;
};

/** Server-side discovery card copy — single source of truth for map/list/sheet headlines. */
export const buildDiscoveryCardPresentation = (
  item: DiscoveryCardBuildInput
): DiscoveryCardPresentationDTO => {
  const source = resolveExploreItemSource(item);
  if (source === 'area') {
    const subtitle = item.subtitle?.trim() || null;
    return {
      kind: 'area',
      source: 'area',
      emoji: '🗺️',
      headline: item.title,
      listTitle: item.title,
      listHost: subtitle,
      subtitle,
      spotsLabel: null,
      venueHint: null,
      primaryCta: 'See outings',
      secondaryCta: 'Area page',
      shareText: null,
      routeLabel: null,
      whenLabel: null,
      sections: {
        listTitle: item.title,
        listWhen: null,
        listGoing: null,
        details: [],
      },
    };
  }
  const kind = resolveDiscoveryCardKind(item);
  const isSeekingPin = exploreMapItemIsSeeking(item);
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;
  const routeLabel = buildExploreRouteLabel(fromLabel, toLabel, kind);
  const whenSuffix = isSeekingPin ? 'flexible' : kind === 'rideshare' ? 'fixed' : null;
  const endDate = item.endDate ?? activity?.endDate ?? null;
  const endTime = item.endTime ?? activity?.endTime ?? null;
  const whenLabel = buildExploreWhenSegment(
    item.date,
    item.time ?? activity?.time ?? null,
    whenSuffix,
    endDate,
    endTime
  );
  const location = sanitizeExploreLocation(
    item.subtitle?.trim() ||
      activity?.locationName?.trim() ||
      activity?.meetingPoint?.trim() ||
      null
  );
  const subtitle = exploreSubtitle(item, kind, source);
  const featuredPerson = resolveExploreFeaturedPerson(item);

  const headlineInput: ExploreHeadlineInput = {
    source,
    isSeekingPin,
    kind,
    title: item.title,
    featuredPerson,
    hostName: activity?.hostName ?? item.hostName,
    tenantName: activity?.tenantName ?? null,
    location,
    subtitle,
    about: item.about ?? null,
    date: item.date,
    time: item.time ?? activity?.time ?? null,
    endDate,
    endTime,
    fromLabel,
    toLabel,
    slotsAvailable: item.slotsAvailable,
    slotsTotal: item.slotsTotal,
    participantCount: item.participantPreviews?.length ?? 0,
    requesterUserId: item.requesterUserId,
    hostAvatar: item.hostAvatar,
    activity,
  };

  const sections = buildDiscoveryCardSections(headlineInput);

  return {
    kind,
    source,
    emoji: resolveMapPinEmoji(
      kind,
      source,
      undefined,
      item.placeKind ?? undefined,
      isSeekingPin
    ),
    headline: exploreHeadline(headlineInput),
    listTitle: sections.listTitle,
    listHost:
      source === 'activity' && activity
        ? resolveActivityPublisherRowPrimaryName({
            publishingProfileKind: activity.publishingProfileKind,
            tenantName: activity.tenantName ?? null,
            hostName: activity.hostName ?? item.hostName,
            createdByName: activity.createdByName,
            featuredPerson,
          })
        : featuredPerson?.displayName ?? null,
    featuredPerson,
    subtitle,
    spotsLabel: exploreSpotsLabel(item),
    venueHint: exploreVenueHint(source, kind, item.shopPresence, isSeekingPin),
    primaryCta: explorePrimaryCtaLabel(source, {
      participationMode: itemParticipationMode(item),
      requirements: activity?.requirements,
      seeking: isSeekingPin,
      slotsTotal: item.slotsTotal,
      slotsAvailable: item.slotsAvailable,
    }),
    secondaryCta: exploreSecondaryCtaLabel(source, {
      websiteUrl: item.websiteUrl,
      seeking: isSeekingPin,
    }),
    shareText: [routeLabel, whenLabel].filter(Boolean).join(' · ') || item.subtitle || null,
    routeLabel,
    whenLabel,
    sections,
  };
};
