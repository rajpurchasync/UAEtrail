import type {
  AvailabilityTimeBand,
  MemberAvailabilitySlotDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonTripHintDTO,
} from '@uaetrail/shared-types';
import {
  areMemberAvailabilityDaysContiguous,
  formatExploreEventDateLabel,
  groupConsecutiveMemberAvailabilityDays,
  memberAvailabilityCalendarDays,
} from '@uaetrail/shared-types';

import { PRODUCT_CREWS_TAB_LABEL } from './productNorthStar';

/** Explore lens title — same triad as Activities · Places (`PRODUCT_CREWS_TAB_LABEL`). */
export const EXPLORE_CREWS_PANEL_TITLE = PRODUCT_CREWS_TAB_LABEL;

export { PRODUCT_CREWS_TAB_LABEL as EXPLORE_CREWS_MAP_BUTTON_LABEL };

export const exploreCrewsMapButtonAriaLabel = (friendCount: number): string =>
  friendCount > 0
    ? `${PRODUCT_CREWS_TAB_LABEL}. ${friendCount} friends`
    : `${PRODUCT_CREWS_TAB_LABEL}. Browse members free to get outside`;

export const exploreCrewsGuestMapButtonAriaLabel = (crewCount: number): string =>
  crewCount > 0
    ? `${PRODUCT_CREWS_TAB_LABEL}. ${crewCount} possible crew on outings`
    : `${PRODUCT_CREWS_TAB_LABEL}. Join free to meet people going outside`;

export const EXPLORE_CREWS_LOADING = 'Loading crews…';
export const EXPLORE_CREWS_MAP_SIGNALS_LOADING = 'Loading map availability…';
export const EXPLORE_CREWS_EMPTY_ALL =
  'No friends or follows yet — connect on outings or follow hosts you like.';
export const EXPLORE_CREWS_EMPTY_FRIENDS =
  'No friends yet — send a friend request from a member profile.';
export const EXPLORE_CREWS_EMPTY_FOLLOWED =
  'You are not following anyone yet — follow hosts and members from their profile.';
export const EXPLORE_CREWS_FOLLOWED_SEGMENT_PEOPLE = 'People';
export const EXPLORE_CREWS_FOLLOWED_SEGMENT_PLACES = 'Places';
export const EXPLORE_CREWS_FOLLOWED_SEGMENT_EVENTS = 'Hosts & operators';
export const EXPLORE_CREWS_EMPTY_FOLLOWED_PLACES =
  'No followed places yet — follow a trail or camp on the map for outing alerts.';
export const EXPLORE_CREWS_EMPTY_FOLLOWED_HOSTS =
  'No followed hosts or operators yet — follow from their profile or a shop on the map.';

export const EXPLORE_CREWS_SEARCH_PLACEHOLDER = 'Search crew, guides, hosts…';
export const EXPLORE_CREWS_DISCOVER_SEARCH_PLACEHOLDER = 'Search by name or city…';

export const EXPLORE_CREWS_TAB_DISCOVER = 'Discover';

/** Map/search scope wire key `people` — UI label **Crews** (not Friends `/crews`). */
export const EXPLORE_SEARCH_SCOPE_PEOPLE_LABEL = PRODUCT_CREWS_TAB_LABEL;
export const EXPLORE_SEARCH_SCOPE_PEOPLE_DESCRIPTION =
  'Members, guides, and hosts — see who is free, on outings, or open to connect (Pro unlocks more)';

export const EXPLORE_CREWS_DISCOVER_ON_TRIPS_TITLE = 'On outings';
export const EXPLORE_CREWS_DISCOVER_FRIENDS_GOING_TITLE = 'Friends';
export const EXPLORE_CREWS_DISCOVER_HOSTS_GOING_TITLE = 'Hosts';
/** @deprecated Section title removed — use Flexible/Fixed row labels. */
export const EXPLORE_CREWS_MAP_SIGNALS_TITLE = 'On the map';
export const EXPLORE_CREWS_EMPTY_MAP_SIGNALS =
  'No fixed-time availability here — try another filter or share your intent.';

/** Available list — intent schedule kind (not map vs calendar chrome). */
export const EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL = 'Flexible';
export const EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL = 'Fixed';

export const EXPLORE_CREWS_AVAILABILITY_LOADING = 'Loading…';
export const EXPLORE_CREWS_AVAILABILITY_EMPTY = 'No one available for these dates.';
export const EXPLORE_CREWS_FRIENDS_GOING_EMPTY =
  'No friends yet — send a friend request from a member profile.';
export const EXPLORE_CREWS_FRIEND_NO_OUTING_FOR_FILTER =
  'No outing on the map for these dates';
export const EXPLORE_CREWS_CONNECT_EMPTY = 'No public profiles match right now.';

/** Shown on Everyone rows beyond the free preview (see `MEMBER_DISCOVERY_QUOTA_LIMIT`). */
export const EXPLORE_CREWS_EVERYONE_PRO_LOCK_LABEL =
  'Unlock unlimited profile views with pro membership';
export const EXPLORE_CREWS_EMPTY_DISCOVER_FOLLOWED =
  'You are not following anyone yet — follow hosts and members from their profile.';
export const EXPLORE_CREWS_INTRO =
  'Find members on live outings or browse public profiles — add friends, message, or plan something together.';

export const EXPLORE_CREWS_DISCOVER_DIRECTORY_TITLE = 'Public profiles';
export const EXPLORE_CREWS_EMPTY_DISCOVER =
  'No one matches right now — try another day on the map filter or check back when more outings are live.';

const crewBrowseQuotaPeriodLabel = (windowDays: number): string =>
  windowDays === 30 ? 'this month' : `every ${windowDays} days`;

/** Free-tier cap on opening new profiles from the Everyone tab (see `MEMBER_DISCOVERY_QUOTA_GATE_BODY`). */
export const exploreCrewsDiscoverQuotaLine = (quota: MemberDiscoveryQuotaDTO): string => {
  if (quota.remaining === null || quota.limit === null) {
    return 'Unlimited profile opens on Everyone';
  }

  const period = crewBrowseQuotaPeriodLabel(quota.windowDays);
  const { limit, used, remaining } = quota;

  if (remaining <= 0) {
    return `You've used all ${limit} free profile opens ${period}.`;
  }

  if (used === 0) {
    return `You can open up to ${limit} new profiles from Everyone ${period}.`;
  }

  const opensWord = remaining === 1 ? 'open' : 'opens';
  return `${remaining} profile ${opensWord} left ${period} (${used} of ${limit} used).`;
};

export const EXPLORE_CREWS_ACTION_MESSAGE = 'Message';
export const EXPLORE_CREWS_ACTION_HOST_OUTING = 'Host an outing';
export const EXPLORE_CREWS_ACTION_ADD_FRIEND = 'Add friend';
export const EXPLORE_CREWS_ACTION_VIEW_PROFILE = 'Profile';

export const memberPersonAttendedLine = (count: number): string =>
  count === 1 ? '1 outing attended' : `${count} outings attended`;

export const memberPersonTripHintLine = (trip: SocialPersonTripHintDTO): string => {
  const verb = trip.role === 'hosting' ? 'Hosting' : 'Going on';
  const datePart = trip.date ? formatMemberTripDate(trip.date) : 'soon';
  const title = trip.title.trim() || 'an outing';
  return `${verb} ${title} · ${datePart}`;
};

export const formatCrewBrowseShortDate = (isoDate: string): string =>
  formatExploreEventDateLabel(isoDate) ?? isoDate;

const formatMemberTripDate = formatCrewBrowseShortDate;

/** First name for friendly crew copy (“Omar is available…”). */
export const crewBrowseFirstName = (displayName: string): string => {
  const trimmed = displayName.trim();
  if (!trimmed) return 'Someone';
  return trimmed.split(/\s+/)[0] ?? trimmed;
};

/** “Hiking, Camping, and Events” → natural list with “and”. */
export const formatCrewBrowseKindsList = (labels: string[]): string => {
  const items = labels.map((label) => label.trim()).filter(Boolean);
  if (items.length === 0) return 'getting outside';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

const AVAILABILITY_TIME_BAND_LABEL: Record<AvailabilityTimeBand, string | null> = {
  morning: 'morning',
  afternoon: 'afternoon',
  evening: 'evening',
  any: null,
};

const MS_PER_DAY = 86_400_000;

const parseCrewBrowseIsoDate = (isoDate: string): Date => new Date(`${isoDate}T12:00:00`);

const calendarDayDiff = (from: Date, to: Date): number => {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
};

const dayOffsetsFromNow = (days: string[], now: Date): number[] =>
  days.map((iso) => calendarDayDiff(now, parseCrewBrowseIsoDate(iso)));

const crewBrowseAvailabilityDayLabels = (slots: MemberAvailabilitySlotDTO[]): string[] => {
  const days = memberAvailabilityCalendarDays(slots);
  if (days.length === 0) return [];
  const blocks = groupConsecutiveMemberAvailabilityDays(days);
  const labels = blocks.map(({ start, end }) => {
    const startLabel = formatCrewBrowseMinimalDate(start);
    const endLabel = formatCrewBrowseMinimalDate(end);
    return start === end ? startLabel : `${startLabel}–${endLabel}`;
  });
  if (slots.length === 1 && days.length === 1) {
    const band =
      slots[0].timeBand && slots[0].timeBand !== 'any'
        ? AVAILABILITY_TIME_BAND_LABEL[slots[0].timeBand]
        : null;
    if (band) labels[0] = `${labels[0]} · ${band}`;
  }
  return labels;
};

/**
 * Optional relative when-phrase for the list title.
 * Based on **projected calendar days** (`memberAvailabilityCalendarDays`), not raw slot rows.
 */
export const crewBrowseAvailabilityWhenPhrase = (
  slots: MemberAvailabilitySlotDTO[],
  now: Date = new Date()
): string | null => {
  const days = memberAvailabilityCalendarDays(slots);
  if (days.length === 0) return 'soon';

  if (!areMemberAvailabilityDaysContiguous(days)) return null;

  const offsets = dayOffsetsFromNow(days, now);
  const minOffset = Math.min(...offsets);
  const maxOffset = Math.max(...offsets);

  if (days.length === 1) {
    if (minOffset === 0) return 'today';
    if (minOffset === 1) return 'tomorrow';
    if (minOffset >= 2 && minOffset <= 6) return 'this week';
    if (minOffset >= 7 && minOffset <= 13) return 'next week';
    return null;
  }

  if (maxOffset <= 6) return 'this week';
  if (minOffset >= 7 && maxOffset <= 13) return 'next week';
  if (minOffset <= 6 && maxOffset <= 13) return 'this week and next week';
  if (maxOffset > 13) return 'over the next few weeks';
  return null;
};

export const formatCrewBrowseMinimalDate = (isoDate: string): string => {
  const date = parseCrewBrowseIsoDate(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Compact slot line for secondary / low-emphasis date hints. */
export const formatCrewBrowseAvailabilitySlotLineMinimal = (
  slot: MemberAvailabilitySlotDTO
): string => {
  const start = formatCrewBrowseMinimalDate(slot.startDate);
  const end = formatCrewBrowseMinimalDate(slot.endDate);
  const range = slot.startDate === slot.endDate ? start : `${start}–${end}`;
  const band =
    slot.timeBand && slot.timeBand !== 'any'
      ? AVAILABILITY_TIME_BAND_LABEL[slot.timeBand]
      : null;
  return band ? `${range} · ${band}` : range;
};

/** One slot — single day or inclusive multi-day range. */
export const formatCrewBrowseAvailabilitySlotLine = (slot: MemberAvailabilitySlotDTO): string => {
  const start = formatCrewBrowseShortDate(slot.startDate);
  const end = formatCrewBrowseShortDate(slot.endDate);
  const range = slot.startDate === slot.endDate ? start : `${start} – ${end}`;
  const band =
    slot.timeBand && slot.timeBand !== 'any'
      ? AVAILABILITY_TIME_BAND_LABEL[slot.timeBand]
      : null;
  return band ? `${range} · ${band}` : range;
};

export const crewBrowseAvailabilityKindSentence = (
  displayName: string,
  kindLabels: string[]
): string => {
  const first = crewBrowseFirstName(displayName);
  const kinds = formatCrewBrowseKindsList(kindLabels);
  return `${first} is available for ${kinds}.`;
};

/** List row title — narrative kinds + when; exact dates only in schedule detail (low emphasis). */
export const crewBrowseAvailabilitySentence = (
  displayName: string,
  kindLabels: string[],
  slots: MemberAvailabilitySlotDTO[],
  now: Date = new Date()
): string => {
  const first = crewBrowseFirstName(displayName);
  const kinds = formatCrewBrowseKindsList(kindLabels);
  const when = crewBrowseAvailabilityWhenPhrase(slots, now);
  if (when === 'soon') {
    return `${first} is available for ${kinds} soon.`;
  }
  if (!when) {
    return `${first} is available for ${kinds}.`;
  }
  return `${first} is available for ${kinds} ${when}.`;
};

const CREW_BROWSE_AVAILABILITY_MAX_SCHEDULE_LINES = 4;

export type CrewBrowseAvailabilitySchedule = {
  /** @deprecated Prefer narrative title; keep null for new UI. */
  metaLine: string | null;
  whenPhrase: string | null;
  /** Low-emphasis exact dates when needed. */
  detailLines: string[];
  detailMoreCount: number;
  /** @deprecated Use `detailLines`. */
  footerLines: string[];
  footerMoreCount: number;
};

export const crewBrowseAvailabilitySchedule = (
  slots: MemberAvailabilitySlotDTO[],
  now: Date = new Date()
): CrewBrowseAvailabilitySchedule => {
  const sorted = [...slots].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const whenPhrase = crewBrowseAvailabilityWhenPhrase(slots, now);
  if (sorted.length === 0) {
    return {
      metaLine: null,
      whenPhrase: 'soon',
      detailLines: [],
      detailMoreCount: 0,
      footerLines: [],
      footerMoreCount: 0,
    };
  }

  const allLines = crewBrowseAvailabilityDayLabels(sorted);
  const detailLines = allLines.slice(0, CREW_BROWSE_AVAILABILITY_MAX_SCHEDULE_LINES);
  const detailMoreCount = Math.max(0, allLines.length - CREW_BROWSE_AVAILABILITY_MAX_SCHEDULE_LINES);

  return {
    metaLine: null,
    whenPhrase,
    detailLines,
    detailMoreCount,
    footerLines: detailLines,
    footerMoreCount: detailMoreCount,
  };
};

/** Shown under the narrative title — pairs “this week” with real calendar dates. */
export const crewBrowseAvailabilityDateLine = (slots: MemberAvailabilitySlotDTO[]): string | null => {
  const { detailLines, detailMoreCount } = crewBrowseAvailabilitySchedule(slots);
  if (detailLines.length === 0) return null;
  const parts = [...detailLines];
  if (detailMoreCount > 0) parts.push(`+${detailMoreCount} more`);
  return parts.join(' · ');
};

export type CrewBrowseGoingCopyParts = {
  prefix: string;
  outingLabel: string;
  suffix: string;
  clickable: boolean;
};

export const crewBrowseGoingCopyParts = (
  displayName: string,
  trip: SocialPersonTripHintDTO | null | undefined
): CrewBrowseGoingCopyParts => {
  const first = crewBrowseFirstName(displayName);
  if (!trip) {
    return {
      prefix: first,
      outingLabel: '',
      suffix: '',
      clickable: false,
    };
  }
  const outing = trip.title.trim() || 'an outing';
  const when = trip.date ? `on ${formatCrewBrowseShortDate(trip.date)}` : 'soon';
  const verb = trip.role === 'hosting' ? 'is hosting' : 'is going on';
  return {
    prefix: `${first} ${verb} `,
    outingLabel: outing,
    suffix: ` ${when}.`,
    clickable: true,
  };
};

/** One-line list title (map list row — same slot as activity title). */
export const crewBrowseGoingSentence = (
  displayName: string,
  trip: SocialPersonTripHintDTO | null | undefined
): string => {
  const parts = crewBrowseGoingCopyParts(displayName, trip);
  const core = `${parts.prefix}${parts.outingLabel}${parts.suffix}`;
  return core.replace(/\s+/g, ' ').trim();
};
