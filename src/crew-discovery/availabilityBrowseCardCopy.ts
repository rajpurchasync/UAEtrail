import type { AvailabilityKind, MemberAvailabilitySlotDTO, MemberProfileRoleLabel } from '@uaetrail/shared-types';
import {
  availabilitySlotOverlapsRange,
  discoveryModalitiesFromSlots,
  isFixedAvailabilitySlot,
  sanitizeDestinationRegions,
  type ExploreAvailablePersonDTO,
} from '@uaetrail/shared-types';
import type { ExploreActivityDatePreset } from '@/discovery/discoveryPortExploreOptionalFilters';
import { exploreActivityDatePresetToInclusiveRange } from '@/discovery/discoveryPortExploreOptionalFilters';
import {
  EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL,
  EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL,
  crewBrowseAvailabilityDateLine,
  crewBrowseAvailabilityWhenPhrase,
  formatCrewBrowseAvailabilitySlotLineMinimal,
  formatCrewBrowseKindsList,
} from '../content/exploreCrewsCopy';
import { availabilityKindLabels, scheduleModalityLabels } from './panel/crewBrowse/crewBrowseAvailabilityKinds';

export const CREW_BROWSE_AVAILABILITY_SECTION_TITLE = 'Available';
export const CREW_BROWSE_AVAILABILITY_LABEL_DESTINATIONS = 'Destinations';
export const CREW_BROWSE_AVAILABILITY_LABEL_FOR = 'For';
export const CREW_BROWSE_AVAILABILITY_LABEL_AS = 'As';
export const CREW_BROWSE_AVAILABILITY_LABEL_DATES = 'Dates';
export const CREW_BROWSE_ACTIVITY_ANY = 'Any activity';
export const CREW_BROWSE_DESTINATIONS_ANY = 'Open to destinations';
export const CREW_BROWSE_DATES_FLEXIBLE_NOTE = EXPLORE_CREWS_AVAILABILITY_FLEXIBLE_LABEL;
export const CREW_BROWSE_DATES_FIXED_NOTE = EXPLORE_CREWS_AVAILABILITY_FIXED_LABEL;

export const FIND_CREW_TRUST_BADGE_PRO = 'Pro';
export const FIND_CREW_TRUST_BADGE_VERIFIED = 'Verified';

const CAPACITY_LABEL: Record<'participant' | 'guide', string> = {
  participant: 'Crew',
  guide: 'Guide',
};

export type FindCrewTrustBadge = 'pro' | 'verified';

export type CrewBrowseAvailabilityDateWindow = {
  text: string;
  kind: 'flexible' | 'fixed';
};

export type CrewBrowseAvailabilityDetail = {
  destinationLabels: string[];
  trustBadges: FindCrewTrustBadge[];
  forLabels: string[];
  activityOpen: boolean;
  for: string;
  asLabels: string[];
  as: string;
  dateWindows: CrewBrowseAvailabilityDateWindow[];
  dateMoreCount: number;
  /** Compact fallback for legacy list rows. */
  datesLine: string | null;
};

const MAX_LIST_ITEMS = 4;

export const findCrewTrustBadgesFromProfileRole = (
  role: MemberProfileRoleLabel | null | undefined
): FindCrewTrustBadge[] => {
  if (!role || role === 'community_member' || role === 'platform_staff') return [];
  const badges = new Set<FindCrewTrustBadge>();
  if (role === 'professional_guide' || role === 'agency' || role === 'shop_owner') {
    badges.add('pro');
  }
  if (role === 'host' || role === 'professional_guide' || role === 'agency' || role === 'shop_owner') {
    badges.add('verified');
  }
  return [...badges];
};

/** Legacy single-line location under name on map crew rows. */
export const crewBrowseAvailabilityLocationLabel = (
  person: Pick<ExploreAvailablePersonDTO, 'region' | 'destinationSlug'>
): string | null => {
  const areas = crewBrowseAvailabilityDestinationLabels(person);
  if (areas.length === 1 && areas[0] === CREW_BROWSE_DESTINATIONS_ANY) return null;
  return areas.join(' · ');
};

export const crewBrowseDestinationLabelsFromSlots = (
  slots: MemberAvailabilitySlotDTO[]
): string[] | null => {
  const merged = slots.flatMap((slot) => slot.destinationRegions ?? []);
  const sanitized = sanitizeDestinationRegions(merged);
  return sanitized?.length ? sanitized : null;
};

export const crewBrowseAvailabilityDestinationLabels = (
  person: Pick<ExploreAvailablePersonDTO, 'region' | 'destinationSlug'>
): string[] => {
  const labels = new Set<string>();
  const region = person.region?.trim();
  if (region) labels.add(region);
  const slug = person.destinationSlug?.trim();
  if (slug) {
    const fromSlug = slug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    if (fromSlug && fromSlug !== region) labels.add(fromSlug);
  }
  if (labels.size === 0) return [CREW_BROWSE_DESTINATIONS_ANY];
  return [...labels];
};

const crewBrowseActivityFit = (
  slots: MemberAvailabilitySlotDTO[],
  personKinds: AvailabilityKind[] = []
): { labels: string[]; activityOpen: boolean } => {
  const modalities = scheduleModalityLabels(discoveryModalitiesFromSlots(slots));
  if (modalities.length > 0) {
    return { labels: modalities, activityOpen: false };
  }
  const legacy = availabilityKindLabels(personKinds.filter((kind) => kind !== 'guide'));
  if (legacy.length > 0) {
    return { labels: legacy, activityOpen: false };
  }
  return { labels: [], activityOpen: true };
};

export const crewBrowseAvailabilityDateWindows = (
  slots: MemberAvailabilitySlotDTO[]
): CrewBrowseAvailabilityDateWindow[] => {
  const sorted = [...slots].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const seen = new Set<string>();
  const windows: CrewBrowseAvailabilityDateWindow[] = [];
  for (const slot of sorted) {
    const key = `${slot.startDate}|${slot.endDate}|${slot.scheduleKind ?? 'open'}|${slot.timeBand ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const kind = isFixedAvailabilitySlot(slot) ? 'fixed' : 'flexible';
    const range = formatCrewBrowseAvailabilitySlotLineMinimal(slot);
    const text =
      kind === 'flexible'
        ? `${CREW_BROWSE_DATES_FLEXIBLE_NOTE} · ${range}`
        : `${CREW_BROWSE_DATES_FIXED_NOTE} · ${range}`;
    windows.push({ text, kind });
  }
  return windows;
};

export const crewBrowseAvailableAsLabels = (slots: MemberAvailabilitySlotDTO[]): string[] => {
  const labels = new Set<string>();
  for (const slot of slots) {
    const cap = slot.capacity === 'guide' ? 'guide' : 'participant';
    labels.add(CAPACITY_LABEL[cap]);
  }
  if (labels.size === 0) labels.add(CAPACITY_LABEL.participant);
  return [...labels];
};

export const crewBrowseAvailabilityDetailFromPerson = (
  person: Pick<ExploreAvailablePersonDTO, 'kinds' | 'slots' | 'region' | 'destinationSlug' | 'profileRoleLabel'>
): CrewBrowseAvailabilityDetail | null => {
  const slots = person.slots ?? [];
  const activity = crewBrowseActivityFit(slots, person.kinds);
  const asLabels = crewBrowseAvailableAsLabels(slots);
  const destinationLabels =
    crewBrowseDestinationLabelsFromSlots(slots) ?? crewBrowseAvailabilityDestinationLabels(person);
  const allDateWindows = crewBrowseAvailabilityDateWindows(slots);
  const dateWindows = allDateWindows.slice(0, MAX_LIST_ITEMS);
  const dateMoreCount = Math.max(0, allDateWindows.length - MAX_LIST_ITEMS);
  const trustBadges = findCrewTrustBadgesFromProfileRole(person.profileRoleLabel);

  const datesFallback =
    dateWindows[0]?.text ??
    crewBrowseAvailabilityDateLine(slots) ??
    crewBrowseAvailabilityWhenPhrase(slots) ??
    null;

  if (
    destinationLabels.length === 0 &&
    !activity.activityOpen &&
    activity.labels.length === 0 &&
    asLabels.length === 0 &&
    !datesFallback
  ) {
    return null;
  }

  const forSummary = activity.activityOpen
    ? CREW_BROWSE_ACTIVITY_ANY
    : activity.labels.length
      ? formatCrewBrowseKindsList(activity.labels)
      : '—';

  const datesLine =
    dateWindows.length > 0
      ? dateWindows.map((w) => w.text).join(' · ') + (dateMoreCount > 0 ? ` · +${dateMoreCount}` : '')
      : datesFallback;

  return {
    destinationLabels,
    trustBadges,
    forLabels: activity.activityOpen ? [] : activity.labels,
    activityOpen: activity.activityOpen,
    for: forSummary,
    asLabels,
    as: formatCrewBrowseKindsList(asLabels),
    dateWindows,
    dateMoreCount,
    datesLine,
  };
};

/** @deprecated Prefer {@link crewBrowseAvailabilityDetailFromPerson}. */
export const crewBrowseAvailabilityDetailFromSlots = (
  slots: MemberAvailabilitySlotDTO[],
  personKinds: AvailabilityKind[] = [],
  person?: Pick<ExploreAvailablePersonDTO, 'region' | 'destinationSlug' | 'profileRoleLabel'>
): CrewBrowseAvailabilityDetail | null =>
  crewBrowseAvailabilityDetailFromPerson({
    slots,
    kinds: personKinds,
    region: person?.region ?? null,
    destinationSlug: person?.destinationSlug ?? null,
    profileRoleLabel: person?.profileRoleLabel ?? null,
  });

export const CREW_BROWSE_SOCIAL_LABEL_FRIEND = 'Friend';
export const CREW_BROWSE_SOCIAL_LABEL_FOLLOWED = 'Followed';

export type CrewBrowseAvailabilitySocialLabel =
  | typeof CREW_BROWSE_SOCIAL_LABEL_FRIEND
  | typeof CREW_BROWSE_SOCIAL_LABEL_FOLLOWED;

export const crewBrowseAvailabilitySocialLabel = (
  person: Pick<ExploreAvailablePersonDTO, 'userId' | 'isFriend'>,
  followedUserIds?: ReadonlySet<string>
): CrewBrowseAvailabilitySocialLabel | null => {
  if (person.isFriend) return CREW_BROWSE_SOCIAL_LABEL_FRIEND;
  if (followedUserIds?.has(person.userId)) return CREW_BROWSE_SOCIAL_LABEL_FOLLOWED;
  return null;
};

export const availabilityMatchesFindCrewSearchDates = (
  slots: MemberAvailabilitySlotDTO[],
  activityDatePreset: ExploreActivityDatePreset
): boolean => {
  if (activityDatePreset === 'anyday') return false;
  const { from, to } = exploreActivityDatePresetToInclusiveRange(activityDatePreset);
  return slots.some((slot) => availabilitySlotOverlapsRange(slot, from, to));
};

export const sortAvailabilityPeopleNetworkFirst = (
  people: ExploreAvailablePersonDTO[],
  followedUserIds?: ReadonlySet<string>
): ExploreAvailablePersonDTO[] => {
  const rank = (person: ExploreAvailablePersonDTO): number => {
    if (person.isFriend) return 0;
    if (followedUserIds?.has(person.userId)) return 1;
    return 2;
  };
  return [...people].sort((a, b) => {
    const delta = rank(a) - rank(b);
    return delta !== 0 ? delta : a.displayName.localeCompare(b.displayName);
  });
};