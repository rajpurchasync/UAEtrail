import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { formatRequesterDisplayName, getFirstName } from '../utils/userDisplay';
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

interface ExploreHeadlineInput {
  source: ExploreCardSource;
  kind: ExploreCardKind;
  title: string;
  hostName?: string | null;
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
      return 'an Event';
    default:
      return 'company';
  }
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

const buildExploreListTitle = (input: ExploreHeadlineInput): string => {
  if (input.source === 'venue' || input.source === 'shop' || input.source === 'agency') {
    return input.title.trim() || 'Listing';
  }

  if (input.source === 'demand') {
    const user = getFirstName(formatRequesterDisplayName(input.hostName));
    const trimmed = input.title.trim();
    if (trimmed && !isLegacyDemandTitle(trimmed) && !isLegacyAutoTitle(trimmed, input.kind)) {
      return trimmed;
    }
    return `${demandKindLabel(input.kind)} · ${user}`;
  }

  if (input.kind === 'carpool') {
    const dest = input.toLabel?.trim();
    return dest ? `Rideshare to ${dest}` : 'Rideshare';
  }

  return input.title.trim() || demandKindLabel(input.kind);
};

const isLegacyDemandTitle = (title: string): boolean =>
  /needs a (carpool|ride)|wants to go|is looking for|posted a plan|community request/i.test(title);

export const exploreHeadline = (input: ExploreHeadlineInput): string => {
  if (input.source === 'venue') {
    if (input.kind === 'hiking') return 'Hiking Spot';
    if (input.kind === 'camping') return 'Camping Spot';
    return input.title;
  }

  if (input.source === 'shop' || input.source === 'agency') {
    return input.title;
  }

  const route = buildExploreRouteLabel(input.fromLabel, input.toLabel, input.kind);
  const whenSuffix =
    input.source === 'demand' ? 'flexible' : input.kind === 'carpool' ? 'fixed' : null;
  const when = buildExploreWhenSegment(input.date, input.time, whenSuffix);
  const spots =
    input.source === 'activity' && input.kind !== 'carpool'
      ? buildExploreSpotsSegment(input.slotsAvailable, input.slotsTotal)
      : null;
  const location = sanitizeExploreLocation(input.location);

  if (input.source === 'demand') {
    const user = getFirstName(formatRequesterDisplayName(input.hostName));
    const lead = `${user} is looking for ${demandKindLabel(input.kind)}`;
    return joinExploreParts(lead, route ?? location, when);
  }

  if (input.kind === 'carpool') {
    const host = getFirstName(input.hostName || input.participantName || 'Host');
    return joinExploreParts(`${host} is offering Rideshare`, route, when);
  }

  const host = input.hostName?.trim() || input.participantName?.trim() || 'Host';
  const title = input.title.trim() || demandKindLabel(input.kind);
  return joinExploreParts(`${title} by ${host}`, location, when, spots);
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
    const user = getFirstName(formatRequesterDisplayName(input.hostName));
    push('route', route);
    push('location', input.kind !== 'carpool' ? location : null);
    push('time', when);

    return finishExploreCardSections(input, {
      highlightName: user,
      suffix: ` is looking for ${demandKindLabel(input.kind)}`,
      details,
      partyLabel,
    });
  }

  if (input.kind === 'carpool') {
    const host = getFirstName(input.hostName || input.participantName || 'Host');
    push('route', route);
    push('time', when);

    return finishExploreCardSections(input, {
      highlightName: host,
      suffix: ' is offering Rideshare',
      details,
    });
  }

  const host = input.hostName?.trim() || input.participantName?.trim() || 'Host';
  const title = input.title.trim() || demandKindLabel(input.kind);

  push('location', location);
  push('time', when);
  push('spots', spots);

  return finishExploreCardSections(input, {
    titleText: title,
    hostName: host,
    details,
    participantCount: input.participantCount,
  });
};

export const exploreSubtitle = (item: ExploreMapItemDTO, kind: ExploreCardKind, source: ExploreCardSource): string | null => {
  if (source === 'venue') return item.title;
  if (source === 'demand') {
    if (kind === 'carpool') return null;
    return item.subtitle?.trim() || null;
  }
  if (source === 'shop' || source === 'agency') return item.subtitle ?? null;
  return item.subtitle ?? item.activity?.locationName ?? null;
};

export const exploreSpotsLabel = (item: ExploreMapItemDTO): string | null => {
  if (item.source === 'demand') return null;
  if (item.source !== 'activity') return null;
  return buildExploreSpotsSegment(item.slotsAvailable, item.slotsTotal);
};

export const explorePrimaryCtaLabel = (
  source: ExploreCardSource,
  options?: { websiteUrl?: string | null }
): string => {
  if (source === 'demand') return 'Request to join';
  if (source === 'shop') return options?.websiteUrl ? 'Visit website' : 'View shop';
  if (source === 'agency') return 'View agency';
  if (source === 'activity') return 'Request to join';
  return 'View details';
};

export const exploreSecondaryCtaLabel = (source: ExploreCardSource): string | null => {
  if (source === 'activity') return 'View details';
  if (source === 'demand') return 'Message';
  return null;
};

const exploreAgencyHint = (): string => 'Licensed tour operator — view trips and contact details.';

export const exploreVenueHint = (source: ExploreCardSource, kind: ExploreCardKind): string | null => {
  if (source === 'demand' || source === 'shop') return null;
  if (source === 'agency') return exploreAgencyHint();
  if (source !== 'venue') return null;
  if (kind === 'hiking') return 'Trail or outdoor spot';
  if (kind === 'camping') return 'Camping location';
  return 'Outdoor spot';
};
