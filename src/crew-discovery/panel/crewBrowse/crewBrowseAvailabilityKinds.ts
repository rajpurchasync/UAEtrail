import type { AvailabilityKind } from '@uaetrail/shared-types';

const LABELS: Record<AvailabilityKind, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  rideshare: 'Rideshare',
  event: 'Events',
  guide: 'Guide',
  other: 'Other outdoors',
};

export const availabilityKindLabels = (kinds: AvailabilityKind[]): string[] =>
  kinds.map((kind) => LABELS[kind] ?? kind);
