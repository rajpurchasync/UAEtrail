import type { MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import {
  availabilityKindMatchesActivityType,
  memberAvailabilityCalendarDays,
  prunePastAvailabilitySlots,
} from '@uaetrail/shared-types';
import { listPublishedActivitiesForExploreMapFromMongo } from '../lib/activity-read-assembler.js';
import { getMemberAvailability } from '../lib/member-availability-store.js';

const MAX_HOSTED = 3;
const HOSTED_SCAN = 120;

const activityCalendarDay = (startAt: Date): string =>
  new Date(startAt).toISOString().slice(0, 10);

export const buildMemberAvailabilityMatchPreview = async (
  userId: string
): Promise<MemberAvailabilityMatchPreviewDTO> => {
  const availability = await getMemberAvailability(userId);
  const today = new Date().toISOString().slice(0, 10);
  const slots = prunePastAvailabilitySlots(availability.slots ?? [], today);
  const days = memberAvailabilityCalendarDays(slots);
  const kinds = availability.kinds;

  if (availability.visibility === 'hidden' || days.length === 0 || kinds.length === 0) {
    return { hostedOutings: [] };
  }

  const daySet = new Set(days);
  const events = await listPublishedActivitiesForExploreMapFromMongo(HOSTED_SCAN);
  const hostedOutings = events
    .filter(
      (event) =>
        event.activityMode !== 'seeking' &&
        event.startAt &&
        daySet.has(activityCalendarDay(event.startAt)) &&
        availabilityKindMatchesActivityType(kinds, event.activityType)
    )
    .slice(0, MAX_HOSTED)
    .map((event) => ({
      id: event.id,
      title: event.title,
      startAt: event.startAt!.toISOString(),
    }));

  return { hostedOutings };
};
