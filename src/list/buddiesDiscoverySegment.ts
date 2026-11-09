import {
  PEOPLE_BROWSE_TAB_LABELS,
  type PeopleBrowseTab,
  parsePeopleBrowseTab,
  serializePeopleBrowseTab,
} from '@/people-discovery/peopleBrowseTab';

/** Same tab ids as explore `peopleTab` — list handoff uses URL param `buddies=` (list category label may say Buddies). */
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

/** Full-screen crews list — default hub when `buddies` is omitted. */
export const parseBuddiesDiscoverySegment = (raw: string | null): BuddiesDiscoverySegment => {
  if (!raw) return 'hub';
  return parsePeopleBrowseTab(raw);
};

export const serializeBuddiesDiscoverySegment = (segment: BuddiesDiscoverySegment): string | null => {
  if (segment === 'hub') return null;
  if (segment === 'looking') return 'looking';
  return serializePeopleBrowseTab(segment);
};
