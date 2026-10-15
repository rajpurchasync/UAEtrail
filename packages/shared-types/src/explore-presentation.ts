import { isRolePlaceholderDisplayName, ORGANIZER_FALLBACK_DISPLAY_NAME } from './host-display.js';
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
import { isGenericDemandPlanTitle, type DemandTitleKind } from './demand-titles.js';
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

export type ExploreCardSource = 'activity' | 'venue' | 'shop' | 'agency' | 'demand' | 'area';
export type ExploreCardKind = 'hiking' | 'camping' | 'event' | 'rideshare' | 'shop' | 'agency' | 'area';

export type ExplorePresentationBuildInput = {
  id: string;
  kind: ExploreCardKind | 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'rideshare';
  source: ExploreCardSource;
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
    activityType?: string;
    requirements?: string[] | null;
    participationMode?: ParticipationMode | null;
    rideshareEnabled?: boolean;
  } | null;
  placeKind?: PlaceKind | null;
};

const itemParticipationMode = (item: ExplorePresentationBuildInput): ParticipationMode =>
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
  return ORGANIZER_FALLBACK_DISPLAY_NAME;
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
export const DEMAND_EMOJI = '🙋';

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
  item: Pick<ExplorePresentationBuildInput, 'id' | 'source' | 'activityMode' | 'participantIntentId'>
): ExploreCardSource => {
  const { id, source } = item;
  if (exploreMapItemIsSeeking(item)) return 'activity';
  if (
    source === 'activity' ||
    source === 'venue' ||
    source === 'shop' ||
    source === 'agency' ||
    source === 'demand' ||
    source === 'area'
  ) {
    return source;
  }
  if (id.startsWith('area:')) return 'area';
  if (id.startsWith('venue:')) return 'venue';
  if (id.startsWith('demand:')) return 'activity';
  if (id.startsWith('shop:')) return 'shop';
  if (id.startsWith('agency:')) return 'agency';
  return 'activity';
};

/** Map pin emoji source — id prefix wins so venues are never mis-tagged. */
export const resolveMapPinItemSource = (
  item: Pick<ExplorePresentationBuildInput, 'id' | 'source' | 'activityMode' | 'participantIntentId'>
): ExploreCardSource => {
  const { id } = item;
  if (id.startsWith('area:')) return 'area';
  if (id.startsWith('venue:')) return 'venue';
  if (id.startsWith('demand:')) return 'activity';
  if (id.startsWith('shop:')) return 'shop';
  if (id.startsWith('agency:')) return 'agency';
  return resolveExploreItemSource(item);
};

export const resolveMapPinEmoji = (
  kind: ExploreCardKind,
  source: ExploreCardSource = 'activity',
  _rideshareEndpoint?: 'from' | 'to',
  placeKind?: PlaceKind
): string => {
  if (placeKind && isFacilityPlaceKind(placeKind)) {
    return facilityPlaceKindPinEmoji(placeKind);
  }
  if (placeKind === 'outdoor_other') {
    return outdoorPlaceKindPinEmoji();
  }

  if (source === 'venue') {
    if (kind === 'hiking') return HIKING_VENUE_EMOJI;
    if (kind === 'camping') return CAMPING_VENUE_EMOJI;
    if (kind === 'event') return '🏃';
    return '📍';
  }

  if (source === 'shop') return SHOP_MAP_EMOJI;
  if (source === 'agency') return '🏢';
  if (source === 'demand') {
    if (kind === 'rideshare') return RIDESHARE_EMOJI;
    return DEMAND_EMOJI;
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
  source: ExploreCardSource;
  /** Set when wire uses `activity` + `activityMode: seeking` (not legacy `source: demand`). */
  isSeekingPin?: boolean;
  kind: ExploreCardKind;
  title: string;
  hostName?: string | null;
  tenantName?: string | null;
  location?: string | null;
  subtitle?: string | null;
  about?: string | null;
  date?: string | null;
  time?: string | null;
  fromLabel?: string | null;
  toLabel?: string | null;
  participantName?: string | null;
  slotsAvailable?: number;
  slotsTotal?: number;
  participantCount?: number;
  activity?: ExplorePresentationBuildInput['activity'];
}

const headlineIsSeeking = (input: ExploreHeadlineInput): boolean =>
  input.isSeekingPin === true ||
  input.source === 'demand' ||
  exploreMapItemIsSeeking(input);

const joinExploreParts = (...parts: (string | null | undefined)[]): string =>
  parts.filter((part): part is string => Boolean(part?.trim())).join(' - ');

const isLegacyAutoTitle = (title: string, kind: ExploreCardKind): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (kind === 'hiking' && /^hiking\b/i.test(trimmed)) return true;
  if (kind === 'camping' && /^camping\b/i.test(trimmed)) return true;
  if (kind === 'rideshare' && (/^carpool\b/i.test(trimmed) || /^rideshare\b/i.test(trimmed))) return true;
  return false;
};

const mapDemandTitleKind = (kind: ExploreCardKind): DemandTitleKind => {
  if (kind === 'hiking' || kind === 'camping' || kind === 'rideshare' || kind === 'event') {
    return kind;
  }
  return 'other';
};

const fallbackPlanPhrase = (kind: ExploreCardKind): string => {
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

/** Turn a user title into a mid-sentence plan phrase, e.g. "See sunrise at Kite Beach" → "to see sunrise at Kite Beach". */
export const formatPlanPhrase = (title: string, kind: ExploreCardKind): string => {
  const trimmed = title.trim();
  if (!trimmed || isLegacyAutoTitle(trimmed, kind)) return fallbackPlanPhrase(kind);

  const lower = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  if (/^(to|for|on|at|in)\s/i.test(trimmed)) return lower;
  if (/^(see|watch|join|run|hike|camp|explore|visit|go|climb|kayak|surf|meet|catch|enjoy)\b/i.test(trimmed)) {
    return `to ${lower}`;
  }
  return `to ${lower}`;
};

const demandKindLabel = (kind: ExploreCardKind): string => {
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

/** Prefer the requester's own words; fall back to the demand type label when title is generic. */
const resolveDemandActivityHighlight = (title: string, kind: ExploreCardKind): string => {
  const trimmed = title.trim();
  if (trimmed && !isGenericDemandPlanTitle(trimmed, mapDemandTitleKind(kind))) {
    return trimmed;
  }
  return demandKindLabel(kind);
};

const exploreScheduleDayStart = (value: Date): Date => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const exploreScheduleIso = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const exploreMondayOfWeek = (value: Date): Date => {
  const copy = exploreScheduleDayStart(value);
  const mondayOffset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - mondayOffset);
  return copy;
};

const exploreWeekRange = (anchor: Date): { start: string; end: string } => {
  const start = exploreMondayOfWeek(anchor);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: exploreScheduleIso(start), end: exploreScheduleIso(end) };
};

const exploreMonthRange = (anchor: Date): { start: string; end: string } => {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { start: exploreScheduleIso(start), end: exploreScheduleIso(end) };
};

/** Smart schedule chip — Today, Tomorrow, This week, Next week, This month, Next month, or short date. */
export const formatExploreRelativeScheduleLabel = (
  date?: string | null,
  now: Date = new Date()
): string | null => {
  if (!date?.trim()) return null;
  const target = new Date(`${date.trim()}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const today = exploreScheduleDayStart(now);
  const targetDay = exploreScheduleDayStart(target);
  const diff = Math.round((targetDay.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';

  const targetIso = exploreScheduleIso(targetDay);
  const thisWeek = exploreWeekRange(today);
  if (targetIso >= thisWeek.start && targetIso <= thisWeek.end) return 'This week';

  const nextWeekAnchor = new Date(thisWeek.start);
  nextWeekAnchor.setDate(nextWeekAnchor.getDate() + 7);
  const nextWeek = exploreWeekRange(nextWeekAnchor);
  if (targetIso >= nextWeek.start && targetIso <= nextWeek.end) return 'Next week';

  const thisMonth = exploreMonthRange(today);
  if (targetIso >= thisMonth.start && targetIso <= thisMonth.end) return 'This month';

  const nextMonthAnchor = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonth = exploreMonthRange(nextMonthAnchor);
  if (targetIso >= nextMonth.start && targetIso <= nextMonth.end) return 'Next month';

  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatExploreDayShort = (date?: string | null): string | null => {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return target.toLocaleDateString('en-US', { weekday: 'short' });
};

/** Mid-sentence day phrase for card titles, e.g. " on Sunday 7th", " today". */
export const formatExploreDayForHeadline = (date?: string | null): string | null => {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  const weekday = target.toLocaleDateString('en-US', { weekday: 'long' });
  const dayLabel = formatExploreDayOrdinal(target.getDate());

  if (diff === 0) return ' today';
  if (diff === 1) return ' tomorrow';
  return ` on ${weekday} ${dayLabel}`;
};

const formatExploreDayOrdinal = (day: number): string => {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  if (mod10 === 1) return `${day}st`;
  if (mod10 === 2) return `${day}nd`;
  if (mod10 === 3) return `${day}rd`;
  return `${day}th`;
};

export const formatExploreTime = (time?: string | null): string | null => {
  if (!time?.trim()) return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time.trim();

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time.trim();

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  if (minutes === 0) {
    if (hours > 0 && hours < 12) return `${hour12}:00`;
    return `${hour12} ${period}`;
  }

  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
};

export const buildExploreWhenSegment = (
  date?: string | null,
  time?: string | null,
  suffix?: 'flexible' | 'fixed' | null
): string | null => {
  const day = formatExploreDayShort(date);
  const clock = formatExploreTime(time);
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
  kind?: ExploreCardKind
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

/** Hide raw map-pin coordinate labels from card copy. */
export const sanitizeExploreLocation = (label?: string | null): string | null => {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  if (/^[\d.-]+,\s*[\d.-]+$/.test(trimmed)) return null;
  if (/map spot/i.test(trimmed) && /[\d.-]+/.test(trimmed)) return null;
  return trimmed;
};

export const buildExploreListWhen = (date?: string | null, time?: string | null): string | null => {
  const day = date ? formatExploreRelativeScheduleLabel(date) : null;
  if (!day) return formatExploreTime(time);
  const shortDay = day === 'Tomorrow' ? 'Tmr' : day;
  const clock = formatExploreTime(time);
  return clock ? `${shortDay} · ${clock}` : shortDay;
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
  if (input.source === 'venue' || input.source === 'shop' || input.source === 'agency') {
    return input.title.trim() || 'Listing';
  }

  if (headlineIsSeeking(input)) {
    const user = exploreHeadlinePersonLabel(input);
    const trimmed = input.title.trim();
    if (trimmed && !isGenericDemandPlanTitle(trimmed, mapDemandTitleKind(input.kind))) {
      return trimmed;
    }
    return `${resolveDemandActivityHighlight(input.title, input.kind)} · ${user}`;
  }

  if (input.kind === 'rideshare') {
    const dest = input.toLabel?.trim();
    const day = formatExploreDayForHeadline(input.date);
    if (dest) return `Rideshare to ${dest}${day ?? ''}`;
    return `Rideshare${day ?? ''}`;
  }

  const host = exploreHeadlinePersonLabel(input);
  const day = formatExploreDayForHeadline(input.date);
  return `${host} is going ${demandKindLabel(input.kind)}${day ?? ''}`;
};

export const exploreHeadline = (input: ExploreHeadlineInput): string => {
  if (input.source === 'venue' || input.source === 'shop' || input.source === 'agency') {
    return input.title.trim() || 'Listing';
  }

  const route = buildExploreRouteLabel(input.fromLabel, input.toLabel, input.kind);
  const whenSuffix =
    headlineIsSeeking(input) ? 'flexible' : input.kind === 'rideshare' ? 'fixed' : null;
  const when = buildExploreWhenSegment(input.date, input.time, whenSuffix);
  const location = sanitizeExploreLocation(input.location);

  if (headlineIsSeeking(input)) {
    const user = exploreHeadlinePersonLabel(input);
    const day = formatExploreDayForHeadline(input.date);
    const activityLabel = resolveDemandActivityHighlight(input.title, input.kind);
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
    const when = buildExploreWhenSegment(input.date, input.time, null);
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
  return joinExploreParts(`${host} is going ${demandKindLabel(input.kind)}${day ?? ''}`, location, when, spots);
};

export type ExploreCardDetailIcon = 'location' | 'time' | 'spots' | 'route' | 'price';

export interface ExploreCardDetail {
  icon: ExploreCardDetailIcon;
  label: string;
}

export interface ExploreCardSections {
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
  details: ExploreCardDetail[];
}

const finishExploreCardSections = (
  input: ExploreHeadlineInput,
  sections: Omit<ExploreCardSections, 'listTitle' | 'listWhen' | 'listGoing'> & {
    participantCount?: number;
  }
): ExploreCardSections => {
  const { participantCount, ...rest } = sections;
  return {
    ...rest,
    listTitle: buildExploreListTitle(input),
    listWhen: buildExploreListWhen(input.date, input.time),
    listGoing: buildExploreListGoingLabel({ ...input, participantCount }),
  };
};

export const buildExploreCardSections = (input: ExploreHeadlineInput): ExploreCardSections => {
  const details: ExploreCardDetail[] = [];
  const push = (icon: ExploreCardDetailIcon, label?: string | null) => {
    if (label?.trim()) details.push({ icon, label: label.trim() });
  };

  if (input.source === 'venue' || input.source === 'shop' || input.source === 'agency') {
    push('location', input.subtitle);
    return finishExploreCardSections(input, {
      plainTitle: exploreHeadline(input),
      aboutLine: input.about?.trim() || null,
      details,
    });
  }

  const route = buildExploreRouteLabel(input.fromLabel, input.toLabel, input.kind);
  const whenSuffix =
    headlineIsSeeking(input) ? 'flexible' : input.kind === 'rideshare' ? 'fixed' : null;
  const when = buildExploreWhenSegment(input.date, input.time, whenSuffix);
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

    return finishExploreCardSections(input, {
      highlightName: user,
      suffix: ' is looking for ',
      activityHighlight: resolveDemandActivityHighlight(input.title, input.kind),
      dateHighlight: formatExploreDayForHeadline(input.date),
      details,
      partyLabel,
    });
  }

  if (input.kind === 'rideshare') {
    const host = exploreHeadlinePersonLabel(input);
    push('route', route);
    push('time', when);

    return finishExploreCardSections(input, {
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

  return finishExploreCardSections(input, {
    highlightName: host,
    suffix: ' is going ',
    activityHighlight: demandKindLabel(input.kind),
    dateHighlight: formatExploreDayForHeadline(input.date),
    details,
    participantCount: input.participantCount,
    partyLabel,
  });
};

export const exploreSubtitle = (
  item: ExplorePresentationBuildInput,
  kind: ExploreCardKind,
  source: ExploreCardSource
): string | null => {
  if (source === 'venue') return item.subtitle?.trim() || null;
  if (exploreMapItemIsSeeking(item) || source === 'demand') {
    if (kind === 'rideshare') return null;
    return item.subtitle?.trim() || null;
  }
  if (source === 'shop' || source === 'agency') return item.subtitle ?? null;
  return item.subtitle ?? item.activity?.locationName ?? null;
};

export const exploreSpotsLabel = (item: ExplorePresentationBuildInput): string | null => {
  if (exploreMapItemIsSeeking(item) || item.source === 'demand') return null;
  if (item.source !== 'activity') return null;
  return buildExploreSpotsSegment(item.slotsAvailable, item.slotsTotal);
};

export const explorePrimaryCtaLabel = (
  source: ExploreCardSource,
  options?: {
    participationMode?: ParticipationMode | null;
    requirements?: string[] | null;
    seeking?: boolean;
  }
): string => {
  if (source === 'demand' || options?.seeking) return 'Request to join';
  if (source === 'shop') return 'View shop';
  if (source === 'agency') return 'View agency';
  if (source === 'activity') {
    return activityJoinCtaLabel({
      participationMode: options?.participationMode,
      requirements: options?.requirements,
    });
  }
  return 'View details';
};

export const exploreSecondaryCtaLabel = (
  source: ExploreCardSource,
  options?: { websiteUrl?: string | null; seeking?: boolean }
): string | null => {
  if (source === 'activity' && !options?.seeking) return 'View details';
  if (source === 'demand' || options?.seeking) return 'Message';
  if (source === 'shop' && options?.websiteUrl) return 'Visit website';
  return null;
};

const exploreAgencyHint = (): string => 'Outdoor host on UAE Trail — see plans and connect.';

export const exploreVenueHint = (
  source: ExploreCardSource,
  kind: ExploreCardKind,
  shopPresence?: 'physical' | 'online' | null,
  seeking?: boolean
): string | null => {
  if (source === 'demand' || seeking) return null;
  if (source === 'shop') {
    return shopPresence === 'online' ? 'Online gear partner' : 'Gear shop on the map';
  }
  if (source === 'agency') return exploreAgencyHint();
  if (source !== 'venue') return null;
  if (kind === 'hiking') return 'Hiking trail location';
  if (kind === 'camping') return 'Camping location';
  return 'Event location';
};

export interface ExploreCardPresentationDTO {
  kind: ExploreCardKind;
  source: ExploreCardSource;
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
  sections: ExploreCardSections;
}

const isRideshareExploreItem = (item: ExplorePresentationBuildInput): boolean =>
  item.kind === 'rideshare' || item.activity?.activityType === 'rideshare';

const resolveExploreCardKind = (item: ExplorePresentationBuildInput): ExploreCardKind => {
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'agency') return 'agency';
  if (isRideshareExploreItem(item)) return 'rideshare';
  return item.kind as ExploreCardKind;
};

/** Server-side explore card copy — single source of truth for map/list/sheet headlines. */
export const buildExploreCardPresentation = (
  item: ExplorePresentationBuildInput
): ExploreCardPresentationDTO => {
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
  const kind = resolveExploreCardKind(item);
  const isSeekingPin = exploreMapItemIsSeeking(item);
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;
  const routeLabel = buildExploreRouteLabel(fromLabel, toLabel, kind);
  const whenSuffix = isSeekingPin ? 'flexible' : kind === 'rideshare' ? 'fixed' : null;
  const whenLabel = buildExploreWhenSegment(item.date, item.time ?? activity?.time ?? null, whenSuffix);
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
    fromLabel,
    toLabel,
    slotsAvailable: item.slotsAvailable,
    slotsTotal: item.slotsTotal,
    participantCount: item.participantPreviews?.length ?? 0,
    requesterUserId: item.requesterUserId,
    hostAvatar: item.hostAvatar,
    activity,
  };

  const sections = buildExploreCardSections(headlineInput);

  return {
    kind,
    source,
    emoji: resolveMapPinEmoji(
      kind,
      isSeekingPin ? 'demand' : source,
      undefined,
      item.placeKind ?? undefined
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
