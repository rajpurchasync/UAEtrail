import type { ParticipantIntentDTO } from '@uaetrail/shared-types';

/** Split member demand intents for Trips → My plans / Self tabs. */
export const partitionParticipantIntentsForTrips = (intents: ParticipantIntentDTO[]) => {
  const upcoming: ParticipantIntentDTO[] = [];
  const completed: ParticipantIntentDTO[] = [];

  for (const intent of intents) {
    if (intent.status === 'active') {
      upcoming.push(intent);
    } else {
      completed.push(intent);
    }
  }

  return { upcoming, completed };
};

export const formatParticipantIntentMeta = (intent: ParticipantIntentDTO): string => {
  const parts: string[] = [];
  const kindLabel =
    intent.kind === 'hiking'
      ? 'Hiking'
      : intent.kind === 'camping'
        ? 'Camping'
        : intent.kind === 'event'
          ? 'Event'
          : intent.kind === 'rideshare'
            ? 'Rideshare'
            : intent.kind === 'guide'
              ? 'Guide'
              : 'Looking for crew';
  parts.push(kindLabel);
  if (intent.date) parts.push(intent.date);
  if (intent.time) parts.push(intent.time);
  if (intent.preferredArea) parts.push(intent.preferredArea);
  return parts.filter(Boolean).join(' · ');
};
