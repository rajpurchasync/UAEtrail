import {
  PEOPLE_BROWSE_TAB_LABELS,
  type PeopleBrowseTab,
  parsePeopleBrowseTab,
  serializePeopleBrowseTab,
} from '@/people-discovery/peopleBrowseTab';

/** @deprecated Name kept for list URL `buddies=` — same values as explore `peopleTab`. */
export type BuddiesDiscoverySegment = PeopleBrowseTab;

export const BUDDIES_DISCOVERY_SEGMENTS: ReadonlyArray<{
  key: BuddiesDiscoverySegment;
  label: string;
}> = [
  { key: 'looking', label: PEOPLE_BROWSE_TAB_LABELS.looking },
  { key: 'available', label: PEOPLE_BROWSE_TAB_LABELS.available },
  { key: 'going', label: PEOPLE_BROWSE_TAB_LABELS.going },
  { key: 'connect', label: PEOPLE_BROWSE_TAB_LABELS.connect },
];

export const BUDDIES_SEGMENT_URL_PARAM = 'buddies';

export const parseBuddiesDiscoverySegment = (raw: string | null): BuddiesDiscoverySegment =>
  parsePeopleBrowseTab(raw);

export const serializeBuddiesDiscoverySegment = (
  segment: BuddiesDiscoverySegment
): string | null => serializePeopleBrowseTab(segment);
