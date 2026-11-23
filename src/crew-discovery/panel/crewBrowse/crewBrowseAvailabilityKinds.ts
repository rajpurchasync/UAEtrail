import type { AvailabilityKind, ScheduleModality } from '@uaetrail/shared-types';

const LABELS: Record<AvailabilityKind, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  rideshare: 'Rideshare',
  event: 'Events',
  guide: 'Guide',
  other: 'Other outdoors',
};

const MODALITY_LABELS: Record<ScheduleModality, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  rideshare: 'Rideshare',
  event: 'Events',
  other: 'Other outdoors',
};

export const availabilityKindLabels = (kinds: AvailabilityKind[]): string[] =>
  kinds.map((kind) => LABELS[kind] ?? kind);

export const scheduleModalityLabels = (modalities: ScheduleModality[]): string[] =>
  modalities.map((modality) => MODALITY_LABELS[modality] ?? modality);
