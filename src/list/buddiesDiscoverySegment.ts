export type BuddiesDiscoverySegment = 'going' | 'looking' | 'followed';

export const BUDDIES_DISCOVERY_SEGMENTS: ReadonlyArray<{
  key: BuddiesDiscoverySegment;
  label: string;
}> = [
  { key: 'going', label: "Who's going" },
  { key: 'looking', label: 'Looking for' },
  { key: 'followed', label: 'Followed' },
];

export const BUDDIES_SEGMENT_URL_PARAM = 'buddies';

export const parseBuddiesDiscoverySegment = (raw: string | null): BuddiesDiscoverySegment => {
  if (raw === 'looking' || raw === 'followed') return raw;
  return 'going';
};

export const serializeBuddiesDiscoverySegment = (
  segment: BuddiesDiscoverySegment
): string | null => (segment === 'going' ? null : segment);
