import { isRolePlaceholderDisplayName } from './host-display.js';
import {
  explorePersonFirstName,
  resolveExploreFeaturedPerson,
  type ExploreFeaturedPersonInput,
  type ExploreMapPersonDTO,
} from './explore-person.js';
import { isGenericDemandPlanTitle, type DemandTitleKind } from './demand-titles.js';
import {
  activityJoinCtaLabel,
  resolveParticipationMode,
  type ParticipationMode,
} from './activity-participation-mode.js';

export type ExploreCardSource = 'activity' | 'venue' | 'shop' | 'agency' | 'demand';
export type ExploreCardKind = 'hiking' | 'camping' | 'event' | 'carpool' | 'shop' | 'agency';

export type ExplorePresentationBuildInput = {
  id: string;
  kind: ExploreCardKind | 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'carpool';
  source: ExploreCardSource;
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
    tenantName?: string | null;
    locationName?: string | null;
    meetingPoint?: string | null;
    startPoint?: string | null;
    time?: string | null;
    activityType?: string;
    requirements?: string[] | null;
    participationMode?: ParticipationMode | null;
    carPoolEnabled?: boolean;
  } | null;
};

const itemParticipationMode = (item: ExplorePresentationBuildInput): ParticipationMode =>
  resolveParticipationMode(item.activity?.participationMode, item.activity?.requirements);

const getFirstName = (name?: string | null): string => {
  if (name?.trim()) return name.trim().split(/\s+/)[0];
  return 'Host';
};

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
  if (host && !isRolePlaceholderDisplayName(host)) return getFirstName(host);
  const requester = options.participantName?.trim();
  if (requester && !isRolePlaceholderDisplayName(requester)) return getFirstName(requester);
  return 'Host';
};

/** Hosted / scheduled hikes and hiking map filter. */
export const HIKING_ACTIVITY_EMOJI = '🥾';

/** Trail & hiking locations on the map. */
export const HIKING_VENUE_EMOJI = '⛰️';

/** Scheduled camping activities on the map. */
export const CAMPING_ACTIVITY_EMOJI = '🏕️';

/** Camping locations on the map. */
export const CAMPING_VENUE_EMOJI = '⛺';

/** “Looking for” / participant demand pins (hand raised). */
export const DEMAND_EMOJI = '🙋';

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
  carpool: RIDESHARE_EMOJI,
} as const;

export const MAP_LAYER_FILTER_EMOJI = {
  others: '🏃',
  shops: SHOP_MAP_EMOJI,
} as const;

/** Resolve map item source; falls back to id prefix when source is missing from cache/API. */
export const resolveExploreItemSource = (
  item: Pick<ExplorePresentationBuildInput, 'id' | 'source'>
): ExploreCardSource => {
  const { id, source } = item;
  if (
    source === 'activity' ||
    source === 'venue' ||
    source === 'shop' ||
    source === 'agency' ||
    source === 'demand'
  ) {
    return source;
  }
  if (id.startsWith('venue:')) return 'venue';
  if (id.startsWith('demand:')) return 'demand';
  if (id.startsWith('shop:')) return 'shop';
  if (id.startsWith('agency:')) return 'agency';
  return 'activity';
};

/** Map pin emoji source — id prefix wins so venues/demand are never mis-tagged. */
export const resolveMapPinItemSource = (
  item: Pick<ExplorePresentationBuildInput, 'id' | 'source'>
): ExploreCardSource => {
  const { id } = item;
  if (id.startsWith('venue:')) return 'venue';
  if (id.startsWith('demand:')) return 'demand';
  if (id.startsWith('shop:')) return 'shop';
  if (id.startsWith('agency:')) return 'agency';
  return resolveExploreItemSource(item);
};

export const resolveMapPinEmoji = (
  kind: ExploreCardKind,
  source: ExploreCardSource = 'activity',
  _carpoolEndpoint?: 'from' | 'to'
): string => {
  if (source === 'venue') {
    if (kind === 'hiking') return HIKING_VENUE_EMOJI;
    if (kind === 'camping') return CAMPING_VENUE_EMOJI;
    if (kind === 'event') return '🏃';
    return '📍';
  }

  if (source === 'shop') return SHOP_MAP_EMOJI;
  if (source === 'agency') return '🏢';
  if (source === 'demand') {
    if (kind === 'carpool') return RIDESHARE_EMOJI;
    return DEMAND_EMOJI;
  }

  if (kind === 'carpool') return RIDESHARE_EMOJI;
  if (kind === 'hiking') return HIKING_ACTIVITY_EMOJI;
  if (kind === 'camping') return CAMPING_ACTIVITY_EMOJI;
  if (kind === 'event') return '🏃';
  if (kind === 'shop') return SHOP_MAP_EMOJI;
  if (kind === 'agency') return '🏢';
  return '📍';
};

interface ExploreHeadlineInput extends ExploreFeaturedPersonInput {
  source: ExploreCardSource;
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

const joinExploreParts = (...parts: (string | null | undefined)[]): string =>
  parts.filter((part): part is string => Boolean(part?.trim())).join(' - ');

const isLegacyAutoTitle = (title: string, kind: ExploreCardKind): boolean => {
  const trimmed = title.trim();
  if (!trimmed) return true;
  if (kind === 'hiking' && /^hiking\b/i.test(trimmed)) return true;
  if (kind === 'camping' && /^camping\b/i.test(trimmed)) return true;
  if (kind === 'carpool' && /^carpool\b/i.test(trimmed)) return true;
  return false;
};

const mapDemandTitleKind = (kind: ExploreCardKind): DemandTitleKind => {
  if (kind === 'hiking' || kind === 'camping' || kind === 'carpool' || kind === 'event') {
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
    case 'carpool':
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
    case 'carpool':
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

export const buildExploreRouteLabel = (
  fromLabel?: string | null,
  toLabel?: string | null,
  kind?: ExploreCardKind
): string | null => {
  if (kind !== 'carpool' || !fromLabel || !toLabel) return null;
  return `${fromLabel} to ${toLabel}`;
};

export const buildExploreSpotsSegment = (
  slotsAvailable?: number,
  slotsTotal?: number
): string | null => {
  const count = (slotsAvailable ?? 0) > 0 ? slotsAvailable! : slotsTotal ?? 0;
  if (count <= 0) return null;
  return `${count} spots`;
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
  const day = formatExploreDayShort(date);
  if (!day) return formatExploreTime(time);
  const shortDay = day === 'Tomorrow' ? 'Tmr' : day;
  const clock = formatExploreTime(time);
  return clock ? `${shortDay} · ${clock}` : shortDay;
};

const buildExploreListGoingLabel = (
  input: ExploreHeadlineInput & { participantCount?: number }
): string | null => {
  if (input.source === 'demand') {
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

/** First name for card copy — prefers featured person; legacy hostName fallback for old payloads. */
const exploreHeadlinePersonLabel = (input: ExploreHeadlineInput): string => {
  const person = resolveHeadlinePerson(input);
  if (person) return explorePersonFirstName(person);
  if (input.source === 'demand') {
    return getFirstName(formatRequesterDisplayName(input.hostName));
  }
  return exploreHostLabel(input);
};

const buildExploreListTitle = (input: ExploreHeadlineInput): string => {
  if (input.source === 'venue' || input.source === 'shop' || input.source === 'agency') {
    return input.title.trim() || 'Listing';
  }

  if (input.source === 'demand') {
    const user = exploreHeadlinePersonLabel(input);
    const trimmed = input.title.trim();
    if (trimmed && !isGenericDemandPlanTitle(trimmed, mapDemandTitleKind(input.kind))) {
      return trimmed;
    }
    return `${resolveDemandActivityHighlight(input.title, input.kind)} · ${user}`;
  }

  if (input.kind === 'carpool') {
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
    input.source === 'demand' ? 'flexible' : input.kind === 'carpool' ? 'fixed' : null;
  const when = buildExploreWhenSegment(input.date, input.time, whenSuffix);
  const location = sanitizeExploreLocation(input.location);

  if (input.source === 'demand') {
    const user = exploreHeadlinePersonLabel(input);
    const day = formatExploreDayForHeadline(input.date);
    const activityLabel = resolveDemandActivityHighlight(input.title, input.kind);
    const lead = `${user} is looking for ${activityLabel}${day ?? ''}`;
    return joinExploreParts(lead, route ?? location, when);
  }

  if (input.kind === 'carpool') {
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
    input.source === 'demand' ? 'flexible' : input.kind === 'carpool' ? 'fixed' : null;
  const when = buildExploreWhenSegment(input.date, input.time, whenSuffix);
  const spots =
    input.source === 'activity' && input.kind !== 'carpool'
      ? buildExploreSpotsSegment(input.slotsAvailable, input.slotsTotal)
      : null;
  const partySize = input.source === 'demand' ? input.slotsTotal : null;
  const partyLabel =
    partySize && partySize > 0 ? `${partySize} ${partySize === 1 ? 'person' : 'people'}` : null;
  const location = sanitizeExploreLocation(input.location);

  if (input.source === 'demand') {
    const user = exploreHeadlinePersonLabel(input);
    push('route', route);
    push('location', input.kind !== 'carpool' ? location : null);
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

  if (input.kind === 'carpool') {
    const host = exploreHeadlinePersonLabel(input);
    push('route', route);
    push('time', when);

    return finishExploreCardSections(input, {
      highlightName: host,
      suffix: ' is offering ',
      activityHighlight: 'Rideshare',
      dateHighlight: formatExploreDayForHeadline(input.date),
      details,
    });
  }

  const host = exploreHeadlinePersonLabel(input);
  const activityTitle = input.title.trim();

  push('location', location);
  push('time', when);
  push('spots', spots);
  if (input.source === 'activity' && input.activity?.carPoolEnabled) {
    push('route', 'Carpool available');
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
  });
};

export const exploreSubtitle = (
  item: ExplorePresentationBuildInput,
  kind: ExploreCardKind,
  source: ExploreCardSource
): string | null => {
  if (source === 'venue') return item.subtitle?.trim() || null;
  if (source === 'demand') {
    if (kind === 'carpool') return null;
    return item.subtitle?.trim() || null;
  }
  if (source === 'shop' || source === 'agency') return item.subtitle ?? null;
  return item.subtitle ?? item.activity?.locationName ?? null;
};

export const exploreSpotsLabel = (item: ExplorePresentationBuildInput): string | null => {
  if (item.source === 'demand') return null;
  if (item.source !== 'activity') return null;
  return buildExploreSpotsSegment(item.slotsAvailable, item.slotsTotal);
};

export const explorePrimaryCtaLabel = (
  source: ExploreCardSource,
  options?: { participationMode?: ParticipationMode | null; requirements?: string[] | null }
): string => {
  if (source === 'demand') return 'Join this plan';
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
  options?: { websiteUrl?: string | null }
): string | null => {
  if (source === 'activity') return 'View details';
  if (source === 'demand') return 'View details';
  if (source === 'shop' && options?.websiteUrl) return 'Visit website';
  return null;
};

const exploreAgencyHint = (): string => 'Outdoor host on UAE Trail — see plans and connect.';

export const exploreVenueHint = (
  source: ExploreCardSource,
  kind: ExploreCardKind,
  shopPresence?: 'physical' | 'online' | null
): string | null => {
  if (source === 'demand') return null;
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

const isCarpoolExploreItem = (item: ExplorePresentationBuildInput): boolean =>
  item.kind === 'carpool' || item.activity?.activityType === 'carpool';

const resolveExploreCardKind = (item: ExplorePresentationBuildInput): ExploreCardKind => {
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'agency') return 'agency';
  if (isCarpoolExploreItem(item)) return 'carpool';
  return item.kind as ExploreCardKind;
};

/** Server-side explore card copy — single source of truth for map/list/sheet headlines. */
export const buildExploreCardPresentation = (
  item: ExplorePresentationBuildInput
): ExploreCardPresentationDTO => {
  const kind = resolveExploreCardKind(item);
  const source = resolveExploreItemSource(item);
  const activity = item.activity;

  const fromLabel = item.fromLabel ?? activity?.meetingPoint ?? null;
  const toLabel = item.toLabel ?? activity?.startPoint ?? activity?.locationName ?? null;
  const routeLabel = buildExploreRouteLabel(fromLabel, toLabel, kind);
  const whenSuffix = source === 'demand' ? 'flexible' : kind === 'carpool' ? 'fixed' : null;
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
    emoji: resolveMapPinEmoji(kind, source),
    headline: exploreHeadline(headlineInput),
    listTitle: sections.listTitle,
    listHost: featuredPerson?.displayName ?? null,
    featuredPerson,
    subtitle,
    spotsLabel: exploreSpotsLabel(item),
    venueHint: exploreVenueHint(source, kind, item.shopPresence),
    primaryCta: explorePrimaryCtaLabel(source, {
      participationMode: itemParticipationMode(item),
      requirements: activity?.requirements,
    }),
    secondaryCta: exploreSecondaryCtaLabel(source, { websiteUrl: item.websiteUrl }),
    shareText: [routeLabel, whenLabel].filter(Boolean).join(' · ') || item.subtitle || null,
    routeLabel,
    whenLabel,
    sections,
  };
};
