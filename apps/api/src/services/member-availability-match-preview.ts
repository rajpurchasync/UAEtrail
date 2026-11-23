import type { MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import { listPublishedActivitiesForExploreMapFromMongo } from '../lib/activity-read-assembler.js';
import { getMemberAvailability } from '../lib/member-availability-store.js';
import { filterHostedEventsForMemberAvailability } from './matching/hosted-availability-fit.js';

const MAX_HOSTED = 3;
const HOSTED_SCAN = 120;

export const buildMemberAvailabilityMatchPreview = async (
  userId: string
): Promise<MemberAvailabilityMatchPreviewDTO> => {
  const availability = await getMemberAvailability(userId);
  const today = new Date().toISOString().slice(0, 10);

  if (availability.visibility === 'hidden') {
    return { hostedOutings: [] };
  }

  const events = await listPublishedActivitiesForExploreMapFromMongo(HOSTED_SCAN);
  const hostedOutings = filterHostedEventsForMemberAvailability(events, availability, {
    todayIso: today,
    max: MAX_HOSTED,
  }).map((event) => ({
    id: event.id,
    title: event.title,
    startAt: event.startAt!.toISOString(),
  }));

  return { hostedOutings };
};